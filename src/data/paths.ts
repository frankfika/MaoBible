/**
 * Phase 2 curated reading paths. Each path is an ordered sequence of article
 * IDs. Article IDs not yet in /public/content/ are tolerated — the Explore
 * page renders a "Coming soon" placeholder for them so this list is safe to
 * extend ahead of the content pipeline.
 *
 * IDs are stable: they live in the public/content manifest and the article
 * JSON files. The bilingual reader's `useArticle` hook will fail to fetch an
 * unknown ID, so the page checks `ARTICLES` for membership before linking.
 */
import type { LangCode } from '@/types';

export interface PathArticle {
  id: string;
  /** Optional short Chinese label shown in the card list. */
  label?: string;
}

export interface ReadingPath {
  id: string;
  title: { 'zh-CN': string; en: string };
  description: { 'zh-CN': string; en: string };
  /** Unicode glyph used in the path card. */
  glyph: string;
  articles: PathArticle[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: 'practice-and-knowledge',
    title: {
      'zh-CN': '实践与认识',
      en: 'Practice and Knowledge',
    },
    description: {
      'zh-CN': '从《实践论》到《矛盾论》,沿认识论的两条主线进入辩证法。',
      en: 'From On Practice to On Contradiction — the two pillars of Maoist epistemology.',
    },
    glyph: '✦',
    articles: [
      { id: 'on-practice-1937' },
      { id: 'on-contradiction-1937' },
    ],
  },
  {
    id: 'investigation-and-masses',
    title: {
      'zh-CN': '调查与群众',
      en: 'Investigation and the Masses',
    },
    description: {
      'zh-CN': '从湖南农运考察到《星星之火》,看"群众路线"的形成。',
      en: 'From the Hunan peasant investigation to “A Single Spark” — how the mass line took shape.',
    },
    glyph: '✺',
    articles: [
      { id: 'hunan-peasant-movement-1927' },
      // The spec called this "analysis-1925"; the manifest uses
      // "classes-analysis-1925" (《中国社会各阶级的分析》, 1925-12-01).
      // Substituted so the path has a real, available lead article.
      { id: 'classes-analysis-1925' },
      { id: 'spark-1930' },
    ],
  },
  {
    id: 'strategy-and-united-front',
    title: {
      'zh-CN': '战略与统一战线',
      en: 'Strategy and the United Front',
    },
    description: {
      'zh-CN': '从《论反对日本帝国主义的策略》到《论持久战》再到《新民主主义论》,理解中国革命的整体战略。',
      en: 'From On Strategy Against Japanese Imperialism to On Protracted War and On New Democracy — strategy in the Chinese revolution.',
    },
    glyph: '✪',
    articles: [
      // The original spec called this "long-march-1935"; the article that
      // actually exists in the manifest is "anti-japan-strategy-1935" (论反对
      // 日本帝国主义的策略, 1935-12-27), which is the post–Long March piece
      // that introduces the united-front argument. Substituted so the path
      // has a real, available lead article.
      { id: 'anti-japan-strategy-1935' },
      { id: 'protracted-war-1938' },
      { id: 'new-democracy-1940' },
    ],
  },
];

export function getPath(id: string): ReadingPath | undefined {
  return READING_PATHS.find((p) => p.id === id);
}

/** Render the title in the given language, falling back to zh-CN. */
export function pathTitle(path: ReadingPath, lang: LangCode): string {
  return path.title[lang] ?? path.title['zh-CN'];
}

export function pathDescription(path: ReadingPath, lang: LangCode): string {
  return path.description[lang] ?? path.description['zh-CN'];
}
