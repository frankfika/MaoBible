import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/manifest';
import { getAllBookmarks, clearBookmark } from '@/lib/storage';
import type { Bookmark } from '@/types';
import { useContentLang } from '@/hooks/useContentLang';
import { ContentLangToggle } from '@/components/ContentLangToggle';

/**
 * Me page — bookmarks + lang prefs + about. Mobile-friendly.
 */
export function Me() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [contentLang] = useContentLang();

  useEffect(() => {
    void getAllBookmarks().then(setBookmarks);
  }, []);

  const onRemove = async (articleId: string) => {
    await clearBookmark(articleId);
    setBookmarks((bs) => bs.filter((b) => b.articleId !== articleId));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
      <header>
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink">
          我的
        </h1>
      </header>

      <section>
        <h2 className="text-xs sm:text-sm font-medium text-secondary dark:text-dark-secondary mb-2.5 sm:mb-3">
          收藏
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary py-2">
            还没有收藏。在文章页点 ★ 收藏当前阅读位置。
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => {
              const article = ARTICLES.find((a) => a.id === b.articleId);
              if (!article) return null;
              return (
                <li
                  key={b.articleId}
                  className="flex items-center justify-between rounded-card border border-ink/8
                             bg-white/50 dark:bg-dark-ink/5 px-4 py-3 min-h-[48px]"
                >
                  <Link
                    to={`/read/${b.articleId}`}
                    className="flex-1 min-w-0 font-serif-cn text-sm sm:text-base text-ink dark:text-dark-ink hover:text-cinnabar transition-colors truncate"
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

      <section>
        <h2 className="text-xs sm:text-sm font-medium text-secondary dark:text-dark-secondary mb-2.5 sm:mb-3">
          内容语言
        </h2>
        <ContentLangToggle />
        <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
          当前阅读：{contentLang === 'zh-CN' ? '中文原文' : 'English translation'}
        </p>
      </section>

      <section>
        <h2 className="text-xs sm:text-sm font-medium text-secondary dark:text-dark-secondary mb-2.5 sm:mb-3">
          关于
        </h2>
        <p className="text-sm text-ink/80 dark:text-dark-ink/80 leading-relaxed">
          毛选多语种阅读器。
          原文来自公开的人民出版社 1991 年版《毛泽东选集》。
          英文为校订草稿（外文出版社版本至 2049 年仍有版权，不在 App 内分发）。
        </p>
      </section>
    </div>
  );
}
