import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pickTodayQuote, type FamousQuote } from '@/lib/famous-pool';
import { useContentLang } from '@/hooks/useContentLang';

/**
 * Shake — 摇一摇获今日毛选名句。
 *
 * UX:
 *   - 第一次进入: 显示大图标 + 提示摇手机, 或点屏幕
 *   - iOS 13+ 需要先点 "开始" 调 DeviceMotionEvent.requestPermission()
 *   - 摇一摇 / 点屏幕 / 点大图标 → 加载今日名句 (按日期 hash 选, 同一天稳定)
 *   - 名句卡片: 原文 + 出处 + 一句现代白话 + "看上下文" 跳到原文 + "换一句" 随机
 *
 * 降级:
 *   - 没传感器 (PC / iOS 未授权) → 点屏幕也触发
 *   - 名句池没加载完 (manifest fetch 失败) → 重试按钮
 */
type State =
  | { kind: 'idle'; permission: 'unknown' | 'granted' | 'denied' | 'unsupported' }
  | { kind: 'loading' }
  | { kind: 'ready'; quote: FamousQuote; isToday: boolean };

const SHAKE_THRESHOLD = 14; // m/s² — generous enough that a casual shake triggers
const SHAKE_COOLDOWN_MS = 1500;

export function Shake() {
  const [contentLang] = useContentLang();
  const [state, setState] = useState<State>({ kind: 'idle', permission: 'unknown' });
  const lastShakeRef = useRef(0);
  const animatingRef = useRef(false);

  // Triggered by shake / tap. `forceRandom` = true skips the "today"
  // date-hash pick and just randomizes. Used by the "换一句" button.
  const onTrigger = useCallback(async (mode: 'today' | 'random') => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setState((s) => (s.kind === 'ready' ? s : { kind: 'loading' }));
    try {
      // Always load the today quote first (cheap, cached after first call).
      const today = await pickTodayQuote();
      if (!today) {
        animatingRef.current = false;
        return;
      }
      if (mode === 'today') {
        setState({ kind: 'ready', quote: today, isToday: true });
        return;
      }
      // Random: pick a different one. Reuse the pool via a fresh hash.
      const pool = await import('@/lib/famous-pool').then((m) => m.getFamousPool());
      if (pool.length <= 1) {
        setState({ kind: 'ready', quote: today, isToday: false });
        return;
      }
      let next = today;
      // Retry until we get a different one (small pool — max 3 tries).
      for (let i = 0; i < 3 && next.paragraphId === today.paragraphId; i++) {
        next = pool[Math.floor(Math.random() * pool.length)];
      }
      setState({ kind: 'ready', quote: next, isToday: false });
    } finally {
      animatingRef.current = false;
    }
  }, []);

  // iOS 13+ DeviceMotion permission flow. Returns true if granted/unsupported.
  const requestMotion = useCallback(async (): Promise<boolean> => {
    const Event = (globalThis as any).DeviceMotionEvent;
    if (typeof Event?.requestPermission !== 'function') {
      setState((s) => (s.kind === 'idle' ? { kind: 'idle', permission: 'unsupported' } : s));
      return true; // Android / desktop — no prompt needed
    }
    try {
      const res = await Event.requestPermission();
      const ok = res === 'granted';
      setState((s) => (s.kind === 'idle' ? { kind: 'idle', permission: ok ? 'granted' : 'denied' } : s));
      return ok;
    } catch {
      setState((s) => (s.kind === 'idle' ? { kind: 'idle', permission: 'denied' } : s));
      return false;
    }
  }, []);

  // Wire up the devicemotion listener — only when state allows.
  useEffect(() => {
    if (state.kind !== 'idle') return;
    if (state.permission !== 'granted' && state.permission !== 'unsupported') return;
    if (typeof window === 'undefined') return;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt(
        (a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2,
      );
      const now = Date.now();
      if (mag > SHAKE_THRESHOLD && now - lastShakeRef.current > SHAKE_COOLDOWN_MS) {
        lastShakeRef.current = now;
        void onTrigger('today');
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [state, onTrigger]);

  const onTapCenter = useCallback(async () => {
    if (state.kind === 'idle') {
      // First time: ask for permission, then immediately trigger.
      const ok = await requestMotion();
      if (ok) void onTrigger('today');
    } else if (state.kind === 'ready') {
      // Tap while a card is showing → re-roll today
      void onTrigger('today');
    }
  }, [state.kind, requestMotion, onTrigger]);

  const isLoading = state.kind === 'loading';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <header className="pb-3 sm:pb-4">
        <h1 className="font-serif-cn text-2xl sm:text-3xl font-medium text-ink dark:text-dark-ink leading-tight">
          摇一摇
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-secondary dark:text-dark-secondary">
          摇手机，或点中间图标 — 抽今天一句毛选。
        </p>
      </header>

      {/* Center stage — tap zone, large icon, hint */}
      <button
        type="button"
        onClick={onTapCenter}
        disabled={isLoading}
        aria-label={state.kind === 'idle' ? '开始摇一摇' : '再抽一次'}
        className="mt-4 sm:mt-8 mx-auto block w-full max-w-sm
                   rounded-card-lg border-2 border-dashed border-cinnabar/30
                   bg-cinnabar/[0.03] hover:bg-cinnabar/[0.06]
                   active:scale-[0.99] transition-all
                   min-h-[260px] sm:min-h-[320px] p-6 sm:p-8
                   flex flex-col items-center justify-center gap-3
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-cinnabar/60
                   disabled:opacity-60"
      >
        <motion.div
          animate={isLoading ? { rotate: [0, -10, 10, -6, 6, 0] } : { rotate: 0 }}
          transition={isLoading ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.2 } : { duration: 0.4 }}
        >
          <ShakeGlyph />
        </motion.div>
        <p className="text-sm sm:text-base text-cinnabar/85 dark:text-cinnabar/80 font-medium">
          {isLoading
            ? '抽签中…'
            : state.kind === 'idle'
              ? state.permission === 'denied'
                ? '摇一摇未授权 — 点这里也抽'
                : '摇手机 · 或点这里'
              : '再抽一次'}
        </p>
        <p className="text-[10px] sm:text-xs text-secondary dark:text-dark-secondary max-w-[24ch] text-center leading-relaxed">
          {state.kind === 'idle' && state.permission === 'unknown'
            ? 'iPhone 第一次需要点一次授权传感器'
            : state.kind === 'idle' && state.permission === 'denied'
              ? '浏览器拒绝传感器访问。仍可点这里抽。'
              : '同一天多次摇 = 同一句。跨天换新。'}
        </p>
      </button>

      {/* Result card */}
      <AnimatePresence mode="wait">
        {state.kind === 'ready' && (
          <motion.article
            key={state.quote.paragraphId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="mt-6 rounded-card-lg border border-cinnabar/30
                       bg-cinnabar/[0.04] dark:bg-cinnabar/[0.08]
                       p-5 sm:p-6"
            aria-live="polite"
          >
            <p className="text-[11px] text-cinnabar/80 tracking-wider mb-3 flex items-center gap-1.5">
              <span>📜</span>
              {state.isToday ? '今天的名句' : '另一句'} · {state.quote.writtenAt}
            </p>
            <blockquote
              className="font-serif-cn text-[17px] sm:text-[19px]
                         text-ink dark:text-dark-ink leading-[1.9] sm:leading-[2]
                         text-balance"
            >
              {state.quote.text}
            </blockquote>
            {state.quote.gloss && contentLang === 'zh-CN' && (
              <p className="mt-3 text-[13px] sm:text-sm text-cinnabar/85 dark:text-cinnabar/80 leading-relaxed">
                💡 {state.quote.gloss}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs text-secondary dark:text-dark-secondary">
                出自 《{state.quote.articleTitle}》
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onTrigger('random')}
                  className="min-h-[36px] px-3 rounded-card border border-ink/10 dark:border-dark-line
                             text-xs sm:text-sm text-secondary hover:border-cinnabar/40 hover:text-cinnabar
                             transition-colors"
                >
                  换一句
                </button>
                <Link
                  to={`/read/${state.quote.articleId}#${state.quote.paragraphId}`}
                  className="min-h-[36px] inline-flex items-center px-3 rounded-card
                             bg-cinnabar text-paper text-xs sm:text-sm
                             hover:bg-cinnabar/90 active:scale-95 transition-all"
                >
                  看上下文 →
                </Link>
              </div>
            </div>
          </motion.article>
        )}
        {state.kind === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center justify-center py-12 text-secondary dark:text-dark-secondary"
          >
            <div className="w-5 h-5 border-2 border-cinnabar border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Phone + wave glyph — a clear "shake" icon, no emoji. */
function ShakeGlyph() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cinnabar"
      aria-hidden
    >
      {/* Phone body */}
      <rect x="26" y="14" width="20" height="40" rx="3" />
      {/* Speaker + home dot */}
      <line x1="32" y1="20" x2="40" y2="20" />
      <circle cx="36" cy="48" r="1" fill="currentColor" />
      {/* Motion waves — left */}
      <path d="M20 26 Q14 28 14 36" opacity="0.7" />
      <path d="M22 30 Q18 32 18 36" opacity="0.45" />
      {/* Motion waves — right */}
      <path d="M52 26 Q58 28 58 36" opacity="0.7" />
      <path d="M50 30 Q54 32 54 36" opacity="0.45" />
    </svg>
  );
}
