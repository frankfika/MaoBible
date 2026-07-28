import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ARTICLES } from '@/data/manifest';
import { ArticleCard } from '@/components/ArticleCard';
import {
  searchArticles,
  type ArticleSearchResult,
  type ParagraphMatch,
} from '@/lib/contentIndex';

/**
 * Library page.
 *
 * Phase 2 addition: full-text paragraph search. The existing input now
 * also fetches article JSONs (cached in memory + by the service worker)
 * and matches the query against every paragraph. The top 3 matches per
 * article are rendered as compact cards with a highlighted snippet.
 *
 * Metadata filtering (title / theme / summary) still works as before; we
 * also keep the theme tag chips for quick filter toggles.
 */
export function Library() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<ArticleSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Debounce: 200ms after the user stops typing before we run the search.
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setDebounced(query);
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Run paragraph search whenever the debounced query changes.
  useEffect(() => {
    const q = debounced.trim();
    if (!q) {
      setResults(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    void searchArticles(q).then((r) => {
      if (cancelled) return;
      setResults(r);
      setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // Metadata filter (title / author / theme / summary)
  const filteredMeta = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.themes.some((th) => th.toLowerCase().includes(q)) ||
        (a.summary?.toLowerCase().includes(q) ?? false),
    );
  }, [debounced]);

  const themes = useMemo(
    () => Array.from(new Set(ARTICLES.flatMap((a) => a.themes))),
    [],
  );

  // Lookup helper for result cards
  const metaById = useMemo(() => {
    const m = new Map<string, (typeof ARTICLES)[number]>();
    for (const a of ARTICLES) m.set(a.id, a);
    return m;
  }, []);

  return (
    <div className="prose-reader py-10">
      <h1 className="font-serif-cn text-2xl mb-6">{t('library.title')}</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('library.search')}
        className="w-full px-4 py-2.5 rounded-card border border-ink/10 dark:border-dark-line
                   bg-white/40 dark:bg-dark-ink/5 focus:border-moss/50 outline-none
                   transition-colors duration-180"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {themes.map((th) => {
          const active = query === th;
          return (
            <button
              key={th}
              type="button"
              onClick={() => setQuery(active ? '' : th)}
              className={[
                'px-3 py-1 text-sm rounded-full transition-colors duration-180',
                active
                  ? 'bg-moss text-paper dark:bg-moss dark:text-dark-paper'
                  : 'bg-moss/10 text-moss hover:bg-moss/20',
              ].join(' ')}
            >
              #{th}
            </button>
          );
        })}
      </div>

      {/* ---- Phase 2: paragraph search results ---- */}
      {debounced.trim() && results && results.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif-cn text-lg mb-3 text-secondary dark:text-dark-secondary">
            {t('library.inArticleHeader')}
            <span className="ml-1 text-xs">
              {t('library.matchesIn', { count: results.length, defaultValue: `${results.length} matches` })}
              {searching ? ' …' : ''}
            </span>
          </h2>
          <div className="space-y-3">
            {results.map((r) => {
              const meta = metaById.get(r.articleId);
              if (!meta) return null;
              return (
                <a
                  key={r.articleId}
                  href={`/read/${r.articleId}`}
                  className="card block p-4 hover:border-moss/40 transition-colors duration-220"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif-cn text-base text-ink dark:text-dark-ink">
                      {meta.title}
                    </h3>
                    <span className="text-xs text-secondary dark:text-dark-secondary shrink-0">
                      {t('library.matchesIn', { count: r.totalMatches })}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {r.matches.map((m, i) => (
                      <li key={i} className="text-sm text-ink/80 dark:text-dark-ink/80 leading-relaxed">
                        <HighlightedSnippet match={m} />
                      </li>
                    ))}
                  </ul>
                </a>
              );
            })}
          </div>
        </section>
      )}
      {debounced.trim() && results && results.length === 0 && !searching && (
        <p className="mt-8 text-sm text-secondary dark:text-dark-secondary">
          {t('library.noParagraphMatch')}
        </p>
      )}

      {/* ---- Existing article list ---- */}
      <h2 className="font-serif-cn text-lg mt-10 mb-3 text-secondary dark:text-dark-secondary">
        {t('library.allArticles')}
      </h2>
      <div className="space-y-4">
        {filteredMeta.length === 0 ? (
          <p className="text-secondary dark:text-dark-secondary text-sm">
            {t('library.empty')}
          </p>
        ) : (
          filteredMeta.map((a) => <ArticleCard key={a.id} meta={a} />)
        )}
      </div>
    </div>
  );
}

/**
 * Renders a snippet with the matched substring wrapped in a <mark>.
 */
function HighlightedSnippet({ match }: { match: ParagraphMatch }) {
  const { snippet, matchStart, matchEnd } = match;
  return (
    <span>
      {snippet.slice(0, matchStart)}
      <mark className="bg-moss/30 dark:bg-moss/40 text-ink dark:text-dark-ink rounded px-0.5">
        {snippet.slice(matchStart, matchEnd)}
      </mark>
      {snippet.slice(matchEnd)}
    </span>
  );
}
