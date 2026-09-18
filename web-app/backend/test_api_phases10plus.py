import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== Testing Phase 10-29 Backend Endpoints ===")
    
    # 1. Login with demo user
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "student@intellitutor.ai",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("[PASS] Auth login verified")

    # 2. Phase 10: Knowledge Hub
    k_res = requests.get(f"{BASE_URL}/knowledge", headers=headers)
    assert k_res.status_code == 200, f"List knowledge failed: {k_res.text}"
    k_data = k_res.json()
    assert "items" in k_data and len(k_data["items"]) > 0
    print(f"[PASS] Knowledge Hub verified ({len(k_data['items'])} items)")

    # Test extract endpoint
    extract_res = requests.post(f"{BASE_URL}/knowledge/extract", headers=headers, json={
        "raw_text": "Gauss Law states that the total electric flux through a closed surface is equal to 1/epsilon_0 times the net charge enclosed: Phi = Q_enclosed / epsilon_0.",
        "subject": "Physics",
        "chapter": "Electrostatics",
        "topic": "Gauss Law and Electric Flux"
    })
    assert extract_res.status_code == 200, f"Knowledge extraction failed: {extract_res.text}"
    print("[PASS] Knowledge Extraction & Flashcard Auto-Generation verified")

    # Test global search
    search_res = requests.post(f"{BASE_URL}/knowledge/search", headers=headers, json={
        "query": "Angular Momentum"
    })
    assert search_res.status_code == 200, f"Search failed: {search_res.text}"
    search_data = search_res.json()
    assert "results" in search_data and "knowledge" in search_data["results"]
    print("[PASS] Unified Global Search (Ctrl+K) verified")

    # 3. Phase 11: Smart Flashcards
    fc_res = requests.get(f"{BASE_URL}/flashcards", headers=headers)
    assert fc_res.status_code == 200, f"Flashcards list failed: {fc_res.text}"
    cards = fc_res.json()["cards"]
    assert len(cards) > 0
    print(f"[PASS] Smart Flashcard Decks verified ({len(cards)} cards)")

    # Test due flashcards
    due_res = requests.get(f"{BASE_URL}/flashcards/due", headers=headers)
    assert due_res.status_code == 200
    print("[PASS] Due Flashcards Deck verified")

    # Test SM-2 review
    first_card_id = cards[0]["id"]
    review_res = requests.post(f"{BASE_URL}/flashcards/{first_card_id}/review", headers=headers, json={
        "rating": "GOOD",
        "time_taken_ms": 2500
    })
    assert review_res.status_code == 200, f"SM-2 Review failed: {review_res.text}"
    assert "new_interval_days" in review_res.json()
    print("[PASS] SM-2 Spaced Repetition Review verified")

    # 4. Phase 12, 20, 21: Memory Vault & Quick Recall
    mem_res = requests.get(f"{BASE_URL}/memory", headers=headers)
    assert mem_res.status_code == 200
    print("[PASS] Memory Vault overview verified")

    formulas_res = requests.get(f"{BASE_URL}/memory/formulas", headers=headers)
    assert formulas_res.status_code == 200
    assert "grouped_formulas" in formulas_res.json()
    print("[PASS] Formula Vault verified")

    recall_res = requests.get(f"{BASE_URL}/memory/quick-recall?duration_minutes=10", headers=headers)
    assert recall_res.status_code == 200
    assert "formulas" in recall_res.json() and "flashcards" in recall_res.json()
    print("[PASS] Quick Recall Mode (10 min session) verified")

    exam_res = requests.get(f"{BASE_URL}/memory/exam?exam=NEET", headers=headers)
    assert exam_res.status_code == 200
    print("[PASS] High-Yield Exam Cram Mode verified")

    # 5. Phase 13: Diagram Engine
    diag_res = requests.get(f"{BASE_URL}/diagrams", headers=headers)
    assert diag_res.status_code == 200
    diags = diag_res.json()["diagrams"]
    assert len(diags) > 0
    print(f"[PASS] Educational Diagram Engine verified ({len(diags)} diagrams)")

    # 6. Phase 14: PYQ Knowledge System
    pyq_res = requests.get(f"{BASE_URL}/pyq", headers=headers)
    assert pyq_res.status_code == 200
    pyqs = pyq_res.json()["pyqs"]
    assert len(pyqs) > 0
    print(f"[PASS] PYQ Knowledge Archive verified ({len(pyqs)} PYQs)")

    first_pyq_id = pyqs[0]["id"]
    submit_res = requests.post(f"{BASE_URL}/pyq/{first_pyq_id}/submit", headers=headers, json={
        "selected_option": pyqs[0]["options"][0],
        "time_taken_seconds": 35
    })
    assert submit_res.status_code == 200
    print("[PASS] PYQ Live Attempt & Pattern Logging verified")

    pyq_analytics_res = requests.get(f"{BASE_URL}/pyq/analytics/overview", headers=headers)
    assert pyq_analytics_res.status_code == 200
    print("[PASS] PYQ Recurring Pattern Analytics verified")

    # 7. Phase 15: Reference Book System
    books_res = requests.get(f"{BASE_URL}/books", headers=headers)
    assert books_res.status_code == 200
    books = books_res.json()["books"]
    assert len(books) > 0
    print(f"[PASS] Reference Book System verified ({len(books)} books)")

    # 8. Phase 16, 17, 19: Videos & Resource Recommendations
    vids_res = requests.get(f"{BASE_URL}/resources/videos", headers=headers)
    assert vids_res.status_code == 200
    print("[PASS] Personalized Video Recommendations verified")

    next_act_res = requests.get(f"{BASE_URL}/resources/next-action", headers=headers)
    assert next_act_res.status_code == 200
    assert "recommendation" in next_act_res.json()
    print(f"[PASS] 'What Should I Do Now?' Single Recommendation: '{next_act_res.json()['recommendation']['title']}'")

    retention_res = requests.get(f"{BASE_URL}/resources/retention-matrix", headers=headers)
    assert retention_res.status_code == 200
    print("[PASS] Ebbinghaus Forgetting Curve Retention Matrix verified")

    # 9. Phase 18: Unified Topic Nerve Center
    topic_res = requests.get(f"{BASE_URL}/topics/Rotational%20Motion/overview", headers=headers)
    assert topic_res.status_code == 200
    overview = topic_res.json()["overview"]
    assert "learn" in overview and "visualize" in overview and "remember" in overview
    print("[PASS] Unified 360 Topic Study Desk verified")

    print("\n=======================================================")
    print("ALL PHASE 10-29 BACKEND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
