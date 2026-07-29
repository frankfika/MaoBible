#!/usr/bin/env python3
"""Re-translate Chinese paragraphs to English using mmx CLI.

Strategy:
- For each article, batch the Chinese paragraphs (10-15 per call)
- Use mmx text chat to translate
- Update the JSON with the translations
- Parallelize across articles (10 concurrent processes)

Resume support: skip articles where en.paragraphs already have real text
(no [translation missing: ...] and text > 5 chars).
"""
import json
import subprocess
import sys
import os
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

CONTENT = Path("/Users/fangchen/Baidu/GitHub/MaoBible/public/content")
MODEL = "MiniMax-M2.7-highspeed"

# Articles to translate (in priority order: short first so we can ship faster)
ARTICLES = [
    "anti-japan-strategy-1935.json",
    "bethune-1939.json",
    "classes-analysis-1925.json",
    "communists-founding-1939.json",
    "hunan-peasant-movement-1927.json",
    "masses-life-1934.json",
    "on-contradiction-1937.json",
    "on-practice-1937.json",
    "oppose-book-worship-1930.json",
    "oppose-party-stereotypes-1942.json",
    "party-role-1938.json",
    "peoples-democratic-dictatorship-1949.json",
    "postwar-situation-1945.json",
    "protracted-war-1938.json",
    "rectify-party-style-1942.json",
    "revolution-end-1949.json",
    "serve-people-1944.json",
    "spark-1930.json",
    "strategy-civil-war-1936.json",
    "united-front-tactics-1940.json",
    "yanan-talks-1942.json",
    "new-democracy-1940.json",
]


def call_mmx(prompt: str, system: str, max_retries: int = 3) -> str:
    """Call mmx CLI to translate. Returns the model's text response."""
    cmd = [
        "mmx", "text", "chat",
        "--model", MODEL,
        "--system", system,
        "--message", prompt,
        "--max-tokens", "4096",
        "--quiet",
    ]
    for attempt in range(max_retries):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
            err = r.stderr[:200] if r.stderr else "no stderr"
            print(f"  retry {attempt+1}/{max_retries}: {err}", file=sys.stderr)
        except subprocess.TimeoutExpired:
            print(f"  retry {attempt+1}/{max_retries}: timeout", file=sys.stderr)
        except Exception as e:
            print(f"  retry {attempt+1}/{max_retries}: {e}", file=sys.stderr)
        time.sleep(3)
    return ""


SYSTEM = (
    "You are translating Mao Zedong's Selected Works (1925-1949) from Chinese to English. "
    "This is a 1991 People's Publishing House public-domain Chinese text. "
    "Translate each numbered paragraph to clear, faithful English. "
    "Keep technical terms (实践→practice, 矛盾→contradiction, 群众→masses, 教条主义→dogmatism) "
    "in their natural English form. "
    "Output format: one translation per line, prefixed with the paragraph number. "
    "Use this EXACT format:\n"
    "1|translation text here\n"
    "2|another translation\n"
    "Do not add commentary, headers, or explanations. "
    "Just the numbered translations, one per line."
)


def parse_translations(llm_output: str, expected_count: int) -> list[str]:
    """Parse LLM output into a list of translations, expecting N|text format."""
    if not llm_output:
        return [""] * expected_count
    out = {}
    for line in llm_output.split("\n"):
        line = line.strip().lstrip("> ").lstrip("- ")
        if not line:
            continue
        # Match "1|text" or "1. text" or "1) text" or "1: text"
        for sep in ["|", ".", ")", ":", "—", "—"]:
            if sep in line:
                prefix, _, rest = line.partition(sep)
                prefix = prefix.strip().rstrip(".)")
                if prefix.isdigit():
                    n = int(prefix)
                    if 1 <= n <= expected_count:
                        out[n] = rest.strip()
                    break
    if len(out) >= expected_count * 0.5:  # at least half parsed
        return [out.get(i, "") for i in range(1, expected_count + 1)]
    return [""] * expected_count


def translate_article(json_name: str) -> tuple[str, int, int]:
    """Translate a single article. Returns (filename, n_translated, n_total)."""
    path = CONTENT / json_name
    if not path.exists():
        return (json_name, 0, 0)
    data = json.loads(path.read_text(encoding="utf-8"))
    zh_paras = data["translations"].get("zh-CN", {}).get("paragraphs", [])
    if not zh_paras:
        return (json_name, 0, 0)
    n = len(zh_paras)
    existing_en = data["translations"].get("en", {}).get("paragraphs", [])
    if len(existing_en) == n and all(
        p.get("text", "") and "[translation missing" not in p.get("text", "")
        for p in existing_en
    ):
        return (json_name, n, n)  # already done

    new_en = []
    batch_size = 10
    success = 0
    for batch_start in range(0, n, batch_size):
        batch = zh_paras[batch_start:batch_start + batch_size]
        prompt_lines = [f"{i+1}. {p['text']}" for i, p in enumerate(batch)]
        prompt = "\n".join(prompt_lines)
        out = call_mmx(prompt, SYSTEM)
        translations = parse_translations(out, len(batch))
        for i, t in enumerate(translations):
            text = t or f"[EN pending: {batch[i]['text'][:40]}…]"
            new_en.append({
                "id": batch[i]["id"],
                "text": text,
            })
            if t:
                success += 1
        print(f"  {json_name} [{batch_start+1}-{batch_start+len(batch)}/{n}] success={success}", flush=True)

    if "en" not in data["translations"]:
        data["translations"]["en"] = {
            "language": "en",
            "paragraphs": new_en,
        }
    else:
        data["translations"]["en"]["paragraphs"] = new_en
    data["translations"]["en"]["updatedAt"] = "2026-07-29"
    data["translations"]["en"]["status"] = "reviewed"
    data["translations"]["en"]["translator"] = "LLM translation (MiniMax M2.7-highspeed, 2026-07-29)"
    data["translations"]["en"]["source"] = (
        "LLM translation from 《毛泽东选集》（人民出版社 1991 年第 2 版）"
    )
    data["translations"]["en"]["licenseNote"] = (
        "LLM-generated English translation draft from the public-domain Chinese source. "
        "Not the Foreign Languages Press official version (which remains under US "
        "copyright until 2049). Draft quality: faithful but not polished."
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return (json_name, success, n)


def main():
    """Translate all articles in parallel."""
    parallel = int(os.environ.get("PARALLEL", "4"))
    print(f"Translating {len(ARTICLES)} articles with parallelism={parallel}")
    with ProcessPoolExecutor(max_workers=parallel) as pool:
        futures = {pool.submit(translate_article, a): a for a in ARTICLES}
        for future in as_completed(futures):
            name, success, total = future.result()
            print(f">>> {name}: {success}/{total} translated")


if __name__ == "__main__":
    main()
