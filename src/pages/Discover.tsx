import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import type { ArticleMetadata } from '@/types';

/**
 * Discover — 发现. Situation-based search + theme grid.
 * Replaces old Ask. The "问一件事，找一篇" experience.
 */
export function Discover() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => matchArticles(query), [query]);

  const themes = useMemo(() => {
    const map = new Map<string, ArticleMetadata[]>();
    for (const a of ARTICLES) {
      for (const t of a.themes) {
        if (!map.has(t)) map.set(t, []);
        map.get(t)!.push(a);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 12);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink">
          问一件事，找一篇。
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          输入你正在想的事 / 正在做的事。匹配最贴近的篇章。
        </p>
      </header>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="比如：我想放弃 / 我管理一个团队…"
          className="w-full min-h-[48px] px-4 py-3 text-base rounded-card
                     border border-ink/15 dark:border-dark-line
                     bg-white/60 dark:bg-dark-ink/10
                     focus:outline-none focus:border-cinnabar/60
                     transition-colors duration-180
                     placeholder:text-secondary/70"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       text-secondary hover:text-ink dark:hover:text-dark-ink
                       min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="清除"
          >
            ✕
          </button>
        )}
      </div>

      {!query && <Suggestions onPick={setQuery} />}

      <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((r, i) => (
            <motion.div
              key={r.article.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <ResultCard result={r} />
            </motion.div>
          ))}
        </AnimatePresence>
        {query && results.length === 0 && (
          <p className="text-sm text-secondary dark:text-dark-secondary py-12 text-center">
            没找到对应的。换句话试试。
          </p>
        )}
      </div>

      {!query && (
        <section className="mt-8">
          <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-3 tracking-wider">
            按主题浏览
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {themes.map(([theme, articles]) => (
              <li key={theme}>
                <Link
                  to={`/ai?theme=${encodeURIComponent(theme)}`}
                  className="block rounded-card border border-ink/8 dark:border-dark-line
                             bg-white/50 dark:bg-dark-ink/5 p-3
                             hover:border-cinnabar/40 active:scale-[0.99] transition-all"
                >
                  <p className="font-serif-cn text-sm text-ink dark:text-dark-ink">{theme}</p>
                  <p className="mt-1 text-[10px] text-secondary dark:text-dark-secondary">
                    {articles.length} 篇
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface ScoredArticle {
  article: ArticleMetadata;
  matchedSituations: string[];
  score: number;
}

function matchArticles(query: string): ScoredArticle[] {
  const q = query.trim();
  if (!q) return [];
  const qLower = q.toLowerCase();
  const scored: ScoredArticle[] = [];
  for (const article of ARTICLES) {
    const matched: string[] = [];
    let score = 0;
    for (const s of article.situations ?? []) {
      const sLower = s.toLowerCase();
      if (qLower === sLower) {
        matched.push(s);
        score += 20;
      } else if (qLower.includes(sLower) || sLower.includes(qLower)) {
        matched.push(s);
        score += 10;
      } else {
        const qTokens = tokenize(qLower);
        const sTokens = tokenize(sLower);
        const overlap = qTokens.filter((t) => sTokens.includes(t)).length;
        if (overlap > 0) {
          matched.push(s);
          score += overlap * 4;
        }
      }
    }
    if (article.interpretation) {
      const iLower = article.interpretation.toLowerCase();
      const qTokens = tokenize(qLower);
      const iTokens = tokenize(iLower);
      const overlap = qTokens.filter((t) => iTokens.includes(t)).length;
      score += overlap * 2;
    }
    if (article.title.toLowerCase().includes(qLower)) score += 1;
    if (score > 0) scored.push({ article, matchedSituations: matched.slice(0, 2), score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}

function tokenize(s: string): string[] {
  return s
    .replace(/[，。！？、；：""''（）《》【】\.,!?;:"'()\[\]<>]/g, ' ')
    .split(/\s+/)
    .flatMap((w) => (w.length > 1 ? [w] : w.split('')))
    .filter((t) => t.length > 0);
}

function ResultCard({ result }: { result: ScoredArticle }) {
  const { article, matchedSituations } = result;
  return (
    <Link
      to={`/read/${article.id}`}
      className="block rounded-card border border-ink/8 dark:border-dark-line
                 bg-white/50 dark:bg-dark-ink/5 p-4
                 hover:border-cinnabar/40 active:scale-[0.99]
                 transition-all duration-180 min-h-[60px]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif-cn text-base font-medium text-ink dark:text-dark-ink">
          {article.title}
        </h3>
        <span className="text-[11px] text-secondary dark:text-dark-secondary whitespace-nowrap tabular-nums shrink-0">
          {article.writtenAt}
        </span>
      </div>
      {article.interpretation && (
        <p className="mt-1.5 text-sm text-ink/75 dark:text-dark-ink/75 leading-relaxed line-clamp-2">
          {article.interpretation}
        </p>
      )}
      {matchedSituations.length > 0 && (
        <div className="mt-1.5 text-[11px] text-cinnabar/85">
          匹配：{matchedSituations.join(' / ')}
        </div>
      )}
    </Link>
  );
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  const examples = [
    '我想放弃',
    '我面前有冲突',
    '我管理一个团队',
    '我学的用不上',
    '我做的事没人看好',
    '我刚赢了',
    '我快撑不下去了',
    '我做事没意义',
    '我看不清全局',
  ];
  return (
    <div className="mt-5 sm:mt-6">
      <p className="text-[11px] sm:text-xs text-secondary dark:text-dark-secondary mb-2.5">
        或者试试：
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="min-h-[36px] px-3 py-1.5 text-sm rounded-full
                       border border-ink/10 dark:border-dark-line
                       bg-white/50 dark:bg-dark-ink/5
                       hover:border-cinnabar/40 hover:text-cinnabar
                       active:scale-95 transition-all duration-180"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
