import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from db import db

JWT_SECRET = os.environ.get("JWT_SECRET") or "luminora_secret_key_change_in_prod_2026"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=True)


# ---------- Models ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"  # student | parent | admin


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    plan: str
    avatar: Optional[str] = None
    created_at: str
    grade: Optional[str] = None
    board: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = "English"
    exam_target: Optional[str] = "None"
    learning_level: Optional[str] = "Standard"
    onboarded: bool = False


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


# ---------- Helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def public_user(doc: dict) -> UserPublic:
    return UserPublic(
        id=doc["id"],
        name=doc["name"],
        email=doc["email"],
        role=doc.get("role", "student"),
        plan=doc.get("plan", "trial"),
        avatar=doc.get("avatar"),
        created_at=doc["created_at"],
        grade=doc.get("grade"),
        board=doc.get("board"),
        country=doc.get("country"),
        language=doc.get("language") or "English",
        exam_target=doc.get("exam_target") or "None",
        learning_level=doc.get("learning_level") or "Standard",
        onboarded=doc.get("onboarded", False),
    )


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def seed_default_stats(user_id: str):
    stats = {
        "user_id": user_id,
        "readiness_score": 72,
        "study_streak": 4,
        "lessons_completed": 12,
        "minutes_studied": 540,
        "goals_total": 5,
        "goals_done": 2,
        "weekly_progress": [
            {"day": "Mon", "minutes": 45, "score": 68},
            {"day": "Tue", "minutes": 80, "score": 71},
            {"day": "Wed", "minutes": 60, "score": 74},
            {"day": "Thu", "minutes": 95, "score": 78},
            {"day": "Fri", "minutes": 50, "score": 80},
            {"day": "Sat", "minutes": 120, "score": 82},
            {"day": "Sun", "minutes": 40, "score": 85},
        ],
        "weak_topics": [
            {"topic": "Organic Chemistry", "mastery": 42},
            {"topic": "Thermodynamics", "mastery": 55},
            {"topic": "Calculus Integrals", "mastery": 61},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.user_stats.update_one(
        {"user_id": user_id}, {"$setOnInsert": stats}, upsert=True
    )


# ---------- Routes ----------
@auth_router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "role": req.role if req.role in ("student", "parent", "admin") else "student",
        "plan": "trial",
        "avatar": None,
        "grade": None,
        "board": None,
        "country": None,
        "language": "English",
        "exam_target": "None",
        "learning_level": "Standard",
        "onboarded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    await seed_default_stats(user_id)

    token = create_token(user_id)
    return AuthResponse(token=token, user=public_user(doc))


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return AuthResponse(token=token, user=public_user(user))


@auth_router.get("/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
    return public_user(current_user)


async def seed_admin():
    """Create a default admin + demo student account if missing."""
    admin_email = "admin@luminora.ai"
    if not await db.users.find_one({"email": admin_email}):
        uid = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "id": uid,
                "name": "Luminora Admin",
                "email": admin_email,
                "password": hash_password("Admin@123"),
                "role": "admin",
                "plan": "yearly",
                "avatar": None,
                "grade": "Grade 12",
                "board": "CBSE",
                "country": "India",
                "language": "English",
                "exam_target": "None",
                "learning_level": "Advanced",
                "onboarded": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await seed_default_stats(uid)

    demo_email = "demo@luminora.ai"
    if not await db.users.find_one({"email": demo_email}):
        uid = str(uuid.uuid4())
        await db.users.insert_one(
            {
                "id": uid,
                "name": "Aarav Sharma",
                "email": demo_email,
                "password": hash_password("Demo@123"),
                "role": "student",
                "plan": "yearly",
                "avatar": None,
                "grade": "Grade 10",
                "board": "Kerala State Board",
                "country": "India",
                "language": "English",
                "exam_target": "None",
                "learning_level": "Standard",
                "onboarded": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await seed_default_stats(uid)
