/**
 * 名句池 — "摇一摇" 用的今日毛选名句。
 *
 * 来源：从 22 篇文章的 zh-CN paragraphs 里按启发式筛 (短小精悍 + 含
 * "金句" 信号)。每篇最多 3 段入选。懒加载 — 第一次进 Shake 页面时
 * 加载并缓存。
 *
 * 选句：按 "年-月-日" hash 到池中，**同一天多次摇都是同一句** (Frank
 * 想要"今天" — 跟"今天读什么"一样按日期稳定)。
 *
 * 启发式打分：含引号 / 排比 / 经典词组 / 不是导语 → 高分。导语 / 长段
 * / 纯口语对话 → 排除。
 */
import { ARTICLES } from '@/data/manifest';
import type { Paragraph, ArticleMetadata } from '@/types';

export interface FamousQuote {
  paragraphId: string;
  articleId: string;
  articleTitle: string;
  writtenAt: string;
  /** 现代白话短句 — 用 article.interpretation 凑 (没配 AI 时也能给点上下文) */
  gloss: string;
  text: string;
}

const POOL_CACHE: { value: FamousQuote[] | null; promise: Promise<FamousQuote[]> | null } = {
  value: null,
  promise: null,
};

const LENGTH_MIN = 28;
const LENGTH_MAX = 200;
const MAX_PER_ARTICLE = 3;
const OPENING_SKIP = 2; // 跳过前 2 段 (通常是导语 / 标题 / 引言)

/** Common gold-quote signals — boost score when these appear. */
const SIGNALS = [
  '「', '』',  // quotes
  '，我们', '，就', '，要',  // 排比钩子
  '实事求是', '没有调查', '没有发言权', '一切从实际', '为人民服务',
  '从群众中来', '到群众中去', '一切反动派', '凡是', '只要',
  '我们的', '这个', '真理', '矛盾', '实践', '认识', '群众',
];

/**
 * Heuristic score — higher = more likely a "名句".
 * Returns 0 for anything that should be excluded.
 */
function score(text: string, kind: Paragraph['kind'] | undefined, index: number): number {
  // Exclude: headings, very short / very long, opening paragraphs (likely
  // scene-setting / speaker notes rather than a memorable line).
  if (kind === 'heading') return 0;
  if (kind === 'note') return 0;
  if (index < OPENING_SKIP) return 0;
  const n = text.length;
  if (n < LENGTH_MIN || n > LENGTH_MAX) return 0;
  if (/^[「『"]/.test(text)) return 0; // quote-opening — context-only line

  let s = 1;
  if (/[「」『』"]/.test(text)) s += 2; // contains a quote
  for (const sig of SIGNALS) {
    if (text.includes(sig)) s += 1;
  }
  // 排比: 多次出现 "，要" / "，就" / "，必须" — 经典风格
  const parallel = (text.match(/[，。][^，。]{1,8}(要|就|必须|才能)/g) ?? []).length;
  if (parallel >= 1) s += 1;
  // 短段 (< 80) 强加分 — 越短越像金句
  if (n < 80) s += 2;
  else if (n < 120) s += 1;
  return s;
}

async function buildPool(): Promise<FamousQuote[]> {
  const all: Array<{ q: FamousQuote; score: number }> = [];
  for (const article of ARTICLES) {
    const paras = await loadParagraphs(article.id);
    if (!paras) continue;
    const scored = paras
      .map((p, i) => {
        const s = score(p.text, p.kind, i);
        return s > 0 ? { p, i, s } : null;
      })
      .filter((x): x is { p: Paragraph; i: number; s: number } => x !== null)
      .sort((a, b) => b.s - a.s) // highest score first
      .slice(0, MAX_PER_ARTICLE);
    for (const { p } of scored) {
      all.push({
        q: {
          paragraphId: p.id,
          articleId: article.id,
          articleTitle: article.title,
          writtenAt: article.writtenAt,
          gloss: article.interpretation ?? article.summary ?? '',
          text: p.text,
        },
        score: 0,
      });
    }
  }
  // Stable ordering — sort by (articleId, paragraphId) so the pool index
  // is deterministic across reloads (otherwise parallel fetches would
  // shuffle it). This is critical: a "stable by date" pick only stays
  // stable if the pool is stable.
  all.sort((a, b) =>
    a.q.articleId === b.q.articleId
      ? a.q.paragraphId.localeCompare(b.q.paragraphId)
      : a.q.articleId.localeCompare(b.q.articleId),
  );
  return all.map((x) => x.q);
}

const paragraphCache = new Map<string, Paragraph[] | null>();

async function loadParagraphs(articleId: string): Promise<Paragraph[] | null> {
  if (paragraphCache.has(articleId)) return paragraphCache.get(articleId) ?? null;
  try {
    const r = await fetch(`/content/${articleId}.json`);
    if (!r.ok) {
      paragraphCache.set(articleId, null);
      return null;
    }
    const d = await r.json();
    const paras: Paragraph[] = d?.translations?.['zh-CN']?.paragraphs ?? [];
    paragraphCache.set(articleId, paras);
    return paras;
  } catch {
    paragraphCache.set(articleId, null);
    return null;
  }
}

/** Lazily build the pool. Returns the cached pool on subsequent calls. */
export async function getFamousPool(): Promise<FamousQuote[]> {
  if (POOL_CACHE.value) return POOL_CACHE.value;
  if (POOL_CACHE.promise) return POOL_CACHE.promise;
  POOL_CACHE.promise = buildPool().then((pool) => {
    POOL_CACHE.value = pool;
    POOL_CACHE.promise = null;
    return pool;
  });
  return POOL_CACHE.promise;
}

/**
 * Pick today's quote. **Same day = same quote.** Date key uses local
 * YYYY-MM-DD (so a user crossing midnight sees a new quote at the
 * boundary they care about).
 */
export async function pickTodayQuote(date = new Date()): Promise<FamousQuote | null> {
  const pool = await getFamousPool();
  if (pool.length === 0) return null;
  const ymd =
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Hash the date to an int — simple sum so it's stable + cheap.
  let h = 0;
  for (let i = 0; i < ymd.length; i++) h = (h * 31 + ymd.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

/** Drop the pool cache (used by tests). */
export function _resetFamousPool() {
  POOL_CACHE.value = null;
  POOL_CACHE.promise = null;
  paragraphCache.clear();
}

// Re-export for callers that want to peek at pool size.
export async function poolSize(): Promise<number> {
  const p = await getFamousPool();
  return p.length;
}

// Unused-but-imported helper to make TS keep the import for callers
// that want to inspect ArticleMetadata outside this file.
export type _ArticleRef = ArticleMetadata;
