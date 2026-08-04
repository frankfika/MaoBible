# MaoBible

> 一处安静、可信的多语言毛泽东著作阅读与思想研习空间。
> A quiet, multi-language reader for Selected Works of Mao Zedong.

A mobile-first PWA with 22 articles transcribed from the 1991 People's Publishing House edition of *Selected Works of Mao Zedong* (《毛泽东选集》), English working drafts, and a built-in reading assistant for plain-language interpretation.

## Features

- **📚 书架 (Shelf)** — one-screen home with continue-reading, daily pick, theme chips, 22-article grid, bookmarks
- **🌿 回应 (Ask)** — single AI entry with two modes:
  - **回应** — 用户写现状, AI 两步找出**直接对应处境的毛选段落** (处境识别 + 文章 + 段落原文 + 现代白话 + 为什么对你有用, 点段落跳到 reader 那段)
  - **问** — 问任何关于毛选的问题, 单步 RAG over 22 篇, 6 热门提问 chip, 历史对话
- **👤 我 (Me)** — this-week reading stats with 7-day bar chart, cumulative progress, recent reading, bookmarks
- **📖 Reader** — top progress bar, default-expanded AI 解读 panel, slide-up TOC drawer, tap any paragraph for an AI 白话 explanation
- **🌐 Bilingual** — single-language (zh-CN | en) or paragraph-aligned bilingual mode
- **📱 Mobile-first** — 3-tab bottom nav (书架/回应/我), safe-area-inset, 44px touch targets, 16px mobile typography
- **🌓 Theme** — light + dark, system-aware
- **🛜 PWA** — installable, full content cached for offline reading

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind 3 with `Paper / Ink / Moss / Cinnabar` palette
- react-router-dom 7
- react-i18next 15 (UI strings)
- idb-keyval for bookmarks / progress / reading sessions
- framer-motion for transitions
- vite-plugin-pwa (workbox) for service worker
- `mmx` CLI (M2.7-highspeed) as the AI backend, bridged via Vite dev middleware

## Content

- 22 articles covering 1925–1949
- Chinese text: transcribed from 人民出版社 1991 年第 2 版 via [M0rtzz/Selected-Works-of-MaoTseTung](https://github.com/M0rtzz/Selected-Works-of-MaoTseTung). Public distribution requires a separate rights review.
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

## Native mobile apps

The same React app is packaged for iOS and Android with Capacitor. Native builds use the bundle ID `com.frankfika.maobible` and display name `毛选`.

```bash
pnpm mobile:sync     # build web assets and sync both native projects
pnpm mobile:android  # open the Android project
pnpm mobile:android:bundle # build a signed Google Play AAB (requires local signing config)
pnpm mobile:ios      # open the iOS project
```

Android requires JDK 21 and Android SDK 36. iOS requires a current full Xcode installation and an Apple Developer signing team. Store release signing credentials are intentionally not committed to the repository.

See [`docs/store-release-checklist.md`](docs/store-release-checklist.md) for the release gates and [`docs/store-listing-zh-CN.md`](docs/store-listing-zh-CN.md) for the draft store listing.

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

## Rights status

- **Chinese**: transcribed from 人民出版社 1991 第 2 版《毛泽东选集》. Do not treat online availability as a license; confirm authorization before public distribution.
- **English**: the repository currently mixes draft translations and text derived from Foreign Languages Press editions. It is not cleared for public distribution and requires both content QA and a jurisdiction-specific rights review.
