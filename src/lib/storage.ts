/**
 * Local storage — bookmarks + reading progress. IndexedDB via idb-keyval.
 */
import { get, set, del, keys } from 'idb-keyval';
import type { Bookmark, ReadingProgress } from '@/types';

const PREFIX = 'maobible:';
function key(articleId: string, kind: string) {
  return `${PREFIX}${kind}:${articleId}`;
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

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const all = await Promise.all(
    (await keys()).map(async (k) => get<Bookmark>(k)),
  );
  return all.filter((x): x is Bookmark => Boolean(x));
}

export async function getReadingProgress(articleId: string): Promise<ReadingProgress | undefined> {
  return get<ReadingProgress>(key(articleId, 'progress'));
}

export async function setReadingProgress(p: ReadingProgress): Promise<void> {
  await set(key(p.articleId, 'progress'), p);
}
