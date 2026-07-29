import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import { analyzeSituation, type SituationAnalysis } from '@/services/ai';
import type { ArticleMetadata } from '@/types';

/**
 * Discover — 心情 / 现状 → AI 找毛选 + 章节.
 *
 * 微信读书式大输入框, 用户写下当前心情和处境, AI:
 *   1. 识别处境 (1-2 句)
 *   2. 推荐 1-3 篇毛选文章
 *   3. 对每篇给具体"看哪一章" (用 manifest themes 当章节标签)
 */
export function Discover() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SituationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyzeSituation(text);
      setResult(r);
    } catch (e) {
      setError(
        'AI 后端不可用, 心情分析需要在本机 dev 模式 (pnpm dev) 或部署带 LLM 后端的版本里才能用。当前 mcode.cn 部署版没有 AI 后端, 所以这一条不会真的去调 LLM。',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          你现在怎样?
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          写下你此刻的心情、状态、卡在哪。AI 帮你找毛选里最贴的几篇 + 章节。
        </p>
      </header>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void onSubmit();
            }
          }}
          placeholder="比如: 我最近项目被砍了, 团队散了, 感觉很失落, 不知道接下来该怎么办…"
          rows={5}
          className="w-full px-4 py-3 text-[15px] sm:text-base rounded-card-lg
                     border border-ink/15 dark:border-dark-line
                     bg-white/60 dark:bg-dark-ink/10
                     focus:outline-none focus:border-cinnabar/60
                     transition-colors duration-180 resize-none
                     placeholder:text-secondary/70"
          autoFocus
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary">
            ⌘/Ctrl + Enter 提交
          </span>
          <button
            onClick={() => void onSubmit()}
            disabled={!text.trim() || loading}
            className="min-h-[40px] px-5 rounded-card
                       bg-cinnabar text-paper text-sm font-medium
                       hover:bg-cinnabar/90 active:scale-95
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '思考中…' : '帮我找 →'}
          </button>
        </div>
      </div>

      {!result && !loading && <Examples onPick={setText} />}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col items-center justify-center py-12 text-secondary dark:text-dark-secondary"
          >
            <div className="w-6 h-6 border-2 border-cinnabar border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm">AI 正在看你的处境…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-card-lg border border-secondary/30 bg-secondary/5 p-4"
          >
            <p className="text-[11px] text-secondary mb-1 tracking-wider">⚠ AI 后端不可用</p>
            <p className="text-[13px] sm:text-sm text-ink/85 dark:text-dark-ink/85 leading-relaxed">
              {error}
            </p>
            <p className="mt-2 text-[12px] text-secondary dark:text-dark-secondary">
              在本机跑 <code className="px-1 py-0.5 rounded bg-ink/5 dark:bg-dark-ink/10 text-cinnabar">pnpm dev</code> 就能用 AI 心情分析。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            {/* 处境分析 */}
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4">
              <p className="text-[11px] text-cinnabar/80 mb-1 tracking-wider">🤖 处境识别</p>
              <p className="text-[15px] sm:text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* 推荐文章 */}
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
                毛选里这几篇可能有用 ({result.articles.length})
              </p>
              <ul className="space-y-3">
                {result.articles.map((rec, i) => {
                  const article = ARTICLES.find((a) => a.id === rec.id);
                  if (!article) return null;
                  return (
                    <motion.li
                      key={rec.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                    >
                      <RecommendationCard article={article} why={rec.why} sections={rec.sections} />
                    </motion.li>
                  );
                })}
              </ul>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setText('');
                }}
                className="text-[12px] sm:text-sm text-secondary dark:text-dark-secondary hover:text-cinnabar transition-colors min-h-[44px] px-4"
              >
                ↻ 重新说一次
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecommendationCard({
  article,
  why,
  sections,
}: {
  article: ArticleMetadata;
  why: string;
  sections: string[];
}) {
  return (
    <Link
      to={`/read/${article.id}`}
      className="block rounded-card-lg border border-ink/8 dark:border-dark-line
                 bg-white/60 dark:bg-dark-ink/5 p-4
                 hover:border-cinnabar/40 active:scale-[0.99] transition-all"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif-cn text-base sm:text-lg font-medium text-ink dark:text-dark-ink">
          {article.title}
        </h3>
        <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary tabular-nums shrink-0">
          {article.writtenAt}
        </span>
      </div>
      {why && (
        <p className="mt-1.5 text-[13px] sm:text-sm text-ink/85 dark:text-dark-ink/85 leading-relaxed">
          {why}
        </p>
      )}
      {sections.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="text-[10px] sm:text-[11px] text-secondary dark:text-dark-secondary mr-1 self-center">
            看这里:
          </span>
          {sections.map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded
                         bg-cinnabar/10 text-cinnabar/85 dark:text-cinnabar/80"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Examples({ onPick }: { onPick: (q: string) => void }) {
  const examples = [
    '我最近项目被砍了, 团队散了, 感觉很失落',
    '我管理一个团队, 大家执行不到位, 怎么办',
    '我学的理论用不到实际, 怀疑自己',
    '我做的事现在没人看好, 还要不要坚持',
    '我和 partner 冲突很大, 关系快崩了',
    '我刚赢了, 但反而空虚',
    '我快撑不下去了, 累',
    '我看不清全局, 不知道哪个才是重要的',
  ];
  return (
    <div className="mt-6">
      <p className="text-[11px] sm:text-xs text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
        或者试试:
      </p>
      <div className="space-y-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="block w-full text-left min-h-[40px] px-3 py-2 text-[13px] sm:text-sm rounded-card
                       border border-ink/10 dark:border-dark-line
                       bg-white/50 dark:bg-dark-ink/5
                       hover:border-cinnabar/40 hover:text-cinnabar
                       active:scale-[0.99] transition-all duration-180"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
