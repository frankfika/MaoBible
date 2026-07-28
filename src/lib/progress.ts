/**
 * Re-export of the reading-progress helpers. Kept in lib/ so hooks/pages
 * can import from a stable path while the storage implementation evolves.
 */
export {
  getReadingProgress,
  setReadingProgress,
  getBookmarks,
  setBookmark,
  clearBookmark,
} from './storage';
export type { ReadingProgress as StoredProgress } from '@/types';
