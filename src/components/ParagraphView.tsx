import { useState } from 'react';
import type { Paragraph, LangCode } from '@/types';

/**
 * Renders a single paragraph with its kind-specific typography.
 * Paragraph actions (highlight, note) are surfaced on tap for mobile,
 * on hover for desktop. Phase 1 keeps a small but functional interaction.
 */
export function ParagraphView({
  p,
  lang,
  compact = false,
}: {
  p: Paragraph;
  lang: LangCode;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (p.kind === 'heading') {
    return (
      <h2
        data-para-id={p.id}
        className={[
          'font-serif-cn font-medium text-ink dark:text-dark-ink',
          compact ? 'text-lg mt-4 mb-1' : 'text-2xl mt-12 mb-4',
        ].join(' ')}
      >
        {p.text}
      </h2>
    );
  }

  return (
    <div data-para-id={p.id} className="group relative">
      <p
        onClick={() => setOpen((o) => !o)}
        className={[
          lang === 'zh-CN' ? 'para-zh' : 'para-en',
          compact
            ? 'text-base my-1 leading-relaxed'
            : 'text-body-lg my-5',
        ].join(' ')}
      >
        {p.text}
      </p>
      {open && !compact && (
        <div className="absolute right-0 top-0 flex gap-1 text-xs">
          <button className="px-2 py-1 rounded bg-moss/10 text-moss hover:bg-moss/20 transition-colors duration-180">
            划线
          </button>
          <button className="px-2 py-1 rounded bg-moss/10 text-moss hover:bg-moss/20 transition-colors duration-180">
            笔记
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-2 py-1 rounded bg-ink/5 text-secondary hover:bg-ink/10 transition-colors duration-180"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
