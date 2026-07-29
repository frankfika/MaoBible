/**
 * Local storage — bookmarks + reading progress + chat history. IndexedDB via idb-keyval.
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
function key(articleId: string, kind: string) {
  return `${PREFIX}${kind}:${articleId}`;
}
function globalKey(kind: string) {
  return `${PREFIX}${kind}`;
}

/* ---------------- Bookmarks ---------------- */

export async function getBookmark(articleId: string): Promise<Bookmark | undefined> {
  return get<Bookmark>(key(articleId, 'bookmark'));
}

export async function setBookmark(b: Bookmark): Promise<void> {
  await set(key(b.articleId, 'bookmark'), b);
}

export async function clearBookmark(articleId: string): Promise<void> {
  await del(key(articleId, 'bookmark'));
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const all = await Promise.all(
    (await keys()).map(async (k) => get<Bookmark>(k)),
  );
  return all.filter(
    (x): x is Bookmark => Boolean(x) && typeof (x as Bookmark).articleId === 'string',
  );
}

/* ---------------- Reading progress ---------------- */

export async function getReadingProgress(
  articleId: string,
): Promise<ReadingProgress | undefined> {
  return get<ReadingProgress>(key(articleId, 'progress'));
}

export async function setReadingProgress(p: ReadingProgress): Promise<void> {
  await set(key(p.articleId, 'progress'), p);
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const all = await Promise.all(
    (await keys()).map(async (k) => get<ReadingProgress>(k)),
  );
  return all.filter(
    (x): x is ReadingProgress =>
      Boolean(x) && typeof (x as ReadingProgress).articleId === 'string',
  );
}

/* ---------------- Reading sessions (history) ---------------- */

export async function recordSession(s: ReadingSession): Promise<void> {
  await set(`${PREFIX}session:${s.startedAt}`, s);
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
  const date = s.startedAt.slice(0, 10); // YYYY-MM-DD
  const cur = (await get<DailyStats>(`${PREFIX}stats:${date}`)) ?? {
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
  await set(`${PREFIX}stats:${date}`, cur);
}

export async function getDailyStats(days: number = 14): Promise<DailyStats[]> {
  const all = await Promise.all(
    (await keys()).map(async (k) => get<DailyStats>(k)),
  );
  const stats = all.filter(
    (x): x is DailyStats =>
      Boolean(x) && typeof (x as DailyStats).date === 'string',
  );
  return stats.slice(-days);
}

/* ---------------- Chat threads ---------------- */

export async function getAllChats(): Promise<ChatThread[]> {
  const all = await Promise.all(
    (await keys()).map(async (k) => get<ChatThread>(k)),
  );
  return all
    .filter(
      (x): x is ChatThread =>
        Boolean(x) && typeof (x as ChatThread).id === 'string',
    )
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function saveChat(thread: ChatThread): Promise<void> {
  await set(`${globalKey('chat')}:${thread.id}`, thread);
}

export async function deleteChat(id: string): Promise<void> {
  await del(`${globalKey('chat')}:${id}`);
}

/* ---------------- Settings (UI lang, theme) ---------------- */

export async function getSetting<T>(name: string): Promise<T | undefined> {
  return get<T>(`${globalKey('setting')}:${name}`);
}

export async function setSetting<T>(name: string, value: T): Promise<void> {
  await set(`${globalKey('setting')}:${name}`, value);
}
