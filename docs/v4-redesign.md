# MaoBible v4 Redesign — 微信读书式 4 tabs + AI + 阅读记录

**Date:** 2026-07-29
**Author:** Mavis
**Reason:** Frank 的反馈 — v3 mobile 体验乱 (3 tabs 冷启动, AI 藏得深, 没有阅读引导, 没有阅读记录)。

## 新 IA (4 bottom tabs)

```
┌──────────────────────────────────────────┐
│  [毛选]                          [🌗]    │  Header
├──────────────────────────────────────────┤
│                                          │
│  Tab content (full screen scroll)        │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│  📚 书架   🤖 解读   🔍 发现   👤 我   │  Bottom nav
└──────────────────────────────────────────┘
```

## Tab 1: 📚 书架 (Shelf, default `/`)

**一屏看到所有需要的东西 — 微信读书风格。**

```
┌────────────────────────────────────────┐
│ 继续阅读                          [>]  │  Hero — last article
│ ┌──────────────────────────────────┐   │
│ │ 矛盾论                  ▓▓▓░░ 60% │   │  progress bar
│ │ 1937-08 · 矛盾 / 辩证法 / 分析    │   │
│ │ 12 分钟前读到这里                  │   │
│ └──────────────────────────────────┘   │
├────────────────────────────────────────┤
│ 今天读什么                              │
│ ┌──────────────────────────────────┐   │
│ │ 实践论                            │   │  daily pick
│ │ 学了不算懂，用了才算数。…           │   │  interpretation
│ │ [开始读 →]                        │   │
│ └──────────────────────────────────┘   │
├────────────────────────────────────────┤
│ 主题                                    │
│ [认识论] [革命战略] [党建] [文风] [全部] │  chips
├────────────────────────────────────────┤
│ 全部文章                                │
│ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ 卡片1 │ │ 卡片2 │ │ 卡片3 │              │
│ └──────┘ └──────┘ └──────┘              │
└────────────────────────────────────────┘
```

**Sections:**
1. **继续阅读** — last article + progress (or "开始你的第一篇" if no history)
2. **今天读什么** — daily pick (rotates by date) with interpretation
3. **主题浏览** — chip filter (5 themes from Feed)
4. **全部文章** — 22 cards in 2-col grid (mobile) or 3-col (sm+)
5. **我的收藏** — only if any bookmarks (collapsible at bottom)

## Tab 2: 🤖 解读 (AI, `/ai`)

**AI 入口做大 — 占据 tab.**

```
┌────────────────────────────────────────┐
│ 有什么想了解的?                         │
│ ┌──────────────────────────────────┐   │
│ │ 输入你的问题...                    │   │
│ └──────────────────────────────────┘   │
│ [发送 →]                                │
├────────────────────────────────────────┤
│ 热门提问                                │
│ • 实践论讲什么?                          │
│ • 怎么理解"矛盾"?                       │
│ • 毛泽东的群众路线是什么?               │
│ • 持久战为什么是持久战?                  │
├────────────────────────────────────────┤
│ AI 工具                                 │
│ [📝 段落解读] [🗂 摘要] [🎯 推荐]       │  3 tools
├────────────────────────────────────────┤
│ 最近对话                                │
│ Q: 怎么理解实践论?                       │
│ A: 实践论是毛泽东...                     │
└────────────────────────────────────────┘
```

**Sections:**
1. **Chat input** — ask any question, RAG over 22 articles
2. **热门提问** — preset questions (4-6)
3. **AI 工具** — 3 quick tools:
   - 段落解读: paste a paragraph → modern Chinese summary
   - 摘要: pick an article → 1-paragraph summary
   - 推荐: based on your reading → suggest next
4. **最近对话** — chat history (last 5)

## Tab 3: 🔍 发现 (Discover, `/discover`)

```
┌────────────────────────────────────────┐
│ 问一件事，找一篇。                       │
│ [搜索框]                                │
├────────────────────────────────────────┤
│ 或者试试:                               │
│ [chip] [chip] [chip]                    │  9 chips
├────────────────────────────────────────┤
│ 6 大主题                                │
│ ┌──────┐ ┌──────┐                      │
│ │ 哲学  │ │ 战略  │                      │
│ │ 4篇  │ │ 3篇  │                      │
│ └──────┘ └──────┘                      │
└────────────────────────────────────────┘
```

**Sections:**
1. **处境搜索** — original Ask (input + 9 chips)
2. **主题浏览** — 6 theme cards (count per theme)

## Tab 4: 👤 我 (Me, `/me`)

```
┌────────────────────────────────────────┐
│ 本周阅读                                │
│ ┌──────────────────────────────────┐   │
│ │ 3 篇  ·  42 分钟                  │   │
│ │ ▓▓▓▓▓▓▓▓░░░░ Mon-Thu             │   │
│ └──────────────────────────────────┘   │
├────────────────────────────────────────┤
│ 累计                                    │
│ 22 篇中已读 3 篇 · 收藏 1 篇              │
├────────────────────────────────────────┤
│ 最近阅读                                │
│ • 矛盾论  60%  12 分钟前                │
│ • 实践论  100% 昨天                     │
│ • 星星之火  35%  3 天前                  │
├────────────────────────────────────────┤
│ 收藏 (1)                                │
│ • 纪念白求恩                            │
├────────────────────────────────────────┤
│ [内容语言] [主题] [关于]                 │
└────────────────────────────────────────┘
```

**Sections:**
1. **本周阅读** — 数字 + 周条形图
2. **累计** — 总进度
3. **最近阅读** — last 5
4. **收藏** — all bookmarks
5. **设置** — content lang, theme, about

## Reader 改进 (`/read/:id`)

```
┌────────────────────────────────────────┐
│ ← 实践论                      [TOC] ⋯  │  Header — TOC drawer
├────────────────────────────────────────┤
│ ▓▓▓░░░░░░░░░ 12%                       │  Top progress bar (thin)
├────────────────────────────────────────┤
│ 实践论                                 │
│ 论认识和实践的关系                       │
│ 1937-07 · 《毛选》第一卷 · 22 分钟       │
├────────────────────────────────────────┤
│ ┌─ 🤖 AI 解读 ─────────────────┐       │  AI panel (collapsible)
│ │ 学了不算懂，用了才算数。…        │       │  Default expanded
│ │ [展开对话]  [换一种解读]          │       │
│ └────────────────────────────────┘       │
├────────────────────────────────────────┤
│ [中] [双语] [字号] [☆]                  │  Sticky toolbar
├────────────────────────────────────────┤
│ 段落 1: 在中国共产党内，…                │
│ 段落 2: 马克思以前的唯物论，…            │  Long-press → "AI 解释"
│ ...
├────────────────────────────────────────┤
│ ← 上一篇 (中国社会各阶级的分析)          │  Bottom nav
│                  下一篇 (矛盾论) →        │
└────────────────────────────────────────┘
```

**Changes:**
- **Top progress bar** — thin scroll-based bar (auto-updates)
- **TOC drawer** — slide-up sheet with all paragraphs as anchors + section headings (kind: heading)
- **AI 解读** — default expanded panel (interpretation)
- **段落长按** → "AI 解释这段" → 浮窗 (uses LLM)
- **字号调节** — small/medium/large
- **Sticky toolbar** — 中/双语/字号/☆

## Reading record (新 storage)

```ts
interface ReadingSession {
  articleId: string;
  paragraphId: string;
  startedAt: string;  // ISO
  durationMs: number;  // time on page
}

interface ArticleProgress {
  articleId: string;
  scrollFraction: number;
  lastReadAt: string;
  totalDurationMs: number;
  completed: boolean;
}

interface DailyStats {
  date: string;  // YYYY-MM-DD
  articlesRead: number;
  durationMs: number;
}
```

## Implementation plan (4 parallel agents)

**Agent 1 — 架构 + UI**
- Rewrite `App.tsx` (4 routes)
- Rewrite `AppShell.tsx` (4 tabs)
- New `pages/Shelf.tsx` (default, everything in one)
- New `pages/AI.tsx`
- Rewrite `pages/Discover.tsx` (from old Ask)
- Rewrite `pages/Me.tsx` (含统计)
- Rewrite `pages/Reader.tsx` (加 TOC + AI + 进度)

**Agent 2 — AI 服务**
- New `src/services/ai.ts` (mmx CLI wrapper)
- Chat endpoint: Q&A over 22 articles (RAG)
- 段落解读: paragraph → modern Chinese
- 摘要: article id → 1-paragraph summary
- 推荐: reading history → next article

**Agent 3 — 阅读记录 + 统计**
- Extend `src/lib/storage.ts` (ReadingSession, DailyStats)
- New `src/lib/stats.ts` (聚合 by week/month/total)
- Weekly bar chart in Me

**Agent 4 — Reader UX + content polish**
- Add `kind: "heading"` rows to long articles (insert-headings.py)
- TOC drawer component
- 段落长按 → AI 解释 浮窗
- 顶部 progress bar
- 字号调节
