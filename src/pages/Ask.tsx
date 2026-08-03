import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLES } from '@/data/manifest';
import {
  analyzeSituation,
  askAI,
  classifyError,
  type SituationAnalysis,
} from '@/services/ai';
import { getAllChats, saveChat, deleteChat } from '@/lib/storage';
import type { ChatThread, ChatMessage } from '@/types';

/**
 * Ask — 单一 AI 入口, 两个 mode:
 *
 *   回应 (默认) — 用户写现状, AI 找出毛选里直接对应的段落 (段落级 RAG, 两步 LLM)
 *   问           — 用户问任何问题, 通用 LLM 答 (单步 RAG over 22 篇 manifest)
 *
 * 这两个都是 AI, 都是同一个 input box, 区别只是"输入是状态还是问题".
 * 不分两个 tab 是因为 Frank 反馈"解读和发现太像了".
 */
type Mode = 'respond' | 'ask';

export function Ask() {
  const [mode, setMode] = useState<Mode>('respond');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<
    'no-config' | 'unauthorized' | 'rate-limited' | 'network' | 'other' | null
  >(null);
  const [result, setResult] = useState<SituationAnalysis | null>(null);
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    void getAllChats().then(setChats);
  }, []);

  // Track an in-flight request so a mid-submit mode switch / unmount
  // doesn't write a stale result into the new mode's state.
  const inflightRef = useRef(0);

  const onSubmit = async () => {
    if (!text.trim() || loading) return;
    const ticket = ++inflightRef.current;
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setResult(null);
    setChatAnswer(null);
    try {
      if (mode === 'respond') {
        setStage('第 1 轮: 从 22 篇里选最贴的…');
        const r = await analyzeSituation(text);
        if (ticket !== inflightRef.current) return; // user switched mode/unmounted
        setStage('第 2 轮: 在每篇里挑对应你处境的段落 + 写白话…');
        setResult(r);
      } else {
        setStage('AI 思考中…');
        const { text: answer, isFallback, reason } = await askAI(text);
        if (ticket !== inflightRef.current) return;
        setChatAnswer(answer);
        if (isFallback) {
          setErrorKind(reason === 'no-config' ? 'no-config' : classifyError(reason, 0));
        }
        // Save to chat history (still useful for the user to keep the Q)
        const userMsg: ChatMessage = {
          id: `m-${Date.now()}-u`,
          role: 'user',
          text,
          createdAt: new Date(Date.now() - 1).toISOString(),
        };
        const aiMsg: ChatMessage = {
          id: `m-${Date.now()}-a`,
          role: 'ai',
          text: answer,
          createdAt: new Date().toISOString(),
        };
        const thread: ChatThread = {
          id: `t-${Date.now()}`,
          title: text.slice(0, 30),
          messages: [userMsg, aiMsg],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveChat(thread);
        if (ticket !== inflightRef.current) return;
        setChats((prev) => [thread, ...prev]);
        setText('');
      }
    } catch (e) {
      if (ticket === inflightRef.current) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('请到「我 → AI 配置」')) {
          setError(msg);
          setErrorKind('no-config');
        } else {
          setError('智能服务暂时不可用，请稍后重试。原文阅读、收藏和阅读进度仍可正常使用。');
          setErrorKind('other');
        }
      }
    } finally {
      if (ticket === inflightRef.current) {
        setLoading(false);
        setStage('');
      }
    }
  };

  const onParagraphClick = (articleId: string, paragraphId: string) => {
    navigate(`/read/${articleId}#${paragraphId}`);
  };

  const onPresetPick = (q: string) => {
    setMode('ask');
    setText(q);
  };

  const onExamplePick = (q: string) => {
    setMode('respond');
    setText(q);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          毛选回应你
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          {mode === 'respond'
            ? '写下你现在的状态、卡点、面对的问题。AI 找出毛选里直接对应你处境的段落, 原文 + 现代白话, 点一下就跳到那。'
            : '问任何关于毛选的问题, 基于 22 篇原文作答。'}
        </p>
      </header>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 rounded-card bg-ink/5 dark:bg-dark-ink/10 mb-3 w-full sm:w-fit">
        <button
          onClick={() => {
            // Cancel any in-flight request before switching modes; was: kept
            // the old stage text and overwrote the new mode's empty state.
            inflightRef.current++;
            setLoading(false);
            setStage('');
            setMode('respond');
            setResult(null);
            setChatAnswer(null);
            setError(null);
            setErrorKind(null);
          }}
          className={[
            'flex-1 sm:flex-none px-4 py-1.5 rounded-card text-sm font-medium transition-all',
            mode === 'respond'
              ? 'bg-paper dark:bg-dark-paper text-ink dark:text-dark-ink shadow-sm'
              : 'text-secondary dark:text-dark-secondary hover:text-ink dark:hover:text-dark-ink',
          ].join(' ')}
        >
          🌿 回应
        </button>
        <button
          onClick={() => {
            inflightRef.current++;
            setLoading(false);
            setStage('');
            setMode('ask');
            setResult(null);
            setChatAnswer(null);
            setError(null);
            setErrorKind(null);
          }}
          className={[
            'flex-1 sm:flex-none px-4 py-1.5 rounded-card text-sm font-medium transition-all',
            mode === 'ask'
              ? 'bg-paper dark:bg-dark-paper text-ink dark:text-dark-ink shadow-sm'
              : 'text-secondary dark:text-dark-secondary hover:text-ink dark:hover:text-dark-ink',
          ].join(' ')}
        >
          💬 问
        </button>
      </div>

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
          placeholder={
            mode === 'respond'
              ? '比如: 我最近项目被砍了, 团队散了, 感觉很失落, 不知道接下来该怎么办…'
              : '比如: 怎么理解"矛盾"? 实践论讲什么?'
          }
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
            {loading ? '分析中…' : mode === 'respond' ? '让毛选回应我 →' : '发送 →'}
          </button>
        </div>
      </div>

      {/* Empty-state: 8 examples (respond) or 6 presets (ask) */}
      {!result && !chatAnswer && !loading && !error && (
        mode === 'respond'
          ? <RespondExamples onPick={onExamplePick} />
          : <AskPresets onPick={onPresetPick} />
      )}

      {/* Loading */}
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
            {mode === 'respond' && (
              <p className="mt-1 text-[10px] text-secondary/70">这通常需要 15-30 秒 (两轮 LLM)</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4"
          >
            <p className="text-[11px] text-cinnabar mb-1 tracking-wider">
              {errorKind === 'no-config' ? '⚠ 尚未配置 AI 接入'
                : errorKind === 'unauthorized' ? '⚠ AI 鉴权失败'
                : errorKind === 'rate-limited' ? '⚠ AI 配额或限流'
                : errorKind === 'network' ? '⚠ AI 网络不可达'
                : '⚠ AI 暂时不可用'}
            </p>
            <p className="text-[13px] sm:text-sm text-ink/85 dark:text-dark-ink/85 leading-relaxed whitespace-pre-wrap">
              {error}
            </p>
            {errorKind === 'no-config' && (
              <Link
                to="/me"
                className="mt-3 inline-flex min-h-[36px] items-center rounded-card bg-cinnabar px-4 text-sm text-paper hover:bg-cinnabar/90 active:scale-95 transition-all"
              >
                去「我」页面配置 →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result: respond mode — paragraph cards */}
      <AnimatePresence>
        {result && !loading && mode === 'respond' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-5"
          >
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4">
              <p className="text-[11px] text-cinnabar/80 mb-1 tracking-wider">🤖 处境识别</p>
              <p className="text-[15px] sm:text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed">
                {result.summary}
              </p>
            </div>

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

      {/* Result: ask mode — chat answer + history */}
      <AnimatePresence>
        {chatAnswer && !loading && mode === 'ask' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-5"
          >
            <div className="rounded-card-lg border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-4">
              <p className="text-[11px] text-cinnabar/80 mb-1 tracking-wider">🤖 回答</p>
              <p className="text-[15px] sm:text-base text-ink dark:text-dark-ink font-serif-cn leading-relaxed whitespace-pre-wrap">
                {chatAnswer}
              </p>
            </div>
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setChatAnswer(null);
                  setText('');
                }}
                className="text-[12px] sm:text-sm text-secondary dark:text-dark-secondary hover:text-cinnabar transition-colors min-h-[44px] px-4"
              >
                ↻ 继续问
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent chats — only in ask mode when not actively answered */}
      {mode === 'ask' && !chatAnswer && !loading && !error && (
        <RecentChats chats={chats} setChats={setChats} />
      )}
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
      <p className="text-[11px] sm:text-[12px] text-cinnabar/85 dark:text-cinnabar/80 leading-relaxed mb-2">
        → {whyThis || '这一段直接说到了你现在的处境'}
      </p>
      <p className="text-[13px] sm:text-[14px] text-ink/90 dark:text-dark-ink/90 font-serif-cn leading-relaxed mb-2.5">
        {gloss || '(白话解释生成中…)'}
      </p>
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-secondary dark:text-dark-secondary">
        <span className="font-mono">{paragraphId}</span>
        <span className="group-hover:text-cinnabar transition-colors">跳到原文 →</span>
      </div>
    </button>
  );
}

function RespondExamples({ onPick }: { onPick: (q: string) => void }) {
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
        或者写下你的状态:
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

function AskPresets({ onPick }: { onPick: (q: string) => void }) {
  const presets = [
    '实践论讲什么?',
    '怎么理解"矛盾"?',
    '毛泽东的群众路线是什么?',
    '持久战为什么是持久战?',
    '什么是"实事求是"?',
    '为什么要整风?',
  ];
  return (
    <div className="mt-6">
      <p className="text-[11px] sm:text-xs text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
        热门提问:
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="min-h-[36px] px-3 py-1.5 text-sm rounded-full
                       border border-ink/10 dark:border-dark-line
                       bg-white/50 dark:bg-dark-ink/5
                       hover:border-cinnabar/40 hover:text-cinnabar
                       active:scale-95 transition-all duration-180"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecentChats({
  chats,
  setChats,
}: {
  chats: ChatThread[];
  setChats: (updater: (prev: ChatThread[]) => ChatThread[]) => void;
}) {
  if (chats.length === 0) return null;
  return (
    <section className="mt-6" aria-label="最近对话">
      <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
        最近对话
      </h2>
      <ul className="space-y-2">
        <AnimatePresence>
          {chats.slice(0, 5).map((t) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-card border border-ink/8 dark:border-dark-line
                         bg-white/50 dark:bg-dark-ink/5 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink dark:text-dark-ink truncate">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[12px] text-secondary dark:text-dark-secondary line-clamp-2">
                    {t.messages.find((m) => m.role === 'ai')?.text.slice(0, 100)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await deleteChat(t.id);
                    setChats((prev) => prev.filter((c) => c.id !== t.id));
                  }}
                  className="text-secondary hover:text-cinnabar text-xs shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
