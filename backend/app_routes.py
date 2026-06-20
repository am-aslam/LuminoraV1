import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from db import db

app_router = APIRouter(prefix="/api", tags=["app"])


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============================================================
# DASHBOARD
# ============================================================
RECOMMENDED = [
    {"title": "The Human Heart", "subject": "Biology", "model3d": "heart", "minutes": 8},
    {"title": "DNA & Genetics", "subject": "Biology", "model3d": "dna", "minutes": 10},
    {"title": "The Solar System", "subject": "Physics", "model3d": "solar_system", "minutes": 9},
    {"title": "Atomic Structure", "subject": "Chemistry", "model3d": "atom", "minutes": 7},
]


@app_router.get("/dashboard")
async def dashboard(current_user: dict = Depends(get_current_user)):
    stats = await db.user_stats.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not stats:
        stats = {
            "readiness_score": 60,
            "study_streak": 0,
            "lessons_completed": 0,
            "minutes_studied": 0,
            "goals_total": 5,
            "goals_done": 0,
            "weekly_progress": [],
            "weak_topics": [],
        }
    recent_lessons = (
        await db.lessons.find(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1, "title": 1, "subject": 1, "model3d": 1, "created_at": 1},
        )
        .sort("created_at", -1)
        .to_list(5)
    )
    upcoming = (
        await db.planner_tasks.find(
            {"user_id": current_user["id"], "type": "exam"}, {"_id": 0}
        )
        .sort("date", 1)
        .to_list(5)
    )
    return {
        "user": {
            "name": current_user["name"],
            "plan": current_user.get("plan"),
            "grade": current_user.get("grade"),
            "board": current_user.get("board"),
            "language": current_user.get("language") or "English",
            "exam_target": current_user.get("exam_target") or "None",
        },
        "stats": stats,
        "recent_lessons": recent_lessons,
        "recommended": RECOMMENDED,
        "upcoming_exams": upcoming,
    }


# ============================================================
# NOTES CENTER
# ============================================================
class NoteRequest(BaseModel):
    title: str
    content: str = ""
    color: str = "blue"
    bookmarked: bool = False


@app_router.get("/notes")
async def list_notes(current_user: dict = Depends(get_current_user)):
    return (
        await db.notes.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("updated_at", -1)
        .to_list(200)
    )


@app_router.post("/notes")
async def create_note(req: NoteRequest, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    note = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": req.title,
        "content": req.content,
        "color": req.color,
        "bookmarked": req.bookmarked,
        "created_at": now,
        "updated_at": now,
    }
    await db.notes.insert_one(dict(note))
    note.pop("_id", None)
    return note


@app_router.put("/notes/{note_id}")
async def update_note(note_id: str, req: NoteRequest, current_user: dict = Depends(get_current_user)):
    await db.notes.update_one(
        {"id": note_id, "user_id": current_user["id"]},
        {
            "$set": {
                "title": req.title,
                "content": req.content,
                "color": req.color,
                "bookmarked": req.bookmarked,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )
    return await db.notes.find_one({"id": note_id}, {"_id": 0})


@app_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    await db.notes.delete_one({"id": note_id, "user_id": current_user["id"]})
    return {"ok": True}


# ============================================================
# STUDY PLANNER
# ============================================================
class TaskRequest(BaseModel):
    title: str
    date: str  # ISO date
    type: str = "study"  # study | exam | revision | goal
    done: bool = False


@app_router.get("/planner")
async def list_tasks(current_user: dict = Depends(get_current_user)):
    return (
        await db.planner_tasks.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("date", 1)
        .to_list(500)
    )


@app_router.post("/planner")
async def create_task(req: TaskRequest, current_user: dict = Depends(get_current_user)):
    task = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": req.title,
        "date": req.date,
        "type": req.type,
        "done": req.done,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.planner_tasks.insert_one(dict(task))
    task.pop("_id", None)
    return task


@app_router.put("/planner/{task_id}")
async def toggle_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.planner_tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    if task:
        await db.planner_tasks.update_one(
            {"id": task_id}, {"$set": {"done": not task.get("done", False)}}
        )
    return await db.planner_tasks.find_one({"id": task_id}, {"_id": 0})


@app_router.delete("/planner/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    await db.planner_tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    return {"ok": True}


# ============================================================
# ADMIN DASHBOARD
# ============================================================
PLAN_PRICE = {"trial": 0, "monthly": 199, "six_months": 999, "yearly": 1999}


@app_router.get("/admin/stats")
async def admin_stats(current_user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    students = await db.users.count_documents({"role": "student"})
    lessons = await db.lessons.count_documents({})
    exams = await db.exam_results.count_documents({})

    # Revenue estimate from plans
    revenue = 0
    plan_counts = {"trial": 0, "monthly": 0, "six_months": 0, "yearly": 0}
    async for u in db.users.find({}, {"_id": 0, "plan": 1}):
        p = u.get("plan", "trial")
        plan_counts[p] = plan_counts.get(p, 0) + 1
        revenue += PLAN_PRICE.get(p, 0)

    growth = [
        {"month": "Sep", "users": max(0, total_users - 120), "revenue": revenue * 0.4},
        {"month": "Oct", "users": max(0, total_users - 80), "revenue": revenue * 0.55},
        {"month": "Nov", "users": max(0, total_users - 45), "revenue": revenue * 0.7},
        {"month": "Dec", "users": max(0, total_users - 20), "revenue": revenue * 0.85},
        {"month": "Jan", "users": total_users, "revenue": revenue},
    ]
    return {
        "total_users": total_users,
        "students": students,
        "lessons_generated": lessons,
        "exams_taken": exams,
        "mrr": revenue,
        "ai_calls": lessons + exams,
        "plan_distribution": plan_counts,
        "growth": growth,
    }


@app_router.get("/admin/users")
async def admin_users(current_user: dict = Depends(require_admin)):
    return (
        await db.users.find(
            {}, {"_id": 0, "password": 0}
        )
        .sort("created_at", -1)
        .to_list(200)
    )
