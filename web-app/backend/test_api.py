import sys
sys.path.insert(0, r"c:\llm-scratch\llm\web-app\backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_auth_and_dashboard_flow():
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("[OK] Health Check:", res.json())

    # 2. Login as Demo User
    res = client.post("/api/auth/login", json={"email": "student@intellitutor.ai", "password": "password123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Demo Login Successful")

    # 3. Get /api/auth/me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, res.text
    me = res.json()
    assert me["email"] == "student@intellitutor.ai"
    print("[OK] /api/auth/me:", me["full_name"], "| Exam:", me["profile"]["target_exam"])

    # 4. Register a new user
    new_email = "alex.rivera@example.com"
    res = client.post("/api/auth/register", json={
        "email": new_email,
        "password": "strongPassword123",
        "full_name": "Alex Rivera"
    })
    if res.status_code != 200 and "already exists" in res.text:
        res = client.post("/api/auth/login", json={"email": new_email, "password": "strongPassword123"})
    assert res.status_code == 200, res.text
    new_token = res.json()["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}
    print("[OK] New User Registration/Login Successful")

    # 5. Complete Onboarding
    res = client.post("/api/auth/onboarding", headers=new_headers, json={
        "target_exam": "JEE Advanced",
        "selected_subjects": ["Physics", "Chemistry", "Mathematics"],
        "target_exam_date": "April 2027",
        "daily_study_hours": 4.5,
        "confidence_level": "Beginner",
        "explanation_preference": "Intermediate"
    })
    assert res.status_code == 200, res.text
    onboarded = res.json()
    assert onboarded["profile"]["onboarding_completed"] is True
    assert onboarded["profile"]["target_exam"] == "JEE Advanced"
    print("[OK] Onboarding Completed for Alex Rivera")

    # 6. Fetch Dashboard Summary
    res = client.get("/api/dashboard", headers=new_headers)
    assert res.status_code == 200, res.text
    dash = res.json()
    assert len(dash["today_plan"]) > 0
    assert len(dash["weak_topics"]) > 0
    assert dash["ai_recommendation"] is not None
    print("[OK] Dashboard Summary Verified! Weak topics count:", len(dash["weak_topics"]))
    print("  AI Recommendation:", dash["ai_recommendation"]["title"])

if __name__ == "__main__":
    test_full_auth_and_dashboard_flow()
    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")
