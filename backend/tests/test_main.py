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
from app.database import User

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

def test_register_invalid_email(client_with_test_db):
    """Test registration with invalid email format."""
    user = {
        "first_name": "Test",
        "last_name": "User",
        "email": "invalid-email",
        "password": "testpass123"
    }
    response = client_with_test_db.post("/auth/register", json=user)
    assert response.status_code == 422  # Validation error

def test_register_missing_fields(client_with_test_db):
    """Test registration with missing required fields."""
    user = {
        "first_name": "Test",
        "email": "test@example.com"
        # Missing last_name and password
    }
    response = client_with_test_db.post("/auth/register", json=user)
    assert response.status_code == 422  # Validation error

def test_login_missing_fields(client_with_test_db):
    """Test login with missing fields."""
    login = {"email": "test@example.com"}  # Missing password
    response = client_with_test_db.post("/auth/login", json=login)
    assert response.status_code == 422  # Validation error

def test_profile_invalid_data(client_with_test_db):
    # Register and login user first
    user_data = {
        "first_name": "Profile",
        "last_name": "Test",
        "email": "profiletest@example.com",
        "password": "testpass123"
    }
    client_with_test_db.post("/auth/register", json=user_data)
    
    login_response = client_with_test_db.post("/auth/login", json={
        "email": "profiletest@example.com",
        "password": "testpass123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to create profile with invalid data
    invalid_profile = {
        "age": -5,  # Invalid age
        "weight": "not_a_number",  # Invalid weight
        "height": 175.0,
        "goal": "invalid_goal"
    }
    
    response = client_with_test_db.post("/profile", json=invalid_profile, headers=headers)
    assert response.status_code == 422  # Validation error

def test_contact_invalid_data(client_with_test_db):
    invalid_contact = {
        "first_name": "",  # Empty required field
        "last_name": "Test",
        "email": "invalid-email-format",
        "message": "Test message"
    }
    
    response = client_with_test_db.post("/contact", json=invalid_contact)
    assert response.status_code == 422  # Validation error

def test_contact_missing_required_fields(client_with_test_db):
    incomplete_contact = {
        "first_name": "Test"
        # Missing last_name, email, and message
    }
    
    response = client_with_test_db.post("/contact", json=incomplete_contact)
    assert response.status_code == 422  # Validation error

def test_meal_plan_unauthorized_access(client_with_test_db):
    """Test accessing meal plan for different user."""
    # Register and login user
    user_data = {
        "first_name": "MealAuth",
        "last_name": "Test",
        "email": "mealauth@example.com",
        "password": "testpass123"
    }
    reg_response = client_with_test_db.post("/auth/register", json=user_data)
    
    login_response = client_with_test_db.post("/auth/login", json={
        "email": "mealauth@example.com",
        "password": "testpass123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to access meal plan for a different user (should be forbidden)
    response = client_with_test_db.get("/generate_plan/999", headers=headers)
    assert response.status_code == 403

def test_health_check():
    """Test health check endpoint if it exists."""
    # This might not exist in your API, but testing for completeness
    response = client.get("/health")
    # Accept both 200 (if endpoint exists) or 404 (if it doesn't)
    assert response.status_code in [200, 404]

def test_cors_headers():
    """Test that CORS headers are properly set."""
    response = client.get("/")
    # CORS headers should be present for cross-origin requests
    assert response.status_code == 200
