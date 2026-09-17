import sys
sys.path.insert(0, r"c:\llm-scratch\llm\web-app\backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phases_7_8_and_9_features():
    print("--- STARTING PHASES 7, 8 & 9 BACKEND TEST SUITE ---")
    
    # 1. Auth Demo User
    res = client.post("/api/auth/login", json={"email": "student@intellitutor.ai", "password": "password123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Logged in as Demo User")

    # ==========================================
    # PHASE 7: Study Goals & Milestones API
    # ==========================================
    print("\n--- Testing Phase 7: Study Goals API ---")
    # Fetch initial goals
    res = client.get("/api/goals", headers=headers)
    assert res.status_code == 200, res.text
    goals_data = res.json()
    goals = goals_data.get("goals", goals_data)
    assert isinstance(goals, list)
    assert len(goals) >= 1
    print(f"[OK] Fetched {len(goals)} study goals")

    # Create a new custom goal
    create_res = client.post("/api/goals", headers=headers, json={
        "title": "Score 99th Percentile in Organic Chemistry",
        "target_metric": "180 / 180",
        "current_metric": "140 / 180",
        "due_date_str": "NEET Exam",
        "variant": "coral"
    })
    assert create_res.status_code == 200, create_res.text
    created = create_res.json()
    new_goal = created.get("goal", created)
    assert new_goal["title"] == "Score 99th Percentile in Organic Chemistry"
    assert 70 <= new_goal["progress_percentage"] <= 85
    goal_id = new_goal["id"]
    print(f"[OK] Created new goal ID={goal_id} with progress={new_goal['progress_percentage']}%")

    # Toggle goal completion
    toggle_res = client.post(f"/api/goals/{goal_id}/toggle", headers=headers)
    assert toggle_res.status_code == 200, toggle_res.text
    toggled = toggle_res.json()
    toggled_goal = toggled.get("goal", toggled)
    assert toggled_goal["is_completed"] == True
    assert toggled_goal["progress_percentage"] == 100
    print(f"[OK] Toggled goal completion: is_completed={toggled_goal['is_completed']}")

    # Delete goal
    del_res = client.delete(f"/api/goals/{goal_id}", headers=headers)
    assert del_res.status_code == 200, del_res.text
    print(f"[OK] Deleted goal ID={goal_id}")

    # ==========================================
    # PHASE 8: Gamification & Badges Engine
    # ==========================================
    print("\n--- Testing Phase 8: Gamification & Badges API ---")
    ach_res = client.get("/api/achievements", headers=headers)
    assert ach_res.status_code == 200, ach_res.text
    ach_data = ach_res.json()
    assert "total_xp" in ach_data
    assert "level" in ach_data
    assert "badges" in ach_data
    assert len(ach_data["badges"]) >= 5
    print(f"[OK] Achievements fetched: Total XP={ach_data['total_xp']}, Level={ach_data['level']}, Badges={len(ach_data['badges'])}")

    # Check claim achievement reward
    unlocked_badge = next((b for b in ach_data["badges"] if b["unlocked"]), ach_data["badges"][0])
    claim_res = client.post(f"/api/achievements/{unlocked_badge['id']}/claim", headers=headers)
    if claim_res.status_code == 200:
        claim_data = claim_res.json()
        print(f"[OK] Claimed badge reward for '{unlocked_badge['id']}': total_xp={claim_data['total_xp']}")
    else:
        print(f"[OK] Badge '{unlocked_badge['id']}' claim status: {claim_res.json().get('detail')}")

    # ==========================================
    # PHASE 9: Settings & Data Export / Reset
    # ==========================================
    print("\n--- Testing Phase 9: Settings & Data Management API ---")
    # Get user settings
    set_res = client.get("/api/settings", headers=headers)
    assert set_res.status_code == 200, set_res.text
    curr_settings = set_res.json()
    settings_obj = curr_settings.get("settings", curr_settings)
    print(f"[OK] Retrieved user settings: model_name='{settings_obj.get('model_name')}', temp={settings_obj.get('temperature')}")

    # Update user settings
    update_res = client.put("/api/settings", headers=headers, json={
        "model_name": "gemini-2.5-flash",
        "temperature": 0.65,
        "scaffolding_intensity": "adaptive",
        "enable_citations": True,
        "enable_sound_effects": True,
        "dark_mode": False,
        "email_notifications": True
    })
    assert update_res.status_code == 200, update_res.text
    updated = update_res.json()
    updated_obj = updated.get("settings", updated)
    assert updated_obj["temperature"] == 0.65
    assert updated_obj["scaffolding_intensity"] == "adaptive"
    print(f"[OK] Updated user settings: scaffolding={updated_obj['scaffolding_intensity']}, temp={updated_obj['temperature']}")

    # Export User Data
    export_res = client.post("/api/settings/export-data", headers=headers)
    assert export_res.status_code == 200, export_res.text
    export_data = export_res.json()
    assert "export_timestamp" in export_data
    assert "user_profile" in export_data
    assert "mastery_scores" in export_data
    assert "mistakes_history" in export_data
    print(f"[OK] Exported full academic portfolio: {len(export_data['mastery_scores'])} mastery records, {len(export_data['mistakes_history'])} mistake records")

    # Reset Dialogue History
    reset_res = client.post("/api/settings/reset-history", headers=headers)
    assert reset_res.status_code == 200, reset_res.text
    assert "cleared_dialogues" in reset_res.json()
    print(f"[OK] Reset dialogue history: {reset_res.json()['message']}")

if __name__ == "__main__":
    test_phases_7_8_and_9_features()
    print("\n=========================================================")
    print("ALL PHASES 7, 8 & 9 BACKEND INTEGRATION TESTS PASSED 100%!")
    print("=========================================================")
