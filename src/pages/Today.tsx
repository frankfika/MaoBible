import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ARTICLES } from '@/data/manifest';
import {
  getReadingProgress,
  type StoredProgress,
} from '@/lib/progress';

/**
 * Today: a "daily passage" + continue-reading card.
 * The daily article rotates by date so each day feels different.
 */
export function Today() {
  const { t } = useTranslation();
  const [progressMap, setProgressMap] = useState<Record<string, StoredProgress>>({});

  useEffect(() => {
    void Promise.all(
      ARTICLES.map((a) =>
        getReadingProgress(a.id).then((p) => [a.id, p] as const),
      ),
    ).then((entries) => {
      const map: Record<string, NonNullable<Awaited<ReturnType<typeof getReadingProgress>>>> = {};
      for (const [id, p] of entries) {
        if (p) map[id] = p;
      }
      setProgressMap(map);
    });
  }, []);

  // Daily article = index based on the day of year
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const daily = ARTICLES[dayOfYear % ARTICLES.length];
  const lastRead = ARTICLES.find((a) => progressMap[a.id]);

  return (
    <div className="prose-reader py-10">
      <h1 className="font-serif-cn text-2xl mb-6">{t('today.daily')}</h1>
      <Link
        to={`/read/${daily.id}`}
        className="card block p-6 hover:border-moss/40 transition-colors duration-220"
      >
        <h2 className="font-serif-cn text-2xl text-ink dark:text-dark-ink leading-snug">
          {daily.title}
        </h2>
        {daily.subtitle && (
          <p className="text-sm text-secondary dark:text-dark-secondary mt-1">
            {daily.subtitle}
          </p>
        )}
        {daily.summary && (
          <p className="mt-4 text-base text-ink/80 dark:text-dark-ink/80">
            {daily.summary}
          </p>
        )}
        <p className="mt-4 text-sm text-moss">
          {t('reader.estimatedTime', { minutes: daily.readingMinutes })}
        </p>
      </Link>

      {lastRead && (
        <section className="mt-12">
          <h2 className="font-serif-cn text-xl mb-3">{t('today.continue')}</h2>
          <Link
            to={`/read/${lastRead.id}`}
            className="card block p-5 hover:border-moss/40 transition-colors duration-220"
          >
            <h3 className="font-serif-cn text-lg">{lastRead.title}</h3>
            <p className="text-sm text-secondary dark:text-dark-secondary mt-1">
              {lastRead.subtitle}
            </p>
            <div className="mt-3 h-1 bg-ink/10 dark:bg-dark-ink/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-moss transition-all duration-260"
                style={{
                  width: `${Math.round((progressMap[lastRead.id]?.scrollFraction ?? 0) * 100)}%`,
                }}
              />
            </div>
          </Link>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif-cn text-xl mb-3">{t('today.thought')}</h2>
        <p className="text-base text-ink/80 dark:text-dark-ink/80 italic leading-relaxed">
          {daily.reflectionPrompt ??
            `读完《${daily.title}》,你印象最深的是哪一句话?为什么?`}
        </p>
      </section>
    </div>
  );
}
