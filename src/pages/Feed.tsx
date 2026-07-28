import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';

/**
 * Feed — vertical scroll of articles. Mobile-friendly card layout.
 */
export function Feed() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <header className="pb-5 sm:pb-6">
        <h1 className="font-serif-cn text-3xl sm:text-4xl font-medium text-ink dark:text-dark-ink leading-tight">
          毛选
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          {ARTICLES.length} 篇 · 人民出版社 1991 官方版本 · 中英双语
        </p>
      </header>

      <ul className="space-y-2.5 sm:space-y-3">
        {ARTICLES.map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
          >
            <Link
              to={`/read/${a.id}`}
              className="block rounded-card-lg border border-ink/8 dark:border-dark-line
                         bg-white/60 dark:bg-dark-ink/5 p-4 sm:p-5
                         hover:border-cinnabar/40 hover:shadow-sm
                         active:scale-[0.99] transition-all duration-220"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif-cn text-base sm:text-xl font-medium text-ink dark:text-dark-ink leading-snug">
                  {a.title}
                </h2>
                <span className="text-[11px] sm:text-xs text-secondary dark:text-dark-secondary whitespace-nowrap tabular-nums shrink-0">
                  {a.writtenAt}
                </span>
              </div>
              {a.summary && (
                <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-sm text-secondary dark:text-dark-secondary leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {a.summary}
                </p>
              )}
              {a.themes.length > 0 && (
                <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5">
                  {a.themes.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] sm:text-[11px] rounded-full
                                 bg-moss/10 text-moss dark:bg-moss/20 dark:text-moss/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </motion.li>
        ))}
      </ul>

      <footer className="mt-10 sm:mt-12 pt-6 text-center text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
        原文来自公开的人民出版社 1991 年版《毛泽东选集》
      </footer>
    </div>
  );
}
