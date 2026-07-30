import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useArticle } from '@/hooks/useArticle';
import { useContentLang } from '@/hooks/useContentLang';
import {
  getBookmark,
  setBookmark,
  clearBookmark,
  getReadingProgress,
  setReadingProgress,
  recordSession,
} from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import { ParagraphView } from '@/components/ParagraphView';
import { TopProgressBar } from '@/components/TopProgressBar';
import { TocDrawer } from '@/components/TocDrawer';
import { ParagraphAIDialog } from '@/components/ParagraphAIDialog';
import { explainParagraph } from '@/services/ai';
import type { LangCode, Paragraph } from '@/types';

type Mode = 'single' | 'bilingual';

/**
 * Reader v4 — title + AI 解读 + paragraphs + sticky toolbar.
 *
 * v4 changes from v3:
 *  - Top progress bar (auto-updates with scroll)
 *  - AI 解读 panel DEFAULT EXPANDED (interpretation visible from start)
 *  - TOC drawer (slide-up sheet with all paragraphs)
 *  - 段落点击 → AI 解释 dialog
 *  - Reading session recorded (durationMs tracked)
 */
export function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { article, loading, error } = useArticle(id);
  const [contentLang, setContentLang] = useContentLang();
  const [mode, setMode] = useState<Mode>('single');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [aiParagraph, setAiParagraph] = useState<Paragraph | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const lastSaveRef = useRef(0);
  const sessionStartRef = useRef<number>(Date.now());

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
    if (!meta?.title) return;
    document.title = `${meta.title} · 毛选`;
  }, [meta?.title]);

  useEffect(() => {
    if (!id) return;
    void getBookmark(id).then((b) => setIsBookmarked(Boolean(b)));
    sessionStartRef.current = Date.now();
    return () => {
      // Record session on unmount
      const durationMs = Date.now() - sessionStartRef.current;
      if (durationMs > 5_000) {
        void recordSession({
          articleId: id,
          startedAt: new Date(sessionStartRef.current).toISOString(),
          durationMs,
        });
      }
    };
  }, [id]);

  useEffect(() => {
    if (!article || !articleRef.current) return;
    const el = articleRef.current;
    let restored = false;
    const saveCurrentProgress = () => {
      if (!restored) return;
      const frac =
        el.scrollHeight > el.clientHeight
          ? el.scrollTop / (el.scrollHeight - el.clientHeight)
          : 0;
      const paragraphs = el.querySelectorAll<HTMLElement>('[data-para-id]');
      let activeId: string | undefined;
      for (const p of paragraphs) {
        const rect = p.getBoundingClientRect();
        if (rect.bottom >= 112) {
          activeId = p.dataset.paraId;
          break;
        }
      }
      void setReadingProgress({
        articleId: id,
        scrollFraction: Math.max(0, Math.min(1, frac)),
        updatedAt: new Date().toISOString(),
        lastParagraphId: activeId,
      });
    };

    void getReadingProgress(id).then((p) => {
      if (p) {
        const target = Math.max(
          0,
          p.scrollFraction * (el.scrollHeight - el.clientHeight),
        );
        el.scrollTo({ top: target, behavior: 'auto' });
      }
      restored = true;
    });
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 1000) return;
      lastSaveRef.current = now;
      saveCurrentProgress();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveCurrentProgress();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', saveCurrentProgress);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      saveCurrentProgress();
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', saveCurrentProgress);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [article, id]);

  // Hash-based jump from Discover page: /read/{id}#{paragraphId} → scroll
  // to that paragraph and briefly highlight it.
  useEffect(() => {
    if (!article) return;
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return;
    // Wait one frame so DOM is ready (paragraphs just rendered above).
    const t = window.setTimeout(() => {
      const el = articleRef.current?.querySelector<HTMLElement>(
        `[data-para-id="${hash}"]`,
      );
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight: add ring, then remove after 1.6s
      el.classList.add(
        'ring-2',
        'ring-cinnabar/40',
        'ring-offset-2',
        'ring-offset-paper',
        'dark:ring-offset-dark-paper',
        'rounded',
        'transition',
      );
      window.setTimeout(() => {
        el.classList.remove(
          'ring-2',
          'ring-cinnabar/40',
          'ring-offset-2',
          'ring-offset-paper',
          'dark:ring-offset-dark-paper',
        );
      }, 1600);
    }, 80);
    return () => window.clearTimeout(t);
  }, [article, location.hash, id]);

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
    <article
      ref={articleRef}
      className="app-surface h-full overflow-y-auto overscroll-y-contain
                 max-w-3xl mx-auto px-4 sm:px-8 pb-[calc(2rem+env(safe-area-inset-bottom))]"
    >
      {/* Top progress bar — fixed to top of viewport */}
      <TopProgressBar containerRef={articleRef} />

      {/* Sticky toolbar */}
      <div
        className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-3 sm:px-8 pb-1.5
                   pt-[calc(.375rem+env(safe-area-inset-top))]
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
        <button
          onClick={() => setShowToc(true)}
          className="min-h-[36px] px-2 rounded-card text-xs text-secondary dark:text-dark-secondary
                     border border-ink/10 dark:border-dark-line
                     hover:border-cinnabar/40 active:scale-95 transition-all"
          title="目录"
        >
          ☰ 目录
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
          label="AI"
          active={showAI}
          onClick={() => setShowAI((s) => !s)}
          title="AI 解读"
        />
        <ToolbarButton
          label={isBookmarked ? '★' : '☆'}
          active={isBookmarked}
          onClick={() => void toggleBookmark()}
          title={isBookmarked ? '取消收藏' : '收藏'}
          isIcon
        />
      </div>

      <header className="pt-4 sm:pt-6 pb-4 sm:pb-5">
        <h1 className="font-serif-cn text-[1.65rem] sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight text-balance">
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

      {/* AI 解读 — default expanded */}
      <AnimatePresence>
        {showAI && meta?.interpretation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] text-cinnabar/80 tracking-wider flex items-center gap-1">
                  <span>🤖</span> AI 解读
                </div>
                <button
                  onClick={() => setShowAI(false)}
                  className="text-[10px] text-secondary hover:text-cinnabar transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  aria-label="关闭解读"
                >
                  ✕
                </button>
              </div>
              <p className="text-[15px] sm:text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                {meta.interpretation}
              </p>
              <Link
                to="/ai"
                className="mt-2 inline-block text-[11px] sm:text-xs text-cinnabar/85 hover:text-cinnabar transition-colors"
              >
                问 AI 更多 →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint about AI paragraph tap */}
      <p className="mb-3 text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
        点按带虚线提示的段落，可查看白话解读
      </p>

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
            <ParagraphView
              key={p.id}
              p={p}
              lang={contentLang}
              onTap={contentLang === 'zh-CN' ? () => setAiParagraph(p) : undefined}
            />
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

      {/* TOC drawer */}
      <TocDrawer
        open={showToc}
        onClose={() => setShowToc(false)}
        article={article}
        contentLang={contentLang}
        onJump={(paraId) => {
          const el = articleRef.current?.querySelector<HTMLElement>(
            `[data-para-id="${paraId}"]`,
          );
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* AI 解释 dialog for a paragraph */}
      <ParagraphAIDialog
        paragraph={aiParagraph}
        onClose={() => setAiParagraph(null)}
        explain={explainParagraph}
      />
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
