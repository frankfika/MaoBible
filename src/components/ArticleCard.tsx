import { Link } from 'react-router-dom';
import type { ArticleMetadata } from '@/types';
import { useTranslation } from 'react-i18next';

export function ArticleCard({ meta }: { meta: ArticleMetadata }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/read/${meta.id}`}
      className="card block p-5 hover:border-moss/40 transition-all duration-220"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif-cn text-xl text-ink dark:text-dark-ink leading-snug">
            {meta.title}
          </h3>
          {meta.subtitle && (
            <p className="text-sm text-secondary dark:text-dark-secondary mt-0.5">
              {meta.subtitle}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-secondary dark:text-dark-secondary whitespace-nowrap">
          {t('reader.estimatedTime', { minutes: meta.readingMinutes })}
        </span>
      </div>
      {meta.summary && (
        <p className="mt-3 text-sm text-ink/80 dark:text-dark-ink/80 leading-relaxed">
          {meta.summary}
        </p>
      )}
      {meta.themes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meta.themes.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-moss/10 text-moss dark:bg-moss/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
