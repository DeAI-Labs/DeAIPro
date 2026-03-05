import pytest
import os
from unittest.mock import patch, MagicMock, AsyncMock

# Set test environment
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["MONGODB_DB_NAME"] = "deaipro_test"

@pytest.fixture
def mock_mongo_cache():
    with patch("cache.MongoCache") as mock_cache:
        mock_cache.return_value.get = AsyncMock(return_value=None)
        mock_cache.return_value.set = AsyncMock()
        mock_cache.return_value.connect = AsyncMock()
        mock_cache.return_value.disconnect = AsyncMock()
        yield mock_cache


@pytest.fixture
def mock_firebase_user():
    return {
        "uid": "test_user_123",
        "email": "test@example.com",
        "email_verified": True,
        "iss": "https://securetoken.google.com/test-project",
        "aud": "test-project",
        "auth_time": 1234567890,
        "user_id": "test_user_123",
        "sub": "test_user_123",
        "iat": 1234567890,
        "exp": 1234571490,
    }


@pytest.fixture
def mock_firebase_admin():
    with patch("firebase_admin.auth") as mock_auth:
        mock_auth.verify_id_token = MagicMock()
        mock_auth.get_user_by_email = MagicMock()
        mock_auth.create_user = MagicMock()
        mock_auth.generate_password_reset_link = MagicMock(return_value="https://example.com/reset")
        yield mock_auth


# Pytest markers
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "integration: integration test"
    )
    config.addinivalue_line(
        "markers", "slow: slow running test"
    )
    config.addinivalue_line(
        "markers", "asyncio: async test"
    )
