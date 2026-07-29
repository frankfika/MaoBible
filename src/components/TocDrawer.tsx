import { motion, AnimatePresence } from 'framer-motion';
import type { Article, LangCode } from '@/types';

/**
 * TocDrawer — slide-up sheet listing all paragraphs of the article.
 * Tap a row to jump to that paragraph (handled by parent's onJump).
 *
 * Headings (kind: 'heading') get visual distinction; bodies are just text.
 */
export function TocDrawer({
  open,
  onClose,
  article,
  contentLang,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  article: Article;
  contentLang: LangCode;
  onJump: (paragraphId: string) => void;
}) {
  const t = article.translations[contentLang];
  if (!t) return null;

  // Group consecutive headings together as a section
  const sections: { heading?: string; items: { id: string; text: string; kind: string }[] }[] = [];
  let cur: typeof sections[number] = { items: [] };
  for (const p of t.paragraphs) {
    if (p.kind === 'heading') {
      if (cur.items.length > 0 || cur.heading) sections.push(cur);
      cur = { heading: p.text, items: [] };
    } else {
      cur.items.push({ id: p.id, text: p.text.slice(0, 60), kind: p.kind });
    }
  }
  if (cur.items.length > 0 || cur.heading) sections.push(cur);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-ink/30 dark:bg-dark-ink/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh]
                       bg-paper dark:bg-dark-paper
                       rounded-t-2xl border-t border-ink/8 dark:border-dark-line
                       overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink/8 dark:border-dark-line shrink-0">
              <h3 className="font-serif-cn text-base text-ink dark:text-dark-ink">
                目录 · {t.paragraphs.length} 段
              </h3>
              <button
                onClick={onClose}
                className="text-secondary hover:text-ink dark:hover:text-dark-ink min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {sections.map((s, si) => (
                <div key={si} className="mb-3">
                  {s.heading && (
                    <p className="px-3 py-1.5 text-[12px] font-medium text-cinnabar/85 dark:text-cinnabar/80 uppercase tracking-wider">
                      {s.heading}
                    </p>
                  )}
                  {s.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onJump(item.id);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-card
                                 text-[13px] text-ink dark:text-dark-ink
                                 hover:bg-ink/5 dark:hover:bg-dark-ink/10
                                 active:scale-[0.99] transition-all line-clamp-1"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
