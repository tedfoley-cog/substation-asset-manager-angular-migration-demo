#!/usr/bin/env python3
"""FM-02 — error handling removed in a diff.

Compares HEAD against --base (default origin/main). Counts removed vs added lines that contain `catch`, `.catch(`,
`finally`, `@ExceptionHandler`, `onError`, `responseError`, `.error(`. If more were removed than added and the PR
justification file / env var does not contain a line starting with `Error-handling-removed:`, fail.
"""
import argparse, os, re, sys
from common import git_diff

TOKENS = re.compile(r"(\bcatch\b|\.catch\(|\bfinally\b|@ExceptionHandler|responseError|onError|\.error\(|errors\.push)")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="origin/main")
    ap.add_argument("--pr-body", default=os.environ.get("PR_BODY_FILE"))
    a = ap.parse_args()
    diff = git_diff(a.base)
    removed = [l[1:].strip() for l in diff.splitlines() if l.startswith("-") and not l.startswith("---") and TOKENS.search(l)]
    added = [l[1:].strip() for l in diff.splitlines() if l.startswith("+") and not l.startswith("+++") and TOKENS.search(l)]
    net = len(removed) - len(added)
    for l in removed:
        print(f"  FM-02 removed: {l[:120]}")
    if net <= 0:
        print(f"FM-02: OK — error-handling lines removed {len(removed)}, added {len(added)}")
        return 0
    body = open(a.pr_body).read() if a.pr_body and os.path.exists(a.pr_body) else os.environ.get("PR_BODY", "")
    if re.search(r"^Error-handling-removed:\s*\S", body, re.M):
        print(f"FM-02: WARN — net {net} handler(s) removed, justified in PR body")
        return 0
    print(f"FM-02: FAIL — net {net} error handler(s) removed without an 'Error-handling-removed:' justification")
    return 1

if __name__ == "__main__":
    sys.exit(main())
