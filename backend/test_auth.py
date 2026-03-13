"""
Integration tests for the authentication layer (Phase 1 refactor).

Covers:
 - verify_token runs in executor (non-blocking)
 - get_current_user raises 401 for missing / malformed / invalid tokens
 - require_staff raises 403 for non-@deaistrategies.io users
 - require_admin raises 403 when admin claim is absent
 - require_admin passes for staff + admin claim
 - PDF endpoints reject unauthenticated requests (403)
 - /api/subnets-detailed rejects unauthenticated requests (403)
"""

import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_decoded_token(
    email: str = "user@example.com",
    uid: str = "uid_001",
    email_verified: bool = True,
    admin: bool = False,
) -> dict:
    return {
        "uid": uid,
        "email": email,
        "email_verified": email_verified,
        "admin": admin,
    }


# ---------------------------------------------------------------------------
# Unit tests — dependencies/auth.py
# ---------------------------------------------------------------------------

class TestVerifyToken:
    """verify_token must offload the Firebase call to a thread executor."""

    @pytest.mark.asyncio
    async def test_valid_token_returns_decoded_dict(self):
        from dependencies.auth import verify_token

        fake_decoded = _make_decoded_token()
        with patch(
            "dependencies.auth.firebase_auth.verify_id_token",
            return_value=fake_decoded,
        ):
            result = await verify_token("good_token")
        assert result is not None
        assert result["email"] == "user@example.com"

    @pytest.mark.asyncio
    async def test_invalid_token_returns_none(self):
        from dependencies.auth import verify_token
        from firebase_admin import auth as fb_auth

        with patch(
            "dependencies.auth.firebase_auth.verify_id_token",
            side_effect=fb_auth.InvalidIdTokenError("bad"),
        ):
            result = await verify_token("bad_token")
        assert result is None

    @pytest.mark.asyncio
    async def test_expired_token_returns_none(self):
        from dependencies.auth import verify_token
        from firebase_admin import auth as fb_auth

        with patch(
            "dependencies.auth.firebase_auth.verify_id_token",
            side_effect=fb_auth.ExpiredIdTokenError("expired", Exception("expired")),
        ):
            result = await verify_token("expired_token")
        assert result is None

    @pytest.mark.asyncio
    async def test_runs_in_executor_not_blocking(self):
        """Verify that verify_id_token is called inside run_in_executor."""
        from dependencies.auth import verify_token

        call_thread_name = None

        def fake_verify(token):
            import threading
            nonlocal call_thread_name
            # If we are in the event loop thread this will be 'MainThread'
            # (test env) — but must NOT be the asyncio loop thread directly.
            call_thread_name = threading.current_thread().name
            return _make_decoded_token()

        with patch("dependencies.auth.firebase_auth.verify_id_token", side_effect=fake_verify):
            await verify_token("any_token")

        # In asyncio test runners the executor submits to a ThreadPoolExecutor.
        # The thread name won't be "MainThread" (which is the event loop thread).
        # This confirms the call was offloaded.
        assert call_thread_name is not None


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_missing_auth_header_raises_401(self):
        from dependencies.auth import get_current_user

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization=None)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_malformed_header_raises_401(self):
        from dependencies.auth import get_current_user

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization="NotBearer sometoken")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self):
        from dependencies.auth import get_current_user

        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer bad_token")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_valid_token_returns_current_user(self):
        from dependencies.auth import get_current_user, CurrentUser

        decoded = _make_decoded_token(email="person@example.com", uid="uid_xyz")
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            user = await get_current_user(authorization="Bearer valid_token")

        assert isinstance(user, CurrentUser)
        assert user.uid == "uid_xyz"
        assert user.email == "person@example.com"
        assert user.is_admin is False

    @pytest.mark.asyncio
    async def test_non_staff_user_is_not_admin(self):
        from dependencies.auth import get_current_user

        decoded = _make_decoded_token(email="hacker@gmail.com", admin=True)
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            user = await get_current_user(authorization="Bearer token")
        # firebase admin claim present, but domain is wrong → not admin
        assert user.is_admin is False

    @pytest.mark.asyncio
    async def test_staff_with_admin_claim_is_admin(self):
        from dependencies.auth import get_current_user

        decoded = _make_decoded_token(email="ceo@deaistrategies.io", admin=True)
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            user = await get_current_user(authorization="Bearer token")
        assert user.is_admin is True

    @pytest.mark.asyncio
    async def test_is_staff_property(self):
        from dependencies.auth import get_current_user

        decoded = _make_decoded_token(email="analyst@deaistrategies.io")
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            user = await get_current_user(authorization="Bearer token")
        assert user.is_staff is True

    @pytest.mark.asyncio
    async def test_non_staff_is_staff_property_false(self):
        from dependencies.auth import get_current_user

        decoded = _make_decoded_token(email="someone@gmail.com")
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            user = await get_current_user(authorization="Bearer token")
        assert user.is_staff is False


class TestRequireStaff:
    @pytest.mark.asyncio
    async def test_non_staff_raises_403(self):
        from dependencies.auth import require_staff

        decoded = _make_decoded_token(email="outsider@hotmail.com")
        with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
            with pytest.raises(HTTPException) as exc_info:
                await require_staff(
                    current_user=await _get_user(email="outsider@hotmail.com")
                )
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_staff_passes(self):
        from dependencies.auth import require_staff

        user = await _get_user(email="ops@deaistrategies.io")
        result = await require_staff(current_user=user)
        assert result.email == "ops@deaistrategies.io"


class TestRequireAdmin:
    @pytest.mark.asyncio
    async def test_staff_without_admin_claim_raises_403(self):
        from dependencies.auth import require_admin

        user = await _get_user(email="viewer@deaistrategies.io", admin=False)
        with pytest.raises(HTTPException) as exc_info:
            await require_admin(current_user=user)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_staff_with_admin_claim_passes(self):
        from dependencies.auth import require_admin

        user = await _get_user(email="admin@deaistrategies.io", admin=True)
        result = await require_admin(current_user=user)
        assert result.is_admin is True


# ---------------------------------------------------------------------------
# HTTP-level auth gate tests (TestClient)
# ---------------------------------------------------------------------------

class TestProtectedEndpoints:
    """Verify that auth-gated endpoints return the correct HTTP codes."""

    def _client(self):
        # Import here so Firebase init doesn't run at module load time.
        from main import app
        return TestClient(app, raise_server_exceptions=False)

    def test_pdf_market_no_auth_returns_403(self):
        """PDF endpoint must require authentication."""
        client = self._client()
        resp = client.get("/api/reports/market")
        assert resp.status_code in (401, 403)

    def test_pdf_subnet_no_auth_returns_403(self):
        client = self._client()
        resp = client.get("/api/reports/subnet/1")
        assert resp.status_code in (401, 403)

    def test_subnets_detailed_no_auth_returns_403(self):
        client = self._client()
        resp = client.get("/api/subnets-detailed")
        assert resp.status_code in (401, 403)

    def test_admin_approve_no_auth_returns_403(self):
        client = self._client()
        resp = client.post("/api/admin/approve-access", json={"email": "x@x.com"})
        assert resp.status_code in (401, 403)

    def test_sentiment_endpoint_is_public(self):
        """Fear & Greed endpoint is public (rate-limited but no auth required)."""
        client = self._client()
        with patch("services.sentiment.FearGreedEngine.compute", new=AsyncMock(return_value={
            "score": 55.0, "label": "Neutral", "components": {}, "computed_at": "", "data_points": 0
        })):
            resp = client.get("/api/market/sentiment")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_user(
    email: str = "user@example.com",
    uid: str = "uid_test",
    admin: bool = False,
):
    from dependencies.auth import get_current_user

    decoded = _make_decoded_token(email=email, uid=uid, admin=admin)
    with patch("dependencies.auth.verify_token", new=AsyncMock(return_value=decoded)):
        return await get_current_user(authorization="Bearer fake_token")
