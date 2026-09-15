"""Unit tests for FastAPI endpoints using TestClient."""

import pytest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.api.app import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["pipeline_initialized"] is True


def test_chat_endpoint(client):
    payload = {
        "student_id": "test_student_42",
        "question": "Can you give me a hint on solving quadratic equations?",
        "concept": "Quadratic Equations",
        "subject": "Mathematics",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "test_student_42"
    assert "tutor_response" in data
    assert len(data["tutor_response"]) > 0
    assert "mastery_after" in data


def test_student_state_endpoint(client):
    response = client.get("/student/test_student_42/state?concept=Quadratic%20Equations")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "test_student_42"
    assert "mastery_summary" in data
    assert "current_mastery" in data["mastery_summary"]
