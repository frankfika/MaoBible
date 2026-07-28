import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLang } from '@/hooks/useContentLang';
import {
  READING_PATHS,
  getPath,
  pathDescription,
  pathTitle,
  type PathArticle,
  type ReadingPath,
} from '@/data/paths';
import { ARTICLES } from '@/data/manifest';
import { loadAvailableArticles } from '@/lib/contentIndex';

/**
 * Explore page — curated reading paths.
 *
 * Each path is rendered as a card. Clicking a card reveals the ordered
 * list of articles in that path; clicking an article opens the Reader.
 *
 * Article IDs not yet in the manifest render as a "Coming soon" placeholder.
 * Article IDs that are in the manifest but whose /public/content/{id}.json
 * is not yet shipped also render as "Coming soon" — driven by
 * /public/available-articles.json. This keeps the page tolerant of the
 * parallel content pipeline.
 */
export function Explore() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [contentLang] = useContentLang();
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);

  // Fetch the available-articles registry once on mount.
  useEffect(() => {
    void loadAvailableArticles().then(setAvailableIds);
  }, []);

  const articleMetaById = useMemo(() => {
    const m = new Map(ARTICLES.map((a) => [a.id, a]));
    return m;
  }, []);

  if (openId) {
    const path = getPath(openId);
    if (!path) {
      // Fall through to the list
      setOpenId(null);
    } else {
      return (
        <PathDetail
          path={path}
          contentLang={contentLang}
          articleMetaById={articleMetaById}
          availableIds={availableIds}
          onBack={() => setOpenId(null)}
        />
      );
    }
  }

  return (
    <div className="prose-reader py-10">
      <h1 className="font-serif-cn text-2xl mb-3">{t('explore.title')}</h1>
      <p className="text-secondary dark:text-dark-secondary mb-8">
        {t('explore.intro')}
      </p>

      <div className="space-y-4">
        {READING_PATHS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenId(p.id)}
            className="card block w-full text-left p-6 hover:border-moss/40
                       transition-colors duration-220"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="shrink-0 w-12 h-12 rounded-card
                           bg-moss/10 dark:bg-moss/20
                           flex items-center justify-center
                           text-2xl text-moss"
              >
                {p.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif-cn text-xl text-ink dark:text-dark-ink">
                  {pathTitle(p, contentLang)}
                </h2>
                <p className="mt-1.5 text-sm text-ink/80 dark:text-dark-ink/80 leading-relaxed">
                  {pathDescription(p, contentLang)}
                </p>
                <p className="mt-3 text-xs text-secondary dark:text-dark-secondary">
                  {p.articles.length} {t('explore.articles')}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="shrink-0 text-secondary dark:text-dark-secondary self-center"
              >
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PathDetail({
  path,
  contentLang,
  articleMetaById,
  availableIds,
  onBack,
}: {
  path: ReadingPath;
  contentLang: 'zh-CN' | 'en';
  articleMetaById: Map<string, (typeof ARTICLES)[number]>;
  availableIds: Set<string> | null;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="prose-reader py-10">
      <button
        type="button"
        onClick={onBack}
        className="link-quiet text-sm"
      >
        ← {t('explore.backToPaths')}
      </button>
      <h1 className="font-serif-cn text-2xl mt-4 mb-2">
        {pathTitle(path, contentLang)}
      </h1>
      <p className="text-secondary dark:text-dark-secondary mb-8 leading-relaxed">
        {pathDescription(path, contentLang)}
      </p>

      <ol className="space-y-3">
        {path.articles.map((a, i) => {
          const meta = articleMetaById.get(a.id);
          // "Coming soon" if no manifest entry, or if the registry says
          // the content file is not yet shipped.
          const isAvailable =
            availableIds == null || availableIds.has(a.id);
          const isComingSoon = !meta || !isAvailable;
          return (
            <li key={a.id}>
              <PathArticleRow
                index={i + 1}
                article={a}
                meta={meta}
                comingSoon={isComingSoon}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PathArticleRow({
  index,
  article,
  meta,
  comingSoon,
}: {
  index: number;
  article: PathArticle;
  meta?: (typeof ARTICLES)[number];
  comingSoon: boolean;
}) {
  const { t } = useTranslation();

  if (comingSoon || !meta) {
    return (
      <div className="card p-4 flex items-start gap-3 opacity-70">
        <span
          aria-hidden="true"
          className="shrink-0 w-7 h-7 rounded-full bg-ink/5
                     dark:bg-dark-ink/10 text-secondary dark:text-dark-secondary
                     text-sm flex items-center justify-center"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif-cn text-base text-ink dark:text-dark-ink">
            {meta?.title ?? article.id}
          </p>
          <p className="text-xs text-secondary dark:text-dark-secondary mt-0.5">
            {meta?.subtitle ?? ''}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 text-xs px-2 py-0.5 rounded-full
                     bg-ink/5 dark:bg-dark-ink/10 text-secondary
                     dark:text-dark-secondary"
        >
          {t('explore.comingSoon')}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={`/read/${meta.id}`}
      className="card block p-4 hover:border-moss/40 transition-colors duration-220"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="shrink-0 w-7 h-7 rounded-full bg-moss/10
                     text-moss text-sm flex items-center justify-center font-medium"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif-cn text-base text-ink dark:text-dark-ink">
            {meta.title}
          </h3>
          {meta.subtitle && (
            <p className="text-xs text-secondary dark:text-dark-secondary mt-0.5">
              {meta.subtitle}
            </p>
          )}
          {meta.summary && (
            <p className="text-sm text-ink/80 dark:text-dark-ink/80 mt-1 leading-relaxed line-clamp-2">
              {meta.summary}
            </p>
          )}
        </div>
        <span className="shrink-0 text-sm text-moss self-center">
          {t('explore.openReader')} →
        </span>
      </div>
    </Link>
  );
}
