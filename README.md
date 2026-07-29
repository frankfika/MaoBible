# MaoBible

> 一处安静、可信的多语言毛泽东著作阅读与思想研习空间。
> A quiet, multi-language reader for Selected Works of Mao Zedong.

A mobile-first PWA that lets you read 22 articles from the official 1991 People's Publishing House edition of *Selected Works of Mao Zedong* (《毛泽东选集》), with English translation drafts and a built-in AI assistant for plain-language interpretation.

## Features

- **📚 书架 (Shelf)** — one-screen home with continue-reading, daily pick, theme chips, 22-article grid, bookmarks
- **🤖 解读 (AI)** — chat with a Mao-reading AI assistant + 3 tools (段落解读 / 摘要 / 推荐) + 6 preset questions
- **🔍 发现 (Discover)** — **毛选回应你**: 用户写下当前状态, AI 两步找出**直接对应处境的毛选段落** — 处境识别 + 文章 + 段落原文 + 现代白话 + 为什么这一段对你有用. 点段落直接跳到 reader 那段.
- **👤 我 (Me)** — this-week reading stats with 7-day bar chart, cumulative progress, recent reading, bookmarks
- **📖 Reader** — top progress bar, default-expanded AI 解读 panel, slide-up TOC drawer, tap any paragraph for an AI 白话 explanation
- **🌐 Bilingual** — single-language (zh-CN | en) or paragraph-aligned bilingual mode
- **📱 Mobile-first** — 4-tab bottom nav like 微信读书, safe-area-inset, 44px touch targets, 16px mobile typography
- **🌓 Theme** — light + dark, system-aware
- **🛜 PWA** — installable, full content cached for offline reading

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind 3 with `Paper / Ink / Moss / Cinnabar` palette
- react-router-dom 6
- react-i18next 15 (UI strings)
- idb-keyval for bookmarks / progress / reading sessions
- framer-motion for transitions
- vite-plugin-pwa (workbox) for service worker
- `mmx` CLI (M2.7-highspeed) as the AI backend, bridged via Vite dev middleware

## Content

- 22 articles covering 1925–1949
- Chinese text: **official 人民出版社 1991 年第 2 版**, sourced from [M0rtzz/Selected-Works-of-MaoTseTung](https://github.com/M0rtzz/Selected-Works-of-MaoTseTung) (public domain in CN)
- English: LLM translation drafts (M2.7-highspeed) — not the Foreign Languages Press edition (which remains under US copyright until 2049)
- Stable paragraph IDs (`hunan-001`, `op-005`, ...) so bilingual mode aligns by content, not by line number
- Long articles have explicit section headings (`kind: "heading"`)

## Quick start

```bash
pnpm install
pnpm dev          # dev server on :5173, with /api/ai backend
pnpm build        # tsc -b + vite build → dist/
pnpm preview      # serve built dist/ on :4173
pnpm typecheck    # tsc -b --noEmit
```

The AI backend (`POST /api/ai`) requires the `mmx` CLI on PATH (it shells out to `mmx text chat`). In production you'd replace the Vite middleware in `vite.config.ts` with a real server.

## Project layout

```
MaoBible/
├── docs/
│   ├── product-plan.md       # Original product brief
│   └── v4-redesign.md        # v4 IA / 4-tabs plan
├── public/
│   ├── favicon.svg           # Brand mark
│   ├── pwa-192x192.svg, 512x512.svg
│   └── content/{id}.json     # 22 article JSONs, fetched at runtime
├── scripts/
│   ├── mao-selected-1991.txt # 5.8MB 毛选 source
│   ├── parse-source.py       # Extract 159 articles from source
│   ├── resegment.py          # Re-segment by source-natural boundaries
│   ├── insert-headings.py    # Detect "（一）" markers, add headings
│   ├── insert-headings-hardcoded.py # Hardcoded sections for 矛盾论/新民主主义论
│   └── translate-english.py  # LLM re-translation via mmx
├── src/
│   ├── App.tsx               # Routes
│   ├── main.tsx              # Entry
│   ├── index.css             # Tailwind + tokens
│   ├── types/                # Article, Paragraph, ReadingSession, ChatThread
│   ├── data/manifest.ts      # Bundled article index (titles, themes, interpretation, situations)
│   ├── i18n/                 # UI translations
│   ├── lib/
│   │   ├── storage.ts        # IndexedDB (bookmarks, progress, sessions, chats)
│   │   └── progress.ts
│   ├── services/ai.ts        # mmx-backed AI service
│   ├── hooks/                # useTheme, useContentLang, useArticle
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── AppShell.tsx      # 4-tab bottom nav
│   │   ├── ParagraphView.tsx
│   │   ├── TopProgressBar.tsx
│   │   ├── TocDrawer.tsx
│   │   ├── ParagraphAIDialog.tsx
│   │   └── ContentLangToggle.tsx
│   └── pages/
│       ├── Shelf.tsx         # 书架 (default)
│       ├── AI.tsx            # 解读
│       ├── Discover.tsx      # 发现
│       ├── Me.tsx            # 我
│       └── Reader.tsx
├── tailwind.config.ts
├── vite.config.ts
└── AGENTS.md                 # Agent project memory
```

## Conventions

- Paragraph IDs: `{article-prefix}-{NNN}` (zero-padded 3 digits)
- Section headings: `{article-prefix}-h{NN}` with `kind: "heading"`
- Two independent languages: `maobible:ui-lang` (UI) + `maobible:content-lang` (article)
- All content: status `published`, source 人民出版社 1991
- 44px touch targets, `px-4` mobile, `safe-area-inset-bottom`

## Copyright

- **Chinese**: 人民出版社 1991 第 2 版《毛泽东选集》— public domain in mainland China
- **English**: LLM translation draft from the public-domain Chinese source. NOT the Foreign Languages Press official version (which remains under US copyright until 2049).
