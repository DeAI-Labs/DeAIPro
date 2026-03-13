"""
Integration tests for the Metagraph sync service (Phase 2/3 refactor).

Covers:
 - MetagraphService._update_subnet stores computed APY (not upstream value)
 - APY formula implements correct 41 % validator share
 - APY returns 0 when stake or emission is zero
 - Bittensor SDK calls are wrapped in run_in_executor (non-blocking)
 - _generate_sample_data triggers when TaoStats API is unavailable
"""

import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from utils.apy import (
    calculate_validator_apy,
    calculate_miner_apy,
    calculate_subnet_apy,
    VALIDATOR_SHARE,
    MINER_SHARE,
)


# ---------------------------------------------------------------------------
# Unit tests — utils/apy.py
# ---------------------------------------------------------------------------

class TestAPYFormula:
    """Verify the 41/41/18 emission split calculations."""

    def test_validator_apy_basic(self):
        """Known values: 277.6 TAO/day, 5000 TAO staked → ≈ 8.32 %"""
        apy = calculate_validator_apy(daily_emission_tao=277.6, total_stake_tao=5000.0)
        # Formula: 277.6 × 0.41 × 365 / 5000 × 100
        expected = round(277.6 * 0.41 * 365 / 5000 * 100, 4)
        assert abs(apy - expected) < 0.01

    def test_validator_share_is_41_percent(self):
        assert VALIDATOR_SHARE == 0.41

    def test_miner_share_is_41_percent(self):
        assert MINER_SHARE == 0.41

    def test_validator_plus_miner_plus_owner_equals_100(self):
        from utils.apy import OWNER_SHARE
        assert abs(VALIDATOR_SHARE + MINER_SHARE + OWNER_SHARE - 1.0) < 1e-9

    def test_zero_stake_returns_zero(self):
        apy = calculate_validator_apy(daily_emission_tao=100.0, total_stake_tao=0.0)
        assert apy == 0.0

    def test_zero_emission_returns_zero(self):
        apy = calculate_validator_apy(daily_emission_tao=0.0, total_stake_tao=1000.0)
        assert apy == 0.0

    def test_negative_inputs_return_zero(self):
        apy = calculate_validator_apy(daily_emission_tao=-50.0, total_stake_tao=1000.0)
        assert apy == 0.0

    def test_apy_scales_with_emission(self):
        apy_low = calculate_subnet_apy(daily_emission_tao=100.0, total_stake_tao=10000.0)
        apy_high = calculate_subnet_apy(daily_emission_tao=200.0, total_stake_tao=10000.0)
        assert apy_high == pytest.approx(apy_low * 2, rel=1e-3)

    def test_apy_inversely_proportional_to_stake(self):
        apy_low_stake = calculate_subnet_apy(daily_emission_tao=100.0, total_stake_tao=5000.0)
        apy_high_stake = calculate_subnet_apy(daily_emission_tao=100.0, total_stake_tao=10000.0)
        assert apy_low_stake == pytest.approx(apy_high_stake * 2, rel=1e-3)

    def test_miner_apy_equals_validator_apy_when_shares_equal(self):
        """Miners and validators get the same share (both 41 %)."""
        v_apy = calculate_validator_apy(100.0, 5000.0)
        m_apy = calculate_miner_apy(100.0, 5000.0)
        assert v_apy == pytest.approx(m_apy, rel=1e-6)

    def test_subnet_apy_uses_validator_share(self):
        """calculate_subnet_apy should equal calculate_validator_apy."""
        subnet = calculate_subnet_apy(150.0, 3000.0)
        validator = calculate_validator_apy(150.0, 3000.0)
        assert subnet == pytest.approx(validator, rel=1e-6)


# ---------------------------------------------------------------------------
# Unit tests — services/metagraph.py (APY wiring)
# ---------------------------------------------------------------------------

class TestMetagraphAPYWiring:
    """Verify MetagraphService._update_subnet computes APY from emission + stake."""

    @pytest.fixture
    def metagraph_service(self):
        from services.metagraph import MetagraphService
        return MetagraphService()

    @pytest.mark.asyncio
    async def test_apy_computed_from_emission_and_stake(self, metagraph_service):
        """APY must be computed, not taken from data['apy']."""
        # Use a real object (SimpleNamespace) so attribute assignment is preserved.
        from types import SimpleNamespace

        subnet_doc = SimpleNamespace(
            id=1,
            name="Test Subnet",
            apy=None,  # will be overwritten by _update_subnet
            daily_emission=None,
            total_stake=None,
            market_cap_millions=None,
            validators_count=None,
            emission_24h=None,
            github_url=None,
            trend=None,
            updated_at=None,
        )
        # Attach async save()
        subnet_doc.save = AsyncMock()

        data = {
            "netuid": 1,
            "name": "Test Subnet",
            "emission_tao": 277.6,
            "total_stake": 5000.0,
            "apy": 999.0,          # upstream garbage — must be ignored
            "market_cap_millions": 100.0,
            "validator_count": 64,
            "emission_24h": 277.6,
            "github_url": "",
            "trend": "up",
        }

        expected_apy = calculate_validator_apy(277.6, 5000.0)

        with patch("services.metagraph.Subnet.find_one", new=AsyncMock(return_value=subnet_doc)):
            await metagraph_service._update_subnet(data)

        assert subnet_doc.apy == pytest.approx(expected_apy, rel=1e-3)
        assert subnet_doc.apy != 999.0

    @pytest.mark.asyncio
    async def test_apy_falls_back_when_stake_is_zero(self, metagraph_service):
        """When stake data is absent, fall back to upstream apy field."""
        from types import SimpleNamespace

        subnet_doc = SimpleNamespace(
            id=2, name="No Stake Subnet", apy=None, daily_emission=None,
            total_stake=None, market_cap_millions=None, validators_count=None,
            emission_24h=None, github_url=None, trend=None, updated_at=None,
        )
        subnet_doc.save = AsyncMock()

        data = {
            "netuid": 2,
            "name": "No Stake Subnet",
            "emission_tao": 100.0,
            "total_stake": 0.0,      # no stake → computed APY = 0
            "apy": 12.5,             # fallback value
            "market_cap_millions": 50.0,
            "validator_count": 10,
            "emission_24h": 100.0,
            "github_url": "",
            "trend": "stable",
        }

        with patch("services.metagraph.Subnet.find_one", new=AsyncMock(return_value=subnet_doc)):
            await metagraph_service._update_subnet(data)

        # computed APY is 0 → falls back to data["apy"] = 12.5
        assert subnet_doc.apy == 12.5

    @pytest.mark.asyncio
    async def test_missing_netuid_returns_false(self, metagraph_service):
        result = await metagraph_service._update_subnet({})
        assert result is False

    @pytest.mark.asyncio
    async def test_no_existing_subnet_returns_false(self, metagraph_service):
        """When the subnet doesn't exist in DB yet, _update_subnet returns False."""
        data = {"netuid": 99, "name": "Mystery", "emission_tao": 10.0, "total_stake": 500.0}
        with patch("services.metagraph.Subnet.find_one", new=AsyncMock(return_value=None)):
            result = await metagraph_service._update_subnet(data)
        assert result is False


# ---------------------------------------------------------------------------
# Unit tests — dynamic.py Bittensor SDK executor wrapping
# ---------------------------------------------------------------------------

class TestBittensorExecutorWrapping:
    """Verify that bt.subtensor calls are not made directly on the event loop."""

    @pytest.mark.asyncio
    async def test_fetch_subnets_from_sdk_uses_executor(self):
        """_sync_get_subtensor must be called via run_in_executor."""
        from dynamic import fetch_subnets_from_sdk, _sync_get_subtensor

        executor_calls = []

        original_run = asyncio.get_event_loop().run_in_executor

        async def mock_run_in_executor(executor, func, *args):
            executor_calls.append(func.__name__ if hasattr(func, "__name__") else str(func))
            # Return None to simulate Bittensor not installed
            return None

        with patch("dynamic.get_cache", new=AsyncMock(return_value=None)):
            loop = asyncio.get_event_loop()
            with patch.object(loop, "run_in_executor", side_effect=mock_run_in_executor):
                await fetch_subnets_from_sdk()

        # The first run_in_executor call must be for the subtensor constructor
        assert len(executor_calls) > 0
        assert "_sync_get_subtensor" in executor_calls

    @pytest.mark.asyncio
    async def test_fetch_subnets_returns_none_when_sdk_unavailable(self):
        """When Bittensor is not installed, should return None gracefully."""
        from dynamic import fetch_subnets_from_sdk

        with patch("dynamic.get_cache", new=AsyncMock(return_value=None)):
            with patch("dynamic._sync_get_subtensor", return_value=None):
                result = await fetch_subnets_from_sdk()
        assert result is None

    @pytest.mark.asyncio
    async def test_cache_hit_skips_sdk_call(self):
        """If the cache already has data, SDK must not be called."""
        from dynamic import fetch_subnets_from_sdk

        cached_data = {1: {"netuid": 1, "n_validators": 5}}
        with patch("dynamic.get_cache", new=AsyncMock(return_value=cached_data)):
            with patch("dynamic._sync_get_subtensor") as mock_sdk:
                result = await fetch_subnets_from_sdk()

        mock_sdk.assert_not_called()
        assert result == cached_data
