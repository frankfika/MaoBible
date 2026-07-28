#!/usr/bin/env python3
"""Merge 人民出版社 official Chinese text into existing article JSONs.

Length-balanced distribution: each English slot gets approximately
(total_source_chars / slot_count) characters from the source, split at
source-paragraph boundaries.
"""
import json
import re
import sys
from pathlib import Path

PARSED = Path("/tmp/maobible-source/parsed")
CONTENT = Path("/Users/fangchen/Baidu/GitHub/MaoBible/public/content")

MAPPING = {
    "classes-analysis-1925.json": ("001",),
    "hunan-peasant-movement-1927.json": ("002",),
    "on-practice-1937.json": ("017",),
    "on-contradiction-1937.json": ("018",),
    "spark-1930.json": ("006",),
    "oppose-book-worship-1930.json": ("007",),
    "masses-life-1934.json": ("011",),
    "anti-japan-strategy-1935.json": ("012",),
    "strategy-civil-war-1936.json": ("013",),
    "protracted-war-1938.json": ("027",),
    "party-role-1938.json": ("028",),
    "communists-founding-1939.json": ("038",),
    "bethune-1939.json": ("043",),
    "new-democracy-1940.json": ("044",),
    "yanan-talks-1942.json": ("066",),
    "serve-people-1944.json": ("077",),
    "postwar-situation-1945.json": ("090",),
    "peoples-democratic-dictatorship-1949.json": ("154",),
    "rectify-party-style-1942.json": ("064",),
    "oppose-party-stereotypes-1942.json": ("065",),
    "revolution-end-1949.json": ("137",),
    "united-front-tactics-1940.json": ("052",),
}


def get_body_paragraphs(num: str):
    src = json.loads((PARSED / f"{num}.json").read_text(encoding="utf-8"))
    paras = []
    for line in src["body_raw"]:
        if line.startswith("　　"):
            text = line.strip()
            if text in ("注　　释", "注释", "注 释"):
                continue
            paras.append(text)
    return paras


def distribute_by_length(src_paras, slot_count):
    """Distribute source paragraphs into N slots, balanced by char count.
    Last slot gets any leftover paragraphs.
    """
    n = len(src_paras)
    if n == 0:
        return [""] * slot_count
    if slot_count == 0:
        return []
    total = sum(len(p) for p in src_paras)
    if total == 0:
        return [""] * slot_count
    target = total / slot_count

    result = []
    cur_paras = []
    cur_len = 0
    slot_idx = 0
    for p in src_paras:
        cur_paras.append(p)
        cur_len += len(p)
        # Last slot: just accumulate everything
        if slot_idx >= slot_count - 1:
            continue
        # Hit threshold for current slot? Finalize.
        if cur_len >= target:
            result.append("\n\n".join(cur_paras))
            cur_paras = []
            cur_len = 0
            slot_idx += 1
    # Whatever's left goes into the next slot (or last slot)
    if cur_paras:
        if slot_idx < slot_count:
            result.append("\n\n".join(cur_paras))
            slot_idx += 1
        else:
            # No more slots, append to last
            result[-1] = result[-1] + "\n\n" + "\n\n".join(cur_paras)
    while len(result) < slot_count:
        result.append("")
    return result[:slot_count]


def merge_one(json_name: str, src_num: str):
    content_path = CONTENT / json_name
    if not content_path.exists():
        print(f"  SKIP: {json_name} not found", file=sys.stderr)
        return None
    data = json.loads(content_path.read_text(encoding="utf-8"))
    en_paras = data["translations"].get("en", {}).get("paragraphs", [])
    slot_count = len(en_paras)
    if slot_count == 0:
        print(f"  SKIP: {json_name} no en paragraphs", file=sys.stderr)
        return None
    src_paras = get_body_paragraphs(src_num)
    if not src_paras:
        print(f"  SKIP: {json_name} source {src_num} empty", file=sys.stderr)
        return None
    distributed = distribute_by_length(src_paras, slot_count)

    new_zh_paras = []
    for i, en_p in enumerate(en_paras):
        new_zh_paras.append({
            "id": en_p["id"],
            "text": distributed[i],
        })

    if "zh-CN" in data["translations"]:
        data["translations"]["zh-CN"]["paragraphs"] = new_zh_paras
        data["translations"]["zh-CN"]["source"] = "《毛泽东选集》（人民出版社 1991 年第 2 版）"
        data["translations"]["zh-CN"]["licenseNote"] = "原文来自公开的人民出版社 1991 年版《毛泽东选集》，属于官方公开内容"
        data["translations"]["zh-CN"]["status"] = "published"
        data["translations"]["zh-CN"]["updatedAt"] = "2026-07-28"

    content_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(src_paras), slot_count


def main():
    for json_name, (src_num,) in MAPPING.items():
        result = merge_one(json_name, src_num)
        if result:
            src_n, slot_n = result
            print(f"  {json_name}: source={src_n} slots={slot_n}")


if __name__ == "__main__":
    main()
