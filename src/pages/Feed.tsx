import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import type { ArticleMetadata } from '@/types';

type ThemeGroup = {
  name: string;
  color: string; // tailwind text color
  bar: string;   // background color for left bar
  articles: ArticleMetadata[];
};

const THEME_GROUPS: { name: string; match: string[]; color: string; bar: string }[] = [
  { name: '认识论 / 方法论', match: ['实践', '认识论', '辩证法', '矛盾', '实事求是', '分析'], color: 'text-ink', bar: 'bg-ink' },
  { name: '调查 / 群众', match: ['调查', '群众', '组织', '工作方法', '领导力', '社会', '阶级'], color: 'text-moss', bar: 'bg-moss' },
  { name: '革命战略 / 军事', match: ['战略', '战术', '持久战', '抗日', '战争', '游击'], color: 'text-cinnabar', bar: 'bg-cinnabar' },
  { name: '党建 / 文风', match: ['党建', '文风', '学习', '教条', '经验', '党八股'], color: 'text-cinnabar/80', bar: 'bg-cinnabar/70' },
  { name: '形势 / 民主', match: ['民主', '形势', '统一战线', '革命', '人民', '建国'], color: 'text-moss/80', bar: 'bg-moss/70' },
];

function groupArticles(articles: ArticleMetadata[]): ThemeGroup[] {
  const used = new Set<string>();
  const groups: ThemeGroup[] = [];
  for (const g of THEME_GROUPS) {
    const matched = articles.filter((a) => {
      if (used.has(a.id)) return false;
      return a.themes.some((t) => g.match.includes(t));
    });
    matched.forEach((a) => used.add(a.id));
    if (matched.length > 0) {
      groups.push({ ...g, articles: matched });
    }
  }
  // Remaining (e.g. 纪念白求恩) goes in "其他"
  const remaining = articles.filter((a) => !used.has(a.id));
  if (remaining.length > 0) {
    groups.push({ name: '其他', color: 'text-secondary', bar: 'bg-ink/40', articles: remaining });
  }
  return groups;
}

/**
 * Feed — vertical scroll of articles, grouped by theme, with interpretation visible.
 * Mobile-first: tight rhythm, small color bar, one-line interpretation per card.
 */
export function Feed() {
  const groups = useMemo(() => groupArticles(ARTICLES), []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
      <header className="pb-3 sm:pb-6">
        <h1 className="font-serif-cn text-2xl sm:text-4xl font-medium text-ink dark:text-dark-ink leading-tight">
          毛选
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          {ARTICLES.length} 篇 · 人民出版社 1991 官方版本 · 中英双语
        </p>
      </header>

      <div className="space-y-6 sm:space-y-8">
        {groups.map((g, gi) => (
          <section key={g.name}>
            <h2 className={`text-xs sm:text-sm font-medium ${g.color} mb-2.5 sm:mb-3 tracking-wider`}>
              {g.name}
            </h2>
            <ul className="space-y-2.5 sm:space-y-3">
              {g.articles.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min((gi * 0.05) + i * 0.02, 0.4) }}
                >
                  <Link
                    to={`/read/${a.id}`}
                    className="relative flex gap-3 rounded-card-lg border border-ink/8 dark:border-dark-line
                               bg-white/60 dark:bg-dark-ink/5 p-3.5 sm:p-4
                               hover:border-cinnabar/40 hover:shadow-sm
                               active:scale-[0.99] transition-all duration-220 min-h-[60px]"
                  >
                    <span
                      className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${g.bar}`}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-serif-cn text-[15px] sm:text-lg font-medium text-ink dark:text-dark-ink leading-snug">
                          {a.title}
                        </h3>
                        <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary whitespace-nowrap tabular-nums shrink-0">
                          {a.writtenAt}
                        </span>
                      </div>
                      {a.interpretation && (
                        <p className="mt-1 text-[12px] sm:text-[13px] text-cinnabar/85 dark:text-cinnabar/80 leading-relaxed line-clamp-2">
                          {a.interpretation}
                        </p>
                      )}
                      {a.themes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {a.themes.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded-full
                                         bg-ink/5 text-secondary dark:bg-dark-ink/20"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 sm:mt-12 pt-6 text-center text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
        原文来自公开的人民出版社 1991 年版《毛泽东选集》
      </footer>
    </div>
  );
}
