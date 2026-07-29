import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useArticle } from '@/hooks/useArticle';
import { useContentLang } from '@/hooks/useContentLang';
import {
  getBookmark,
  setBookmark,
  clearBookmark,
  getReadingProgress,
  setReadingProgress,
} from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import { ParagraphView } from '@/components/ParagraphView';
import type { LangCode } from '@/types';

type Mode = 'single' | 'bilingual';

/**
 * Reader — title + paragraphs + sticky toolbar.
 * Mobile-friendly: toolbar uses 44px touch targets, scrolls with content.
 * Interpretation toggle reveals the modern one-liner; bilingual toggle
 * adds an English column on md+ screens, stacks on mobile.
 */
export function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { article, loading, error } = useArticle(id);
  const [contentLang, setContentLang] = useContentLang();
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
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 text-secondary text-sm">
        加载中
      </div>
    );
  }
  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <p className="text-cinnabar text-sm">未找到该文章。</p>
        <Link
          to="/"
          className="text-sm text-secondary hover:text-ink mt-3 inline-block"
        >
          ← 返回
        </Link>
      </div>
    );
  }

  const primary = article.translations[contentLang];
  const secondary = mode === 'bilingual' ? article.translations[otherLang(contentLang)] : null;
  const secondaryCode = otherLang(contentLang) as LangCode;

  const toggleBookmark = async () => {
    if (isBookmarked) {
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
    <article ref={articleRef} className="max-w-3xl mx-auto px-4 sm:px-8 py-3 pb-8">
      {/* Sticky toolbar — compact, 44px touch targets, mobile-friendly */}
      <div
        className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-3 sm:px-8 py-1.5
                   backdrop-blur-md bg-paper/85 dark:bg-dark-paper/85
                   border-b border-ink/5 dark:border-dark-line
                   flex items-center gap-1"
      >
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center
                     text-ink/75 dark:text-dark-ink/75 hover:text-ink dark:hover:text-dark-ink
                     active:scale-95 transition-all"
          aria-label="返回"
        >
          <span className="text-lg">←</span>
        </button>
        <div className="flex-1 min-w-0" />
        <ToolbarButton
          label={contentLang === 'zh-CN' ? '中' : 'EN'}
          active={false}
          onClick={() => setContentLang(otherLang(contentLang))}
          title="切换内容语言"
        />
        <ToolbarButton
          label={mode === 'bilingual' ? '单语' : '双语'}
          active={mode === 'bilingual'}
          onClick={() => setMode((m) => (m === 'single' ? 'bilingual' : 'single'))}
          title="双语对照"
        />
        <ToolbarButton
          label="解读"
          active={showInterpretation}
          onClick={() => setShowInterpretation((s) => !s)}
          title="解读"
        />
        <ToolbarButton
          label={isBookmarked ? '★' : '☆'}
          active={isBookmarked}
          onClick={() => void toggleBookmark()}
          title={isBookmarked ? '取消收藏' : '收藏'}
          isIcon
        />
      </div>

      <header className="pt-2 sm:pt-4 pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          {meta?.title}
        </h1>
        {meta?.subtitle && (
          <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-base text-secondary dark:text-dark-secondary font-serif-cn">
            {meta.subtitle}
          </p>
        )}
        <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
          {meta?.author} · {meta?.writtenAt} · {meta?.volume} · 约 {meta?.readingMinutes} 分钟
        </p>
      </header>

      {showInterpretation && meta?.interpretation && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 px-4 py-3">
            <div className="text-[11px] text-cinnabar/80 mb-1 tracking-wider">解读</div>
            <p className="text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
              {meta.interpretation}
            </p>
          </div>
        </motion.div>
      )}

      <div
        className={
          mode === 'bilingual'
            ? 'grid md:grid-cols-2 md:gap-10'
            : ''
        }
      >
        <section
          className={
            mode === 'bilingual'
              ? 'md:border-r md:border-ink/8 md:pr-8'
              : ''
          }
        >
          {primary?.paragraphs.map((p) => (
            <ParagraphView key={p.id} p={p} lang={contentLang} />
          ))}
        </section>
        {mode === 'bilingual' && secondary && (
          <section className="md:pl-2 mt-6 md:mt-0">
            {secondary.paragraphs.map((p) => (
              <ParagraphView key={p.id} p={p} lang={secondaryCode} />
            ))}
          </section>
        )}
      </div>

      <nav className="mt-12 sm:mt-16 pt-6 border-t border-ink/8 flex justify-between gap-4 text-sm">
        {prevArticle ? (
          <Link to={`/read/${prevArticle.id}`} className="flex-1 min-w-0 group">
            <div className="text-xs text-secondary dark:text-dark-secondary">
              ← 上一篇
            </div>
            <div className="mt-1 font-serif-cn text-ink dark:text-dark-ink group-hover:text-cinnabar transition-colors line-clamp-1 text-sm sm:text-base">
              {prevArticle.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextArticle ? (
          <Link to={`/read/${nextArticle.id}`} className="flex-1 min-w-0 group text-right">
            <div className="text-xs text-secondary dark:text-dark-secondary">
              下一篇 →
            </div>
            <div className="mt-1 font-serif-cn text-ink dark:text-dark-ink group-hover:text-cinnabar transition-colors line-clamp-1 text-sm sm:text-base">
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

function otherLang(l: LangCode): LangCode {
  return l === 'zh-CN' ? 'en' : 'zh-CN';
}

function ToolbarButton({
  label,
  active,
  onClick,
  title,
  isIcon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
  isIcon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'min-h-[36px] px-2.5 rounded-card border transition-colors active:scale-95',
        isIcon ? 'text-base' : 'text-xs',
        active
          ? 'border-cinnabar text-cinnabar bg-cinnabar/5'
          : 'border-ink/10 dark:border-dark-line hover:border-cinnabar/40',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
