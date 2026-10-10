#!/usr/bin/env python3
"""Guard against stray non-Latin characters sneaking into Arabic/English copy.

The Arabic copy in this project is written by hand; this quick check catches
CJK characters or Unicode replacement characters that can otherwise ship inside
a string literal and render as tofu.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r"[　-鿿�가-힯]")

def main() -> int:
    offenders = []
    for path in ROOT.rglob("*"):
        if path.is_dir():
            continue
        if not path.suffix in {".ts", ".tsx", ".md", ".json", ".css"}:
            continue
        if any(part in {"node_modules", ".next", ".git"} for part in path.parts):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            if PATTERN.search(line):
                offenders.append(f"{path.relative_to(ROOT)}:{lineno}: {line.strip()[:120]}")

    for item in offenders:
        print(item)
    if offenders:
        print(f"\n{len(offenders)} suspicious line(s)")
        return 1
    print("copy check passed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
