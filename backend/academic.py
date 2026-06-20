"""Curriculum-aware academic intelligence layer.

Holds the academic option catalog (grades, boards, languages, exams) and the
logic that turns a student's academic profile into a precise instruction block
injected into every AI prompt so lessons, exams and tutoring are aligned to the
student's grade, board, target exam, learning depth and language.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from auth import get_current_user
from db import db
from datetime import datetime, timezone

academic_router = APIRouter(prefix="/api/academic", tags=["academic"])

# ---------------------------------------------------------------- catalog
GRADES = [
    "Grade 5", "Grade 6", "Grade 7", "Grade 8",
    "Grade 9", "Grade 10", "Grade 11", "Grade 12",
]

HIGHER_ED = ["Undergraduate", "Postgraduate", "Professional Certification"]

EXAMS = [
    "None", "NEET", "JEE Main", "JEE Advanced", "CUET",
    "UPSC", "SSC", "Banking Exams", "CAT", "GATE",
]

INDIA_BOARDS = [
    "Kerala State Board", "CBSE", "ICSE", "ISC", "Karnataka State Board",
    "Tamil Nadu State Board", "Andhra Pradesh Board", "Telangana Board",
    "Maharashtra Board", "Gujarat Board", "Punjab Board", "Rajasthan Board",
    "Uttar Pradesh Board", "West Bengal Board",
]

INTERNATIONAL_BOARDS = ["IGCSE", "IB", "Cambridge", "American Curriculum"]

LANGUAGES = [
    "English", "Malayalam", "Hindi", "Tamil", "Telugu", "Kannada",
    "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu",
]

COUNTRIES = ["India", "United States", "United Kingdom", "UAE", "Other"]

LEARNING_LEVELS = ["Foundational", "Standard", "Advanced", "Exam-Focused"]


@academic_router.get("/options")
async def get_options():
    return {
        "grades": GRADES,
        "higher_ed": HIGHER_ED,
        "exams": EXAMS,
        "india_boards": INDIA_BOARDS,
        "international_boards": INTERNATIONAL_BOARDS,
        "languages": LANGUAGES,
        "countries": COUNTRIES,
        "learning_levels": LEARNING_LEVELS,
    }


class AcademicProfile(BaseModel):
    grade: Optional[str] = None
    board: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = "English"
    exam_target: Optional[str] = "None"
    learning_level: Optional[str] = "Standard"


@academic_router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "grade": current_user.get("grade"),
        "board": current_user.get("board"),
        "country": current_user.get("country"),
        "language": current_user.get("language") or "English",
        "exam_target": current_user.get("exam_target") or "None",
        "learning_level": current_user.get("learning_level") or "Standard",
        "onboarded": current_user.get("onboarded", False),
    }


@academic_router.put("/profile")
async def update_profile(profile: AcademicProfile, current_user: dict = Depends(get_current_user)):
    valid_grades = set(GRADES + HIGHER_ED)
    valid_boards = set(INDIA_BOARDS + INTERNATIONAL_BOARDS)

    def pick(value, allowed, fallback):
        return value if value in allowed else fallback

    language = pick(profile.language, set(LANGUAGES), "English")
    exam_target = pick(profile.exam_target, set(EXAMS), "None")
    learning_level = pick(profile.learning_level, set(LEARNING_LEVELS), "Standard")
    country = pick(profile.country, set(COUNTRIES), None)
    grade = profile.grade if profile.grade in valid_grades else None
    board = profile.board if profile.board in valid_boards else None

    update = {
        "grade": grade,
        "board": board,
        "country": country,
        "language": language,
        "exam_target": exam_target,
        "learning_level": learning_level,
        "onboarded": True,
        "profile_updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.update_one({"id": current_user["id"]}, {"$set": update})
    return {"ok": True, **update}


def academic_context(user: dict) -> str:
    """Return an instruction block that aligns AI output to the student's profile."""
    grade = user.get("grade")
    board = user.get("board")
    exam = user.get("exam_target")
    level = user.get("learning_level")
    country = user.get("country")
    language = user.get("language") or "English"

    parts = []
    if grade:
        parts.append(f"Grade/Level: {grade}")
    if board:
        parts.append(f"Education Board / Curriculum: {board}")
    if exam and exam != "None":
        parts.append(f"Target Exam: {exam}")
    if country:
        parts.append(f"Country: {country}")
    if level:
        parts.append(f"Preferred depth: {level}")
    profile = "; ".join(parts) if parts else "General learner (no specific board/grade)"

    ctx = (
        "\n\n=== STUDENT ACADEMIC PROFILE (MANDATORY ALIGNMENT) ===\n"
        f"{profile}.\n"
        "Align ALL content strictly to this profile:\n"
    )
    if board:
        ctx += (
            f"- Follow the {board} syllabus, chapter sequence, official terminology, "
            f"marking scheme style and examination patterns.\n"
        )
    if grade:
        ctx += (
            f"- Match the conceptual depth and vocabulary to {grade}. Do NOT exceed this "
            "academic level unless the student explicitly asks for more.\n"
        )
    if exam and exam != "None":
        ctx += (
            f"- Mirror the {exam} pattern: question structure, difficulty, application focus "
            "and previous-year style. Generate ORIGINAL questions — never copy real papers.\n"
        )
    if level:
        ctx += f"- Calibrate explanations to a '{level}' learner.\n"
    ctx += (
        "- Be factually accurate to the official curriculum. Avoid hallucinations and stay "
        "academically consistent.\n"
    )

    if language and language.lower() != "english":
        ctx += (
            f"\n=== LANGUAGE REQUIREMENT (CRITICAL) ===\n"
            f"Write ALL user-facing text — titles, headings, explanations, examples, flashcards, "
            f"questions, answer options, summaries and notes — entirely in {language}. "
            f"Keep ONLY the JSON keys in English; every JSON value must be in {language}. "
            f"Use natural, fluent {language} appropriate for the student's grade.\n"
        )
    return ctx
