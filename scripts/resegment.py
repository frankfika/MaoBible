#!/usr/bin/env python3
"""Re-segment Chinese text to use the source's natural paragraph boundaries.

For each article:
  - zh-CN paragraphs become 1 row per source paragraph (granular)
  - The existing English paragraphs (N entries) become the "covering" English
    for groups of source paragraphs. Each source paragraph row gets the
    English of the slot it falls into (repeated across multiple rows).

Result: mobile readers see one short Chinese paragraph per row instead of
a 3000-char mega-paragraph. English stays at the same "explanation density"
as before (1 English paragraph covers ~N source paragraphs).
"""
import json
import re
import sys
from pathlib import Path

PARSED = Path("/tmp/maobible-source/parsed")
CONTENT = Path("/Users/fangchen/Baidu/GitHub/MaoBible/public/content")

# (json_file, source_num, id_prefix)
MAPPING = [
    ("hunan-peasant-movement-1927.json", "002", "hunan"),
    ("classes-analysis-1925.json", "001", "classes"),
    ("on-practice-1937.json", "017", "op"),
    ("on-contradiction-1937.json", "018", "oc"),
    ("spark-1930.json", "006", "spark"),
    ("oppose-book-worship-1930.json", "007", "obw"),
    ("masses-life-1934.json", "011", "ml"),
    ("anti-japan-strategy-1935.json", "012", "ajs"),
    ("strategy-civil-war-1936.json", "013", "scw"),
    ("protracted-war-1938.json", "027", "pw"),
    ("party-role-1938.json", "028", "pr"),
    ("communists-founding-1939.json", "038", "cf"),
    ("bethune-1939.json", "043", "bth"),
    ("new-democracy-1940.json", "044", "nd"),
    ("united-front-tactics-1940.json", "052", "uft"),
    ("yanan-talks-1942.json", "066", "yt"),
    ("rectify-party-style-1942.json", "064", "rps"),
    ("oppose-party-stereotypes-1942.json", "065", "ops"),
    ("serve-people-1944.json", "077", "sp"),
    ("postwar-situation-1945.json", "090", "pws"),
    ("peoples-democratic-dictatorship-1949.json", "154", "pdd"),
    ("revolution-end-1949.json", "137", "re"),
]


def get_source_paragraphs(num: str):
    src = json.loads((PARSED / f"{num}.json").read_text(encoding="utf-8"))
    paras = []
    for line in src["body_raw"]:
        if line.startswith("　　"):
            text = line.strip()
            if text in ("注　　释", "注释", "注 释"):
                continue
            paras.append(text)
    return paras


def re_segment(json_name: str, src_num: str, prefix: str):
    path = CONTENT / json_name
    if not path.exists():
        print(f"  SKIP: {json_name} not found", file=sys.stderr)
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    en_paras = data["translations"].get("en", {}).get("paragraphs", [])
    if not en_paras:
        print(f"  SKIP: {json_name} no en paragraphs", file=sys.stderr)
        return None

    src_paras = get_source_paragraphs(src_num)
    if not src_paras:
        print(f"  SKIP: {json_name} source {src_num} empty", file=sys.stderr)
        return None

    # For each source paragraph, determine which English slot covers it.
    # Proportional distribution: source[i] is covered by English slot j
    # where j = floor(i * len(en_paras) / len(src_paras))
    n_en = len(en_paras)
    n_src = len(src_paras)

    new_zh = []
    new_en = []
    for i, src_text in enumerate(src_paras):
        # English slot for this source paragraph
        en_idx = min(int(i * n_en / n_src), n_en - 1)
        en_p = en_paras[en_idx]
        pid = f"{prefix}-{i+1:03d}"
        new_zh.append({"id": pid, "text": src_text})
        new_en.append({"id": pid, "text": en_p["text"]})

    if "zh-CN" in data["translations"]:
        data["translations"]["zh-CN"]["paragraphs"] = new_zh
        data["translations"]["zh-CN"]["source"] = "《毛泽东选集》（人民出版社 1991 年第 2 版）"
        data["translations"]["zh-CN"]["licenseNote"] = "原文来自公开的人民出版社 1991 年版《毛泽东选集》，属于官方公开内容"
        data["translations"]["zh-CN"]["status"] = "published"
        data["translations"]["zh-CN"]["updatedAt"] = "2026-07-28"

    if "en" in data["translations"]:
        data["translations"]["en"]["paragraphs"] = new_en

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return n_src, n_en


def main():
    for json_name, src_num, prefix in MAPPING:
        result = re_segment(json_name, src_num, prefix)
        if result:
            n_src, n_en = result
            print(f"  {json_name}: src={n_src} → {n_src} rows (en slots: {n_en})")


if __name__ == "__main__":
    main()
