/**
 * AI service — calls /api/ai/* (Vite dev middleware runs `mmx` server-side).
 * In production, replace with a real backend.
 */
import { ARTICLES } from '@/data/manifest';
import type { ArticleMetadata, Paragraph } from '@/types';

const ARTICLES_CONTEXT = ARTICLES.map(articleContextLine).join('\n');

function articleContextLine(a: ArticleMetadata): string {
  return `- ${a.title} (${a.writtenAt}) [${a.themes.join('/')}]: ${a.interpretation ?? a.summary ?? ''}`;
}

const SYSTEM_BRAIN = `你是毛选 AI 助手。毛选是人民出版社 1991 年公开版的《毛泽东选集》22 篇文章, 包括实践论、矛盾论、论持久战、新民主主义论、为人民服务等。

参考文章库:
${ARTICLES_CONTEXT}

回答要求:
1. 用现代白话, 简洁直接, 200 字以内
2. 引用具体文章时给出标题
3. 不要编造, 不确定就说不确定
4. 用第一人称口吻("我觉得", "从原文看"), 亲切自然
5. **不要使用 markdown 格式** (不要 **加粗**, 不要 # 标题, 不要列表, 直接用中文段落)`;

/** Ask AI a question, RAG-style over 22 articles. */
export async function askAI(question: string): Promise<string> {
  return callAI(
    `问: ${question}\n\n请基于参考文章库回答。如果问题跟毛选无关, 也尽量联系到毛选思想给个简短回答。`,
    SYSTEM_BRAIN,
  );
}

/** Explain a Chinese paragraph in modern Chinese. */
export async function explainParagraph(text: string): Promise<string> {
  const system = `你是毛选 AI 助手。把用户给的古文/文言段落用现代白话重新解释, 让现代读者能立刻看懂。150 字以内, 保留原文核心意思, 不要展开。不要使用 markdown 格式 (不要 **加粗**, 不要 # 标题, 直接用中文段落)。`;
  return callAI(
    `原文:\n${text}\n\n请用现代白话解释这段话。`,
    system,
  );
}

/** Summarize an article by id in one paragraph. */
export async function summarizeArticle(articleId: string): Promise<string> {
  const a = ARTICLES.find((x) => x.id === articleId);
  if (!a) return '文章不存在';
  const system = `你是毛选 AI 助手。给文章写一段 80-150 字的现代白话摘要, 让没读过的人能立刻知道文章讲什么、跟今天有什么关系。`;
  return callAI(
    `文章: 《${a.title}》(${a.writtenAt})\n主题: ${a.themes.join('/')}\n一句话解读: ${a.interpretation ?? ''}\n\n请写一段 80-150 字的现代白话摘要。`,
    system,
  );
}

/** Recommend next article based on reading history. */
export async function recommend(readArticleIds: string[]): Promise<string> {
  const read = ARTICLES.filter((a) => readArticleIds.includes(a.id));
  const unread = ARTICLES.filter((a) => !readArticleIds.includes(a.id));
  if (unread.length === 0) return '恭喜你, 已经读完所有 22 篇!';
  const system = `你是毛选 AI 助手。根据用户已读和未读的文章, 推荐下一篇最适合读的。50-100 字, 给出具体标题和理由。`;
  const prompt = `已读 (${read.length} 篇):
${read.map((a) => `- ${a.title} (${a.themes.join('/')})`).join('\n')}

未读 (${unread.length} 篇), 请从中推荐 1 篇:
${unread.map((a) => `- ${a.title} (${a.themes.join('/')}): ${a.interpretation ?? a.summary ?? ''}`).join('\n')}

请推荐 1 篇, 给出理由。`;
  return callAI(prompt, system);
}

export interface RecommendedParagraph {
  paragraphId: string;
  /** 一句话说明为什么这一段对你有用 */
  whyThis: string;
  /** 现代白话解释 (50-100 字) */
  gloss: string;
}

export interface RecommendedArticle {
  id: string;
  /** 为什么推荐这篇文章, 1 句 */
  why: string;
  /** 1-3 段最贴的段落 (paragraph id + 引用 + 白话) */
  paragraphs: RecommendedParagraph[];
}

export interface SituationAnalysis {
  /** 1-2 句处境分析: "你正在..." */
  summary: string;
  /** 1-3 篇推荐文章 + 段落引用 */
  articles: RecommendedArticle[];
}

const PARAGRAPH_GIST_CHARS = 60;

/**
 * Step 1 of situation analysis: pick 1-3 articles from 22 (using manifest
 * metadata only — fast, no need to fetch full articles).
 */
async function pickArticles(text: string): Promise<Array<{ id: string; why: string }>> {
  const validIds = new Set(ARTICLES.map((a) => a.id));
  const catalog = ARTICLES.map((a) => {
    const situations = a.situations?.length ? ` 适用处境: ${a.situations.slice(0, 4).join('; ')}` : '';
    return `${a.id} 《${a.title}》 [${a.themes.join('/')}] — ${a.interpretation ?? a.summary ?? ''}${situations}`;
  }).join('\n');

  const system = `你是毛选阅读助手。用户会描述他/她现在的状态/卡点/面对的问题。你需要从下面 22 篇文章中选出 1-3 篇最贴的, 简短说明为什么。

**关键约束**:
- 只能用下面 "文章目录" 里标注的 id (slug 格式如 spark-1930, on-contradiction-1937, protracted-war-1938), 绝不能是中文标题, 也不能自己编 (如 "1930-01" 不是合法 id)
- why 一句话, 扣用户的具体处境
- 严格 JSON, 不要 markdown 不要解释: {"articles":[{"id":"...","why":"..."}]}

文章目录 (id 是上面那种 slug, 只能从这里挑):
${catalog}`;

  const raw = await callAIJson(`用户描述:\n${text}\n\n请选 1-3 篇最贴的, 返回 JSON。`, system);
  const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    parsed = { articles: [] };
  }
  const articles = (parsed.articles ?? [])
    .filter((a: any) => validIds.has(a.id))
    .map((a: any) => ({ id: a.id, why: typeof a.why === 'string' ? a.why : '' }))
    .slice(0, 3);

  if (articles.length === 0) {
    // Last-resort fallback: pick first 2 articles
    return ARTICLES.slice(0, 2).map((a) => ({
      id: a.id,
      why: a.interpretation ?? '',
    }));
  }
  return articles;
}

/**
 * Fetch the full Article (with paragraphs) for an article id.
 */
async function fetchArticle(articleId: string): Promise<ArticleMetadata & { paragraphs: Paragraph[] } | null> {
  try {
    const r = await fetch(`/content/${articleId}.json`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const d = await r.json();
    const paras: Paragraph[] = d?.translations?.['zh-CN']?.paragraphs ?? [];
    const meta = ARTICLES.find((a) => a.id === articleId);
    if (!meta || paras.length === 0) return null;
    return { ...meta, paragraphs: paras };
  } catch {
    return null;
  }
}

/**
 * Step 2 of situation analysis: for each article, pick 1-3 paragraphs that
 * speak most directly to the user's situation. Returns paragraph ids.
 */
async function pickParagraphs(
  text: string,
  article: ArticleMetadata & { paragraphs: Paragraph[] },
): Promise<Array<{ paragraphId: string; whyThis: string }>> {
  // Build a paragraph catalog: id + first N chars of text.
  // We skip heading paragraphs whose body is super long (those are chapter
  // intros, not specific lines) and focus on regular body paragraphs.
  const catalog = article.paragraphs
    .filter((p) => p.text.length > 30)
    .slice(0, 200) // hard cap to keep prompt small
    .map((p) => {
      const gist = p.text.length > PARAGRAPH_GIST_CHARS
        ? p.text.slice(0, PARAGRAPH_GIST_CHARS) + '…'
        : p.text;
      return `${p.id} | ${gist}`;
    })
    .join('\n');

  const system = `你是毛选阅读助手。用户在读《${article.title}》。你从下面这篇文章的段落里, 挑出 1-3 段**直接回应用户处境**的。优先选 body 段 (非 heading), 因为 heading 通常是章节标题而非观点。

**关键约束**:
- paragraphId 必须从下面段落目录里挑真实存在的 id, 不能编
- whyThis 一句话, 说"这一段直接对应用户的什么处境", **不要在 whyThis 里用任何引号** (包括双引号和单引号), 用顿号 / 句号 分隔
- 严格 JSON, 不要 markdown: {"paragraphs":[{"paragraphId":"...","whyThis":"..."}]}

段落目录 (id | 摘要):
${catalog}`;

  try {
    const raw = await callAIJson(`用户处境:\n${text}\n\n请从《${article.title}》里挑 1-3 段最贴的段落, 返回 JSON。`, system);
    const validIds = new Set(article.paragraphs.map((p) => p.id));
    // Try strict parse first; if it fails (LLM often puts unescaped quotes in
    // whyThis), fall back to regex-extracting paragraphIds.
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
    try {
      const parsed = JSON.parse(jsonText) as { paragraphs?: Array<{ paragraphId?: string; whyThis?: string }> };
      return (parsed.paragraphs ?? [])
        .filter((p) => p.paragraphId && validIds.has(p.paragraphId))
        .map((p) => ({ paragraphId: p.paragraphId!, whyThis: p.whyThis ?? '' }))
        .slice(0, 3);
    } catch {
      // Looser fallback: extract any id-like tokens that look like paragraph ids
      const idPattern = new RegExp(`\\b(${article.paragraphs.map((p) => p.id.replace(/[-]/g, '\\-')).join('|')})\\b`, 'g');
      const ids: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = idPattern.exec(raw)) !== null) {
        if (!ids.includes(m[1])) ids.push(m[1]);
        if (ids.length >= 3) break;
      }
      return ids.map((id) => ({ paragraphId: id, whyThis: '' }));
    }
  } catch {
    return [];
  }
}

/**
 * Analyze the user's current situation using two-step LLM:
 *   1) Pick 1-3 articles from 22 (manifest-level).
 *   2) For each article, pick 1-3 specific paragraphs that directly speak
 *      to the user's situation.
 * Returns paragraph-level recommendations with a modern-Chinese gloss for
 * each (so the user can read the original + understand it immediately).
 */
export async function analyzeSituation(text: string): Promise<SituationAnalysis> {
  // Step 1: pick 1-3 articles (single LLM call)
  const articlePicks = await pickArticles(text);
  if (articlePicks.length === 0) {
    return { summary: 'AI 暂时没找到合适的回应, 试试换个说法?', articles: [] };
  }

  // Fetch + pick paragraphs in parallel for all picked articles
  const enriched = await Promise.all(
    articlePicks.map(async (pick) => {
      const article = await fetchArticle(pick.id);
      if (!article) return null;
      const paraPicks = await pickParagraphs(text, article);
      // Resolve paragraph ids → full text + modern gloss
      const paragraphs: RecommendedParagraph[] = [];
      for (const pp of paraPicks) {
        const p = article.paragraphs.find((x) => x.id === pp.paragraphId);
        if (!p) continue;
        // Modern gloss in parallel
        let gloss = '';
        try {
          gloss = await explainParagraph(p.text);
        } catch {
          gloss = '(AI 解释暂不可用)';
        }
        paragraphs.push({ paragraphId: p.id, whyThis: pp.whyThis, gloss });
      }
      return { id: pick.id, why: pick.why, paragraphs };
    }),
  );

  return {
    summary: `你正在面对的状态, 毛选里这 ${articlePicks.length} 篇文章里 ${articlePicks.length === 1 ? '有一段' : '有几段'}话直接回应你。`,
    articles: enriched.filter((a): a is RecommendedArticle => Boolean(a && a.paragraphs.length > 0)),
  };
}

async function callAI(prompt: string, system: string): Promise<string> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system }),
    });
    if (!r.ok) {
      return `抱歉, AI 暂时不可用 (HTTP ${r.status})`;
    }
    const data = (await r.json()) as { text: string };
    return data.text || '抱歉, AI 暂时不可用';
  } catch (e) {
    return '抱歉, AI 暂时不可用 (network error)';
  }
}

/**
 * Like callAI but throws on failure. Use for JSON-parsed endpoints where a
 * friendly error string would silently become a "fake" parse fallback.
 */
async function callAIJson(prompt: string, system: string): Promise<string> {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, system }),
  });
  if (!r.ok) {
    throw new Error(`AI backend returned HTTP ${r.status}`);
  }
  const data = (await r.json()) as { text: string };
  if (!data.text) {
    throw new Error('AI backend returned empty response');
  }
  return data.text;
}
