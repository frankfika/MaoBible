/**
 * Local storage — bookmarks + reading progress + chat history. IndexedDB via idb-keyval.
 *
 * Every call is wrapped in a try/catch so a single failure (Safari private
 * mode quota, IDB disabled, WebView without storage) doesn't crash the UI
 * and surface as an unhandled promise rejection. On error we return the
 * "empty" value and let the caller render normally.
 *
 * Schema version is stored at the `maobible:setting:schema-version` key.
 * Bump SCHEMA_VERSION when changing a stored record shape; add a migration
 * step in `migrate()`.
 */
import { get, set, del, keys } from 'idb-keyval';
import type {
  Bookmark,
  ReadingProgress,
  ReadingSession,
  DailyStats,
  ChatThread,
} from '@/types';

const PREFIX = 'maobible:';
const SCHEMA_VERSION = 1;
const SCHEMA_KEY = `${PREFIX}setting:schema-version`;

function key(articleId: string, kind: string) {
  return `${PREFIX}${kind}:${articleId}`;
}
function globalKey(kind: string) {
  return `${PREFIX}${kind}`;
}

/* ---------------- Safe wrappers ---------------- */

export async function safeGet<T>(k: string): Promise<T | undefined> {
  try {
    return await get<T>(k);
  } catch (e) {
    console.warn(`[storage] safeGet(${k}) failed`, e);
    return undefined;
  }
}

export async function safeSet<T>(k: string, v: T): Promise<void> {
  try {
    await set(k, v);
  } catch (e) {
    console.warn(`[storage] safeSet(${k}) failed`, e);
  }
}

export async function safeDel(k: string): Promise<void> {
  try {
    await del(k);
  } catch (e) {
    console.warn(`[storage] safeDel(${k}) failed`, e);
  }
}

/* ---------------- Schema migration ---------------- */

async function migrate(): Promise<void> {
  let current = 0;
  try {
    const stored = await get<number>(SCHEMA_KEY);
    current = typeof stored === 'number' ? stored : 0;
  } catch {
    // First run or IDB unavailable — nothing to migrate.
  }
  if (current >= SCHEMA_VERSION) return;
  // Future migrations would land here as `if (current < 2) { ... }` blocks.
  await safeSet(SCHEMA_KEY, SCHEMA_VERSION);
}

/* ---------------- Bookmarks ---------------- */

export async function getBookmark(articleId: string): Promise<Bookmark | undefined> {
  return safeGet<Bookmark>(key(articleId, 'bookmark'));
}

export async function setBookmark(b: Bookmark): Promise<void> {
  await safeSet(key(b.articleId, 'bookmark'), b);
}

export async function clearBookmark(articleId: string): Promise<void> {
  await safeDel(key(articleId, 'bookmark'));
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const bookmarkKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}bookmark:`),
  );
  const all = await Promise.all(
    bookmarkKeys.map(async (k) => safeGet<Bookmark>(k)),
  );
  return all.filter(
    (x): x is Bookmark => Boolean(x) && typeof (x as Bookmark).articleId === 'string',
  );
}

/* ---------------- Reading progress ---------------- */

export async function getReadingProgress(
  articleId: string,
): Promise<ReadingProgress | undefined> {
  return safeGet<ReadingProgress>(key(articleId, 'progress'));
}

export async function setReadingProgress(p: ReadingProgress): Promise<void> {
  await safeSet(key(p.articleId, 'progress'), p);
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const progressKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}progress:`),
  );
  const all = await Promise.all(
    progressKeys.map(async (k) => safeGet<ReadingProgress>(k)),
  );
  return all.filter(
    (x): x is ReadingProgress =>
      Boolean(x) && typeof (x as ReadingProgress).articleId === 'string',
  );
}

/* ---------------- Reading sessions (history) ---------------- */

/**
 * Convert an ISO timestamp + a duration to a local YYYY-MM-DD bucket key.
 * Previously used `startedAt.slice(0, 10)` which is a UTC date — a 23:59
 * session recorded at 00:01 local was bucketed to the wrong day.
 */
function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function recordSession(s: ReadingSession): Promise<void> {
  await safeSet(`${PREFIX}session:${s.startedAt}`, s);
  // Also update the article's running total
  const progress = await getReadingProgress(s.articleId);
  const totalDurationMs = (progress?.totalDurationMs ?? 0) + s.durationMs;
  await setReadingProgress({
    articleId: s.articleId,
    scrollFraction: progress?.scrollFraction ?? 0,
    lastParagraphId: progress?.lastParagraphId,
    updatedAt: new Date().toISOString(),
    totalDurationMs,
  });
  // Also bump the daily bucket
  await bumpDailyStats(s);
}

async function bumpDailyStats(s: ReadingSession): Promise<void> {
  const date = localDateKey(s.startedAt);
  const cur = (await safeGet<DailyStats>(`${PREFIX}stats:${date}`)) ?? {
    date,
    articlesRead: 0,
    durationMs: 0,
    articleIds: [],
  };
  cur.durationMs += s.durationMs;
  if (!cur.articleIds.includes(s.articleId)) {
    cur.articleIds.push(s.articleId);
    cur.articlesRead = cur.articleIds.length;
  }
  await safeSet(`${PREFIX}stats:${date}`, cur);
}

export async function getDailyStats(days: number = 14): Promise<DailyStats[]> {
  const statsKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}stats:`),
  );
  const all = await Promise.all(
    statsKeys.map(async (k) => safeGet<DailyStats>(k)),
  );
  const stats = all.filter(
    (x): x is DailyStats =>
      Boolean(x) && typeof (x as DailyStats).date === 'string',
  );
  return stats
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
}

/* ---------------- Chat threads ---------------- */

export async function getAllChats(): Promise<ChatThread[]> {
  const chatKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${globalKey('chat')}:`),
  );
  const all = await Promise.all(
    chatKeys.map(async (k) => safeGet<ChatThread>(k)),
  );
  return all
    .filter(
      (x): x is ChatThread =>
        Boolean(x) && typeof (x as ChatThread).id === 'string',
    )
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function saveChat(thread: ChatThread): Promise<void> {
  await safeSet(`${globalKey('chat')}:${thread.id}`, thread);
}

export async function deleteChat(id: string): Promise<void> {
  await safeDel(`${globalKey('chat')}:${id}`);
}

/* ---------------- Settings (UI lang, theme) ---------------- */

export async function getSetting<T>(name: string): Promise<T | undefined> {
  return safeGet<T>(`${globalKey('setting')}:${name}`);
}

export async function setSetting<T>(name: string, value: T): Promise<void> {
  await safeSet(`${globalKey('setting')}:${name}`, value);
}

/* ---------------- Bulk operations (data ownership) ---------------- */

/**
 * Wipe everything. Used by the "清空本机数据" button in Me — the privacy
 * page promises deletion is in-app, so we need a real entry point.
 */
export async function clearAllLocalData(): Promise<void> {
  const allKeys = await keys();
  await Promise.all(
    allKeys
      .filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX))
      .map((k) => safeDel(k)),
  );
  // Re-init schema version so the next session is consistent.
  await safeSet(SCHEMA_KEY, SCHEMA_VERSION);
}

/** Wipe just chat threads (used by "清空对话" in Me / Ask). */
export async function clearAllChats(): Promise<void> {
  const chatKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${globalKey('chat')}:`),
  );
  await Promise.all(chatKeys.map((k) => safeDel(k)));
}

/** Wipe just reading progress (used by "重置阅读进度" in Me). */
export async function clearAllProgress(): Promise<void> {
  const progressKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}progress:`),
  );
  await Promise.all(progressKeys.map((k) => safeDel(k)));
  const sessionKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}session:`),
  );
  await Promise.all(sessionKeys.map((k) => safeDel(k)));
  const statsKeys = (await keys()).filter(
    (k): k is string =>
      typeof k === 'string' && k.startsWith(`${PREFIX}stats:`),
  );
  await Promise.all(statsKeys.map((k) => safeDel(k)));
}

/**
 * Best-effort migration on module load. Idempotent; safe to call
 * repeatedly. Will be auto-promoted to first-call if imported from a
 * page module. (No-op today — kept as a hook for future schema changes.)
 */
void migrate();
