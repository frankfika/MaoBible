/**
 * Article manifest — small index bundled with the app.
 * Full article content lives in /public/content/{id}.json (fetched at runtime,
 * cached by the service worker for offline access).
 */
import type { ArticleMetadata } from '@/types';

export const ARTICLES: ArticleMetadata[] = [
  {
    id: 'hunan-peasant-movement-1927',
    title: '湖南农民运动考察报告',
    subtitle: '1927',
    author: '毛泽东',
    writtenAt: '1927-03',
    readingMinutes: 28,
    volume: '《毛泽东选集》第一卷',
    themes: ['调查', '群众', '组织', '革命'],
    summary:
      '针对党内对农民运动的责难而作的实地考察报告。毛泽东用三十二天走访湖南五县，提出"贫农是革命先锋"的判断，奠定农村调查的方法。',
    reflectionPrompt:
      '"没有调查就没有发言权"——你最近一次对一个陌生领域形成判断，是基于第一手材料，还是基于道听途说？',
  },
  {
    id: 'on-practice-1937',
    title: '实践论',
    subtitle: '论认识和实践的关系——知和行的关系',
    author: '毛泽东',
    writtenAt: '1937-07',
    readingMinutes: 22,
    volume: '《毛泽东选集》第一卷',
    themes: ['实践', '认识论', '辩证法', '学习'],
    summary:
      '为总结中国革命经验、肃清教条主义而写的哲学论文。系统论述实践—认识—再实践的循环，确立"通过实践检验真理"的认识路线。',
    reflectionPrompt:
      '你最近学到的某个"道理"，有没有回到现实里被检验过？它经得住哪些具体场景？',
  },
  {
    id: 'on-contradiction-1937',
    title: '矛盾论',
    subtitle: '唯物辩证法最根本的法则',
    author: '毛泽东',
    writtenAt: '1937-08',
    readingMinutes: 26,
    volume: '《毛泽东选集》第一卷',
    themes: ['矛盾', '辩证法', '分析', '方法'],
    summary:
      '与《实践论》姊妹篇。系统阐释对立统一规律，提出"矛盾普遍性"与"矛盾特殊性"的分析框架，强调具体问题具体分析。',
    reflectionPrompt:
      '在今天的某个具体决定里，主要矛盾和次要矛盾分别是什么？哪一边被你忽略了？',
  },
];

export function getArticleMeta(id: string): ArticleMetadata | undefined {
  return ARTICLES.find((a) => a.id === id);
}
