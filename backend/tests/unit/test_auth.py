"""
Unit tests for authentication functions.
"""
import pytest
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.auth import verify_password, get_password_hash, create_access_token, verify_token
from datetime import timedelta

def test_password_hashing():
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Hash should be different from original password
    assert hashed != password
    # Should verify correctly
    assert verify_password(password, hashed) is True
    # Should not verify incorrect password
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    """Test JWT token"""
    data = {"sub": "test@example.com"}
    token = create_access_token(data)
    
    # Token should be a string
    assert isinstance(token, str)
    # Token should contain data
    assert len(token) > 0

def test_create_access_token_with_expiry():
    """Test JWT token with custom expiry."""
    data = {"sub": "test@example.com"}
    expires_delta = timedelta(minutes=60)
    token = create_access_token(data, expires_delta)
    
    # Token should be created successfully
    assert isinstance(token, str)
    assert len(token) > 0

def test_verify_token():
    """Test JWT token verification."""
    data = {"sub": "test@example.com"}
    token = create_access_token(data)
    
    # Valid token should return email
    email = verify_token(token)
    assert email == "test@example.com"
    
    # Invalid token should return None
    invalid_email = verify_token("invalid.token.here")
    assert invalid_email is None
