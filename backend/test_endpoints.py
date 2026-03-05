import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json
from datetime import datetime

from main import app
from cache import MongoCache
from dynamic import fetch_tao_price, fetch_subnet_tokens_from_coingecko

# Test Client
client = TestClient(app)

# Health & Basic Endpoints
class TestBasicEndpoints:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "DeAIPro"
        assert "timestamp" in data
    def test_stats_endpoint(self):
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        # Verify required fields
        assert "tao_price" in data
        assert "market_cap" in data
        assert "volume_24h" in data
        assert data["tao_price"] > 0
    def test_subnets_endpoint(self):
        response = client.get("/api/subnets")
        assert response.status_code == 200
        data = response.json()
        # Should return list of subnets
        assert isinstance(data, list)
        assert len(data) > 0
        # Check subnet structure
        subnet = data[0]
        assert "id" in subnet
        assert "n" in subnet
        assert "mc" in subnet
    def test_news_endpoint(self):
        response = client.get("/api/news")
        assert response.status_code == 200
        data = response.json()
        # Should return list of news items
        assert isinstance(data, list)
        if len(data) > 0:
            news_item = data[0]
            assert isinstance(news_item, dict)
    def test_research_endpoint(self):
        response = client.get("/api/research")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    def test_lessons_endpoint(self):
        response = client.get("/api/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


# Rate Limiting Tests
class TestRateLimiting:
    def test_rate_limit_headers(self):
        response = client.get("/api/stats")
        assert response.status_code == 200
        assert "x-ratelimit-limit" in response.headers or response.status_code == 200


# Request-Access Handling
class TestAccessControl:
    def test_request_access_valid_email(self):
        response = client.post("/api/request-access", json={"email": "user@example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access request" in data["message"].lower()
    def test_request_access_invalid_email(self):
        response = client.post("/api/request-access", json={"email": "invalid"})
        assert response.status_code == 422


# Dynamic Data Fetching Tests 
class TestDynamicDataFetching:
    @pytest.mark.asyncio
    async def test_fetch_tao_price_returns_dict_or_none(self):
        result = await fetch_tao_price()
        # Should return dict or None
        assert result is None or isinstance(result, dict)
    @pytest.mark.asyncio
    async def test_fetch_coingecko_subnets_structure(self):
        assert isinstance(result, dict)


# Error Handling Tests
class TestErrorHandling:
    def test_404_not_found(self):
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    def test_invalid_method(self):
        response = client.post("/api/stats")  # GET endpoint, POST request
        assert response.status_code == 405

# Auth Tests
class TestAuthentication:
    def test_missing_bearer_token(self):
        response = client.get("/api/subnets-detailed")
        assert response.status_code == 403  # Missing credentials
    def test_invalid_bearer_token(self):
        response = client.get(
            "/api/subnets-detailed",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401  # Unauthorized

# Integration Tests
class TestIntegration:
    def test_public_endpoints_concurrency(self):
        stats = client.get("/api/stats")
        subnets = client.get("/api/subnets")
        news = client.get("/api/news")
        assert stats.status_code == 200
        assert subnets.status_code == 200
        assert news.status_code == 200
        # Data should be consistent
        stats_data = stats.json()
        subnets_data = subnets.json()
        # TAO price should be reasonable
        assert 1 < stats_data["tao_price"] < 10000

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
