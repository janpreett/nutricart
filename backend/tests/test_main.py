"""
Test main FastAPI endpoints for NutriCart backend.
"""
import pytest
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    """Test the root endpoint returns a welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "NutriCart backend up!"}

def test_register_and_login(client_with_test_db):
    """Test user registration and login endpoints."""
    user = {
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    # Register
    response = client_with_test_db.post("/auth/register", json=user)
    assert response.status_code == 200 or response.status_code == 400
    # Login
    login = {"email": user["email"], "password": user["password"]}
    response = client_with_test_db.post("/auth/login", json=login)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
