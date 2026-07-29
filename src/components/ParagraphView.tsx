import type { Paragraph, LangCode } from '@/types';

/**
 * Simple paragraph renderer — typography + optional tap handler.
 * Tap → AI 解释 dialog (only for Chinese paragraphs, since the LLM
 * is currently trained on Chinese interpretation).
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
  return (
    <p
      data-para-id={p.id}
      onClick={onTap}
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
