import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import {
  analyzeSituation,
  type SituationAnalysis,
} from '@/services/ai';

/**
 * Discover — 写现状 → 毛选直接回应你.
 *
 * 不只是"找几篇文章", 而是:
 *   1) LLM 推荐 1-3 篇相关文章
 *   2) 再在每篇里挑 1-3 段直接对应用户处境的段落
 *   3) 展示原文 + 现代白话 + 为什么这一段对你有用
 *   4) 点段落直接跳到 reader 的那个段落
 */
export function Discover() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SituationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('');
  const navigate = useNavigate();

  const onSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setStage('找相关文章…');
      const r = await analyzeSituationWithStages(text, setStage);
      setResult(r);
    } catch (e) {
      setError(
        'AI 后端不可用, 现状分析需要在本机 dev 模式 (pnpm dev) 或部署带 LLM 后端的版本里才能用。当前 mcode.cn 部署版没有 AI 后端, 所以这一条不会真的去调 LLM。',
      );
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  const onParagraphClick = (articleId: string, paragraphId: string) => {
    navigate(`/read/${articleId}#${paragraphId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          毛选回应你
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          写下你现在的状态、卡点、面对的问题。AI 找出毛选里**直接对应你处境的段落**, 原文 + 现代白话, 点一下就跳到那。
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
            {loading ? '分析中…' : '让毛选回应我 →'}
          </button>
        </div>
      </div>

      {!result && !loading && !error && <Examples onPick={setText} />}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col items-center justify-center py-12 text-secondary dark:text-dark-secondary"
          >
            <div className="w-6 h-6 border-2 border-cinnabar border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm">{stage || 'AI 正在翻毛选…'}</p>
            <p className="mt-1 text-[10px] text-secondary/70">这通常需要 15-30 秒 (两轮 LLM)</p>
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
              在本机跑 <code className="px-1 py-0.5 rounded bg-ink/5 dark:bg-dark-ink/10 text-cinnabar">pnpm dev</code> 就能用毛选回应。
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
            className="mt-6 space-y-5"
          >
            {/* 处境分析 */}
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4">
              <p className="text-[11px] text-cinnabar/80 mb-1 tracking-wider">🤖 处境识别</p>
              <p className="text-[15px] sm:text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* 段落引用 (按文章分组) */}
            {result.articles.map((rec, i) => {
              const article = ARTICLES.find((a) => a.id === rec.id);
              if (!article) return null;
              return (
                <motion.section
                  key={rec.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.08 }}
                >
                  <header className="flex items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-serif-cn text-base sm:text-lg font-medium text-ink dark:text-dark-ink">
                      {article.title}
                    </h2>
                    <span className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary tabular-nums shrink-0">
                      {article.writtenAt}
                    </span>
                  </header>
                  {rec.why && (
                    <p className="text-[12px] sm:text-[13px] text-secondary dark:text-dark-secondary mb-3 leading-relaxed">
                      📌 {rec.why}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {rec.paragraphs.map((p) => (
                      <ParagraphCard
                        key={p.paragraphId}
                        paragraphId={p.paragraphId}
                        whyThis={p.whyThis}
                        gloss={p.gloss}
                        onClick={() => onParagraphClick(article.id, p.paragraphId)}
                      />
                    ))}
                  </ul>
                </motion.section>
              );
            })}

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setText('');
                }}
                className="text-[12px] sm:text-sm text-secondary dark:text-dark-secondary hover:text-cinnabar transition-colors min-h-[44px] px-4"
              >
                ↻ 重新描述一次
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParagraphCard({
  paragraphId,
  whyThis,
  gloss,
  onClick,
}: {
  paragraphId: string;
  whyThis: string;
  gloss: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-card-lg border border-ink/8 dark:border-dark-line
                 bg-white/60 dark:bg-dark-ink/5 p-3.5 sm:p-4
                 hover:border-cinnabar/40 active:scale-[0.99] transition-all group"
    >
      {/* 为什么这一段对你有用 */}
      <p className="text-[11px] sm:text-[12px] text-cinnabar/85 dark:text-cinnabar/80 leading-relaxed mb-2">
        → {whyThis || '这一段直接说到了你现在的处境'}
      </p>

      {/* 现代白话 */}
      <p className="text-[13px] sm:text-[14px] text-ink/90 dark:text-dark-ink/90 font-serif-cn leading-relaxed mb-2.5">
        {gloss || '(白话解释生成中…)'}
      </p>

      {/* 跳转提示 */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-secondary dark:text-dark-secondary">
        <span className="font-mono">{paragraphId}</span>
        <span className="group-hover:text-cinnabar transition-colors">跳到原文 →</span>
      </div>
    </button>
  );
}

// Wrapper that exposes stage updates during the 2-step LLM
async function analyzeSituationWithStages(
  text: string,
  setStage: (s: string) => void,
): Promise<SituationAnalysis> {
  // Patch analyzeSituation to update stage. We do this by re-importing and
  // doing the work inline here. Simpler: just call analyzeSituation and show
  // one stage — the two-step is internal.
  setStage('第 1 轮: 从 22 篇里选最贴的…');
  const result = await analyzeSituation(text);
  setStage('第 2 轮: 在每篇里挑对应你处境的段落 + 写白话…');
  return result;
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
