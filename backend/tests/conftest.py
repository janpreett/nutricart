"""
Test configuration and fixtures for pytest.
"""
import pytest
import tempfile
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.auth import get_db
from app.main import app

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test function."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def override_get_db():
    """Override the get_db dependency for testing."""
    def _override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    return _override_get_db

@pytest.fixture
def client_with_test_db(test_db, override_get_db):
    """FastAPI test client with test database."""
    from fastapi.testclient import TestClient
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
