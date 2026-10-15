"""Shared helpers for the deterministic failure-mode checks (FM-01..FM-03)."""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASELINE = ROOT / "tools" / "checks" / "baseline.json"
FRONTEND_GLOBS = ["frontend/src/app/**/*.js", "frontend/src/app-ng/**/*.ts"]
BACKEND_GLOBS = ["backend/src/main/java/**/*.java"]

def files(globs):
    out = []
    for g in globs:
        out.extend(p for p in ROOT.glob(g) if p.is_file() and "node_modules" not in p.parts and not p.name.endswith(".spec.ts"))
    return sorted(out)

def rel(p):
    return str(p.relative_to(ROOT))

def load_baseline():
    return json.loads(BASELINE.read_text()) if BASELINE.exists() else {}

def ratchet(check_id, findings, update=False):
    """Fail if the number of findings grew vs baseline; report the delta. Returns exit code."""
    base = load_baseline()
    before = base.get(check_id, {}).get("count")
    now = len(findings)
    for f in findings:
        print(f"  {check_id} {f}")
    if update or before is None:
        base[check_id] = {"count": now}
        BASELINE.write_text(json.dumps(base, indent=2, sort_keys=True) + "\n")
        print(f"{check_id}: baseline {'updated' if update else 'created'} at {now}")
        return 0
    if now > before:
        print(f"{check_id}: FAIL — {now} findings, baseline {before} (ratchet only moves down)")
        return 1
    print(f"{check_id}: OK — {now} findings (baseline {before}{', improved' if now < before else ''})")
    return 0

def git_diff(base):
    try:
        return subprocess.run(["git", "diff", "--unified=0", f"{base}...HEAD", "--", "frontend/src", "backend/src/main"], cwd=ROOT, check=True, capture_output=True, text=True).stdout
    except subprocess.CalledProcessError as e:
        sys.exit(f"git diff failed: {e.stderr.strip()}")
