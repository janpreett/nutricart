"""
Unit tests for database models and functions.
"""
import pytest
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, Profile, User, Contact

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
