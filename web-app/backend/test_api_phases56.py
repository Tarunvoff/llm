import sys
sys.path.insert(0, r"c:\llm-scratch\llm\web-app\backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phases_5_and_6_features():
    print("--- STARTING PHASES 5 & 6 BACKEND TEST SUITE ---")
    
    # 1. Auth Demo User
    res = client.post("/api/auth/login", json={"email": "student@intellitutor.ai", "password": "password123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Logged in as Demo User")

    # 2. Test Practice / Quiz Generation & Retrieval
    res = client.post("/api/quizzes/generate", headers=headers, json={
        "subject": "Physics",
        "chapter": "Rotational Dynamics",
        "topic": "Torque and Angular Momentum",
        "difficulty": "Exam level",
        "question_type": "MCQ",
        "question_count": 3
    })
    assert res.status_code == 200, res.text
    quiz_data = res.json()
    quiz_obj = quiz_data.get("quiz", quiz_data)
    quiz_id = quiz_obj.get("id") or quiz_data.get("quiz_id")
    questions = quiz_obj.get("questions", [])
    assert len(questions) >= 1
    print(f"[OK] Generated Quiz successfully: ID={quiz_id}, questions count={len(questions)}")

    # 3. Test Quiz Submission & Automatic Mistake Book Logging
    # Intentionally submit one right and one wrong answer
    q1 = questions[0]
    q2 = questions[1]
    sub_res = client.post(f"/api/quizzes/{quiz_id}/submit", headers=headers, json={
        "answers": [
            {"question_id": q1["id"], "user_answer": q1["options"][0]},
            {"question_id": q2["id"], "user_answer": "Wrong Distractor Answer"}
        ],
        "time_taken_seconds": 65
    })
    assert sub_res.status_code == 200, sub_res.text
    score_data = sub_res.json()
    print(f"[OK] Submitted Quiz: Score={score_data['score']}% ({score_data['correct_count']}/{score_data['total_count']}), XP earned={score_data['xp_earned']}")

    # 4. Test Mistakes Notebook API
    res = client.get("/api/mistakes", headers=headers)
    assert res.status_code == 200, res.text
    mistakes_data = res.json()
    assert "stats" in mistakes_data
    assert len(mistakes_data["mistakes"]) >= 1
    m1 = mistakes_data["mistakes"][0]
    print(f"[OK] Mistakes listed: Total={mistakes_data['stats']['total']}, Conceptual={mistakes_data['stats']['conceptual']}")

    # Test toggle mistake resolve
    res = client.post(f"/api/mistakes/{m1['id']}/toggle-resolve", headers=headers)
    assert res.status_code == 200
    print(f"[OK] Toggled mistake resolution: ID={m1['id']}, is_resolved={res.json()['is_resolved']}")

    # Test Mistakes Retest Generator
    retest_res = client.post("/api/mistakes/retest", headers=headers)
    assert retest_res.status_code == 200, retest_res.text
    assert retest_res.json()["question_count"] >= 1
    print(f"[OK] Generated targeted retest quiz from mistakes: Title='{retest_res.json()['title']}'")

    # 5. Test Spaced Repetition Revision API
    rev_res = client.get("/api/revision", headers=headers)
    assert rev_res.status_code == 200, rev_res.text
    buckets = rev_res.json()["buckets"]
    assert len(buckets) == 4
    print(f"[OK] Spaced Repetition buckets loaded: {len(buckets)} stages, Total Due Today={rev_res.json()['total_due_today']}")

    if buckets[0]["topics"]:
        item_id = buckets[0]["topics"][0]["id"]
        comp_res = client.post(f"/api/revision/{item_id}/complete", headers=headers)
        assert comp_res.status_code == 200
        print(f"[OK] Completed revision topic, advanced stage to {comp_res.json()['interval_stage']}")

    # 6. Test Weekly Study Planner API
    plan_res = client.get("/api/planner/week", headers=headers)
    assert plan_res.status_code == 200, plan_res.text
    week_data = plan_res.json()
    assert len(week_data["days"]) == 5
    assert len(week_data["sessions"]) >= 5
    print(f"[OK] Weekly Study Planner loaded: {len(week_data['sessions'])} sessions across 5 days")

    session_id = week_data["sessions"][0]["id"]
    t_res = client.post(f"/api/planner/items/{session_id}/toggle", headers=headers)
    assert t_res.status_code == 200
    print(f"[OK] Toggled planner session: ID={session_id}, completed={t_res.json()['is_completed']}")

    # 7. Test Mock Tests API
    mock_res = client.get("/api/mock-tests", headers=headers)
    assert mock_res.status_code == 200, mock_res.text
    mock_list = mock_res.json()["mock_tests"]
    assert len(mock_list) >= 2
    print(f"[OK] Mock Tests listed: count={len(mock_list)}")

    gen_mock_res = client.post("/api/mock-tests/generate", headers=headers, json={"subject": "All", "question_count": 5})
    assert gen_mock_res.status_code == 200, gen_mock_res.text
    print(f"[OK] Generated Adaptive Mock Test: ID={gen_mock_res.json()['id']}, Title='{gen_mock_res.json()['title']}'")

    # 8. Test Deep Analytics & Mastery Tree API
    analytics_res = client.get("/api/analytics/overview", headers=headers)
    assert analytics_res.status_code == 200, analytics_res.text
    stats = analytics_res.json()
    assert "overall_mastery" in stats
    assert "accuracy" in stats
    print(f"[OK] Analytics Overview: Mastery={stats['overall_mastery']}%, Accuracy={stats['accuracy']}%, Streak={stats['streak_days']} days")

    tree_res = client.get("/api/analytics/mastery-tree", headers=headers)
    assert tree_res.status_code == 200, tree_res.text
    tree = tree_res.json()["topic_tree"]
    assert "Physics" in tree and "Chemistry" in tree and "Biology" in tree
    print(f"[OK] Mastery Tree loaded for subjects: {list(tree.keys())}")

    # 9. Test Feedback Submission API
    fb_res = client.post("/api/feedback", headers=headers, json={
        "rating": 1,
        "comment": "Exceptional Socratic scaffolding breakdown without giving away direct answers.",
        "category": "Socratic Scaffolding"
    })
    assert fb_res.status_code == 200, fb_res.text
    print(f"[OK] Feedback recorded: {fb_res.json()['message']}")

if __name__ == "__main__":
    test_phases_5_and_6_features()
    print("\n=======================================================")
    print("ALL PHASES 5 & 6 BACKEND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")
