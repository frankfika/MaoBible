import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ARTICLES } from '@/data/manifest';
import { ArticleCard } from '@/components/ArticleCard';

export function Library() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.themes.some((th) => th.toLowerCase().includes(q)) ||
        (a.summary?.toLowerCase().includes(q) ?? false),
    );
  }, [query]);

  const themes = useMemo(
    () => Array.from(new Set(ARTICLES.flatMap((a) => a.themes))),
    [],
  );

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

      <div className="mt-6 flex flex-wrap gap-2">
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

      <h2 className="font-serif-cn text-lg mt-10 mb-3 text-secondary dark:text-dark-secondary">
        {t('library.allArticles')}
      </h2>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-secondary dark:text-dark-secondary text-sm">
            {t('library.empty')}
          </p>
        ) : (
          filtered.map((a) => <ArticleCard key={a.id} meta={a} />)
        )}
      </div>
    </div>
  );
}
