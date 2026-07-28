import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import type { ArticleMetadata } from '@/types';

/**
 * Ask page — situation-based search.
 * User types a situation ("我正在做..." or "我想..."). We match the text
 * against each article's `situations` and `interpretation` to find
 * the most relevant articles.
 */
export function Ask() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => matchArticles(query), [query]);

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
      <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink">
        问一件事，找一篇。
      </h1>
      <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
        输入你正在想的事 / 正在做的事，找到对应篇章。
      </p>

      <div className="mt-6 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="比如：我想放弃 / 我不知道该听谁的 / 我在管理一个团队…"
          className="w-full px-4 py-3 text-base rounded-card
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
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-secondary hover:text-ink dark:hover:text-dark-ink
                       text-sm px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {!query && <Suggestions onPick={setQuery} />}

      <div className="mt-6 space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((r, i) => (
            <motion.div
              key={r.article.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <ResultCard result={r} />
            </motion.div>
          ))}
        </AnimatePresence>
        {query && results.length === 0 && (
          <p className="text-sm text-secondary dark:text-dark-secondary py-8 text-center">
            没找到对应的。换句话试试？
          </p>
        )}
      </div>
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

    // 1. Match against situation keywords (highest weight)
    for (const s of article.situations ?? []) {
      const sLower = s.toLowerCase();
      if (qLower.includes(sLower) || sLower.includes(qLower)) {
        matched.push(s);
        score += 10;
        continue;
      }
      // Token overlap
      const qTokens = tokenize(qLower);
      const sTokens = tokenize(sLower);
      const overlap = qTokens.filter((t) => sTokens.includes(t)).length;
      if (overlap > 0) {
        matched.push(s);
        score += overlap * 4;
      }
    }

    // 2. Match against interpretation (medium weight)
    if (article.interpretation) {
      const iLower = article.interpretation.toLowerCase();
      const qTokens = tokenize(qLower);
      const iTokens = tokenize(iLower);
      const overlap = qTokens.filter((t) => iTokens.includes(t)).length;
      if (overlap > 0) {
        score += overlap * 2;
      }
    }

    // 3. Match against title (low weight)
    if (article.title.toLowerCase().includes(qLower)) {
      score += 1;
    }

    if (score > 0) {
      scored.push({ article, matchedSituations: matched.slice(0, 2), score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}

function tokenize(s: string): string[] {
  // Simple Chinese-friendly tokenizer: split on whitespace + each char as fallback
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
                 bg-white/40 dark:bg-dark-ink/5 p-4
                 hover:border-cinnabar/40 transition-colors duration-180"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif-cn text-base sm:text-lg font-medium text-ink dark:text-dark-ink">
          {article.title}
        </h3>
        <span className="text-[11px] text-secondary dark:text-dark-secondary whitespace-nowrap">
          {article.writtenAt}
        </span>
      </div>
      {article.interpretation && (
        <p className="mt-1.5 text-sm text-ink/80 dark:text-dark-ink/80 line-clamp-2">
          {article.interpretation}
        </p>
      )}
      {matchedSituations.length > 0 && (
        <div className="mt-2 text-[11px] text-moss">
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
    '我该不该为别人付出',
  ];
  return (
    <div className="mt-6">
      <p className="text-xs text-secondary dark:text-dark-secondary mb-2">
        或者试试：
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="px-3 py-1.5 text-sm rounded-full
                       border border-ink/10 dark:border-dark-line
                       bg-white/40 dark:bg-dark-ink/5
                       hover:border-cinnabar/40 hover:text-cinnabar
                       transition-colors duration-180"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
