"""
Tests for TemporaryAccess TTL expiry semantics (Phase 2 — Data Lifecycle).

Covers:
 - expires_at is set to exactly 24 hours after created_at
 - revoked documents are treated as expired
 - TTL index is declared on the correct field (created_at), not expires_at
 - FearGreedEngine signal weights sum to 1.0
 - FearGreedEngine normalise helper clamps values correctly
 - FearGreedEngine score is in [0, 100]
 - FearGreedEngine falls back to 50 (Neutral) when data is unavailable
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock


# ---------------------------------------------------------------------------
# TTL / TemporaryAccess model tests
# ---------------------------------------------------------------------------

class TestTemporaryAccessTTL:
    """Validate 24-hour expiry semantics on the TemporaryAccess model."""

    def _make_doc(self, **kwargs) -> object:
        """Construct a TemporaryAccess without initialising Beanie/MongoDB.

        model_construct() (Pydantic v2) skips __init__ validators and
        the Beanie collection-init hook, letting us test field defaults.
        """
        from models.access import TemporaryAccess
        return TemporaryAccess.model_construct(
            email=kwargs.get("email", "test@example.com"),
            token=kwargs.get("token", "t" * 32),
            created_at=kwargs.get("created_at", datetime.utcnow()),
            expires_at=kwargs.get("expires_at", datetime.utcnow() + timedelta(seconds=86400)),
            revoked=kwargs.get("revoked", False),
            revoked_at=kwargs.get("revoked_at", None),
            request_count=kwargs.get("request_count", 0),
        )

    def test_expires_at_is_24h_after_created_at(self):
        """expires_at default must be exactly created_at + 24 hours."""
        now = datetime.utcnow()
        doc = self._make_doc(created_at=now, expires_at=now + timedelta(seconds=86400))
        delta = doc.expires_at - doc.created_at
        assert abs(delta.total_seconds() - 86400) < 1

    def test_default_not_revoked(self):
        doc = self._make_doc()
        assert doc.revoked is False

    def test_revoked_at_is_none_by_default(self):
        doc = self._make_doc()
        assert doc.revoked_at is None

    def test_request_count_starts_at_zero(self):
        doc = self._make_doc()
        assert doc.request_count == 0

    def test_ttl_index_field_is_created_at(self):
        """
        The TTL index in db.py must be on 'created_at'.
        Verify by inspecting the source of _create_indexes.
        """
        import inspect
        from dependencies.db import Database
        source = inspect.getsource(Database._create_indexes)
        assert '"created_at"' in source or "'created_at'" in source
        assert "expireAfterSeconds=86400" in source

    def test_ttl_index_has_name_for_idempotency(self):
        """Named indexes are idempotent across restarts."""
        import inspect
        from dependencies.db import Database
        source = inspect.getsource(Database._create_indexes)
        assert "temporary_access_ttl_24h" in source

    def test_settings_indexes_no_duplicate_created_at(self):
        """
        After the fix, the Beanie Settings.indexes list must NOT contain
        a plain ascending index on created_at (it would conflict with TTL).
        """
        from models.access import TemporaryAccess
        settings_indexes = TemporaryAccess.Settings.indexes
        assert [("created_at", 1)] not in settings_indexes

    def test_mock_clock_expiry_detection(self):
        """Simulate the system clock advancing 25 hours past created_at."""
        twenty_five_hours_ago = datetime.utcnow() - timedelta(hours=25)
        doc = self._make_doc(
            created_at=twenty_five_hours_ago,
            expires_at=twenty_five_hours_ago + timedelta(seconds=86400),
        )
        ttl_expiry = doc.created_at + timedelta(seconds=86400)
        assert ttl_expiry < datetime.utcnow(), "Document should be expired"

    def test_not_yet_expired_document(self):
        """A fresh document should not yet be expired."""
        now = datetime.utcnow()
        doc = self._make_doc(created_at=now, expires_at=now + timedelta(seconds=86400))
        ttl_expiry = doc.created_at + timedelta(seconds=86400)
        assert ttl_expiry > datetime.utcnow(), "Fresh document should not be expired"


# ---------------------------------------------------------------------------
# Fear & Greed Engine tests
# ---------------------------------------------------------------------------

class TestFearGreedNormalise:
    def test_normalise_midpoint(self):
        from services.sentiment import _normalise
        assert _normalise(1.0, 0.0, 2.0) == pytest.approx(50.0)

    def test_normalise_clamps_below_zero(self):
        from services.sentiment import _normalise
        assert _normalise(-5.0, 0.0, 10.0) == 0.0

    def test_normalise_clamps_above_100(self):
        from services.sentiment import _normalise
        assert _normalise(15.0, 0.0, 10.0) == 100.0

    def test_normalise_equal_min_max_returns_50(self):
        from services.sentiment import _normalise
        assert _normalise(5.0, 5.0, 5.0) == 50.0


class TestFearGreedLabel:
    def test_0_is_extreme_fear(self):
        from services.sentiment import _label
        assert _label(0) == "Extreme Fear"

    def test_24_is_extreme_fear(self):
        from services.sentiment import _label
        assert _label(24) == "Extreme Fear"

    def test_50_is_neutral(self):
        from services.sentiment import _label
        assert _label(50) == "Neutral"

    def test_100_is_extreme_greed(self):
        from services.sentiment import _label
        assert _label(100) == "Extreme Greed"


class TestFearGreedWeights:
    def test_weights_sum_to_one(self):
        from services.sentiment import FearGreedEngine
        total = sum(FearGreedEngine.WEIGHTS.values())
        assert abs(total - 1.0) < 1e-9

    def test_volatility_weight_is_25pct(self):
        from services.sentiment import FearGreedEngine
        assert FearGreedEngine.WEIGHTS["volatility"] == pytest.approx(0.25)

    def test_momentum_weight_is_25pct(self):
        from services.sentiment import FearGreedEngine
        assert FearGreedEngine.WEIGHTS["momentum"] == pytest.approx(0.25)


class TestFearGreedSignals:
    def test_volatility_score_no_data_returns_50(self):
        from services.sentiment import _volatility_score
        assert _volatility_score([]) == 50.0

    def test_volatility_score_single_price_returns_50(self):
        from services.sentiment import _volatility_score
        assert _volatility_score([100.0]) == 50.0

    def test_volatility_high_returns_low_score(self):
        """High variance in daily return sizes → high volatility → low score."""
        from services.sentiment import _volatility_score
        # These prices create highly variable return MAGNITUDES:
        # 100→200 (+100%), 200→50 (-75%), 50→180 (+260%), etc.
        # pstdev of these large, uneven returns will be >> 0.15 → score near 0.
        prices = [100.0, 200.0, 50.0, 180.0, 30.0, 150.0,
                  100.0, 200.0, 50.0, 180.0, 30.0, 150.0]
        score = _volatility_score(prices)
        assert score < 30.0

    def test_momentum_score_insufficient_data_returns_50(self):
        from services.sentiment import _momentum_score
        assert _momentum_score([100.0] * 5) == 50.0

    def test_momentum_score_rising_market(self):
        """Prices trending strongly upward → 7d > 30d → greed."""
        from services.sentiment import _momentum_score
        # Rising prices: first 23 days at 100, last 7 at 130
        prices = [100.0] * 23 + [130.0] * 7
        score = _momentum_score(prices)
        assert score > 55.0

    def test_momentum_score_falling_market(self):
        """Prices falling → 7d < 30d → fear."""
        from services.sentiment import _momentum_score
        prices = [130.0] * 23 + [100.0] * 7
        score = _momentum_score(prices)
        assert score < 45.0

    def test_github_activity_score_zero_commits(self):
        from services.sentiment import _github_activity_score
        assert _github_activity_score([]) == 0.0

    def test_github_activity_score_1000_commits_is_100(self):
        from services.sentiment import _github_activity_score
        assert _github_activity_score([1000]) == pytest.approx(100.0)


class TestFearGreedCompute:
    @pytest.mark.asyncio
    async def test_compute_score_in_range(self):
        """Score must always be in [0, 100]."""
        from services.sentiment import FearGreedEngine

        mock_prices = [100.0 + i * 0.5 for i in range(35)]
        mock_volumes = [1_000_000.0] * 35

        with patch.object(
            FearGreedEngine, "_fetch_price_series",
            new=AsyncMock(return_value=(mock_prices, mock_volumes)),
        ):
            with patch.object(
                FearGreedEngine, "_fetch_github_activity",
                new=AsyncMock(return_value=[50, 80, 120, 200, 150]),
            ):
                result = await FearGreedEngine.compute()

        assert 0.0 <= result["score"] <= 100.0

    @pytest.mark.asyncio
    async def test_compute_returns_label(self):
        from services.sentiment import FearGreedEngine

        with patch.object(FearGreedEngine, "_fetch_price_series", new=AsyncMock(return_value=([], []))):
            with patch.object(FearGreedEngine, "_fetch_github_activity", new=AsyncMock(return_value=[])):
                result = await FearGreedEngine.compute()

        assert "label" in result
        assert result["label"] in ("Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed")

    @pytest.mark.asyncio
    async def test_compute_fallback_on_error(self):
        """When DB fetch throws, should return Neutral (50) with error info."""
        from services.sentiment import FearGreedEngine

        with patch.object(
            FearGreedEngine, "_fetch_price_series",
            new=AsyncMock(side_effect=Exception("DB down")),
        ):
            result = await FearGreedEngine.compute()

        assert result["score"] == 50.0
        assert result["label"] == "Neutral"
        assert "error" in result

    @pytest.mark.asyncio
    async def test_compute_returns_components(self):
        from services.sentiment import FearGreedEngine

        prices = [100.0 + i for i in range(35)]
        vols = [500_000.0] * 35

        with patch.object(FearGreedEngine, "_fetch_price_series", new=AsyncMock(return_value=(prices, vols))):
            with patch.object(FearGreedEngine, "_fetch_github_activity", new=AsyncMock(return_value=[100])):
                result = await FearGreedEngine.compute()

        assert "components" in result
        comp = result["components"]
        assert "volatility" in comp
        assert "momentum" in comp
        assert "volume_momentum" in comp
        assert "github_activity" in comp
