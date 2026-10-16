#!/usr/bin/env python3
"""FM-03 — API fields silently coerced to 0 / '' / false.

Flags: `x || 0`, `x || ''`, `Number(x) || 0`, `parseFloat(x) || 0`, `?? 0`, `|| false` on values that come from API
objects (heuristic: identifier chains with a dot, e.g. `ied.firmware.version || ''`), plus Java
`Optional.ofNullable(...).orElse(0|"")` and `== null ? 0 :` in service/web code.
"""
import re, sys
from common import files, rel, ratchet, FRONTEND_GLOBS, BACKEND_GLOBS

FRONT = [
    (r"[A-Za-z_$][\w$]*\.[\w$.]+\s*\|\|\s*(0|''|\"\"|false)\b", "API field defaulted with ||"),
    (r"\b(Number|parseFloat|parseInt)\([^)]*\)\s*\|\|\s*0\b", "NaN/blank coerced to 0"),
    (r"\?\?\s*(0|''|\"\"|false)\b", "nullish coalesced to falsy literal"),
    (r"\|\s*number\s*:\s*\d\s*\}\}\s*\|\|", "template default after number filter"),
]
BACK = [
    (r"\.orElse\((0|0L|0\.0|\"\"|BigDecimal\.ZERO)\)", "Optional defaulted to zero/blank"),
    (r"==\s*null\s*\?\s*(0|0L|\"\"|BigDecimal\.ZERO)\s*:", "null ternary to zero/blank"),
]

def scan(path, patterns):
    out = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if "// fm-03-ok" in line or "fm-03-ok" in line:
            continue
        for pat, why in patterns:
            if re.search(pat, line):
                out.append(f"{rel(path)}:{i}: {why}")
                break
    return out

def main(argv):
    findings = []
    for p in files(FRONTEND_GLOBS + ["frontend/src/app/**/*.html", "frontend/src/app-ng/**/*.html"]):
        findings += scan(p, FRONT)
    for p in files(BACKEND_GLOBS):
        findings += scan(p, BACK)
    return ratchet("FM-03", findings, update="--update-baseline" in argv)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
