import type { Paragraph, LangCode } from '@/types';

/**
 * Simple paragraph renderer — just typography. No popover, no notes.
 */
export function ParagraphView({ p, lang }: { p: Paragraph; lang: LangCode }) {
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
  return (
    <p
      data-para-id={p.id}
      className={
        lang === 'zh-CN'
          ? 'para-zh text-[15px] sm:text-base my-3 sm:my-4 leading-7 sm:leading-8'
          : 'para-en text-sm sm:text-base my-3 sm:my-4 leading-6 sm:leading-7'
      }
    >
      {p.text}
    </p>
  );
}
