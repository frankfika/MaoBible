import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBookmarks, getReadingProgress } from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import { Link } from 'react-router-dom';

export function Me() {
  const { t } = useTranslation();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [recent, setRecent] = useState<
    { id: string; updatedAt: string; scrollFraction: number }[]
  >([]);

  useEffect(() => {
    void getBookmarks().then((bs) => setBookmarkedIds(bs.map((b) => b.articleId)));
    void Promise.all(
      ARTICLES.map((a) => getReadingProgress(a.id).then((p) => p && { id: a.id, ...p })),
    ).then((rows) => {
      const filtered = rows.filter(Boolean) as {
        id: string;
        updatedAt: string;
        scrollFraction: number;
      }[];
      filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setRecent(filtered.slice(0, 5));
    });
  }, []);

  return (
    <div className="prose-reader py-10 space-y-10">
      <h1 className="font-serif-cn text-2xl">{t('me.title')}</h1>

      <section>
        <h2 className="font-serif-cn text-lg mb-3 text-secondary dark:text-dark-secondary">
          {t('me.bookmarks')}
        </h2>
        {bookmarkedIds.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t('me.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarkedIds.map((bid) => {
              const a = ARTICLES.find((x) => x.id === bid);
              if (!a) return null;
              return (
                <li key={bid}>
                  <Link
                    to={`/read/${bid}`}
                    className="card block p-3 hover:border-moss/40 transition-colors duration-220"
                  >
                    {a.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif-cn text-lg mb-3 text-secondary dark:text-dark-secondary">
          {t('me.history')}
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t('me.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => {
              const a = ARTICLES.find((x) => x.id === r.id);
              if (!a) return null;
              return (
                <li key={r.id}>
                  <Link
                    to={`/read/${r.id}`}
                    className="card block p-3 hover:border-moss/40 transition-colors duration-220"
                  >
                    <div className="flex items-center justify-between">
                      <span>{a.title}</span>
                      <span className="text-xs text-secondary dark:text-dark-secondary">
                        {Math.round(r.scrollFraction * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 bg-ink/10 dark:bg-dark-ink/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-moss transition-all duration-260"
                        style={{ width: `${Math.round(r.scrollFraction * 100)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
