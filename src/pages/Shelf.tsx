import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import { getAllReadingProgress, getAllBookmarks } from '@/lib/storage';
import type { ArticleMetadata, ReadingProgress, Bookmark } from '@/types';

/**
 * Shelf — 书架 (default tab).
 *
 * Single screen that pulls together everything the reader needs:
 *   1. 继续阅读 — last article + progress bar (or "开始第一篇" if no history)
 *   2. 今天读什么 — daily pick (date-stable, with interpretation)
 *   3. 主题浏览 — 5 chips (认识论 / 调查 / 革命 / 党建 / 形势)
 *   4. 全部文章 — 22 cards in 2-col grid (mobile)
 *   5. 我的收藏 — only if any bookmarks
 */
const THEME_STORAGE_KEY = 'maobible.shelf-theme';

export function Shelf() {
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  // Persist the theme filter across remounts (was: reset to 'all' every
  // time the user switched tabs and came back, because Shelf unmounted).
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'all';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    void getAllReadingProgress().then(setProgress);
    void getAllBookmarks().then(setBookmarks);
  }, []);

  // Last article with progress (continue reading)
  const lastProgress = [...progress]
    .filter((p) => p.scrollFraction > 0.01 && p.scrollFraction < 0.99)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
  const lastArticle = lastProgress
    ? ARTICLES.find((a) => a.id === lastProgress.articleId)
    : null;

  // Daily pick — stable by date so user sees same pick all day
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const dailyPick = ARTICLES[dayOfYear % ARTICLES.length];

  // Theme filter
  const themeFilters: { name: string; match: string[] }[] = [
    { name: 'all', match: [] },
    { name: '认识论 / 方法论', match: ['实践', '认识论', '辩证法', '矛盾', '实事求是', '分析'] },
    { name: '调查 / 群众', match: ['调查', '群众', '组织', '工作方法', '领导力', '社会', '阶级'] },
    { name: '革命战略 / 军事', match: ['战略', '战术', '持久战', '抗日', '战争', '游击'] },
    { name: '党建 / 文风', match: ['党建', '文风', '学习', '教条', '经验', '党八股'] },
    { name: '形势 / 民主', match: ['民主', '形势', '统一战线', '革命', '人民', '建国'] },
  ];
  const currentFilter = themeFilters.find((t) => t.name === theme) ?? themeFilters[0];
  const filteredArticles =
    currentFilter.name === 'all'
      ? ARTICLES
      : ARTICLES.filter((a) => a.themes.some((t) => currentFilter.match.includes(t)));

  const bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6 pb-2">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          毛选
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          {ARTICLES.length} 篇 · 据人民出版社 1991 年版整理 · 中英双语
        </p>
      </header>

      {/* 继续阅读 */}
      <section className="mb-5 sm:mb-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2 tracking-wider">
          继续阅读
        </h2>
        {lastArticle && lastProgress ? (
          <Link
            to={`/read/${lastArticle.id}`}
            className="block rounded-card-lg border border-cinnabar/30 bg-cinnabar/5
                       dark:bg-cinnabar/10 p-4 sm:p-5
                       hover:border-cinnabar/60 active:scale-[0.99] transition-all"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-serif-cn text-base sm:text-lg font-medium text-ink dark:text-dark-ink">
                {lastArticle.title}
              </h3>
              <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary shrink-0 tabular-nums">
                {Math.round(lastProgress.scrollFraction * 100)}%
              </span>
            </div>
            <div className="mt-2 h-1 bg-cinnabar/15 dark:bg-cinnabar/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-cinnabar transition-all"
                style={{ width: `${Math.round(lastProgress.scrollFraction * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
              {lastProgress.lastParagraphId
                ? `上次读到这里 · ${timeAgo(lastProgress.updatedAt)}`
                : `${timeAgo(lastProgress.updatedAt)}`}
            </p>
          </Link>
        ) : (
          <Link
            to={`/read/${ARTICLES[0].id}`}
            className="block rounded-card-lg border border-ink/8 dark:border-dark-line
                       bg-white/60 dark:bg-dark-ink/5 p-4 sm:p-5
                       hover:border-cinnabar/40 active:scale-[0.99] transition-all"
          >
            <p className="text-sm text-ink dark:text-dark-ink">开始你的第一篇 →</p>
            <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
              推荐从「{ARTICLES[0].title}」读起
            </p>
          </Link>
        )}
      </section>

      {/* 今天读什么 */}
      <section className="mb-5 sm:mb-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2 tracking-wider">
          今天读什么
        </h2>
        <Link
          to={`/read/${dailyPick.id}`}
          className="block rounded-card-lg border border-ink/8 dark:border-dark-line
                     bg-white/60 dark:bg-dark-ink/5 p-4 sm:p-5
                     hover:border-cinnabar/40 active:scale-[0.99] transition-all relative"
        >
          <span
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-cinnabar"
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif-cn text-base sm:text-lg font-medium text-ink dark:text-dark-ink">
              {dailyPick.title}
            </h3>
            <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary tabular-nums shrink-0">
              {dailyPick.writtenAt}
            </span>
          </div>
          {dailyPick.interpretation && (
            <p className="mt-1.5 text-[12px] sm:text-[13px] text-cinnabar/85 dark:text-cinnabar/80 leading-relaxed">
              {dailyPick.interpretation}
            </p>
          )}
          <p className="mt-2 text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
            约 {dailyPick.readingMinutes} 分钟 →
          </p>
        </Link>
      </section>

      {/* 主题 */}
      <section className="mb-5 sm:mb-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2 tracking-wider">
          主题
        </h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {themeFilters.map((t) => (
            <button
              key={t.name}
              onClick={() => setTheme(t.name)}
              className={[
                'shrink-0 min-h-[44px] px-3 py-2 text-[12px] sm:text-sm rounded-full border transition-colors',
                theme === t.name
                  ? 'border-cinnabar text-cinnabar bg-cinnabar/5'
                  : 'border-ink/10 dark:border-dark-line text-secondary dark:text-dark-secondary hover:border-cinnabar/40',
              ].join(' ')}
            >
              {t.name === 'all' ? '全部' : t.name}
            </button>
          ))}
        </div>
      </section>

      {/* 全部文章 — 2 列 grid mobile, 3 列 sm+ */}
      <section className="mb-5 sm:mb-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2 tracking-wider">
          全部文章 ({filteredArticles.length})
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredArticles.map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              bookmarked={bookmarkedIds.has(a.id)}
              progressFraction={
                progress.find((p) => p.articleId === a.id)?.scrollFraction ?? 0
              }
            />
          ))}
        </ul>
      </section>

      {/* 收藏 */}
      {bookmarks.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2 tracking-wider">
            收藏 ({bookmarks.length})
          </h2>
          <ul className="space-y-1.5">
            {bookmarks.map((b) => {
              const a = ARTICLES.find((x) => x.id === b.articleId);
              if (!a) return null;
              return (
                <li key={b.articleId}>
                  <Link
                    to={`/read/${b.articleId}`}
                    className="flex items-center justify-between rounded-card border border-ink/8
                               bg-white/50 dark:bg-dark-ink/5 px-3 py-2.5 min-h-[44px]
                               hover:border-cinnabar/40 active:scale-[0.99] transition-all"
                  >
                    <span className="font-serif-cn text-[13px] sm:text-sm text-ink dark:text-dark-ink truncate">
                      ★ {a.title}
                    </span>
                    <span className="text-[10px] text-secondary dark:text-dark-secondary tabular-nums shrink-0 ml-2">
                      {a.writtenAt}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="mt-8 pt-4 text-center text-[10px] sm:text-[11px] text-secondary dark:text-dark-secondary">
        版本来源：人民出版社 1991 年版《毛泽东选集》
      </footer>
    </div>
  );
}

function ArticleCard({
  article,
  bookmarked,
  progressFraction,
}: {
  article: ArticleMetadata;
  bookmarked: boolean;
  progressFraction: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/read/${article.id}`}
        className="block relative rounded-card-lg border border-ink/8 dark:border-dark-line
                   bg-white/60 dark:bg-dark-ink/5 p-3
                   hover:border-cinnabar/40 active:scale-[0.99] transition-all min-h-[88px]"
      >
        {bookmarked && (
          <span className="absolute top-1.5 right-1.5 text-cinnabar text-[10px]">★</span>
        )}
        <h3 className="font-serif-cn text-[13px] sm:text-sm font-medium text-ink dark:text-dark-ink leading-snug line-clamp-2 pr-3">
          {article.title}
        </h3>
        <p className="mt-1.5 text-[10px] text-secondary dark:text-dark-secondary tabular-nums">
          {article.writtenAt} · {article.readingMinutes} 分钟
        </p>
        {progressFraction > 0.01 && progressFraction < 0.99 && (
          <div className="mt-1.5 h-0.5 bg-cinnabar/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-cinnabar"
              style={{ width: `${Math.round(progressFraction * 100)}%` }}
            />
          </div>
        )}
        {progressFraction >= 0.99 && (
          <p className="mt-1 text-[10px] text-moss">已读完</p>
        )}
      </Link>
    </motion.li>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}
