# MaoBible — Project Memory for AI Agents

> Multi-language reader for Selected Works of Mao Zedong. See `docs/product-plan.md` for the full product brief.

## Stack

- **React 18 + TypeScript + Vite 5** (PWA via `vite-plugin-pwa`)
- **Tailwind 3** with design tokens in `tailwind.config.ts` (Paper/Ink/Moss/Cinnabar palette)
- **react-router-dom 6**, **react-i18next 15** (UI strings; content language is independent)
- **idb-keyval** for local bookmarks / highlights / notes / reading progress
- **framer-motion** for page and paragraph transitions
- Path alias `@/*` → `src/*`

## Project layout

```
MaoBible/
├── docs/product-plan.md            # Full product brief
├── public/
│   ├── favicon.svg                 # Brand mark
│   ├── pwa-192x192.svg, 512x512.svg
│   └── content/{id}.json           # One article per file, fetched at runtime
├── src/
│   ├── App.tsx                     # Routes
│   ├── main.tsx                    # Entry
│   ├── index.css                   # Tailwind + design tokens
│   ├── types/                      # Domain types (Article, Paragraph, ...)
│   ├── data/manifest.ts            # Bundled article index
│   ├── i18n/                       # UI translations (zh-CN, en)
│   ├── lib/                        # storage (IndexedDB), progress
│   ├── hooks/                      # useTheme, useContentLang, useArticle
│   ├── components/                 # Header, ArticleCard, ParagraphView, ...
│   └── pages/                      # Today, Library, Reader, Me
├── tailwind.config.ts              # Design tokens
├── vite.config.ts                  # PWA + path alias + workbox caching
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

## Content model

Every article has the shape:

```ts
interface Article {
  metadata: ArticleMetadata;        // id, title, author, themes, ...
  translations: {
    'zh-CN'?: Translation;
    'en'?: Translation;
  };
}

interface Translation {
  language: 'zh-CN' | 'en';
  translator?: string;
  source: string;                  // e.g. "《毛泽东选集》第一卷 1991"
  licenseNote: string;             // public domain / source disclosure
  updatedAt: string;
  status: 'draft' | 'reviewed' | 'published';
  paragraphs: Paragraph[];         // each has a stable id
}
```

**Stable paragraph IDs are the spine of bilingual reading.** Every paragraph in every translation of an article shares the same id (`hunan-002`, `op-005`, ...). Bilingual mode aligns by id, not by line number, so the alignment survives edits to either language.

## Two independent languages

- **UI language** (`maobible.ui-lang` in localStorage) — buttons, navigation, settings
- **Content language** (`maobible.content-lang` in localStorage) — which translation of an article to show

These are independent on purpose — see product-plan §5.

## Run / build

```bash
pnpm install
pnpm dev            # Vite dev server on :5173
pnpm build          # tsc -b + vite build → dist/
pnpm preview        # serve built dist/ on :4173
pnpm typecheck      # tsc -b --noEmit
```

## Phase 1 acceptance

- [x] Today / Library / Reader / Me pages
- [x] 3 representative articles, zh-CN + en
- [x] Single-language + paragraph-aligned bilingual reading
- [x] Light + dark theme, system-aware
- [x] Reading progress persisted
- [x] Bookmark + history
- [x] PWA install + offline (workbox cache)
- [x] Source / license disclosed on every article

## Phase 2 plan (next)

- Expand to 20 articles (full Mao selection across volumes)
- 6 themes + 3 curated reading paths
- Full-text search
- Notes editor (currently a stub button)
- Vocabulary glossary for "实践 / 矛盾 / 群众路线" and similar

## Conventions

- Paragraph IDs: `{article-prefix}-{NNN}` (zero-padded 3 digits, e.g. `hunan-001`)
- Translation content: never auto-translate to publish; only `status: 'reviewed' | 'published'` is public
- Sources: every translation must list a concrete source (publisher + year) and a license note
- Components: prefer class-variance-style `className={[...].join(' ')}`; avoid utility libraries beyond Tailwind
