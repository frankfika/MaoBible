#!/usr/bin/env python3
"""Hardcode section headings for 矛盾论 and 新民主主义论 (no inline markers in source)."""
import json
from pathlib import Path

CONTENT = Path("/Users/fangchen/Baidu/GitHub/MaoBible/public/content")

# (file, prefix, [(insert_after_para_idx, heading_text)])
# idx is 0-based after-insertion: insert heading BEFORE paragraph at idx.
# Heading ids: oc-h{NN}, nd-h{NN}
HARDCODED = [
    (
        "on-contradiction-1937.json",
        "oc",
        [
            (9, "一、矛盾的普遍性"),
            (27, "二、矛盾的特殊性"),
            (79, "三、主要矛盾和主要的矛盾方面"),
            (90, "四、矛盾诸方面的同一性和斗争性"),
        ],
    ),
    (
        "new-democracy-1940.json",
        "nd",
        [
            (12, "一、我们要建立一个新中国"),
            (20, "二、新民主主义的政治"),
            (53, "三、新民主主义的经济"),
            (90, "四、新民主主义的文化"),
        ],
    ),
]


def main():
    for fname, prefix, headings in HARDCODED:
        path = CONTENT / fname
        data = json.loads(path.read_text(encoding="utf-8"))
        for lang in ("zh-CN", "en"):
            t = data["translations"].get(lang)
            if not t:
                continue
            paras = t["paragraphs"]
            # Insert in reverse order so indices don't shift
            new_paras = list(paras)
            for idx, heading in reversed(headings):
                if idx >= len(new_paras):
                    continue
                heading_id = f"{prefix}-h{len(new_paras):02d}"
                new_paras.insert(
                    idx,
                    {"id": heading_id, "kind": "heading", "text": heading},
                )
            t["paragraphs"] = new_paras
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"  {fname}: +{len(headings)} headings")


if __name__ == "__main__":
    main()
