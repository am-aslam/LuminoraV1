import json
import os
import re
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import (
    LlmChat,
    StreamDone,
    TextDelta,
    UserMessage,
)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth import get_current_user
from academic import academic_context
from db import db

llm_router = APIRouter(prefix="/api", tags=["ai"])

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("GEMINI_API_KEY") or "mock_key"
MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-5.2"


def build_chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


def extract_json(text: str):
    """Robustly pull a JSON object out of an LLM response."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    else:
        first = text.find("{")
        last = text.rfind("}")
        if first != -1 and last != -1:
            text = text[first : last + 1]
    return json.loads(text)


# ============================================================
# AI LEARNING STUDIO — structured lesson generation
# ============================================================
LESSON_SYSTEM = """You are Luminora, an elite AI Teacher. When a student asks to learn a topic,
produce a complete, beautifully structured micro-lesson.

Return ONLY valid JSON (no markdown, no prose) with EXACTLY this schema:
{
  "title": "string - concise lesson title",
  "subject": "one of: Biology, Physics, Chemistry, Mathematics, Geography, Engineering, Computer Science, History, General",
  "model3d": "one of: heart, dna, brain, atom, molecule, solar_system, earth, none - choose the most relevant interactive 3D model, or none",
  "difficulty": "Beginner | Intermediate | Advanced",
  "read_minutes": number,
  "objectives": ["3-5 clear learning objectives"],
  "sections": [{"heading": "string", "content": "2-4 rich sentences explaining the concept clearly"}],
  "examples": ["2-3 concrete real-world examples"],
  "flashcards": [{"front": "question", "back": "answer"}],
  "summary": "string - a motivating 2-3 sentence summary",
  "revision_notes": ["4-6 punchy revision bullet points"]
}
Make it engaging, accurate and exam-ready. Provide 4-6 sections and 4-6 flashcards."""


class StudioRequest(BaseModel):
    prompt: str


@llm_router.post("/studio/generate")
async def generate_lesson(req: StudioRequest, current_user: dict = Depends(get_current_user)):
    chat = build_chat(f"studio-{uuid.uuid4()}", LESSON_SYSTEM + academic_context(current_user))
    try:
        resp = await chat.send_message(UserMessage(text=f"Teach me: {req.prompt}"))
        data = extract_json(resp)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Lesson generation failed: {e}")

    lesson = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "prompt": req.prompt,
        **data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.lessons.insert_one(dict(lesson))
    lesson.pop("_id", None)
    return lesson


@llm_router.get("/studio/lessons")
async def list_lessons(current_user: dict = Depends(get_current_user)):
    rows = (
        await db.lessons.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    return rows


# Real-time explanation when a student clicks a 3D model part
class ExplainRequest(BaseModel):
    model: str
    part: str
    topic: str = ""


@llm_router.post("/studio/explain-part")
async def explain_part(req: ExplainRequest, current_user: dict = Depends(get_current_user)):
    sys = (
        "You are Luminora AI Teacher. The student clicked a specific part of an interactive "
        "3D model. Explain it crisply in 3 short labelled lines: Function, How it works, "
        "and Why it matters / Clinical or real-world importance. Be vivid and concise."
    )
    chat = build_chat(f"explain-{uuid.uuid4()}", sys)
    text = f"3D model: {req.model}. Part clicked: {req.part}. Topic context: {req.topic or req.model}."
    try:
        resp = await chat.send_message(UserMessage(text=text))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"part": req.part, "explanation": resp}


# ============================================================
# AI TUTOR — conversations + streaming chat
# ============================================================
TUTOR_SYSTEM = """You are Luminora, a warm, brilliant personal AI tutor. You adapt to the
student, explain step-by-step, use analogies, and encourage them. Keep answers focused and
well-formatted with short paragraphs, bullet points and bold key terms when helpful.
You remember the conversation context. Always be motivating."""


@llm_router.get("/tutor/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    rows = (
        await db.conversations.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("updated_at", -1)
        .to_list(100)
    )
    return rows


@llm_router.post("/tutor/conversations")
async def create_conversation(current_user: dict = Depends(get_current_user)):
    conv = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": "New conversation",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.conversations.insert_one(dict(conv))
    conv.pop("_id", None)
    return conv


@llm_router.get("/tutor/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    rows = (
        await db.messages.find(
            {"conversation_id": conversation_id, "user_id": current_user["id"]},
            {"_id": 0},
        )
        .sort("created_at", 1)
        .to_list(500)
    )
    return rows


@llm_router.delete("/tutor/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    await db.conversations.delete_one({"id": conversation_id, "user_id": current_user["id"]})
    await db.messages.delete_many({"conversation_id": conversation_id, "user_id": current_user["id"]})
    return {"ok": True}


class ChatRequest(BaseModel):
    conversation_id: str
    message: str


@llm_router.post("/tutor/chat")
async def tutor_chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one(
        {"id": req.conversation_id, "user_id": current_user["id"]}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": req.conversation_id,
        "user_id": current_user["id"],
        "role": "user",
        "content": req.message,
        "created_at": now,
    }
    await db.messages.insert_one(dict(user_msg))

    # Build context from prior messages
    history = (
        await db.messages.find(
            {"conversation_id": req.conversation_id, "user_id": current_user["id"]},
            {"_id": 0},
        )
        .sort("created_at", 1)
        .to_list(40)
    )
    context = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-12:]
    )

    # Auto-title the conversation on first user message
    msg_count = await db.messages.count_documents(
        {"conversation_id": req.conversation_id, "role": "user"}
    )
    if msg_count == 1:
        title = req.message.strip()[:48]
        await db.conversations.update_one(
            {"id": req.conversation_id}, {"$set": {"title": title}}
        )

    chat = build_chat(req.conversation_id, TUTOR_SYSTEM + academic_context(current_user))
    prompt = (
        f"Conversation so far:\n{context}\n\nReply to the student's latest message."
        if len(history) > 1
        else req.message
    )

    async def event_generator():
        full = ""
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            assistant_msg = {
                "id": str(uuid.uuid4()),
                "conversation_id": req.conversation_id,
                "user_id": current_user["id"],
                "role": "assistant",
                "content": full,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.messages.insert_one(dict(assistant_msg))
            await db.conversations.update_one(
                {"id": req.conversation_id},
                {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ============================================================
# AI CAREER ADVISOR
# ============================================================
CAREER_SYSTEM = """You are Luminora's AI Career Advisor. Given a student's interests/goals,
return ONLY valid JSON with this schema:
{
  "summary": "1-2 motivating sentences",
  "careers": [{"title": "string", "match": number 0-100, "description": "1 sentence", "salary_range": "e.g. ₹8L - ₹35L / yr"}],
  "degrees": ["3-4 recommended degrees/programs"],
  "skill_gaps": [{"skill": "string", "current": number 0-100, "target": number 0-100}],
  "roadmap": [{"phase": "e.g. 0-6 months", "focus": "string", "milestones": ["2-3 items"]}]
}
Provide 3-4 careers and a 3-4 phase roadmap."""


class CareerRequest(BaseModel):
    interests: str


@llm_router.post("/career/advise")
async def career_advise(req: CareerRequest, current_user: dict = Depends(get_current_user)):
    chat = build_chat(f"career-{uuid.uuid4()}", CAREER_SYSTEM + academic_context(current_user))
    try:
        resp = await chat.send_message(
            UserMessage(text=f"Student interests and goals: {req.interests}")
        )
        data = extract_json(resp)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Career analysis failed: {e}")
    return data


# ============================================================
# AI EXAM ENGINE — generate quiz
# ============================================================
EXAM_SYSTEM = """You are Luminora's AI Exam Engine. Generate a focused multiple-choice exam.
Return ONLY valid JSON:
{
  "title": "string",
  "questions": [
    {"id": "q1", "question": "string", "options": ["a","b","c","d"], "correct_index": 0, "topic": "string", "explanation": "1 sentence why"}
  ]
}
Generate exactly the requested number of questions, each with 4 options."""


class ExamRequest(BaseModel):
    topic: str
    count: int = 5


@llm_router.post("/exam/generate")
async def generate_exam(req: ExamRequest, current_user: dict = Depends(get_current_user)):
    n = max(3, min(req.count, 10))
    chat = build_chat(f"exam-{uuid.uuid4()}", EXAM_SYSTEM + academic_context(current_user))
    try:
        resp = await chat.send_message(
            UserMessage(text=f"Create a {n}-question exam on: {req.topic}")
        )
        data = extract_json(resp)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Exam generation failed: {e}")

    exam = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "topic": req.topic,
        **data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.exams.insert_one(dict(exam))
    exam.pop("_id", None)
    return exam


class ExamSubmit(BaseModel):
    exam_id: str
    answers: dict  # {question_id: selected_index}


@llm_router.post("/exam/submit")
async def submit_exam(req: ExamSubmit, current_user: dict = Depends(get_current_user)):
    exam = await db.exams.find_one(
        {"id": req.exam_id, "user_id": current_user["id"]}, {"_id": 0}
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = exam["questions"]
    correct = 0
    breakdown = []
    topic_perf: dict = {}
    for q in questions:
        sel = req.answers.get(q["id"])
        is_correct = sel == q["correct_index"]
        if is_correct:
            correct += 1
        topic = q.get("topic", "General")
        topic_perf.setdefault(topic, {"correct": 0, "total": 0})
        topic_perf[topic]["total"] += 1
        topic_perf[topic]["correct"] += 1 if is_correct else 0
        breakdown.append(
            {
                "question": q["question"],
                "selected": sel,
                "correct_index": q["correct_index"],
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "options": q["options"],
            }
        )

    total = len(questions)
    score = round((correct / total) * 100) if total else 0
    weak_topics = [
        t for t, v in topic_perf.items() if v["correct"] / v["total"] < 0.6
    ]

    result = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "exam_id": req.exam_id,
        "topic": exam["topic"],
        "score": score,
        "correct": correct,
        "total": total,
        "breakdown": breakdown,
        "weak_topics": weak_topics,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.exam_results.insert_one(dict(result))
    result.pop("_id", None)
    return result


@llm_router.get("/exam/results")
async def exam_results(current_user: dict = Depends(get_current_user)):
    rows = (
        await db.exam_results.find({"user_id": current_user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    return rows
