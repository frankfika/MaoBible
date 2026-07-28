/**
 * Domain types for MaoBible content.
 *
 * Article shape:
 *   Article
 *   ├── metadata (id, title, year, themes, summary, interpretation, situations)
 *   ├── zh-CN (paragraphs with stable ids)
 *   └── en     (paragraphs with stable ids)
 *
 * Each translation is an array of Paragraphs with a stable id so that
 * bilingual mode can align across languages without re-segmenting.
 */

export type LangCode = 'zh-CN' | 'en';

export type ParagraphKind = 'body' | 'heading' | 'note' | 'quote';

export interface Paragraph {
  id: string;
  kind: ParagraphKind;
  text: string;
}

export interface Translation {
  language: LangCode;
  translator?: string;
  source?: string;
  licenseNote?: string;
  updatedAt: string;
  status: 'draft' | 'reviewed' | 'published';
  paragraphs: Paragraph[];
}

export interface ArticleMetadata {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  writtenAt: string;
  readingMinutes: number;
  volume?: string;
  themes: string[];
  summary?: string;
  /** One-sentence modern interpretation ("what this means today") — shown only when user taps 解读. */
  interpretation?: string;
  /** Concrete user situations this article relates to (for Ask page search). */
  situations?: string[];
}

export interface Article {
  metadata: ArticleMetadata;
  translations: {
    [K in LangCode]?: Translation;
  };
}

/** User-side data: bookmarks + reading progress. Stored in IndexedDB. */
export interface Bookmark {
  articleId: string;
  paragraphId: string;
  createdAt: string;
}

export interface ReadingProgress {
  articleId: string;
  scrollFraction: number;
  updatedAt: string;
}
