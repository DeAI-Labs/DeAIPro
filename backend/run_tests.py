#!/usr/bin/env python3
"""
Runner: stub out the entire broken web3/ethpm plugin chain that is registered
as a pytest11 entrypoint in bt_venv. This must happen before pytest calls
load_setuptools_entrypoints, so we cannot use conftest.py for this.
"""
import sys
import types


def _make_package_stub(name):
    """Return a minimal stub that also looks like a package."""
    mod = types.ModuleType(name)
    mod.__spec__ = None
    mod.__path__ = []     # makes importlib treat it as a package
    mod.__package__ = name
    return mod


# Pre-stub every module in the broken import chain so entrypoint loading
# cannot trigger real imports from the incompatible packages.
_STUB_NAMES = [
    "eth_typing",
    "ethpm",
    "ethpm.package",
    "web3.tools",
    "web3.tools.pytest_ethereum",
    "web3.tools.pytest_ethereum.deployer",
    "web3.tools.pytest_ethereum.plugins",
    "web3.tools.pytest_ethereum.utils",
    # runtime-only dependencies not used in tests
    "apscheduler",
    "apscheduler.schedulers",
    "apscheduler.schedulers.asyncio",
    "apscheduler.triggers",
    "apscheduler.triggers.cron",
    "apscheduler.triggers.interval",
    "weasyprint",
]
for _name in _STUB_NAMES:
    if _name not in sys.modules:
        sys.modules[_name] = _make_package_stub(_name)

# Inject all symbols that the broken code tries to import from eth_typing.
_et = sys.modules["eth_typing"]
for _sym in ("ContractName", "Manifest", "PackageName", "URI",
             "ABI", "ChecksumAddress", "HexStr"):
    if not hasattr(_et, _sym):
        setattr(_et, _sym, str)

# Make web3.tools a real attribute on the web3 package if it's already loaded.
if "web3" in sys.modules:
    sys.modules["web3"].tools = sys.modules["web3.tools"]

# Inject required class attributes into the apscheduler stubs.
_sched_mod = sys.modules["apscheduler.schedulers.asyncio"]
if not hasattr(_sched_mod, "AsyncIOScheduler"):
    class AsyncIOScheduler:
        def __init__(self, *a, **kw): pass
        def add_job(self, *a, **kw): pass
        def start(self): pass
        def shutdown(self, *a, **kw): pass
    _sched_mod.AsyncIOScheduler = AsyncIOScheduler
    sys.modules["apscheduler.schedulers"].AsyncIOScheduler = AsyncIOScheduler

# Inject CronTrigger / IntervalTrigger stubs.
_cron_mod = sys.modules["apscheduler.triggers.cron"]
if not hasattr(_cron_mod, "CronTrigger"):
    class CronTrigger:
        def __init__(self, *a, **kw): pass
    _cron_mod.CronTrigger = CronTrigger

_interval_mod = sys.modules["apscheduler.triggers.interval"]
if not hasattr(_interval_mod, "IntervalTrigger"):
    class IntervalTrigger:
        def __init__(self, *a, **kw): pass
    _interval_mod.IntervalTrigger = IntervalTrigger

# Run pytest normally.
import pytest
sys.exit(pytest.main(sys.argv[1:]))



