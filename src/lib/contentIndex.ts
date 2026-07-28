/**
 * Content index — small client-side cache for full-text search.
 *
 * Phase 2 approach:
 *   1. On first use, fetch /available-articles.json — a small registry of
 *      article IDs that actually have content in /public/content/. This
 *      keeps us from issuing fetch requests for IDs whose JSON file is
 *      not yet shipped, which would log 404s in the browser console.
 *   2. Pre-fetch /content/{id}.json for each registered ID and cache the
 *      results in memory. The service worker also caches these, so
 *      repeated searches stay fast.
 *   3. A negative cache catches the race condition where the registry
 *      includes an ID whose file briefly 404s (e.g. mid-deploy). Once we
 *      know an ID is missing we don't retry.
 */
import type { Article } from '@/types';
import { ARTICLES } from '@/data/manifest';

const cache = new Map<string, Article>();
const missing = new Set<string>();
let registryPromise: Promise<Set<string>> | null = null;

/** Fetch the static registry of article IDs that have content. Cached. */
async function loadRegistry(): Promise<Set<string>> {
  if (registryPromise) return registryPromise;
  registryPromise = (async () => {
    try {
      const res = await fetch('/available-articles.json', {
        headers: { Accept: 'application/json' },
        cache: 'force-cache',
      });
      if (!res.ok) return new Set(ARTICLES.map((a) => a.id));
      const ids = (await res.json()) as string[];
      return new Set(ids);
    } catch {
      return new Set(ARTICLES.map((a) => a.id));
    }
  })();
  return registryPromise;
}

/** Public version of the registry loader, used by the Explore page
 *  to decide which path-articles should show "Coming soon" placeholders. */
export async function loadAvailableArticles(): Promise<Set<string>> {
  return loadRegistry();
}

async function fetchArticle(id: string): Promise<Article | null> {
  if (cache.has(id)) return cache.get(id)!;
  if (missing.has(id)) return null;
  try {
    const res = await fetch(`/content/${id}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      // Mark as missing so we don't retry and re-log the 404.
      missing.add(id);
      return null;
    }
    const a = (await res.json()) as Article;
    cache.set(id, a);
    return a;
  } catch {
    missing.add(id);
    return null;
  }
}

export async function ensureAllArticlesLoaded(): Promise<Article[]> {
  const registry = await loadRegistry();
  const ids = ARTICLES.map((a) => a.id).filter((id) => registry.has(id));
  const results = await Promise.all(ids.map((id) => fetchArticle(id)));
  return results.filter((a): a is Article => Boolean(a));
}

export function getCachedArticle(id: string): Article | undefined {
  return cache.get(id);
}

export interface ParagraphMatch {
  paragraphId: string;
  /** Trimmed slice of the paragraph with the match context. */
  snippet: string;
  /** Character index (in the snippet) of the match start. */
  matchStart: number;
  matchEnd: number;
}

export interface ArticleSearchResult {
  articleId: string;
  matches: ParagraphMatch[];
  /** Best-effort count of paragraph matches (capped at e.g. 50 to stay snappy). */
  totalMatches: number;
}

/**
 * Run a case-insensitive substring search across every paragraph of every
 * article in the manifest (filtered to IDs that have shipped content).
 * Returns up to `maxPerArticle` paragraph snippets per article, plus the
 * total match count.
 */
export async function searchArticles(
  query: string,
  maxPerArticle = 3,
): Promise<ArticleSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const ql = q.toLowerCase();
  const articles = await ensureAllArticlesLoaded();
  const out: ArticleSearchResult[] = [];
  for (const article of articles) {
    const matches: ParagraphMatch[] = [];
    let total = 0;
    // Walk every translation's paragraphs; one snippet per paragraph is
    // enough — we collapse duplicate IDs across languages.
    const seen = new Set<string>();
    for (const t of Object.values(article.translations)) {
      if (!t) continue;
      for (const p of t.paragraphs) {
        if (p.kind === 'heading') continue;
        const idx = p.text.toLowerCase().indexOf(ql);
        if (idx < 0) continue;
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        total += 1;
        if (matches.length < maxPerArticle) {
          matches.push(buildSnippet(p.text, idx, q.length));
        }
      }
    }
    if (matches.length > 0) {
      out.push({ articleId: article.metadata.id, matches, totalMatches: total });
    }
  }
  // Sort: more matches first
  out.sort((a, b) => b.totalMatches - a.totalMatches);
  return out;
}

/**
 * Build a snippet around the match: ~24 chars of context on each side,
 * trimmed at paragraph boundary. The returned `matchStart` / `matchEnd`
 * are positions inside the snippet string so the UI can highlight them.
 */
function buildSnippet(text: string, idx: number, qLen: number): ParagraphMatch {
  const PAD = 24;
  const start = Math.max(0, idx - PAD);
  const end = Math.min(text.length, idx + qLen + PAD);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  const snippet = prefix + text.slice(start, end) + suffix;
  const matchStart = prefix.length + (idx - start);
  const matchEnd = matchStart + qLen;
  return { paragraphId: '', snippet, matchStart, matchEnd };
}
