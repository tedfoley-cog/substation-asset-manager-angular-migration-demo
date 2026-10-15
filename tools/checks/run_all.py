#!/usr/bin/env python3
"""Run every failure-mode check. Exit non-zero if any fails. `--base` is passed to the diff check."""
import subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent
rc = 0
for script in ["check_controller_logic.py", "check_null_coercion.py"]:
    print(f"== {script}")
    rc |= subprocess.call([sys.executable, str(HERE / script)] + [a for a in sys.argv[1:] if a == "--update-baseline"])
base = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--base" and i + 1 < len(sys.argv)), None)
print("== check_error_handling.py")
rc |= subprocess.call([sys.executable, str(HERE / "check_error_handling.py")] + (["--base", base] if base else []))
sys.exit(1 if rc else 0)
