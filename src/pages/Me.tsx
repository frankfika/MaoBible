import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getBookmarks, getReadingProgress } from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import { useTheme } from '@/hooks/useTheme';
import { useContentLang } from '@/hooks/useContentLang';
import { useUiLang } from '@/hooks/useUiLang';
import type { LangCode } from '@/types';

const UI_LANGS: { code: LangCode; label: string }[] = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en', label: 'English' },
];

const CONTENT_LANGS: { code: LangCode; label: string }[] = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en', label: 'English' },
];

const THEME_MODES: { value: 'light' | 'dark' | 'system'; glyph: string }[] = [
  { value: 'light', glyph: '☀' },
  { value: 'dark', glyph: '☾' },
  { value: 'system', glyph: '◐' },
];

export function Me() {
  const { t } = useTranslation();
  const [themeMode, setThemeMode] = useTheme();
  const [contentLang, setContentLang] = useContentLang();
  const [uiLang, setUiLang] = useUiLang();
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
          {t('me.settings')}
        </h2>
        <div className="space-y-5">
          {/* Appearance: theme mode */}
          <div>
            <p className="text-sm text-ink dark:text-dark-ink mb-2">
              {t('me.appearance')}
            </p>
            <div
              role="group"
              aria-label={t('me.appearance')}
              className="inline-flex rounded-card border border-ink/10 dark:border-dark-line overflow-hidden"
            >
              {THEME_MODES.map((m) => {
                const active = themeMode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setThemeMode(m.value)}
                    className={[
                      'px-3 py-1.5 text-sm transition-colors duration-180',
                      active
                        ? 'bg-ink text-paper dark:bg-dark-ink dark:text-dark-paper'
                        : 'bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10',
                    ].join(' ')}
                  >
                    <span aria-hidden="true" className="mr-1">{m.glyph}</span>
                    {t(`theme.${m.value}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content language */}
          <div>
            <p className="text-sm text-ink dark:text-dark-ink mb-2">
              {t('me.contentLanguage')}
            </p>
            <div
              role="group"
              aria-label={t('me.contentLanguage')}
              className="inline-flex rounded-card border border-ink/10 dark:border-dark-line overflow-hidden"
            >
              {CONTENT_LANGS.map((l) => {
                const active = contentLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setContentLang(l.code)}
                    className={[
                      'px-3 py-1.5 text-sm transition-colors duration-180',
                      active
                        ? 'bg-ink text-paper dark:bg-dark-ink dark:text-dark-paper'
                        : 'bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10',
                    ].join(' ')}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* UI language */}
          <div>
            <p className="text-sm text-ink dark:text-dark-ink mb-2">
              {t('me.uiLanguage')}
            </p>
            <div
              role="group"
              aria-label={t('me.uiLanguage')}
              className="inline-flex rounded-card border border-ink/10 dark:border-dark-line overflow-hidden"
            >
              {UI_LANGS.map((l) => {
                const active = uiLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setUiLang(l.code)}
                    className={[
                      'px-3 py-1.5 text-sm transition-colors duration-180',
                      active
                        ? 'bg-ink text-paper dark:bg-dark-ink dark:text-dark-paper'
                        : 'bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10',
                    ].join(' ')}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
