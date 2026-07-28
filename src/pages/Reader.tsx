import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useArticle } from '@/hooks/useArticle';
import { useContentLang } from '@/hooks/useContentLang';
import {
  getBookmark,
  setBookmark,
  getReadingProgress,
  setReadingProgress,
} from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import { ParagraphView } from '@/components/ParagraphView';
import type { LangCode } from '@/types';

type Mode = 'single' | 'bilingual';

/**
 * Simplified Reader — no popovers, no notes, no glossary, no highlights.
 * Just: back / title / language toggle / paragraphs / bookmark.
 */
export function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { article, loading, error } = useArticle(id);
  const [contentLang] = useContentLang();
  const [secondaryLang] = useState<LangCode>(
    contentLang === 'zh-CN' ? 'en' : 'zh-CN',
  );
  const [mode, setMode] = useState<Mode>('single');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const lastSaveRef = useRef(0);

  const meta = article?.metadata;
  const currentIndex = useMemo(
    () => ARTICLES.findIndex((a) => a.id === id),
    [id],
  );
  const prevArticle = currentIndex > 0 ? ARTICLES[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < ARTICLES.length - 1
      ? ARTICLES[currentIndex + 1]
      : null;

  useEffect(() => {
    if (!id) return;
    void getBookmark(id).then((b) => setIsBookmarked(Boolean(b)));
  }, [id]);

  // Restore scroll + track progress
  useEffect(() => {
    if (!article || !articleRef.current) return;
    const el = articleRef.current;
    void getReadingProgress(id).then((p) => {
      if (p) {
        const target = Math.max(
          0,
          p.scrollFraction * (el.scrollHeight - el.clientHeight),
        );
        el.scrollTo({ top: target, behavior: 'auto' });
      }
    });
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 1000) return;
      lastSaveRef.current = now;
      const frac =
        el.scrollHeight > el.clientHeight
          ? el.scrollTop / (el.scrollHeight - el.clientHeight)
          : 0;
      void setReadingProgress({
        articleId: id,
        scrollFraction: frac,
        updatedAt: new Date().toISOString(),
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [article, id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 text-secondary">
        加载中…
      </div>
    );
  }
  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <p className="text-cinnabar">未找到该文章。</p>
        <Link to="/" className="text-sm underline mt-2 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const primary = article.translations[contentLang];
  const secondary = mode === 'bilingual' ? article.translations[secondaryLang] : null;

  const toggleBookmark = async () => {
    if (isBookmarked) {
      const { clearBookmark } = await import('@/lib/storage');
      await clearBookmark(id);
      setIsBookmarked(false);
    } else {
      await setBookmark({
        articleId: id,
        paragraphId: primary?.paragraphs[0]?.id ?? '',
        createdAt: new Date().toISOString(),
      });
      setIsBookmarked(true);
    }
  };

  return (
    <article
      ref={articleRef}
      className="max-w-3xl mx-auto px-5 sm:px-8 py-4 pb-24"
    >
      <div className="sticky top-12 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2
                      backdrop-blur-md bg-paper/80 dark:bg-dark-paper/80
                      border-b border-ink/5 dark:border-dark-line
                      flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="text-ink/70 dark:text-dark-ink/70 hover:text-ink dark:hover:text-dark-ink
                     px-2 py-1 text-sm"
        >
          ← 返回
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setMode((m) => (m === 'single' ? 'bilingual' : 'single'))}
          className="rounded-card px-2.5 py-1 text-xs border border-ink/10 dark:border-dark-line
                     hover:border-cinnabar/40 transition-colors"
        >
          {mode === 'single' ? '双语' : '单语'}
        </button>
        <button
          onClick={() => setShowInterpretation((s) => !s)}
          className="rounded-card px-2.5 py-1 text-xs border border-ink/10 dark:border-dark-line
                     hover:border-cinnabar/40 transition-colors"
        >
          解读
        </button>
        <button
          onClick={() => void toggleBookmark()}
          aria-label={isBookmarked ? '取消收藏' : '收藏'}
          className={[
            'rounded-card px-2.5 py-1 text-xs border transition-colors',
            isBookmarked
              ? 'border-cinnabar text-cinnabar bg-cinnabar/5'
              : 'border-ink/10 dark:border-dark-line',
          ].join(' ')}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      <header className="pt-6 pb-4">
        <h1 className="font-serif-cn text-3xl sm:text-4xl font-medium text-ink dark:text-dark-ink">
          {meta?.title}
        </h1>
        <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
          {meta?.author} · {meta?.writtenAt} · {meta?.volume}
        </p>
      </header>

      <AnimatePresence>
        {showInterpretation && meta?.interpretation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4">
              <div className="text-xs text-cinnabar mb-1">解读</div>
              <p className="text-base sm:text-lg text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                {meta.interpretation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={mode === 'bilingual' ? 'grid md:grid-cols-2 gap-8' : ''}>
        <section>
          {primary?.paragraphs.map((p) => (
            <ParagraphView key={p.id} p={p} lang={contentLang} />
          ))}
        </section>
        {mode === 'bilingual' && secondary && (
          <section>
            {secondary.paragraphs.map((p) => (
              <ParagraphView key={p.id} p={p} lang={secondaryLang} />
            ))}
          </section>
        )}
      </div>

      <nav className="mt-12 pt-6 border-t border-ink/8 flex justify-between gap-4">
        {prevArticle ? (
          <Link
            to={`/read/${prevArticle.id}`}
            className="flex-1 rounded-card border border-ink/8 dark:border-dark-line
                       p-3 hover:border-cinnabar/40 transition-colors"
          >
            <div className="text-xs text-secondary dark:text-dark-secondary">
              ← 上一篇
            </div>
            <div className="mt-1 font-serif-cn text-sm text-ink dark:text-dark-ink line-clamp-1">
              {prevArticle.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextArticle ? (
          <Link
            to={`/read/${nextArticle.id}`}
            className="flex-1 rounded-card border border-ink/8 dark:border-dark-line
                       p-3 hover:border-cinnabar/40 transition-colors text-right transition-colors"
          >
            <div className="text-xs text-secondary dark:text-dark-secondary">
              下一篇 →
            </div>
            <div className="mt-1 font-serif-cn text-sm text-ink dark:text-dark-ink line-clamp-1">
              {nextArticle.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </article>
  );
}
