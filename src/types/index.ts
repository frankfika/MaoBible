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
  /** One-sentence modern interpretation ("what this means today") */
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

/* ------------------------------------------------------------------ *
 * User-side data: bookmarks + reading progress + history.            *
 * Stored in IndexedDB via idb-keyval.                                 *
 * ------------------------------------------------------------------ */

export interface Bookmark {
  articleId: string;
  paragraphId: string;
  createdAt: string;
}

export interface ReadingProgress {
  articleId: string;
  scrollFraction: number;
  updatedAt: string;
  /** Last paragraph id the user has reached (for resume). */
  lastParagraphId?: string;
  /** Cumulative time on this article (ms). */
  totalDurationMs?: number;
}

export interface ReadingSession {
  articleId: string;
  startedAt: string;
  durationMs: number;
}

export interface DailyStats {
  date: string;          // YYYY-MM-DD
  articlesRead: number;  // distinct articles with any session this day
  durationMs: number;    // total reading time
  articleIds: string[];  // for de-dupe
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
