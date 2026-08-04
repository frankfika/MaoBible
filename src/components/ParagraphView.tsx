import type { Paragraph, LangCode } from '@/types';

/**
 * Simple paragraph renderer — typography + optional tap handler.
 * Tap → AI 解释 dialog (only for Chinese paragraphs, since the LLM
 * is currently trained on Chinese interpretation).
 *
 * Always renders the same element type for a given `kind`, even when
 * `onTap` is undefined — previously fell back from <button> to <p>, which
 * caused focus loss and re-mounts when the user toggled content language.
 */
export function ParagraphView({
  p,
  lang,
  onTap,
}: {
  p: Paragraph;
  lang: LangCode;
  onTap?: () => void;
}) {
  if (p.kind === 'heading') {
    return (
      <h2
        data-para-id={p.id}
        className="font-serif-cn font-medium text-ink dark:text-dark-ink
                   text-lg sm:text-xl mt-8 sm:mt-10 mb-2 sm:mb-3 scroll-mt-20"
      >
        {p.text}
      </h2>
    );
  }

  const textClass =
    lang === 'zh-CN'
      ? 'para-zh text-[16px] sm:text-[17px] my-3.5 sm:my-5 leading-[1.9] sm:leading-[2]'
      : 'para-en text-[15px] sm:text-base my-3.5 sm:my-5 leading-[1.75] sm:leading-[1.85]';

  if (!onTap) {
    // Plain non-interactive paragraph (English mode, or bilingual
    // secondary column). Renders as <p> with the same data-para-id
    // attribute so scroll/highlight logic keeps working.
    return (
      <p
        data-para-id={p.id}
        className={textClass}
      >
        {p.text}
      </p>
    );
  }

  return (
    <button
      type="button"
      data-para-id={p.id}
      onClick={onTap}
      className={[
        textClass,
        'group relative block w-full text-left',
        'rounded-lg border border-dashed border-cinnabar/40 dark:border-cinnabar/35',
        'px-3 -mx-1 py-1 my-2 sm:my-3',
        'bg-cinnabar/[0.02] hover:bg-cinnabar/[0.07] active:bg-cinnabar/[0.10]',
        'transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cinnabar/60',
      ].join(' ')}
      aria-label={`解读段落：${p.text.slice(0, 24)}`}
    >
      {p.text}
      <span
        className="absolute -top-2 right-2 inline-flex items-center gap-0.5
                   px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]
                   bg-cinnabar text-paper
                   opacity-80 group-hover:opacity-100 transition-opacity
                   pointer-events-none"
        aria-hidden
      >
        💡 AI
      </span>
    </button>
  );
}
