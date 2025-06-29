"""
Unit tests for authentication functions.
"""
import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.auth import (
    verify_password, get_password_hash, create_access_token, verify_token,
    get_db, get_user_by_email, authenticate_user, get_current_user,
    get_current_active_user
)
from app.database import User
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

def test_verify_token_no_subject():
    """Test token verification with missing subject."""
    # Create token without 'sub' field
    data = {"user": "test@example.com"}  # Wrong key
    token = create_access_token(data)
    
    email = verify_token(token)
    assert email is None

def test_get_db():
    """Test database session management."""
    db_gen = get_db()
    db = next(db_gen)
    
    # Should return a database session
    assert db is not None
    
    # Clean up
    try:
        next(db_gen)
    except StopIteration:
        pass  # Expected when generator is exhausted

@patch('app.auth.get_user_by_email')
def test_authenticate_user_success(mock_get_user):
    """Test successful user authentication."""
    # Mock user with hashed password
    mock_user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword")
    )
    mock_get_user.return_value = mock_user
    
    mock_db = Mock()
    result = authenticate_user(mock_db, "test@example.com", "testpassword")
    
    assert result == mock_user
    mock_get_user.assert_called_once_with(mock_db, "test@example.com")

@patch('app.auth.get_user_by_email')
def test_authenticate_user_not_found(mock_get_user):
    """Test authentication when user doesn't exist."""
    mock_get_user.return_value = None
    
    mock_db = Mock()
    result = authenticate_user(mock_db, "nonexistent@example.com", "password")
    
    assert result is None

@patch('app.auth.get_user_by_email')
def test_authenticate_user_wrong_password(mock_get_user):
    """Test authentication with wrong password."""
    mock_user = User(
        email="test@example.com",
        hashed_password=get_password_hash("correctpassword")
    )
    mock_get_user.return_value = mock_user
    
    mock_db = Mock()
    result = authenticate_user(mock_db, "test@example.com", "wrongpassword")
    
    assert result is None

@patch('app.auth.get_user_by_email')
@patch('app.auth.verify_token')
def test_get_current_user_success(mock_verify_token, mock_get_user):
    """Test successful current user retrieval."""
    mock_verify_token.return_value = "test@example.com"
    mock_user = User(email="test@example.com", is_active=True)
    mock_get_user.return_value = mock_user
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")
    mock_db = Mock()
    
    result = get_current_user(credentials, mock_db)
    
    assert result == mock_user

@patch('app.auth.verify_token')
def test_get_current_user_invalid_token(mock_verify_token):
    """Test current user retrieval with invalid token."""
    mock_verify_token.return_value = None
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")
    mock_db = Mock()
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)
    
    assert exc_info.value.status_code == 401

@patch('app.auth.get_user_by_email')
@patch('app.auth.verify_token')
def test_get_current_user_not_found(mock_verify_token, mock_get_user):
    """Test current user retrieval when user not found."""
    mock_verify_token.return_value = "test@example.com"
    mock_get_user.return_value = None
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")
    mock_db = Mock()
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)
    
    assert exc_info.value.status_code == 401

def test_get_current_active_user_active():
    """Test active user validation."""
    mock_user = User(is_active=True)
    
    result = get_current_active_user(mock_user)
    
    assert result == mock_user

def test_get_current_active_user_inactive():
    """Test inactive user validation."""
    mock_user = User(is_active=False)
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_active_user(mock_user)
    
    assert exc_info.value.status_code == 400
    assert "Inactive user" in exc_info.value.detail
