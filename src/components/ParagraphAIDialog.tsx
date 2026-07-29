import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Paragraph } from '@/types';

/**
 * ParagraphAIDialog — bottom sheet that explains a Chinese paragraph in
 * modern Chinese using the LLM. Called from ParagraphView.onTap.
 */
export function ParagraphAIDialog({
  paragraph,
  onClose,
  explain,
}: {
  paragraph: Paragraph | null;
  onClose: () => void;
  explain: (text: string) => Promise<string>;
}) {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paragraph) {
      setResult('');
      return;
    }
    setLoading(true);
    void explain(paragraph.text)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [paragraph, explain]);

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
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh]
                       bg-paper dark:bg-dark-paper
                       rounded-t-2xl border-t border-ink/8 dark:border-dark-line
                       flex flex-col"
          >
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
                <p className="text-[13px] sm:text-sm text-ink dark:text-dark-ink leading-relaxed line-clamp-4">
                  {paragraph.text}
                </p>
              </div>
              <div className="rounded-card border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-3">
                <p className="text-[11px] text-cinnabar/80 mb-1">现代白话</p>
                {loading ? (
                  <div className="flex items-center gap-2 text-secondary dark:text-dark-secondary text-sm py-2">
                    <span className="inline-block w-3 h-3 border-2 border-cinnabar border-t-transparent rounded-full animate-spin" />
                    AI 思考中…
                  </div>
                ) : (
                  <p className="text-[14px] sm:text-[15px] text-ink dark:text-dark-ink font-serif-cn leading-relaxed whitespace-pre-wrap">
                    {result || '抱歉, AI 暂时不可用'}
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
