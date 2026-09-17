import io
import sys
sys.path.insert(0, r"c:\llm-scratch\llm\web-app\backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phases_2_3_4_features():
    # 1. Login demo user
    res = client.post("/api/auth/login", json={"email": "student@intellitutor.ai", "password": "password123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Logged in as Demo User")

    # 2. Test Curriculum hierarchy
    res = client.get("/api/curriculum/exams")
    assert res.status_code == 200
    exams = res.json()["exams"]
    assert len(exams) >= 2
    print("[OK] Curriculum Exams count:", len(exams))

    res = client.get("/api/curriculum/subjects?exam=NEET")
    assert res.status_code == 200
    subjects = res.json()["subjects"]
    assert len(subjects) >= 3
    print("[OK] NEET Subjects hierarchy loaded:", [s["name"] for s in subjects])

    # 3. Test Profile Update
    res = client.put("/api/profile", headers=headers, json={
        "daily_study_hours": 4.0,
        "explanation_preference": "Intermediate"
    })
    assert res.status_code == 200
    prof = res.json()
    assert prof["profile"]["daily_study_hours"] == 4.0
    assert prof["profile"]["explanation_preference"] == "Intermediate"
    print("[OK] Profile update verified (daily_study_hours=4.0)")

    # 4. Test Document Upload & Processing
    sample_text = (
        "Rotational Dynamics Lecture Notes.\n"
        "The moment of inertia of a uniform disk of mass M and radius R about its central axis is I = 1/2 M R^2.\n"
        "Torque tau is defined as r cross F. In pure rolling motion, the point of contact is instantaneously at rest.\n"
        "Conservation of angular momentum applies whenever net external torque is zero."
    )
    fake_file = io.BytesIO(sample_text.encode("utf-8"))
    res = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("Mechanics_Lecture_04.txt", fake_file, "text/plain")},
        data={"subject": "Physics", "chapter": "Rotational Motion"}
    )
    assert res.status_code == 200, res.text
    doc_data = res.json()["document"]
    doc_id = doc_data["id"]
    print(f"[OK] Document uploaded successfully: {doc_data['title']} (ID: {doc_id})")

    # Verify document listing
    res = client.get("/api/documents", headers=headers)
    assert res.status_code == 200
    docs = res.json()["documents"]
    assert len(docs) >= 1
    print("[OK] Documents listed count:", len(docs))

    # 5. Test AI Socratic Chat & RAG Retrieval
    res = client.post("/api/tutor/chat", headers=headers, json={
        "prompt": "What is the moment of inertia of a disk?",
        "explanation_mode": "Exam-oriented",
        "subject": "Physics"
    })
    assert res.status_code == 200, res.text
    chat_res = res.json()
    assert chat_res["conversation_id"] is not None
    assert len(chat_res["message"]["content"]) > 0
    print("[OK] AI Socratic Chat returned response successfully!")
    if chat_res["message"]["citations"]:
        print("  Grounded Citation found:", chat_res["message"]["citations"][0]["document_title"])

    # 6. Test Dashboard Task Toggle
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    plan_items = dash_res.json()["today_plan"]
    if plan_items:
        task_id = plan_items[0]["id"]
        toggle_res = client.post(f"/api/dashboard/tasks/{task_id}/toggle", headers=headers)
        assert toggle_res.status_code == 200, toggle_res.text
        print(f"[OK] Dashboard task toggled: task_id={task_id}, is_completed={toggle_res.json()['is_completed']}")

if __name__ == "__main__":
    test_phases_2_3_4_features()
    print("\nALL PHASES 2, 3, 4 BACKEND TESTS PASSED SUCCESSFULLY!")
