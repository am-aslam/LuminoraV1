"""End-to-end backend tests for Luminora Learning API.

Covers: auth, dashboard, notes CRUD, planner CRUD, studio (AI), exam (AI),
career (AI), tutor (SSE streaming) and admin endpoints.
"""

import json
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get(
    "REACT_APP_BACKEND_URL"
) else "https://luminora-studio.preview.emergentagent.com"

API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@luminora.ai"
DEMO_PASSWORD = "Demo@123"
ADMIN_EMAIL = "admin@luminora.ai"
ADMIN_PASSWORD = "Admin@123"

# Generous timeout for LLM-backed endpoints (gpt-5.2 can take 5-30s)
LLM_TIMEOUT = 90
SHORT_TIMEOUT = 20


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
        timeout=SHORT_TIMEOUT,
    )
    assert r.status_code == 200, f"Demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=SHORT_TIMEOUT,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["status"] == "online"

    def test_demo_login(self, demo_token):
        assert isinstance(demo_token, str) and len(demo_token) > 10

    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 10

    def test_login_invalid(self):
        r = requests.post(
            f"{API}/auth/login",
            json={"email": DEMO_EMAIL, "password": "wrongpass"},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 401

    def test_me_with_token(self, demo_token):
        r = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert data["role"] == "student"
        assert "id" in data

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=SHORT_TIMEOUT)
        assert r.status_code in (401, 403)

    def test_register_new_user(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(
            f"{API}/auth/register",
            json={
                "name": "TEST User",
                "email": email,
                "password": "TestPass@123",
                "role": "student",
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "student"

    def test_register_duplicate(self):
        r = requests.post(
            f"{API}/auth/register",
            json={
                "name": "Dup",
                "email": DEMO_EMAIL,
                "password": "Whatever@123",
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 400


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard(self, demo_token):
        r = requests.get(f"{API}/dashboard", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert "stats" in data
        assert "recommended" in data
        assert "recent_lessons" in data
        assert data["user"]["name"]
        assert isinstance(data["recommended"], list) and len(data["recommended"]) > 0


# ---------------- Notes CRUD ----------------
class TestNotes:
    def test_notes_crud(self, demo_token):
        # Create
        r = requests.post(
            f"{API}/notes",
            headers=H(demo_token),
            json={"title": "TEST_Note", "content": "hello", "color": "violet"},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        note = r.json()
        note_id = note["id"]
        assert note["title"] == "TEST_Note"

        # List - confirm presence
        r = requests.get(f"{API}/notes", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        assert any(n["id"] == note_id for n in r.json())

        # Update
        r = requests.put(
            f"{API}/notes/{note_id}",
            headers=H(demo_token),
            json={
                "title": "TEST_Note_Updated",
                "content": "updated",
                "color": "blue",
                "bookmarked": True,
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Note_Updated"
        assert r.json()["bookmarked"] is True

        # Delete
        r = requests.delete(
            f"{API}/notes/{note_id}", headers=H(demo_token), timeout=SHORT_TIMEOUT
        )
        assert r.status_code == 200

        # Verify gone
        r = requests.get(f"{API}/notes", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert not any(n["id"] == note_id for n in r.json())


# ---------------- Planner CRUD ----------------
class TestPlanner:
    def test_planner_crud(self, demo_token):
        r = requests.post(
            f"{API}/planner",
            headers=H(demo_token),
            json={"title": "TEST_Task", "date": "2026-02-01", "type": "study"},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        task = r.json()
        tid = task["id"]
        assert task["done"] is False

        # toggle
        r = requests.put(f"{API}/planner/{tid}", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["done"] is True

        # delete
        r = requests.delete(f"{API}/planner/{tid}", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200


# ---------------- Admin ----------------
class TestAdmin:
    def test_admin_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=H(admin_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        for key in ("total_users", "students", "lessons_generated", "growth", "plan_distribution"):
            assert key in data
        assert data["total_users"] >= 2

    def test_admin_users(self, admin_token):
        r = requests.get(f"{API}/admin/users", headers=H(admin_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        users = r.json()
        assert any(u["email"] == ADMIN_EMAIL for u in users)
        # Passwords must not leak
        for u in users:
            assert "password" not in u


# ---------------- AI Studio ----------------
class TestStudio:
    lesson_id = None

    def test_generate_lesson(self, demo_token):
        r = requests.post(
            f"{API}/studio/generate",
            headers=H(demo_token),
            json={"prompt": "the human heart"},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        for key in ("title", "subject", "model3d", "sections", "flashcards", "summary"):
            assert key in data, f"missing {key}"
        assert isinstance(data["sections"], list) and len(data["sections"]) >= 2
        assert isinstance(data["flashcards"], list) and len(data["flashcards"]) >= 2
        TestStudio.lesson_id = data["id"]

    def test_list_lessons(self, demo_token):
        r = requests.get(f"{API}/studio/lessons", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        if TestStudio.lesson_id:
            assert any(l["id"] == TestStudio.lesson_id for l in rows)

    def test_explain_part(self, demo_token):
        r = requests.post(
            f"{API}/studio/explain-part",
            headers=H(demo_token),
            json={"model": "heart", "part": "Left Ventricle", "topic": "the human heart"},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        data = r.json()
        assert data["part"] == "Left Ventricle"
        assert isinstance(data["explanation"], str) and len(data["explanation"]) > 20


# ---------------- AI Exam ----------------
class TestExam:
    exam_id = None
    exam_data = None

    def test_generate_exam(self, demo_token):
        r = requests.post(
            f"{API}/exam/generate",
            headers=H(demo_token),
            json={"topic": "photosynthesis", "count": 3},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        data = r.json()
        assert "questions" in data
        assert len(data["questions"]) >= 3
        for q in data["questions"]:
            assert "id" in q and "question" in q
            assert isinstance(q["options"], list) and len(q["options"]) == 4
            assert "correct_index" in q
        TestExam.exam_id = data["id"]
        TestExam.exam_data = data

    def test_submit_exam(self, demo_token):
        assert TestExam.exam_id, "generate must run first"
        # answer all with index 0
        answers = {q["id"]: 0 for q in TestExam.exam_data["questions"]}
        r = requests.post(
            f"{API}/exam/submit",
            headers=H(demo_token),
            json={"exam_id": TestExam.exam_id, "answers": answers},
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "score" in data and 0 <= data["score"] <= 100
        assert "breakdown" in data and len(data["breakdown"]) == len(answers)
        assert "weak_topics" in data

    def test_exam_results(self, demo_token):
        r = requests.get(f"{API}/exam/results", headers=H(demo_token), timeout=SHORT_TIMEOUT)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- AI Career ----------------
class TestCareer:
    def test_advise(self, demo_token):
        r = requests.post(
            f"{API}/career/advise",
            headers=H(demo_token),
            json={"interests": "I love biology and computers and want to help patients"},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        data = r.json()
        for key in ("careers", "degrees", "skill_gaps", "roadmap"):
            assert key in data, f"missing {key}"
        assert isinstance(data["careers"], list) and len(data["careers"]) >= 2
        assert isinstance(data["roadmap"], list) and len(data["roadmap"]) >= 2


# ---------------- AI Tutor (SSE) ----------------
class TestTutor:
    def test_tutor_full_flow(self, demo_token):
        # Create conversation
        r = requests.post(
            f"{API}/tutor/conversations",
            headers=H(demo_token),
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        conv = r.json()
        conv_id = conv["id"]

        # List
        r = requests.get(
            f"{API}/tutor/conversations", headers=H(demo_token), timeout=SHORT_TIMEOUT
        )
        assert r.status_code == 200
        assert any(c["id"] == conv_id for c in r.json())

        # SSE chat
        deltas = []
        done = False
        with requests.post(
            f"{API}/tutor/chat",
            headers=H(demo_token),
            json={"conversation_id": conv_id, "message": "Say hi in one short sentence."},
            stream=True,
            timeout=LLM_TIMEOUT,
        ) as resp:
            assert resp.status_code == 200
            assert "text/event-stream" in resp.headers.get("content-type", "")
            start = time.time()
            for raw in resp.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data: "):
                    try:
                        payload = json.loads(raw[6:])
                    except Exception:
                        continue
                    if "delta" in payload:
                        deltas.append(payload["delta"])
                    if payload.get("done"):
                        done = True
                        break
                    if payload.get("error"):
                        pytest.fail(f"SSE error: {payload['error']}")
                if time.time() - start > LLM_TIMEOUT:
                    break

        assert done, "SSE stream did not signal done"
        assert len("".join(deltas)) > 0, "No text deltas received"

        # Persisted messages
        r = requests.get(
            f"{API}/tutor/conversations/{conv_id}/messages",
            headers=H(demo_token),
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200
        msgs = r.json()
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles

        # Delete
        r = requests.delete(
            f"{API}/tutor/conversations/{conv_id}",
            headers=H(demo_token),
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200
