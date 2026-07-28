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
  /** Stable ID shared across all language versions of the same paragraph. */
  id: string;
  kind: ParagraphKind;
  text: string;
}

export interface Translation {
  language: LangCode;
  translator?: string;
  source?: string; // e.g. "Selected Works of Mao Tse-tung, Vol. 1, FLP 1954"
  licenseNote?: string; // e.g. "Public domain (pre-1955 publication)"
  updatedAt: string; // ISO date
  status: 'draft' | 'reviewed' | 'published';
  paragraphs: Paragraph[];
}

export interface ArticleMetadata {
  /** Stable id used in URLs */
  id: string;
  /** Title in the original language */
  title: string;
  /** Optional short subtitle (e.g. "1937") */
  subtitle?: string;
  /** Author display, e.g. "Mao Zedong" */
  author: string;
  /** Date originally written, ISO date or YYYY-MM */
  writtenAt: string;
  /** Reading time in minutes */
  readingMinutes: number;
  /** Volume or collection */
  volume?: string;
  /** Tags / themes (abstract concepts) */
  themes: string[];
  /** One-sentence description shown on cards */
  summary?: string;
  /** One-sentence modern interpretation ("what this means today") */
  interpretation?: string;
  /** Concrete user situations this article relates to (for "ask by situation" search) */
  situations?: string[];
}

export interface Article {
  metadata: ArticleMetadata;
  /** Translations keyed by language code */
  translations: {
    [K in LangCode]?: Translation;
  };
}

/**
 * User-side data: bookmark + reading progress.
 * Stored in IndexedDB via idb-keyval.
 */
export interface Bookmark {
  articleId: string;
  paragraphId: string;
  createdAt: string;
}

export interface ReadingProgress {
  articleId: string;
  /** Last scroll percentage 0..1 */
  scrollFraction: number;
  updatedAt: string;
}
