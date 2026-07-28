import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useArticle } from '@/hooks/useArticle';
import { useContentLang } from '@/hooks/useContentLang';
import {
  getReadingProgress,
  setReadingProgress,
  getBookmark,
  setBookmark as persistBookmark,
  clearBookmark,
  getHighlights,
  setHighlights,
  getNotes,
  setNotes,
} from '@/lib/storage';
import { ARTICLES } from '@/data/manifest';
import type { Highlight, LangCode, Note, Paragraph } from '@/types';
import { ContentLangToggle } from '@/components/ContentLangToggle';
import { ParagraphView } from '@/components/ParagraphView';
import { GlossaryPanel } from '@/components/GlossaryPanel';



type BilingualMode = 'single' | 'bilingual';

/** Lightweight unique-id generator. crypto.randomUUID is widely available,
 *  but we fall back gracefully for older browsers. */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { article, loading, error } = useArticle(id);
  const [contentLang] = useContentLang();
  const [mode, setMode] = useState<BilingualMode>('single');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [highlights, setHighlightsState] = useState<Highlight[]>([]);
  const [notes, setNotesState] = useState<Note[]>([]);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
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

  // Load bookmark state
  useEffect(() => {
    if (!id) return;
    void getBookmark(id).then((b) => setIsBookmarked(Boolean(b)));
  }, [id]);

  // Load highlights + notes when the article changes
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void Promise.all([getHighlights(id), getNotes(id)]).then(([hs, ns]) => {
      if (cancelled) return;
      setHighlightsState(hs);
      setNotesState(ns);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Restore scroll on mount; track scroll for progress (throttled to 1s)
  useEffect(() => {
    if (!article || !articleRef.current) return;
    const el = articleRef.current;
    void getReadingProgress(id).then((p) => {
      if (p) {
        const target = Math.max(0, p.scrollFraction * (el.scrollHeight - el.clientHeight));
        el.scrollTo({ top: target, behavior: 'auto' });
      }
    });
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 1000) return;
      lastSaveRef.current = now;
      const frac = el.scrollHeight > el.clientHeight
        ? el.scrollTop / (el.scrollHeight - el.clientHeight)
        : 0;
      const visible = computeFirstVisibleParagraphIndex(el);
      void setReadingProgress({
        articleId: id,
        lastParagraphIndex: visible,
        scrollFraction: Math.min(1, Math.max(0, frac)),
        updatedAt: new Date().toISOString(),
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [article, id]);

  // Keyboard: left/right for prev/next article; Esc back to library
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevArticle) {
        navigate(`/read/${prevArticle.id}`);
      } else if (e.key === 'ArrowRight' && nextArticle) {
        navigate(`/read/${nextArticle.id}`);
      } else if (e.key === 'Escape') {
        navigate('/library');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, prevArticle, nextArticle]);

  const onSwipe = useCallback(
    (deltaX: number) => {
      if (deltaX > 60 && prevArticle) navigate(`/read/${prevArticle.id}`);
      else if (deltaX < -60 && nextArticle) navigate(`/read/${nextArticle.id}`);
    },
    [navigate, prevArticle, nextArticle],
  );

  const onToggleBookmark = useCallback(async () => {
    if (isBookmarked) {
      await clearBookmark(id);
      setIsBookmarked(false);
    } else {
      await persistBookmark({
        articleId: id,
        paragraphId: meta?.id ?? id,
        createdAt: new Date().toISOString(),
      });
      setIsBookmarked(true);
    }
  }, [id, isBookmarked, meta?.id]);

  // ---- Highlight / note helpers (Phase 2) -----------------------------
  // Maps paragraphId -> first matching highlight/note, used to thread
  // state into each ParagraphView without an extra context provider.
  const highlightByPara = useMemo(() => {
    const m = new Map<string, Highlight>();
    for (const h of highlights) m.set(h.paragraphId, h);
    return m;
  }, [highlights]);
  const noteByPara = useMemo(() => {
    const m = new Map<string, Note>();
    for (const n of notes) m.set(n.paragraphId, n);
    return m;
  }, [notes]);

  const onToggleHighlight = useCallback(
    (p: Paragraph) => {
      const existing = highlightByPara.get(p.id);
      const next: Highlight[] = existing
        ? highlights.filter((h) => h.id !== existing.id)
        : [
            ...highlights,
            {
              id: newId(),
              articleId: id,
              paragraphId: p.id,
              text: p.text.slice(0, 120),
              createdAt: new Date().toISOString(),
            },
          ];
      setHighlightsState(next);
      void setHighlights(id, next);
    },
    [highlightByPara, highlights, id],
  );

  const onSaveNote = useCallback(
    (p: Paragraph, text: string) => {
      const existing = noteByPara.get(p.id);
      const now = new Date().toISOString();
      const next: Note[] = existing
        ? notes.map((n) => (n.id === existing.id ? { ...n, text, updatedAt: now } : n))
        : [
            ...notes,
            {
              id: newId(),
              articleId: id,
              paragraphId: p.id,
              text,
              updatedAt: now,
            },
          ];
      setNotesState(next);
      void setNotes(id, next);
    },
    [noteByPara, notes, id],
  );

  const onDeleteNote = useCallback(
    (noteId: string) => {
      const next = notes.filter((n) => n.id !== noteId);
      setNotesState(next);
      void setNotes(id, next);
    },
    [notes, id],
  );

  if (loading) {
    return (
      <div className="prose-reader py-20 text-secondary dark:text-dark-secondary">
        {t('common.loading')}
      </div>
    );
  }
  if (error || !article || !meta) {
    return (
      <div className="prose-reader py-20">
        <p className="text-cinnabar">{t('common.error')}: {error ?? 'not found'}</p>
        <Link to="/library" className="link-quiet mt-4 inline-block">
          ← {t('nav.back')}
        </Link>
      </div>
    );
  }

  const availableLangs = Object.keys(article.translations) as LangCode[];
  const safeLang: LangCode = availableLangs.includes(contentLang)
    ? contentLang
    : (availableLangs[0] ?? 'zh-CN');

  const primary = article.translations[safeLang]!;
  const secondary = article.translations[
    safeLang === 'zh-CN' ? 'en' : 'zh-CN'
  ] as typeof primary | undefined;

  return (
    <Swipeable onSwipe={onSwipe}>
      <article
        ref={articleRef}
        className="prose-reader py-10 sm:py-16"
      >
        <div className="flex items-center justify-between mb-8 text-sm">
          <Link to="/library" className="link-quiet">
            ← {t('nav.library')}
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'single' ? 'bilingual' : 'single'))}
              className="rounded-card px-3 py-1.5 border border-ink/10 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10
                         transition-colors duration-180"
              title={mode === 'single' ? t('reader.bilingual') : t('reader.singleLang')}
            >
              {mode === 'single' ? t('reader.bilingual') : t('reader.singleLang')}
            </button>
            <button
              type="button"
              onClick={() => setGlossaryOpen(true)}
              aria-pressed={glossaryOpen}
              title={t('reader.glossary')}
              className="rounded-card px-3 py-1.5 border border-ink/10 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10
                         transition-colors duration-180"
            >
              <span aria-hidden="true">📖</span>{' '}
              <span className="hidden sm:inline">{t('reader.glossary')}</span>
            </button>
            <ContentLangToggle />
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-pressed={isBookmarked}
              title={isBookmarked ? '取消收藏' : '收藏'}
              className={[
                'rounded-card px-3 py-1.5 border transition-colors duration-180',
                isBookmarked
                  ? 'border-cinnabar/40 text-cinnabar'
                  : 'border-ink/10 dark:border-dark-line text-ink/70 dark:text-dark-ink/70',
              ].join(' ')}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
          </div>
        </div>

        <header className="mb-10">
          <h1 className="font-serif-cn text-3xl sm:text-4xl text-ink dark:text-dark-ink leading-tight">
            {primary.paragraphs[0]?.kind === 'heading'
              ? primary.paragraphs[0].text
              : meta.title}
          </h1>
          <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
            {t('reader.by')} {meta.author} · {t('reader.written', { date: meta.writtenAt })} ·{' '}
            {t('reader.estimatedTime', { minutes: meta.readingMinutes })}
          </p>
          {meta.themes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.themes.map((th) => (
                <span
                  key={th}
                  className="px-2 py-0.5 text-xs rounded-full bg-moss/10 text-moss"
                >
                  #{th}
                </span>
              ))}
            </div>
          )}
        </header>

        {mode === 'single' ? (
          <SingleColumn
            paragraphs={primary.paragraphs}
            lang={safeLang}
            highlightByPara={highlightByPara}
            noteByPara={noteByPara}
            onToggleHighlight={onToggleHighlight}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        ) : (
          <BilingualColumns
            primary={primary.paragraphs}
            primaryLang={safeLang}
            secondary={secondary?.paragraphs ?? []}
            secondaryLang={safeLang === 'zh-CN' ? 'en' : 'zh-CN'}
            highlightByPara={highlightByPara}
            noteByPara={noteByPara}
            onToggleHighlight={onToggleHighlight}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        )}

        <nav className="mt-20 pt-6 border-t border-ink/10 dark:border-dark-line flex justify-between text-sm">
          {prevArticle ? (
            <Link to={`/read/${prevArticle.id}`} className="link-quiet">
              ← {prevArticle.title}
            </Link>
          ) : <span />}
          {nextArticle ? (
            <Link to={`/read/${nextArticle.id}`} className="link-quiet">
              {nextArticle.title} →
            </Link>
          ) : <span />}
        </nav>

        <p className="mt-8 text-xs text-secondary dark:text-dark-secondary">
          {t('reader.by')} {meta.author} · {meta.volume ?? ''} ·{' '}
          {primary.source} · {primary.licenseNote}
        </p>
      </article>

      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </Swipeable>
  );
}

function SingleColumn({
  paragraphs,
  lang,
  highlightByPara,
  noteByPara,
  onToggleHighlight,
  onSaveNote,
  onDeleteNote,
}: {
  paragraphs: Paragraph[];
  lang: LangCode;
  highlightByPara: Map<string, Highlight>;
  noteByPara: Map<string, Note>;
  onToggleHighlight: (p: Paragraph) => void;
  onSaveNote: (p: Paragraph, text: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  return (
    <div>
      {paragraphs
        .filter((p) => p.id.split('-').slice(-1)[0] !== '001' || p.kind !== 'heading') // skip the duplicate title heading
        .map((p) => (
          <ParagraphView
            key={p.id}
            p={p}
            lang={lang}
            isHighlighted={highlightByPara.has(p.id)}
            note={noteByPara.get(p.id)}
            onToggleHighlight={() => onToggleHighlight(p)}
            onSaveNote={(text) => onSaveNote(p, text)}
            onDeleteNote={onDeleteNote}
          />
        ))}
    </div>
  );
}

function BilingualColumns({
  primary,
  primaryLang,
  secondary,
  secondaryLang,
  highlightByPara,
  noteByPara,
  onToggleHighlight,
  onSaveNote,
  onDeleteNote,
}: {
  primary: Paragraph[];
  primaryLang: LangCode;
  secondary: Paragraph[];
  secondaryLang: LangCode;
  highlightByPara: Map<string, Highlight>;
  noteByPara: Map<string, Note>;
  onToggleHighlight: (p: Paragraph) => void;
  onSaveNote: (p: Paragraph, text: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  // Align by id; missing ids in secondary are shown as muted placeholder
  return (
    <div className="space-y-2">
      {primary
        .filter((p) => !(p.kind === 'heading' && p.id.endsWith('001')))
        .map((p) => {
          const twin = secondary.find((q) => q.id === p.id);
          return (
            <div
              key={p.id}
              data-para-id={p.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 py-3 border-b border-ink/5 dark:border-dark-line/60"
            >
              <div>
                <ParagraphView
                  p={p}
                  lang={primaryLang}
                  compact
                  isHighlighted={highlightByPara.has(p.id)}
                  note={noteByPara.get(p.id)}
                  onToggleHighlight={() => onToggleHighlight(p)}
                  onSaveNote={(text) => onSaveNote(p, text)}
                  onDeleteNote={onDeleteNote}
                />
              </div>
              <div>
                {twin ? (
                  <ParagraphView
                    p={twin}
                    lang={secondaryLang}
                    compact
                    isHighlighted={highlightByPara.has(p.id)}
                    note={noteByPara.get(p.id)}
                    onToggleHighlight={() => onToggleHighlight(p)}
                    onSaveNote={(text) => onSaveNote(p, text)}
                    onDeleteNote={onDeleteNote}
                  />
                ) : (
                  <p className="text-sm italic text-secondary dark:text-dark-secondary">
                    ({secondaryLang === 'zh-CN' ? '暂无中文译文' : 'No translation yet'})
                  </p>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function computeFirstVisibleParagraphIndex(container: HTMLElement): number {
  const items = container.querySelectorAll<HTMLElement>('[data-para-id]');
  if (items.length === 0) return 0;
  const ctop = container.getBoundingClientRect().top;
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    if (r.top >= ctop + 8) return i;
  }
  return items.length - 1;
}

/**
 * Wraps children with a horizontal swipe detector. Vertical scroll is
 * untouched; only left/right swipes trigger navigation.
 */
function Swipeable({
  children,
  onSwipe,
}: {
  children: React.ReactNode;
  onSwipe: (dx: number) => void;
}) {
  const startX = useRef<number | null>(null);
  return (
    <div
      onTouchStart={(e) => {
        startX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const end = e.changedTouches[0]?.clientX ?? 0;
        onSwipe(end - startX.current);
        startX.current = null;
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
