import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import { getArticleMeta } from '@/data/manifest';

/**
 * Fetches article content from /public/content/{id}.json with a
 * timeout-based retry. The service worker caches these for offline use.
 */
export function useArticle(articleId: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) {
      setLoading(false);
      setError('No article id');
      return;
    }
    const meta = getArticleMeta(articleId);
    if (!meta) {
      setLoading(false);
      setError('Article not found in manifest');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchOnce = async () => {
      const res = await fetch(`/content/${articleId}.json`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as Article;
    };

    fetchOnce()
      .then((a) => {
        if (!cancelled) {
          setArticle(a);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'unknown error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return { article, loading, error };
}
