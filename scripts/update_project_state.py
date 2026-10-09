#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "TECHNICAL_SNAPSHOT.md"

def run(command: list[str], timeout: int = 180) -> tuple[int, str]:
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        output = (result.stdout + ("\n" + result.stderr if result.stderr else "")).strip()
        return result.returncode, output or "(no output)"
    except Exception as exc:
        return 999, f"{type(exc).__name__}: {exc}"

def make_section(title: str, command: list[str], timeout: int = 180) -> str:
    code, output = run(command, timeout)
    cmd = " ".join(command)
    return (
        f"## {title}\n\n"
        f"Command:\n\n```bash\n{cmd}\n```\n\n"
        f"Exit code: `{code}`\n\n"
        f"```text\n{output}\n```\n\n"
    )

now = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")

parts = [
    "# TECHNICAL SNAPSHOT — PortaleCinofilo\n\n"
    f"> Auto-generated repository snapshot. Generated: `{now}`\n\n"
    "This file records command outputs, not a complete implementation or deployment assessment.\n"
    "Maintained project state: [CURRENT_STATE.md](CURRENT_STATE.md).\n"
    "Read every exit code; report generation alone does not mean all checks passed.\n"
    "This script does not apply migrations or deploy the website.\n\n",
    make_section("Current branch", ["git", "branch", "--show-current"]),
    make_section("Working tree", ["git", "status", "--short"]),
    make_section("Recent commits", ["git", "log", "--oneline", "--decorate", "-n", "30"]),
    make_section("Supabase migration history", ["npx", "supabase", "migration", "list"], 240),
    make_section("TypeScript verification", ["npm", "run", "typecheck"], 240),
    make_section("Production build", ["npm", "run", "build"], 300),
]

snapshot = "\n".join(line.rstrip() for line in "".join(parts).splitlines()).rstrip() + "\n"
OUT.write_text(snapshot, encoding="utf-8")
print(f"Updated {OUT.relative_to(ROOT)}")
