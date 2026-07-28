import type { Paragraph, LangCode } from '@/types';

/**
 * Simple paragraph renderer — no popover, no notes, no highlight.
 * Just typography. Used by the simplified Reader.
 */
export function ParagraphView({
  p,
  lang,
}: {
  p: Paragraph;
  lang: LangCode;
}) {
  if (p.kind === 'heading') {
    return (
      <h2
        data-para-id={p.id}
        className="font-serif-cn font-medium text-ink dark:text-dark-ink
                   text-xl mt-10 mb-3"
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
          ? 'para-zh text-body-lg my-4 leading-loose'
          : 'para-en text-body-lg my-4 leading-relaxed'
      }
    >
      {p.text}
    </p>
  );
}
