import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/manifest';
import {
  getAllBookmarks,
  clearBookmark,
  getAllReadingProgress,
  getDailyStats,
} from '@/lib/storage';
import type { Bookmark, ReadingProgress, DailyStats } from '@/types';
import { useContentLang } from '@/hooks/useContentLang';
import { ContentLangToggle } from '@/components/ContentLangToggle';

/**
 * Me — 我. Reading stats + history + bookmarks + settings.
 */
export function Me() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [contentLang] = useContentLang();

  useEffect(() => {
    void Promise.all([
      getAllBookmarks(),
      getAllReadingProgress(),
      getDailyStats(7),
    ]).then(([b, p, d]) => {
      setBookmarks(b);
      setProgress(p);
      setDailyStats(d);
    });
  }, []);

  const onRemove = async (articleId: string) => {
    await clearBookmark(articleId);
    setBookmarks((bs) => bs.filter((b) => b.articleId !== articleId));
  };

  // Stats
  const totalRead = progress.filter((p) => p.scrollFraction >= 0.9).length;
  const totalMinRead = Math.round(
    progress.reduce((sum, p) => sum + (p.totalDurationMs ?? 0), 0) / 60_000,
  );
  const weekMin = Math.round(
    dailyStats.reduce((sum, d) => sum + d.durationMs, 0) / 60_000,
  );
  const weekArticles = new Set(dailyStats.flatMap((d) => d.articleIds)).size;

  // Last 5 reading sessions (sorted by updatedAt)
  const recentProgress = [...progress]
    .filter((p) => p.scrollFraction > 0.01)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink">
          我的
        </h1>
      </header>

      {/* 本周阅读 */}
      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          本周阅读
        </h2>
        <div className="rounded-card-lg border border-ink/8 dark:border-dark-line
                        bg-white/60 dark:bg-dark-ink/5 p-4 sm:p-5">
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-serif-cn text-ink dark:text-dark-ink tabular-nums">
                {weekMin}
              </p>
              <p className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary">
                分钟
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif-cn text-ink dark:text-dark-ink tabular-nums">
                {weekArticles}
              </p>
              <p className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary">
                篇
              </p>
            </div>
          </div>
          <WeeklyBarChart stats={dailyStats} />
        </div>
      </section>

      {/* 累计 */}
      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          累计
        </h2>
        <p className="text-sm text-ink dark:text-dark-ink">
          {ARTICLES.length} 篇中已读 {totalRead} 篇 · 收藏 {bookmarks.length} 篇 · 累计 {totalMinRead} 分钟
        </p>
        <div className="mt-2 h-1.5 bg-ink/5 dark:bg-dark-ink/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-cinnabar transition-all"
            style={{ width: `${(totalRead / ARTICLES.length) * 100}%` }}
          />
        </div>
      </section>

      {/* 最近阅读 */}
      {recentProgress.length > 0 && (
        <section>
          <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
            最近阅读
          </h2>
          <ul className="space-y-1.5">
            {recentProgress.map((p) => {
              const a = ARTICLES.find((x) => x.id === p.articleId);
              if (!a) return null;
              return (
                <li key={p.articleId}>
                  <Link
                    to={`/read/${p.articleId}`}
                    className="flex items-center justify-between rounded-card border border-ink/8
                               bg-white/50 dark:bg-dark-ink/5 px-3 py-2.5 min-h-[44px]
                               hover:border-cinnabar/40 active:scale-[0.99] transition-all"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-serif-cn text-[13px] sm:text-sm text-ink dark:text-dark-ink truncate block">
                        {a.title}
                      </span>
                      <span className="text-[10px] text-secondary dark:text-dark-secondary">
                        {Math.round(p.scrollFraction * 100)}% · {timeAgo(p.updatedAt)}
                      </span>
                    </span>
                    <div className="ml-2 w-12 h-1 bg-ink/10 dark:bg-dark-ink/20 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-cinnabar"
                        style={{ width: `${Math.round(p.scrollFraction * 100)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 收藏 */}
      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          收藏 ({bookmarks.length})
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary py-2">
            还没有收藏。在文章页点 ★ 收藏当前阅读位置。
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bookmarks.map((b) => {
              const article = ARTICLES.find((a) => a.id === b.articleId);
              if (!article) return null;
              return (
                <li
                  key={b.articleId}
                  className="flex items-center justify-between rounded-card border border-ink/8
                             bg-white/50 dark:bg-dark-ink/5 px-3 py-2.5 min-h-[44px]"
                >
                  <Link
                    to={`/read/${b.articleId}`}
                    className="flex-1 min-w-0 font-serif-cn text-[13px] sm:text-sm text-ink dark:text-dark-ink hover:text-cinnabar transition-colors truncate"
                  >
                    {article.title}
                  </Link>
                  <button
                    onClick={() => void onRemove(b.articleId)}
                    className="text-sm text-secondary hover:text-cinnabar transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="移除收藏"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 设置 */}
      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          设置
        </h2>
        <div className="rounded-card-lg border border-ink/8 dark:border-dark-line
                        bg-white/60 dark:bg-dark-ink/5 p-4 space-y-3">
          <div>
            <p className="text-[11px] text-secondary dark:text-dark-secondary mb-1.5">
              内容语言
            </p>
            <ContentLangToggle />
            <p className="mt-1.5 text-[10px] text-secondary dark:text-dark-secondary">
              当前阅读：{contentLang === 'zh-CN' ? '中文原文' : 'English translation'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[10px] sm:text-xs text-secondary dark:text-dark-secondary leading-relaxed">
          毛选多语种阅读器。原文来自公开的人民出版社 1991 年版《毛泽东选集》。
          英文为 LLM 翻译草稿（外文出版社版本至 2049 年仍有版权，不在 App 内分发）。
        </p>
      </section>
    </div>
  );
}

function WeeklyBarChart({ stats }: { stats: DailyStats[] }) {
  // Build last 7 days, fill missing with 0
  const days: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const stat = stats.find((s) => s.date === dateStr);
    days.push({ date: dateStr, minutes: Math.round((stat?.durationMs ?? 0) / 60_000) });
  }
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  return (
    <div className="mt-4 flex items-end gap-2 h-16">
      {days.map((d, i) => {
        const date = new Date(d.date);
        const dow = (date.getDay() + 6) % 7; // Mon=0
        const today = i === 6;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className={[
                  'w-full rounded-t transition-all',
                  d.minutes > 0
                    ? today
                      ? 'bg-cinnabar'
                      : 'bg-cinnabar/40'
                    : 'bg-ink/5 dark:bg-dark-ink/20',
                ].join(' ')}
                style={{ height: `${(d.minutes / max) * 100}%`, minHeight: '4px' }}
                title={`${d.date}: ${d.minutes} 分钟`}
              />
            </div>
            <span
              className={[
                'text-[9px] sm:text-[10px] tabular-nums',
                today ? 'text-cinnabar font-medium' : 'text-secondary dark:text-dark-secondary',
              ].join(' ')}
            >
              {dayLabels[dow]}
            </span>
          </div>
        );
      })}
    </div>
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
