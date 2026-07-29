import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAllChats, saveChat, deleteChat } from '@/lib/storage';
import { askAI, explainParagraph, summarizeArticle } from '@/services/ai';
import type { ChatThread, ChatMessage } from '@/types';

/**
 * AI — 解读 tab. Big visible AI entry point.
 *
 * 1. Chat input — ask any question, RAG over 22 articles
 * 2. 热门提问 — preset questions
 * 3. AI 工具 — 段落解读 / 摘要 / 推荐
 * 4. 最近对话
 */
export function AI() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<ChatThread[]>([]);

  useEffect(() => {
    void getAllChats().then(setChats);
  }, []);

  const onSend = async (q: string = query) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuery('');
    try {
      const answer = await askAI(q);
      const msg: ChatMessage = {
        id: String(Date.now()),
        role: 'ai',
        text: answer,
        createdAt: new Date().toISOString(),
      };
      const userMsg: ChatMessage = {
        id: String(Date.now() - 1),
        role: 'user',
        text: q,
        createdAt: new Date(Date.now() - 1).toISOString(),
      };
      const thread: ChatThread = {
        id: `t-${Date.now()}`,
        title: q.slice(0, 30),
        messages: [userMsg, msg],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveChat(thread);
      setChats((prev) => [thread, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl">🤖</span>
          <span>有什么想了解的?</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          问任何关于毛选的问题。基于 22 篇原文作答。
        </p>
      </header>

      {/* Chat input */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder="比如: 怎么理解'矛盾'? 实践论讲什么?"
          rows={2}
          className="w-full px-4 py-3 text-base rounded-card
                     border border-ink/15 dark:border-dark-line
                     bg-white/60 dark:bg-dark-ink/10
                     focus:outline-none focus:border-cinnabar/60
                     transition-colors duration-180 resize-none
                     placeholder:text-secondary/70"
        />
        <button
          onClick={() => void onSend()}
          disabled={!query.trim() || loading}
          className="absolute right-2 bottom-2
                     min-h-[36px] px-4 rounded-card
                     bg-cinnabar text-paper text-sm font-medium
                     hover:bg-cinnabar/90 active:scale-95
                     transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '思考中…' : '发送 →'}
        </button>
      </div>

      {/* 热门提问 */}
      <section className="mt-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          热门提问
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void onSend(q)}
              disabled={loading}
              className="min-h-[36px] px-3 py-1.5 text-sm rounded-full
                         border border-ink/10 dark:border-dark-line
                         bg-white/50 dark:bg-dark-ink/5
                         hover:border-cinnabar/40 hover:text-cinnabar
                         active:scale-95 transition-all duration-180
                         text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* AI 工具 */}
      <section className="mt-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          AI 工具
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <li>
            <Link
              to="/ai/explain"
              className="block rounded-card border border-ink/8 dark:border-dark-line
                         bg-white/50 dark:bg-dark-ink/5 p-3
                         hover:border-cinnabar/40 active:scale-[0.99] transition-all"
            >
              <p className="text-base">📝 段落解读</p>
              <p className="mt-1 text-[11px] text-secondary dark:text-dark-secondary">
                贴一段 → 现代白话
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/ai/summarize"
              className="block rounded-card border border-ink/8 dark:border-dark-line
                         bg-white/50 dark:bg-dark-ink/5 p-3
                         hover:border-cinnabar/40 active:scale-[0.99] transition-all"
            >
              <p className="text-base">🗂 摘要</p>
              <p className="mt-1 text-[11px] text-secondary dark:text-dark-secondary">
                选文章 → 一段话总结
              </p>
            </Link>
          </li>
          <li>
            <Link
              to="/ai/recommend"
              className="block rounded-card border border-ink/8 dark:border-dark-line
                         bg-white/50 dark:bg-dark-ink/5 p-3
                         hover:border-cinnabar/40 active:scale-[0.99] transition-all"
            >
              <p className="text-base">🎯 推荐</p>
              <p className="mt-1 text-[11px] text-secondary dark:text-dark-secondary">
                根据阅读历史
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* 最近对话 */}
      <section className="mt-6">
        <h2 className="text-[11px] sm:text-xs font-medium text-secondary dark:text-dark-secondary mb-2.5 tracking-wider">
          最近对话
        </h2>
        {chats.length === 0 ? (
          <p className="text-sm text-secondary dark:text-dark-secondary py-4 text-center">
            还没有对话。试着问一个问题 →
          </p>
        ) : (
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
        )}
      </section>
    </div>
  );
}

const PRESET_QUESTIONS = [
  '实践论讲什么?',
  '怎么理解"矛盾"?',
  '毛泽东的群众路线是什么?',
  '持久战为什么是持久战?',
  '什么是"实事求是"?',
  '为什么要整风?',
];

// re-export for AI tools (in case other pages use)
export { explainParagraph, summarizeArticle };
