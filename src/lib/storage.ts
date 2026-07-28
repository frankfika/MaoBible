/**
 * Local storage layer — bookmarks, highlights, notes, reading progress.
 * Persists in IndexedDB via idb-keyval. Survives reload + works offline.
 */
import { get, set, del, keys } from 'idb-keyval';
import type { Bookmark, Highlight, Note, ReadingProgress } from '@/types';

const PREFIX = 'maobible:';

function key(articleId: string, kind: string) {
  return `${PREFIX}${kind}:${articleId}`;
}

export async function getBookmarks(articleId?: string): Promise<Bookmark[]> {
  if (articleId) {
    const v = await get<Bookmark>(key(articleId, 'bookmark'));
    return v ? [v] : [];
  }
  const all = await Promise.all(
    (await keys()).map(async (k) => get<Bookmark>(k)),
  );
  return all.filter((x): x is Bookmark => Boolean(x));
}

export async function getBookmark(articleId: string): Promise<Bookmark | undefined> {
  return get<Bookmark>(key(articleId, 'bookmark'));
}

export async function setBookmark(b: Bookmark): Promise<void> {
  await set(key(b.articleId, 'bookmark'), b);
}

export async function clearBookmark(articleId: string): Promise<void> {
  await del(key(articleId, 'bookmark'));
}

export async function getReadingProgress(
  articleId: string,
): Promise<ReadingProgress | undefined> {
  return get<ReadingProgress>(key(articleId, 'progress'));
}

export async function setReadingProgress(p: ReadingProgress): Promise<void> {
  await set(key(p.articleId, 'progress'), p);
}

export async function getHighlights(articleId: string): Promise<Highlight[]> {
  return (await get<Highlight[]>(key(articleId, 'highlights'))) ?? [];
}

export async function setHighlights(
  articleId: string,
  list: Highlight[],
): Promise<void> {
  await set(key(articleId, 'highlights'), list);
}

export async function getNotes(articleId: string): Promise<Note[]> {
  return (await get<Note[]>(key(articleId, 'notes'))) ?? [];
}

export async function setNotes(articleId: string, list: Note[]): Promise<void> {
  await set(key(articleId, 'notes'), list);
}
