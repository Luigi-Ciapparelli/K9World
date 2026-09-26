#!/usr/bin/env python3
"""Proposal regression using the existing isolated full-history sport test runner.
No online credentials. --export-fixture supports the PostgreSQL WASM test runner.
"""
from pathlib import Path
import importlib.util
import sys

path = Path(__file__).with_name('test_sport_search.py')
spec = importlib.util.spec_from_file_location('sport_search_test_runner', path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
original_fixture = runner.fixture

def fixture(repo):
    data = original_fixture(repo)
    data['migration'] += '\n' + (repo / 'docs/proposals/invalidate_changed_sport_evidence.sql').read_text()
    data['assertions'] += '\n' + (repo / 'scripts/tests/sport_evidence_invalidation_assertions.sql').read_text()
    return data

runner.fixture = fixture
if __name__ == '__main__':
    runner.main()
    if '--export-fixture' not in sys.argv:
        print('OK: modifica evidenza, tentata auto-verifica, attestazione separata e visibilità.')
