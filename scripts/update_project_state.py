#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "CURRENT_STATE.md"

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
    "# CURRENT STATE — PawConnect / Portalecinofilo\n\n"
    f"> Auto-generated repository snapshot. Generated: `{now}`\n\n"
    "This file records the **implemented state**, not future plans.\n"
    "If it conflicts with code, Git history or migrations, inspect the repository directly and regenerate it.\n\n",
    make_section("Current branch", ["git", "branch", "--show-current"]),
    make_section("Working tree", ["git", "status", "--short"]),
    make_section("Recent commits", ["git", "log", "--oneline", "--decorate", "-n", "30"]),
    make_section("Supabase migration history", ["npx", "supabase", "migration", "list"], 240),
    make_section("TypeScript verification", ["npm", "run", "typecheck"], 240),
    make_section("Production build", ["npm", "run", "build"], 300),
]

OUT.write_text("".join(parts), encoding="utf-8")
print(f"Updated {OUT.relative_to(ROOT)}")
