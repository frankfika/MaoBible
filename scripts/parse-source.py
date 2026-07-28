#!/usr/bin/env python3
"""Parse 毛泽东选集.txt into per-article JSON files."""
import json
import re
import sys
from pathlib import Path

SRC = Path("/tmp/maobible-source/mao-selected.utf8.txt")
OUT = Path("/tmp/maobible-source/parsed")
OUT.mkdir(parents=True, exist_ok=True)

# Read whole file, split lines (preserve content)
text = SRC.read_text(encoding="utf-8")
# Normalize line endings
text = text.replace("\r\n", "\n").replace("\r", "\n")
lines = text.split("\n")

# Find article boundaries: a line that is (after stripping) exactly 3 digits,
# possibly with leading whitespace.
NUM_RE = re.compile(r"^\s*(\d{3})\s*$")
DATE_RE = re.compile(r"^[（(]([^）)]+)[）)]\s*$")

# Map: 3-digit number -> (title, subtitle, date_raw, intro, body_lines, footnotes)
articles = {}
# 2-pass: collect positions
positions = []
for i, line in enumerate(lines):
    m = NUM_RE.match(line)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 200:
            positions.append((i, n))

print(f"Found {len(positions)} article boundaries", file=sys.stderr)

# Now parse each article
for idx, (start_line, num) in enumerate(positions):
    end_line = positions[idx + 1][0] if idx + 1 < len(positions) else len(lines)
    chunk = lines[start_line + 1 : end_line]

    # Remove watermark / blank leading lines
    while chunk and (not chunk[0].strip() or "4020.cn" in chunk[0] or "TXT" in chunk[0] or "───────" in chunk[0]):
        chunk.pop(0)
    while chunk and not chunk[0].strip():
        chunk.pop(0)
    if not chunk:
        continue

    # First non-empty line = title
    title = chunk.pop(0).strip()
    # Optional subtitle (next non-empty line if it doesn't look like a date)
    subtitle = None
    if chunk and chunk[0].strip() and not DATE_RE.match(chunk[0].strip()):
        # Look ahead: if the line after this is a date, this is the subtitle
        if len(chunk) > 1 and DATE_RE.match(chunk[1].strip()):
            subtitle = chunk.pop(0).strip()

    # Date
    date = None
    if chunk and DATE_RE.match(chunk[0].strip()):
        m = DATE_RE.match(chunk.pop(0).strip())
        date = m.group(1)

    # Body: strip leading blank lines, then collect until end
    while chunk and not chunk[0].strip():
        chunk.pop(0)

    # Split body from footnotes: footnotes begin at first "　　〔N〕" line
    body_lines = []
    footnote_lines = []
    in_footnotes = False
    for ln in chunk:
        if not in_footnotes and re.match(r"^\s*〔\d+〕", ln):
            in_footnotes = True
        if in_footnotes:
            footnote_lines.append(ln)
        else:
            body_lines.append(ln)

    # Strip trailing blank lines from body
    while body_lines and not body_lines[-1].strip():
        body_lines.pop()
    # Strip trailing blank lines from footnotes
    while footnote_lines and not footnote_lines[-1].strip():
        footnote_lines.pop()

    # Strip leading "　　" (full-width indent) from body lines for cleaner paragraphs
    # Actually, keep them — the reader code may use them to detect section breaks.
    # But normalize CRLF/CR artifacts.

    article = {
        "num": f"{num:03d}",
        "title": title,
        "subtitle": subtitle,
        "date": date,
        "body_raw": body_lines,
        "footnotes_raw": footnote_lines,
    }
    out_path = OUT / f"{num:03d}.json"
    out_path.write_text(json.dumps(article, ensure_ascii=False, indent=2), encoding="utf-8")

# Summary
print(f"Wrote {len(positions)} articles to {OUT}", file=sys.stderr)
