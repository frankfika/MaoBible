/**
 * Domain types for MaoBible content.
 * Shape follows docs/product-plan.md §5 "内容数据结构":
 *
 *   Work
 *   └── Article
 *       ├── metadata
 *       ├── zh-CN
 *       │   └── paragraph-001...
 *       ├── en
 *       │   └── paragraph-001...
 *       └── annotations
 *
 * Each translation is an array of Paragraphs with a stable id so that
 * "段落对照" (paragraph-level bilingual mode) can align across languages
 * without re-segmenting.
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
  /** Title in the original language, used as the canonical title */
  title: string;
  /** Optional short subtitle (e.g. "1937") */
  subtitle?: string;
  /** Author display, e.g. "Mao Zedong" */
  author: string;
  /** Date originally written, ISO date or YYYY-MM */
  writtenAt: string;
  /** Reading time in minutes (computed) */
  readingMinutes: number;
  /** Volume or collection */
  volume?: string;
  /** Tags / themes */
  themes: string[];
  /** Optional short summary shown on cards */
  summary?: string;
  /** Optional reflection prompt shown on the Today page */
  reflectionPrompt?: string;
}

export interface Article {
  metadata: ArticleMetadata;
  /** Translations keyed by language code */
  translations: {
    [K in LangCode]?: Translation;
  };
}

/**
 * User-side data model: bookmarks, highlights, notes, reading progress.
 * Stored in IndexedDB via idb-keyval.
 */
export interface Bookmark {
  articleId: string;
  paragraphId: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  articleId: string;
  paragraphId: string;
  /** Trimmed slice of paragraph text */
  text: string;
  createdAt: string;
}

export interface Note {
  id: string;
  articleId: string;
  paragraphId: string;
  text: string;
  updatedAt: string;
}

export interface ReadingProgress {
  articleId: string;
  /** Index of last paragraph read (0-based) */
  lastParagraphIndex: number;
  /** Last scroll percentage 0..1 */
  scrollFraction: number;
  updatedAt: string;
}
