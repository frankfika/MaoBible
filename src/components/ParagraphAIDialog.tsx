import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Paragraph } from '@/types';
import type { AIResult } from '@/services/ai';

/**
 * ParagraphAIDialog — bottom sheet that explains a Chinese paragraph in
 * modern Chinese using the LLM. Called from ParagraphView.onTap.
 *
 * When the underlying call falls back to the offline hint, we surface it
 * as a real error (separate styling, explicit "AI 不可用" label) so the
 * user can tell a real answer from a fallback.
 */
export function ParagraphAIDialog({
  paragraph,
  onClose,
  explain,
}: {
  paragraph: Paragraph | null;
  onClose: () => void;
  explain: (text: string) => Promise<AIResult>;
}) {
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paragraph) {
      setResult(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    void explain(paragraph.text)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paragraph, explain]);

  useEffect(() => {
    if (!paragraph) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, paragraph]);

  return (
    <AnimatePresence>
      {paragraph && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-ink/30 dark:bg-dark-ink/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="段落解读"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[82dvh]
                       bg-paper dark:bg-dark-paper
                       rounded-t-2xl border-t border-ink/8 dark:border-dark-line
                       flex flex-col pb-[env(safe-area-inset-bottom)]"
          >
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-ink/15 dark:bg-dark-ink/20" aria-hidden />
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink/8 dark:border-dark-line shrink-0">
              <h3 className="text-sm font-medium text-ink dark:text-dark-ink flex items-center gap-1.5">
                <span>🤖</span> AI 解释
              </h3>
              <button
                onClick={onClose}
                className="text-secondary hover:text-ink dark:hover:text-dark-ink min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
              <div className="rounded-card border border-ink/10 dark:border-dark-line bg-ink/5 dark:bg-dark-ink/10 p-3">
                <p className="text-[11px] text-secondary dark:text-dark-secondary mb-1">
                  原文
                </p>
                <p className="text-[13px] sm:text-sm text-ink dark:text-dark-ink leading-relaxed">
                  {paragraph.text}
                </p>
              </div>
              <div
                className={[
                  'rounded-card border p-3',
                  result?.isFallback
                    ? 'border-secondary/30 bg-secondary/5 dark:bg-dark-ink/10'
                    : 'border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10',
                ].join(' ')}
              >
                <p
                  className={[
                    'text-[11px] mb-1.5 flex items-center gap-1.5',
                    result?.isFallback
                      ? 'text-secondary dark:text-dark-secondary'
                      : 'text-cinnabar/80',
                  ].join(' ')}
                >
                  {result?.isFallback ? '💡 本地简易提示' : '现代白话'}
                </p>
                {loading ? (
                  <div className="flex items-center gap-2 text-secondary dark:text-dark-secondary text-sm py-2">
                    <span className="inline-block w-3 h-3 border-2 border-cinnabar border-t-transparent rounded-full animate-spin" />
                    AI 思考中…
                  </div>
                ) : result?.isFallback ? (
                  <>
                    <p className="text-[14px] sm:text-[15px] text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                      {result.text}
                    </p>
                    {result.reason === 'no-config' && (
                      <Link
                        to="/me"
                        onClick={onClose}
                        className="mt-2.5 inline-flex min-h-[36px] items-center rounded-card bg-cinnabar px-3.5 text-[12px] text-paper hover:bg-cinnabar/90 active:scale-95 transition-all"
                      >
                        去「我」配置 AI →
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] sm:text-[15px] text-ink dark:text-dark-ink font-serif-cn leading-relaxed whitespace-pre-wrap">
                    {result?.text ?? ''}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
