import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/manifest';
import { getBookmarks, clearBookmark } from '@/lib/storage';
import type { Bookmark } from '@/types';
import { useContentLang } from '@/hooks/useContentLang';
import { ContentLangToggle } from '@/components/ContentLangToggle';

/**
 * Me page — minimal settings + bookmarks list.
 * No account, no profile. Just prefs and saved articles.
 */
export function Me() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [contentLang] = useContentLang();
  const [uiLang, setUiLang] = useState<'zh-CN' | 'en'>(() => {
    const stored = localStorage.getItem('maobible.ui-lang');
    return (stored as 'zh-CN' | 'en') || 'zh-CN';
  });

  useEffect(() => {
    void getBookmarks().then(setBookmarks);
  }, []);

  const onRemoveBookmark = async (articleId: string) => {
    await clearBookmark(articleId);
    setBookmarks((bs) => bs.filter((b) => b.articleId !== articleId));
  };

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 space-y-8">
      <h1 className="font-serif-cn text-2xl font-medium text-ink dark:text-dark-ink">
        我的
      </h1>

      <section>
        <h2 className="text-sm font-medium text-secondary dark:text-dark-secondary mb-2">
          收藏
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary py-4">
            还没有收藏。在文章页可以收藏当前阅读位置。
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
                             bg-white/40 dark:bg-dark-ink/5 p-3"
                >
                  <Link
                    to={`/read/${b.articleId}`}
                    className="flex-1 font-serif-cn text-base text-ink dark:text-dark-ink"
                  >
                    {article.title}
                  </Link>
                  <button
                    onClick={() => void onRemoveBookmark(b.articleId)}
                    className="text-xs text-secondary hover:text-cinnabar transition-colors"
                  >
                    移除
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-secondary dark:text-dark-secondary mb-2">
          内容语言（文章原文/译文）
        </h2>
        <ContentLangToggle />
        <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
          当前：{contentLang === 'zh-CN' ? '中文原文' : 'English translation'}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-secondary dark:text-dark-secondary mb-2">
          界面语言
        </h2>
        <div className="flex gap-2">
          {(['zh-CN', 'en'] as const).map((code) => (
            <button
              key={code}
              onClick={() => {
                setUiLang(code);
                localStorage.setItem('maobible.ui-lang', code);
                // Trigger i18n change if available
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('maobible:ui-lang-changed', { detail: code }),
                  );
                }
              }}
              className={[
                'px-3 py-1.5 text-sm rounded-card border transition-colors',
                uiLang === code
                  ? 'border-cinnabar text-cinnabar bg-cinnabar/5'
                  : 'border-ink/10 text-ink/70 dark:text-dark-ink/70 hover:border-ink/30',
              ].join(' ')}
            >
              {code === 'zh-CN' ? '中文' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-secondary dark:text-dark-secondary mb-2">
          关于
        </h2>
        <p className="text-sm text-ink/80 dark:text-dark-ink/80 leading-relaxed">
          毛选多语种阅读器。
          原文来自公开的人民出版社 1991 年版《毛泽东选集》。
          译文为校订草稿（外文出版社英文版至 2049 年仍有版权，不在 App 内分发）。
        </p>
      </section>
    </div>
  );
}
