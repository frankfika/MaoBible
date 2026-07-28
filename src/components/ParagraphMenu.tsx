import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Small floating popover that appears on a paragraph when the user taps it.
 * Offers three actions: highlight, note, close. Labels are the existing
 * Chinese strings used in Phase 1 ("划线", "笔记", "×") so we don't need
 * new i18n keys for the menu itself.
 *
 * Positioning: the popover is rendered inside a relatively positioned
 * container and pinned to the top-right corner. We close on outside click
 * and on Escape so it doesn't trap the user.
 */
export interface ParagraphMenuProps {
  open: boolean;
  highlighted: boolean;
  hasNote: boolean;
  onToggleHighlight: () => void;
  onOpenNote: () => void;
  onClose: () => void;
}

export function ParagraphMenu({
  open,
  highlighted,
  hasNote,
  onToggleHighlight,
  onOpenNote,
  onClose,
}: ParagraphMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          // Inline-flex so the menu sits in the top-right of the paragraph
          // container without affecting flow.
          className="absolute right-0 -top-2 z-20 inline-flex items-stretch
                     rounded-card overflow-hidden border border-ink/10
                     dark:border-dark-line bg-paper/95 dark:bg-dark-paper/95
                     shadow-sm backdrop-blur"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHighlight();
            }}
            aria-pressed={highlighted}
            className={[
              'px-2.5 py-1 text-xs transition-colors duration-180',
              highlighted
                ? 'bg-moss text-paper'
                : 'text-moss hover:bg-moss/10',
            ].join(' ')}
            title="划线"
          >
            划线
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote();
            }}
            className={[
              'px-2.5 py-1 text-xs transition-colors duration-180 border-l',
              'border-ink/10 dark:border-dark-line text-moss hover:bg-moss/10',
              hasNote ? 'bg-moss/10' : '',
            ].join(' ')}
            title="笔记"
          >
            笔记
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="关闭"
            className="px-2 py-1 text-xs text-secondary dark:text-dark-secondary
                       hover:bg-ink/5 dark:hover:bg-dark-ink/10 border-l
                       border-ink/10 dark:border-dark-line transition-colors duration-180"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
