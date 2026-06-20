"""Tests for the curriculum-aware academic intelligence layer (iteration 2).

Covers:
- /api/academic/options catalog
- GET/PUT /api/academic/profile and onboarded flag persistence
- Newly registered user has onboarded=false
- Language adaptation: Malayalam lesson via /api/studio/generate
- Board-aware exam: CBSE /api/exam/generate count=5

All tests reset the demo account back to its default profile at the end
of the module so the default demo experience stays English.
"""

import os
import re
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@luminora.ai"
DEMO_PASSWORD = "Demo@123"

LLM_TIMEOUT = 120
SHORT_TIMEOUT = 25

DEFAULT_DEMO_PROFILE = {
    "grade": "Grade 10",
    "board": "Kerala State Board",
    "country": "India",
    "language": "English",
    "exam_target": "None",
    "learning_level": "Standard",
}


def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
        timeout=SHORT_TIMEOUT,
    )
    assert r.status_code == 200, f"Demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module", autouse=True)
def reset_demo_profile_after(demo_token):
    """Restore demo profile to defaults after all tests in this module run."""
    yield
    try:
        requests.put(
            f"{API}/academic/profile",
            headers=H(demo_token),
            json=DEFAULT_DEMO_PROFILE,
            timeout=SHORT_TIMEOUT,
        )
    except Exception as e:
        print(f"[teardown] failed to reset demo profile: {e}")


# ---------------- Academic options ----------------
class TestAcademicOptions:
    def test_options_catalog(self):
        r = requests.get(f"{API}/academic/options", timeout=SHORT_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in (
            "grades",
            "higher_ed",
            "exams",
            "india_boards",
            "international_boards",
            "languages",
            "countries",
            "learning_levels",
        ):
            assert key in data, f"missing key {key}"
            assert isinstance(data[key], list) and len(data[key]) > 0
        # spot-check a few values
        assert "Grade 10" in data["grades"]
        assert "CBSE" in data["india_boards"]
        assert "Malayalam" in data["languages"]
        assert "NEET" in data["exams"]


# ---------------- Profile GET/PUT ----------------
class TestAcademicProfile:
    def test_get_profile_demo_is_onboarded(self, demo_token):
        r = requests.get(
            f"{API}/academic/profile", headers=H(demo_token), timeout=SHORT_TIMEOUT
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["onboarded"] is True
        assert data["grade"] == "Grade 10"
        assert data["board"] == "Kerala State Board"
        assert data["language"] == "English"

    def test_put_profile_updates_and_me_reflects(self, demo_token):
        new_profile = {
            "grade": "Grade 11",
            "board": "CBSE",
            "country": "India",
            "language": "Hindi",
            "exam_target": "JEE Main",
            "learning_level": "Advanced",
        }
        r = requests.put(
            f"{API}/academic/profile",
            headers=H(demo_token),
            json=new_profile,
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["onboarded"] is True

        # /auth/me must reflect the new fields
        me = requests.get(
            f"{API}/auth/me", headers=H(demo_token), timeout=SHORT_TIMEOUT
        ).json()
        assert me["grade"] == "Grade 11"
        assert me["board"] == "CBSE"
        assert me["language"] == "Hindi"
        assert me["exam_target"] == "JEE Main"
        assert me["learning_level"] == "Advanced"
        assert me["onboarded"] is True


# ---------------- Newly registered user is NOT onboarded ----------------
class TestRegisterOnboardedFlag:
    def test_new_user_not_onboarded(self):
        email = f"test_onboard_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(
            f"{API}/auth/register",
            json={
                "name": "TEST Newbie",
                "email": email,
                "password": "TestPass@123",
                "role": "student",
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["onboarded"] is False
        assert data["user"]["language"] == "English"

        # /academic/profile for this user also reports onboarded false
        new_token = data["token"]
        r2 = requests.get(
            f"{API}/academic/profile", headers=H(new_token), timeout=SHORT_TIMEOUT
        )
        assert r2.status_code == 200
        assert r2.json()["onboarded"] is False


# ---------------- Language adaptation (Malayalam <-> English) ----------------
MALAYALAM_RE = re.compile(r"[\u0D00-\u0D7F]")


class TestLanguageAdaptation:
    def test_malayalam_then_english_lesson(self, demo_token):
        # Switch demo to Malayalam
        r = requests.put(
            f"{API}/academic/profile",
            headers=H(demo_token),
            json={
                "grade": "Grade 10",
                "board": "Kerala State Board",
                "country": "India",
                "language": "Malayalam",
                "exam_target": "None",
                "learning_level": "Standard",
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200

        # Generate lesson — should be Malayalam
        r = requests.post(
            f"{API}/studio/generate",
            headers=H(demo_token),
            json={"prompt": "the human heart"},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        ml = r.json()
        combined = f"{ml.get('title','')} {ml.get('summary','')}"
        assert MALAYALAM_RE.search(combined), (
            f"Expected Malayalam script in title/summary, got: {combined!r}"
        )
        assert ml.get("model3d") == "heart", f"Expected model3d=heart, got {ml.get('model3d')}"

        # Reset to English
        r = requests.put(
            f"{API}/academic/profile",
            headers=H(demo_token),
            json=DEFAULT_DEMO_PROFILE,
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200

        # Generate lesson — should be English (no Malayalam script)
        r = requests.post(
            f"{API}/studio/generate",
            headers=H(demo_token),
            json={"prompt": "the human heart"},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        en = r.json()
        en_combined = f"{en.get('title','')} {en.get('summary','')}"
        assert not MALAYALAM_RE.search(en_combined), (
            f"English lesson unexpectedly contains Malayalam: {en_combined!r}"
        )
        assert en.get("model3d") == "heart"


# ---------------- Board-aware exam (CBSE, 5 questions) ----------------
class TestCBSEExam:
    def test_cbse_photosynthesis_5q(self, demo_token):
        r = requests.put(
            f"{API}/academic/profile",
            headers=H(demo_token),
            json={
                "grade": "Grade 10",
                "board": "CBSE",
                "country": "India",
                "language": "English",
                "exam_target": "None",
                "learning_level": "Standard",
            },
            timeout=SHORT_TIMEOUT,
        )
        assert r.status_code == 200

        r = requests.post(
            f"{API}/exam/generate",
            headers=H(demo_token),
            json={"topic": "Photosynthesis", "count": 5},
            timeout=LLM_TIMEOUT,
        )
        assert r.status_code == 200, r.text[:500]
        data = r.json()
        assert "questions" in data
        assert len(data["questions"]) == 5, f"Expected 5 questions, got {len(data['questions'])}"
        for q in data["questions"]:
            assert isinstance(q["options"], list) and len(q["options"]) == 4
            assert "correct_index" in q
