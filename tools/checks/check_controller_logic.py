#!/usr/bin/env python3
"""FM-01 — business logic in UI controllers / components / HTTP controllers.

Heuristics (deterministic, no AST): inside a `.controller(` or `.component(` block, or a Spring `@RestController`
class, count functions that compute domain results — numeric comparison with tolerance, range checks, classification
of settings, sorting by severity, CSV assembly, checksum/aggregate maths. Each hit is reported as file:line.
"""
import re, sys
from common import files, rel, ratchet, FRONTEND_GLOBS, BACKEND_GLOBS

FRONT_PATTERNS = [
    (r"Math\.abs\(", "numeric tolerance comparison"),
    (r"\b(n|value|val)\s*[<>]=?\s*Number\(", "range check against min/max"),
    (r"\.localeCompare\(.*\|\|", "multi-key domain sort"),
    (r"severity\s*\(|\.severity\s*=", "severity classification"),
    (r"['\"]text/csv['\"]", "CSV assembly in UI layer"),
    (r"\breduce\(function \(acc?, [a-z]\) \{ (acc?\.|return acc? \+)", "aggregate maths"),
    (r"/PDIF\|PTOC|/Pickup\|Setting", "protection-domain rules in UI"),
]
BACK_PATTERNS = [
    (r"\bif \(.*\.(compareTo|doubleValue)\(", "numeric rule in controller"),
    (r"new BigDecimal\(", "value maths in controller"),
    (r"\.stream\(\)\.(filter|sorted)\(", "domain filtering in controller"),
]

def scan_front(path):
    out = []
    text = path.read_text(encoding="utf-8")
    in_ui = bool(re.search(r"\.(controller|component)\(", text)) or path.suffix == ".ts" and "@Component" in text
    if not in_ui:
        return out
    for i, line in enumerate(text.splitlines(), 1):
        for pat, why in FRONT_PATTERNS:
            if re.search(pat, line):
                out.append(f"{rel(path)}:{i}: {why}")
                break
    return out

def scan_back(path):
    out = []
    text = path.read_text(encoding="utf-8")
    if "@RestController" not in text:
        return out
    for i, line in enumerate(text.splitlines(), 1):
        for pat, why in BACK_PATTERNS:
            if re.search(pat, line):
                out.append(f"{rel(path)}:{i}: {why}")
                break
    return out

def main(argv):
    findings = []
    for p in files(FRONTEND_GLOBS):
        findings += scan_front(p)
    for p in files(BACKEND_GLOBS):
        findings += scan_back(p)
    return ratchet("FM-01", findings, update="--update-baseline" in argv)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
