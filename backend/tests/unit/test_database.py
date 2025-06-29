"""
Unit tests for database models and functions.
"""
import pytest
import sys
import warnings
from pathlib import Path
from datetime import datetime, timezone
import json

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import (
    Base, Profile, User, Contact, MealPlan, Meal, Ingredient, JSON,
    calculate_bmr, adjust_tdee, generate_meal_plan, init_db
)

def test_profile_model():
    profile = Profile(
        user_id=1,
        age=25,
        weight=70.5,
        height=175.0,
        goal="weight_loss"
    )
    
    assert profile.user_id == 1
    assert profile.age == 25
    assert profile.weight == 70.5
    assert profile.height == 175.0
    assert profile.goal == "weight_loss"

def test_user_model():
    user = User(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        hashed_password="hashed_password_here",
        is_active=True,
        is_verified=False
    )
    
    assert user.first_name == "John"
    assert user.last_name == "Doe"
    assert user.email == "john@example.com"
    assert user.hashed_password == "hashed_password_here"
    assert user.is_active is True
    assert user.is_verified is False

def test_contact_model():
    contact = Contact(
        first_name="Jane",
        last_name="Smith",
        email="jane@example.com",
        phone="123-456-7890",
        message="Test message",
        sms_consent=True
    )
    
    assert contact.first_name == "Jane"
    assert contact.last_name == "Smith"
    assert contact.email == "jane@example.com"
    assert contact.phone == "123-456-7890"
    assert contact.message == "Test message"
    assert contact.sms_consent is True

def test_meal_plan_model():
    plan_data = {"breakfast": "oatmeal", "lunch": "salad"}
    meal_plan = MealPlan(
        name="Weekly Plan",
        user_id=1,
        plan_json=plan_data,
        plan_ids="1,2,3",
        created_at=datetime.now(timezone.utc)
    )
    
    assert meal_plan.name == "Weekly Plan"
    assert meal_plan.user_id == 1
    assert meal_plan.plan_json == plan_data
    assert meal_plan.plan_ids == "1,2,3"
    assert meal_plan.created_at is not None

def test_meal_model():
    meal = Meal(
        name="Chicken Salad",
        ingredient_ids="1,2,3,4",
        instructions="Mix all ingredients",
        created_at=datetime.now(timezone.utc)
    )
    
    assert meal.name == "Chicken Salad"
    assert meal.ingredient_ids == "1,2,3,4"
    assert meal.instructions == "Mix all ingredients"
    assert meal.created_at is not None

def test_ingredient_model():
    ingredient = Ingredient(
        name="Chicken Breast",
        created_at=datetime.now(timezone.utc)
    )
    
    assert ingredient.name == "Chicken Breast"
    assert ingredient.created_at is not None

def test_json_type_bind_param():
    """Test JSON type bind parameter processing."""
    json_type = JSON()
    
    # Test with dict
    result = json_type.process_bind_param({"key": "value"}, None)
    assert result == '{"key": "value"}'
    
    # Test with None
    result = json_type.process_bind_param(None, None)
    assert result is None

def test_json_type_result_value():
    """Test JSON type result value processing."""
    json_type = JSON()
    
    # Test with JSON string
    result = json_type.process_result_value('{"key": "value"}', None)
    assert result == {"key": "value"}
    
    # Test with None
    result = json_type.process_result_value(None, None)
    assert result is None

def test_calculate_bmr():
    """Test BMR calculation using Mifflin-St Jeor equation."""
    # Test with typical values
    bmr = calculate_bmr(25, 70, 175)
    expected = 10 * 70 + 6.25 * 175 - 5 * 25 + 5
    assert bmr == expected
    
    # Test with different values
    bmr = calculate_bmr(30, 80, 180)
    expected = 10 * 80 + 6.25 * 180 - 5 * 30 + 5
    assert bmr == expected

def test_adjust_tdee_maintain():
    """Test TDEE adjustment for maintenance goal."""
    bmr = 1500
    tdee = adjust_tdee(bmr, "maintain")
    expected = bmr * 1.2  # Sedentary activity factor
    assert tdee == expected

def test_adjust_tdee_lose():
    """Test TDEE adjustment for weight loss goal."""
    bmr = 1500
    tdee = adjust_tdee(bmr, "lose")
    expected = bmr * 1.2 - 500
    assert tdee == expected

def test_adjust_tdee_gain():
    """Test TDEE adjustment for weight gain goal."""
    bmr = 1500
    tdee = adjust_tdee(bmr, "gain")
    expected = bmr * 1.2 + 300
    assert tdee == expected

def test_generate_meal_plan():
    """Test meal plan generation."""
    profile = {
        "user_id": 1,
        "age": 25,
        "weight": 70,
        "height": 175,
        "goal": "maintain"
    }
    
    # Suppress sklearn warning about feature names
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="X does not have valid feature names")
        meal_plan = generate_meal_plan(profile)
    
    assert "user_id" in meal_plan
    assert "weekly_plan" in meal_plan
    assert meal_plan["user_id"] == 1
    assert len(meal_plan["weekly_plan"]) == 7  # 7 days
    
    # Check each day has the required structure
    for day_plan in meal_plan["weekly_plan"]:
        assert "day" in day_plan
        assert "meals" in day_plan
        assert len(day_plan["meals"]) == 3  # 3 meals per day
        
        for meal in day_plan["meals"]:
            assert "name" in meal
            assert "calories" in meal

def test_init_db():
    """Test database initialization."""
    # This test ensures init_db runs without errors
    try:
        init_db()
        assert True
    except Exception as e:
        pytest.fail(f"init_db() raised an exception: {e}")
