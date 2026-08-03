import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ARTICLES } from '@/data/manifest';
import {
  getAllBookmarks,
  clearBookmark,
  getAllReadingProgress,
  getDailyStats,
  getAllChats,
  deleteChat,
} from '@/lib/storage';
import type { Bookmark, ReadingProgress, DailyStats, ChatThread } from '@/types';
import { useContentLang } from '@/hooks/useContentLang';
import { ContentLangToggle } from '@/components/ContentLangToggle';
import { InstallAppCard } from '@/components/InstallAppCard';

const UI_LANG_KEY = 'maobible.ui-lang';
type UILang = 'zh-CN' | 'en';

/**
 * Me — 我. Reading stats + history + bookmarks + settings.
 */
export function Me() {
  const { i18n } = useTranslation();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [contentLang] = useContentLang();
  const [uiLang, setUiLang] = useState<UILang>(() => {
    if (typeof window === 'undefined') return 'zh-CN';
    const stored = window.localStorage.getItem(UI_LANG_KEY);
    if (stored === 'en' || stored === 'zh-CN') return stored;
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UI_LANG_KEY, uiLang);
    }
    void i18n.changeLanguage(uiLang);
  }, [uiLang, i18n]);

  useEffect(() => {
    void Promise.all([
      getAllBookmarks(),
      getAllReadingProgress(),
      getDailyStats(7),
      getAllChats(),
    ]).then(([b, p, d, c]) => {
      setBookmarks(b);
      setProgress(p);
      setDailyStats(d);
      setChats(c);
    });
  }, []);

  const onRemove = async (articleId: string) => {
    await clearBookmark(articleId);
    setBookmarks((bs) => bs.filter((b) => b.articleId !== articleId));
  };

  // Filter out progress whose articleId is no longer in the manifest
  // (orphans from removed articles used to inflate totalMinRead).
  const validArticleIds = new Set(ARTICLES.map((a) => a.id));
  const validProgress = progress.filter((p) => validArticleIds.has(p.articleId));

  // Stats
  const totalRead = validProgress.filter((p) => p.scrollFraction >= 0.9).length;
  const totalMinRead = Math.round(
    validProgress.reduce((sum, p) => sum + (p.totalDurationMs ?? 0), 0) / 60_000,
  );
  const weekMin = Math.round(
    dailyStats.reduce((sum, d) => sum + d.durationMs, 0) / 60_000,
  );
  const weekArticles = new Set(dailyStats.flatMap((d) => d.articleIds)).size;

  // Last 5 reading sessions (sorted by updatedAt)
  const recentProgress = [...validProgress]
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

      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          手机应用
        </h2>
        <InstallAppCard />
      </section>

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

      {/* 对话历史 — Ask 页之外的入口, 满足隐私页"应用内删除对话"承诺 */}
      {chats.length > 0 && (
        <section>
          <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
            最近对话 ({chats.length})
          </h2>
          <ul className="space-y-1.5">
            {chats.slice(0, 10).map((t) => {
              const lastAi = [...t.messages].reverse().find((m) => m.role === 'ai');
              return (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-2 rounded-card border border-ink/8
                             bg-white/50 dark:bg-dark-ink/5 px-3 py-2.5 min-h-[44px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] sm:text-sm text-ink dark:text-dark-ink truncate">
                      {t.title || '对话'}
                    </p>
                    {lastAi && (
                      <p className="mt-0.5 text-[11px] text-secondary dark:text-dark-secondary line-clamp-1">
                        {lastAi.text.slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await deleteChat(t.id);
                      setChats((prev) => prev.filter((c) => c.id !== t.id));
                    }}
                    className="text-sm text-secondary hover:text-cinnabar transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="删除对话"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            to="/ask"
            className="mt-2 inline-flex min-h-[44px] items-center text-xs text-cinnabar/85 hover:text-cinnabar transition-colors"
          >
            打开对话页 →
          </Link>
        </section>
      )}

      {/* 设置 */}
      <section>
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          设置
        </h2>
        <div className="rounded-card-lg border border-ink/8 dark:border-dark-line
                        bg-white/60 dark:bg-dark-ink/5 p-4 space-y-4">
          <div>
            <p className="text-[11px] text-secondary dark:text-dark-secondary mb-1.5">
              界面语言
            </p>
            <div className="inline-flex rounded-card border border-ink/10 dark:border-dark-line overflow-hidden">
              {([
                { code: 'zh-CN' as const, label: '中文' },
                { code: 'en' as const, label: 'English' },
              ]).map((l) => {
                const active = uiLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setUiLang(l.code)}
                    className={[
                      'min-h-[36px] px-3 py-1.5 text-sm transition-colors duration-180',
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
            <p className="mt-1.5 text-[10px] text-secondary dark:text-dark-secondary">
              独立于内容语言 — 见下方"内容语言"。
            </p>
          </div>
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
          毛选多语种阅读器。版本来源：人民出版社 1991 年版《毛泽东选集》。
          英文为 LLM 翻译草稿（外文出版社版本至 2049 年仍有版权，不在 App 内分发）。
        </p>
        <Link
          to="/privacy"
          className="mt-2 inline-flex min-h-[44px] items-center text-xs text-cinnabar/85 transition-colors hover:text-cinnabar"
        >
          隐私政策 →
        </Link>
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
