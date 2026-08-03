# Changelog

All notable changes to MaoBible are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-03

### Added

- 3-tab bottom nav: 书架 (Shelf) / 回应 (Ask) / 我 (Me)
- 22 articles across 1925–1949, transcribed from 人民出版社 1991 年第 2 版
- Bilingual reader with paragraph-aligned zh-CN ⇄ en mode (stable id alignment)
- AI-assisted "回应" mode — two-step paragraph-level RAG over the 22 articles
  (situation matching + paragraph selection + modern-Chinese gloss)
- "问" mode — single-step RAG Q&A over the manifest, with conversation history
- Tap any Chinese paragraph for a modern-Chinese AI explanation
- Daily pick, theme filter, continue-reading card
- 7-day reading-time bar chart on the Me page
- Bookmarks, reading progress, daily stats, cumulative reading time
- UI language toggle (中文 / English), independent of content language
- Dark theme + system-aware default
- PWA install + offline reading (workbox runtime cache for /content/*)
- iOS + Android native builds via Capacitor (bundle id `com.frankfika.maobible`)
- Privacy page (in-app + 3 categories of in-app data deletion)
- Source / license disclosure on every article

### Fixed (audit + remediation pass, 2026-08-03)

- Dark mode CSS selector matched `body.dark` but `useTheme` toggled the class
  on `<html>` — dark variant never applied. Switched to `html.dark body`.
- `useTheme` only applied the stored mode in the first effect tick → FOUC.
  Now `applyTheme` runs synchronously in the mount effect.
- Reader loaded with auto-scrollTo that overrode the user's current scroll
  position. Guarded with a `userTouched` flag — only auto-restore if the
  user hasn't already scrolled.
- `toggleBookmark` always stored `paragraphs[0]?.id`; bookmarks jumped
  users to the top of the article. Now stores the paragraph currently in
  view (with a body-paragraph fallback).
- Reader bilingual mode silently fell back to single column when the
  secondary translation was missing. Added an explicit notice and an
  automatic single-mode fallback.
- ParagraphView switched between `<button>` and `<p>` on content-language
  toggle, causing focus loss and DOM remount. Now stable: always the same
  element type for a given `kind`.
- AI callAI swallowed network / non-2xx / empty-body errors and returned
  a fallback string that the UI displayed as if it were a model answer.
  Now returns `AIResult { text, isFallback }`; UI shows a real "AI 不可用"
  notice when `isFallback`.
- Ask page mode toggle kept the old `stage` text after switching. Added
  an `inflightRef` token so mode-switch / unmount cancels in-flight
  requests and clears loading state.
- `storage.ts` had no try/catch — IndexedDB quota / Safari private mode
  / WebView storage disabled all surfaced as unhandled promise
  rejections. Wrapped every op in `safeGet` / `safeSet` / `safeDel`.
- Cross-day session buckets used UTC ISO date string. Switched to local
  date so a 23:59 → 00:01 session is bucketed to the user's local day.
- Reader hash-jump inner timer (1.6s ring removal) leaked — could fire
  on a detached node after the user navigated away. Stored the timer in
  a ref and cleared it on unmount.
- Reader sticky toolbar overflowed on 320px screens (7 buttons + 1 back
  chevron). Switched to horizontal scroll.
- `InstallAppCard` only matched the iOS user-agent string; iPadOS 13+
  in desktop mode reports `Mac` and was routed to the Android hint.
  Added touch + Mac detection.
- Shelf theme filter reset to "all" on every tab switch (Shelf unmount).
  Persisted in localStorage.
- Me "累计" total minutes included orphan progress records whose
  `articleId` was no longer in the manifest. Now filters by `ARTICLES`.
- Added in-app data controls: clear chats / reset progress / clear all
  local data. Privacy page now points at these instead of telling the
  user to uninstall.
- EN translation status was `reviewed` or `published` on 18/22 articles
  with empty paragraphs or systematic duplicate runs. Downgraded all of
  them to `draft` and recorded the issue in `licenseNote`. The store
  listing now honestly states "draft translation".
- `package.json` version 0.1.0 → 1.0.0; Android `versionCode` / `versionName`,
  iOS `MARKETING_VERSION`, and the privacy page footer all match.
- Reader paragraph-gloss fetches were sequential (`for await`). Switched
  to `Promise.all` so 3 paragraphs × 2s becomes 2s total.
- Added a UI language toggle to the Me page (was: only 4 i18n keys, no
  entry point, so `lng` change did nothing visible).
- Vite `sourcemap: true` was shipping a 1.8 MB sourcemap to the PWA
  bundle. Disabled. Lowered `target: es2020` → `es2019` to match the
  Android WebView floor.
- Added `react.lazy` route splitting; first-paint chunk dropped from
  424 kB to 241 kB.
- AndroidManifest: added `VIBRATE` permission (Haptics needs it on
  Android 12+) and a custom-scheme `com.frankfika.maobible://` deep
  link intent filter.
- iOS Info.plist: dropped `armv7` (rejected by App Store, all iOS 11+
  devices are arm64-only); added `ITSAppIsNonExemptEncryption: false`
  to skip App Store Connect's encryption question on every upload.
- Android `minifyEnabled` / `shrinkResources` flipped to `true` for
  release builds.
- @capacitor/app 0 references in JS — added an `appStateChange`
  listener so we can save reading progress when the user backgrounds
  the app, and `backButton` handling on Android so the Reader back
  chevron and the system back gesture agree.
- `vite.config.ts` workbox precache: removed the orphan
  `available-articles.json` (no source code references it).

### Security / privacy

- Privacy policy rewritten with: operator identity, support + privacy
  contact emails, third-party disclosure (Google Fonts), in-app data
  deletion, regional and minor disclosures, and a data-export note for
  the upcoming export feature.
- IndexedDB schema version field (`maobible:setting:schema-version`)
  with a stub `migrate()` function so future shape changes have a
  single entry point.

### Known limitations

- 18 / 22 English translations remain `status: draft` (machine-generated,
  not human-reviewed). The store listing surfaces this; distribution
  outside the LLM-draft envelope requires a human-reviewed translation
  pass.
- `AI backend` in production: the dev-only `aiMiddleware` (Vite
  plugin) is not present in `vite preview` or the static PWA. The
  runtime falls back to the offline topic-index. To enable real AI in
  production, deploy a `/api/ai` endpoint that accepts `{ prompt,
  system }` and returns `{ text }`, then point `src/services/ai.ts`
  `callAI()` at it.
- iOS `DEVELOPMENT_TEAM` is unset; archive / sign requires the owner
  to pick a team in Xcode and re-archive.
- 中文文本 (人民出版社 1991) public-distribution authorization is
  pending — owner has to obtain a written confirmation or a
  jurisdiction-specific legal opinion.
- 中国大陆 APP 备案 and any 出版类 regulatory filing are pending.

## [0.x] — pre-release prototypes

See git history. Earliest prototype: `ecbd3ce feat: Phase 1 prototype foundation`.
