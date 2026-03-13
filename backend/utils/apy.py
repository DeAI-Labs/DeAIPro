"""APY calculation utilities for Bittensor subnet yields.

Bittensor Emission Split (as of 2026):
    - 41% → Validators (stakers who secure the subnet)
    - 41% → Miners  (workers who produce the subnet's output)
    - 18% → Subnet Owner / Root-level dividends

References:
    https://docs.bittensor.com/learn/bittensor-building-blocks#emission
"""

from __future__ import annotations


# ──────────────────────────────────────────────────────────────
# Emission split constants (Bittensor protocol)
# ──────────────────────────────────────────────────────────────
VALIDATOR_SHARE = 0.41   # 41 % of subnet emissions go to validators
MINER_SHARE = 0.41       # 41 % of subnet emissions go to miners
OWNER_SHARE = 0.18       # 18 % goes to the subnet owner / root dividends


def calculate_validator_apy(
    daily_emission_tao: float,
    total_stake_tao: float,
    validator_share: float = VALIDATOR_SHARE,
) -> float:
    """Estimate the annualised yield for a validator staking into a subnet.

    Formula:
        APY = (daily_emission_tao × validator_share × 365) / total_stake_tao × 100

    Args:
        daily_emission_tao: Total TAO emitted to this subnet per day.
        total_stake_tao:    Aggregate TAO staked across all validators in
                            the subnet.  Must be > 0.
        validator_share:    Fraction of emission allocated to validators
                            (default 0.41 per protocol spec).

    Returns:
        Annualised percentage yield as a float (e.g. 12.4 for 12.4 %).
        Returns 0.0 if inputs are invalid / zero to avoid division errors.

    Example:
        >>> calculate_validator_apy(daily_emission_tao=277.6, total_stake_tao=5000)
        8.32  # roughly
    """
    if total_stake_tao <= 0 or daily_emission_tao <= 0:
        return 0.0
    apy = (daily_emission_tao * validator_share * 365) / total_stake_tao * 100
    return round(apy, 4)


def calculate_miner_apy(
    daily_emission_tao: float,
    total_stake_tao: float,
    miner_share: float = MINER_SHARE,
) -> float:
    """Estimate the annualised yield for miners in a subnet.

    Uses the same formula as validators but applies the miner emission share.

    Args:
        daily_emission_tao: Total TAO emitted to this subnet per day.
        total_stake_tao:    Aggregate TAO staked in the subnet (used as the
                            denominator proxy for economic scale).
        miner_share:        Fraction of emission allocated to miners
                            (default 0.41 per protocol spec).

    Returns:
        Annualised percentage yield as a float.
    """
    return calculate_validator_apy(daily_emission_tao, total_stake_tao, miner_share)


def calculate_subnet_apy(
    daily_emission_tao: float,
    total_stake_tao: float,
) -> float:
    """Combined subnet APY — validator share only (the investable yield).

    This is the figure displayed to institutional investors looking at
    staking returns.  It represents the validator leg of the 41/41/18 split.

    Args:
        daily_emission_tao: Total daily TAO emission for the subnet.
        total_stake_tao:    Total TAO staked in the subnet.

    Returns:
        Annualised validator yield percentage.
    """
    return calculate_validator_apy(daily_emission_tao, total_stake_tao)
