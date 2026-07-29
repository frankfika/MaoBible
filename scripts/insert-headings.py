#!/usr/bin/env python3
"""Insert section heading rows into long articles based on the source.

For 矛盾论 / 论持久战 / 新民主主义论 / 战略问题, detect lines like
"（一）" "（二）" or "一、" "二、" or "第一章" in the parsed source, and
insert {"kind": "heading", "id": "<prefix>-hNN", "text": "<line>"} rows
at the right position in the article's paragraphs.

This assumes the article paragraphs are already aligned to source paragraphs
(via resegment.py) — i.e. each zh paragraph corresponds to a source line.

Strategy:
- Read parsed source from /tmp/maobible-source/parsed/{num}.json
- Read each line of body_raw
- For lines that match a section pattern AND are not the first line (the first
  line is usually the article header note), AND are not pure numerals/footnotes,
  treat them as a heading.
- Walk through article paragraphs; for each heading position, insert a heading row
  before the next paragraph in the article that covers that source line.
"""
import json
import re
import sys
from pathlib import Path

PARSED = Path("/tmp/maobible-source/parsed")
CONTENT = Path("/Users/fangchen/Baidu/GitHub/MaoBible/public/content")

# Long articles only — these have explicit section markers in the source
LONG_ARTICLES = [
    # (json_name, source_num, id_prefix)
    ("on-contradiction-1937.json", "018", "oc"),
    ("protracted-war-1938.json", "027", "pw"),
    ("new-democracy-1940.json", "044", "nd"),
    ("strategy-civil-war-1936.json", "013", "scw"),
]

# Patterns to detect section markers in source body lines
HEADING_PATTERNS = [
    re.compile(r"^（[一二三四五六七八九十]+）"),     # （一）（二）
    re.compile(r"^[一二三四五六七八九十]+、"),        # 一、二、
    re.compile(r"^第[一二三四五六七八九十百]+章"),    # 第一章
    re.compile(r"^第[一二三四五六七八九十百]+节"),    # 第一节
]

# Lines that should NOT be treated as headings even if they match
EXCLUDE_PATTERNS = [
    re.compile(r"^注释?$"),
    re.compile(r"^\s*$"),
]


def is_heading_line(line: str) -> bool:
    text = line.strip()
    if not text:
        return False
    for ex in EXCLUDE_PATTERNS:
        if ex.match(text):
            return False
    for pat in HEADING_PATTERNS:
        if pat.match(text):
            return True
    return False


def get_source_heading_lines(num: str) -> list[tuple[int, str]]:
    """Return list of (index_in_body, heading_text) for a source article.

    Only includes body paragraphs (lines starting with 　　) — not the article header.
    Returns index into the paragraph list (not raw line list).
    """
    src_path = PARSED / f"{num}.json"
    if not src_path.exists():
        print(f"  WARN: source {num} not found", file=sys.stderr)
        return []
    src = json.loads(src_path.read_text(encoding="utf-8"))
    body = src["body_raw"]

    # Filter to indented body paragraphs only (start with 　　)
    body_paras = []
    for raw in body:
        if raw.startswith("　　"):
            text = raw.strip()
            if text in ("注　　释", "注释", "注 释"):
                continue
            body_paras.append(text)

    headings: list[tuple[int, str]] = []
    for i, line in enumerate(body_paras):
        if is_heading_line(line):
            headings.append((i, line))
    return headings


def insert_headings_for_article(json_name: str, src_num: str, prefix: str) -> tuple[int, int]:
    """Insert heading rows into the article's zh-CN paragraphs. Returns (n_existing, n_inserted)."""
    path = CONTENT / json_name
    if not path.exists():
        print(f"  SKIP: {json_name} not found", file=sys.stderr)
        return (0, 0)
    data = json.loads(path.read_text(encoding="utf-8"))
    zh_paras = data["translations"].get("zh-CN", {}).get("paragraphs", [])
    if not zh_paras:
        return (0, 0)

    # Get heading line indices in the source's body_para list
    headings = get_source_heading_lines(src_num)
    if not headings:
        return (len(zh_paras), 0)

    # Walk through article paragraphs in order. For each heading (src_idx, text),
    # insert before the article paragraph whose text starts with that line.
    new_zh: list[dict] = []
    heading_inserted = 0
    heading_iter = iter(headings)
    next_heading = next(heading_iter, None)
    h_counter = 0

    for para in zh_paras:
        para_text = para.get("text", "").strip()
        # If this paragraph text starts with the heading line, insert heading before
        while next_heading and para_text.startswith(next_heading[1]):
            h_counter += 1
            new_zh.append({
                "id": f"{prefix}-h{h_counter:02d}",
                "kind": "heading",
                "text": next_heading[1],
            })
            heading_inserted += 1
            next_heading = next(heading_iter, None)
        new_zh.append(para)

    # Apply the same insertion to en (kind: heading, but English text will be the
    # same heading line — readers on en will see the Chinese heading; for
    # simplicity, we duplicate the heading line, since the source itself is Chinese)
    # — but use a marker that ParagraphView can render differently if needed.
    en_paras = data["translations"].get("en", {}).get("paragraphs", [])
    # Re-align by id match
    if en_paras and len(en_paras) == len(zh_paras):
        en_by_id = {p["id"]: p for p in en_paras}
        new_en = []
        for item in new_zh:
            if item.get("kind") == "heading":
                # Heading in en: translate mechanically
                heading_id = item["id"]
                # Use a small translation table for common markers
                translated = translate_heading(item["text"])
                new_en.append({
                    "id": heading_id,
                    "kind": "heading",
                    "text": translated,
                })
            else:
                p = en_by_id.get(item["id"])
                if p:
                    new_en.append(p)
        data["translations"]["en"]["paragraphs"] = new_en

    data["translations"]["zh-CN"]["paragraphs"] = new_zh
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return (len(zh_paras), heading_inserted)


# Simple Chinese-section-marker → English translation table
HEADING_TRANSLATIONS = {
    "（一）": "(1)",
    "（二）": "(2)",
    "（三）": "(3)",
    "（四）": "(4)",
    "（五）": "(5)",
    "（六）": "(6)",
    "（七）": "(7)",
    "（八）": "(8)",
    "（九）": "(9)",
    "（十）": "(10)",
}


def translate_heading(text: str) -> str:
    """Translate a heading line to English (best-effort, mechanical)."""
    text = text.strip()
    for cn, en in HEADING_TRANSLATIONS.items():
        if text.startswith(cn):
            rest = text[len(cn):].strip()
            if rest:
                return f"{en} {rest}"
            return en
    # Generic Chinese → keep as-is with marker (mobile user can read both)
    return text


def main():
    total_inserted = 0
    for json_name, src_num, prefix in LONG_ARTICLES:
        n_existing, n_inserted = insert_headings_for_article(json_name, src_num, prefix)
        print(f"  {json_name}: {n_existing} → {n_existing + n_inserted} paragraphs (+{n_inserted} headings)")
        total_inserted += n_inserted
    print(f"\nTotal headings inserted: {total_inserted}")


if __name__ == "__main__":
    main()
