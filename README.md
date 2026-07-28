# MaoBible

> 一处安静、可信的多语言毛泽东著作阅读与思想研习空间。
> A quiet, multi-language reader for Selected Works of Mao Zedong.

This is the **Phase 1 prototype** — see `docs/product-plan.md` for the full plan and `AGENTS.md` for the agent-facing project memory.

## What's in Phase 1

- **Today** — daily passage + continue reading
- **Library** — 3 representative articles with theme tags and search
- **Reader** — single-language and paragraph-aligned bilingual reading, swipe to navigate, light/dark, bookmark, reading-progress memory
- **Me** — bookmarks and history
- **PWA** — installable, works offline once loaded

## Quick start

```bash
pnpm install
pnpm dev
# open http://localhost:5173
```

To build a production bundle:

```bash
pnpm build
pnpm preview
```

## Three demo articles

| # | Article | Written | Themes |
| - | ------- | ------- | ------ |
| 1 | 湖南农民运动考察报告 / Report on an Investigation of the Peasant Movement in Hunan | 1927 | 调查, 群众, 组织, 革命 |
| 2 | 实践论 / On Practice | 1937 | 实践, 认识论, 辩证法, 学习 |
| 3 | 矛盾论 / On Contradiction | 1937 | 矛盾, 辩证法, 分析, 方法 |

Each article ships in `public/content/{id}.json` and is loaded at runtime; the service worker caches it for offline use.

## Sources & licensing

Phase 1 demo content is sourced from public-domain / officially-published versions:

- **Chinese** — official text from the People's Publishing House edition, mirrored on 求是网 and 中国共产党新闻网 (CC0 / 官方公开).
- **English** — early Foreign Languages Press translations (1950s, now in the public domain in most jurisdictions); cross-checked against marxists.org and modern scholarly reprints where available.

Every article's footer in the Reader shows the concrete source and license note. Phase 2 will add a full `LICENSES.md` registry with translator credits and exact edition information.

## What's deliberately NOT in Phase 1

- 20+ articles (Phase 2)
- Full-text search across articles (Phase 2)
- Notes editor — current button is a stub
- Theme pages (Explore) and reading paths (Phase 2)
- AI-assisted explanations (Phase 3)
- iOS / Android via Capacitor (Phase 4)

## License

Code: see `LICENSE` (TBD — internal prototype).
Content: each article's source is disclosed in the Reader footer. Public-domain content retains its original status.
