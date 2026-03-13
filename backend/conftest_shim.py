"""
Pytest bootstrap shim.

The bt_venv contains web3 which registers a pytest11 entrypoint that imports
`eth_typing.ContractName`. That symbol was removed in eth_typing >=3.0.
This conftest is loaded before any entrypoint plugin executes, so we patch
it in sys.modules to prevent the ImportError crash.
"""
import sys
import types

# Patch eth_typing to include ContractName as a no-op string alias.
_eth = sys.modules.get("eth_typing")
if _eth is None:
    try:
        import eth_typing as _eth
    except ImportError:
        _eth = None

if _eth is not None and not hasattr(_eth, "ContractName"):
    _eth.ContractName = str  # stub: ContractName is just a NewType over str

# Also patch the parent package so re-imports pick it up.
import importlib
try:
    import eth_typing as _m
    if not hasattr(_m, "ContractName"):
        _m.ContractName = str
except Exception:
    pass
