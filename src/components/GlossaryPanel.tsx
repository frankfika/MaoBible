import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GLOSSARY, searchGlossary } from '@/data/glossary';

/**
 * Vocabulary glossary panel.
 *
 * Phase 2 simple approach: term + English gloss + Chinese definition, with
 * a search input. On mobile it slides up from the bottom (bottom sheet);
 * on `md:` and up it pins to the right edge as a side panel.
 *
 * The spec mentions "tapping a term highlights any paragraph that contains
 * it" — that requires walking the article's paragraphs and scrolling to
 * matches, which is a larger Phase 3 change. For now we just list terms.
 * TODO(phase3): scroll-to + paragraph-highlight when a term is tapped.
 */
export function GlossaryPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    if (!query.trim()) return GLOSSARY;
    return searchGlossary(query).map((m) => m.entry);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — click to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/30 dark:bg-black/50"
            aria-hidden="true"
          />
          {/* Panel — bottom sheet on mobile, side panel on md+ */}
          <motion.aside
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'tween', duration: 0.24, ease: 'easeOut' }}
            // Mobile: bottom sheet covering ~75% height. Desktop: right-side
            // panel ~360px wide.
            className="fixed z-50 left-0 right-0 bottom-0 max-h-[80vh]
                       md:left-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none
                       md:w-[380px] md:h-dvh
                       bg-paper dark:bg-dark-paper border-t md:border-t-0 md:border-l
                       border-ink/10 dark:border-dark-line
                       flex flex-col"
            role="dialog"
            aria-label={t('glossary.title')}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-ink/10 dark:border-dark-line">
              <div>
                <h2 className="font-serif-cn text-lg text-ink dark:text-dark-ink">
                  {t('glossary.title')}
                </h2>
                <p className="text-xs text-secondary dark:text-dark-secondary mt-0.5">
                  {t('glossary.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close glossary"
                className="w-8 h-8 rounded-full text-ink/70 dark:text-dark-ink/70
                           hover:bg-ink/5 dark:hover:bg-dark-ink/10
                           transition-colors duration-180"
              >
                ×
              </button>
            </header>

            <div className="px-4 py-3 border-b border-ink/5 dark:border-dark-line/60">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('glossary.searchPlaceholder')}
                className="w-full px-3 py-2 rounded-card border border-ink/10
                           dark:border-dark-line bg-white/40 dark:bg-dark-ink/5
                           focus:border-moss/50 outline-none text-sm
                           transition-colors duration-180"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {entries.length === 0 ? (
                <p className="text-sm text-secondary dark:text-dark-secondary">
                  {t('glossary.empty')}
                </p>
              ) : (
                entries.map((e) => (
                  <article
                    key={e.term}
                    className="rounded-card border border-ink/10 dark:border-dark-line
                               bg-white/40 dark:bg-dark-ink/5 p-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif-cn text-base text-ink dark:text-dark-ink">
                        {e.term}
                      </h3>
                      <span className="text-xs italic text-secondary dark:text-dark-secondary">
                        {e.en}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/80 dark:text-dark-ink/80">
                      {e.definition}
                    </p>
                  </article>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
