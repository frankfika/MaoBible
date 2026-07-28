import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';

/**
 * Feed page — TikTok-style vertical scroll of article cards.
 * Each card: title, year, themes, 1-line modern interpretation.
 * Tap card → /read/:id.
 */
export function Feed() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
      <FeedHero />
      <div className="mt-8 space-y-6">
        {ARTICLES.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
          >
            <Link
              to={`/read/${a.id}`}
              className="block group rounded-card-lg border border-ink/8 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 p-5 sm:p-6
                         hover:border-cinnabar/40 hover:shadow-sm
                         transition-all duration-220"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif-cn text-xl sm:text-2xl font-medium text-ink dark:text-dark-ink">
                  {a.title}
                </h2>
                <span className="text-xs text-secondary dark:text-dark-secondary whitespace-nowrap">
                  {a.writtenAt}
                </span>
              </div>

              {a.interpretation && (
                <p className="mt-4 text-base sm:text-lg text-ink/85 dark:text-dark-ink/85 font-serif-cn leading-relaxed">
                  <span className="text-cinnabar mr-1">「</span>
                  {a.interpretation}
                  <span className="text-cinnabar ml-1">」</span>
                </p>
              )}

              {a.themes.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {a.themes.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[11px] rounded-full
                                 bg-moss/10 text-moss dark:bg-moss/20 dark:text-moss/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-secondary dark:text-dark-secondary">
                <span>~{a.readingMinutes} min</span>
                <span className="text-cinnabar opacity-0 group-hover:opacity-100 transition-opacity">
                  打开 →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeedHero() {
  return (
    <div className="pt-2">
      <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink">
        一篇一篇读，慢慢来。
      </h1>
      <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
        共 {ARTICLES.length} 篇 · 人民出版社 1991 官方文本 · 中英双语
      </p>
    </div>
  );
}
