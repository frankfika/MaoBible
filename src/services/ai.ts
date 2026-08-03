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
export async function askAI(question: string): Promise<AIResult> {
  return callAI(
    `问: ${question}\n\n请基于参考文章库回答。如果问题跟毛选无关, 也尽量联系到毛选思想给个简短回答。`,
    SYSTEM_BRAIN,
    () => offlineAnswer(question),
  );
}

/** Explain a Chinese paragraph in modern Chinese. */
export async function explainParagraph(text: string): Promise<AIResult> {
  const system = `你是毛选 AI 助手。把用户给的古文/文言段落用现代白话重新解释, 让现代读者能立刻看懂。150 字以内, 保留原文核心意思, 不要展开。不要使用 markdown 格式 (不要 **加粗**, 不要 # 标题, 直接用中文段落)。`;
  return callAI(
    `原文:\n${text}\n\n请用现代白话解释这段话。`,
    system,
    () =>
      '当前智能解读服务暂时不可用。这段原文仍已完整保存在设备中；建议先结合前后段落阅读，稍后联网后再试白话解读。',
  );
}

/** Summarize an article by id in one paragraph. */
export async function summarizeArticle(articleId: string): Promise<AIResult> {
  const a = ARTICLES.find((x) => x.id === articleId);
  if (!a) return { text: '文章不存在', isFallback: false };
  const system = `你是毛选 AI 助手。给文章写一段 80-150 字的现代白话摘要, 让没读过的人能立刻知道文章讲什么、跟今天有什么关系。`;
  return callAI(
    `文章: 《${a.title}》(${a.writtenAt})\n主题: ${a.themes.join('/')}\n一句话解读: ${a.interpretation ?? ''}\n\n请写一段 80-150 字的现代白话摘要。`,
    system,
    () => a.interpretation ?? a.summary ?? `《${a.title}》主要讨论${a.themes.join('、')}。`,
  );
}

/** Recommend next article based on reading history. */
export async function recommend(readArticleIds: string[]): Promise<AIResult> {
  const read = ARTICLES.filter((a) => readArticleIds.includes(a.id));
  const unread = ARTICLES.filter((a) => !readArticleIds.includes(a.id));
  if (unread.length === 0) {
    return { text: '恭喜你, 已经读完所有 22 篇!', isFallback: false };
  }
  const system = `你是毛选 AI 助手。根据用户已读和未读的文章, 推荐下一篇最适合读的。50-100 字, 给出具体标题和理由。`;
  const prompt = `已读 (${read.length} 篇):
${read.map((a) => `- ${a.title} (${a.themes.join('/')})`).join('\n')}

未读 (${unread.length} 篇), 请从中推荐 1 篇:
${unread.map((a) => `- ${a.title} (${a.themes.join('/')}): ${a.interpretation ?? a.summary ?? ''}`).join('\n')}

请推荐 1 篇, 给出理由。`;
  return callAI(prompt, system, () => {
    const lastRead = read[read.length - 1];
    const next =
      unread.find((a) => lastRead?.themes.some((theme) => a.themes.includes(theme))) ??
      unread[0];
    return `建议下一篇读《${next.title}》。${next.interpretation ?? next.summary ?? `它延续了${next.themes.join('、')}这些主题。`}`;
  });
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
  // Step 1: pick 1-3 articles (single LLM call). The production PWA can
  // still provide a transparent local match when the model endpoint is absent.
  let articlePicks: Array<{ id: string; why: string }>;
  let offline = false;
  try {
    articlePicks = await pickArticles(text);
  } catch {
    offline = true;
    articlePicks = matchArticlesLocally(text).map((article) => ({
      id: article.id,
      why: `根据“${article.themes.slice(0, 2).join('、')}”主题与你描述的处境匹配。`,
    }));
  }
  if (articlePicks.length === 0) {
    return { summary: 'AI 暂时没找到合适的回应, 试试换个说法?', articles: [] };
  }

  // Fetch + pick paragraphs in parallel for all picked articles
  const enriched = await Promise.all(
    articlePicks.map(async (pick) => {
      const article = await fetchArticle(pick.id);
      if (!article) return null;
      const paraPicks = offline
        ? pickParagraphsLocally(text, article.paragraphs)
        : await pickParagraphs(text, article);
      // Resolve paragraph ids → full text + modern gloss in parallel.
      // Was a sequential for-await (P1 perf: 3 paragraphs × 2s = 6s).
      const paragraphs = await Promise.all(
        paraPicks.map(async (pp): Promise<RecommendedParagraph | null> => {
          const p = article.paragraphs.find((x) => x.id === pp.paragraphId);
          if (!p) return null;
          const gloss = offline
            ? `可从“${article.interpretation ?? article.summary ?? article.themes.join('、')}”这一主线理解；点开原文，结合上下文阅读更准确。`
            : (await explainParagraph(p.text)).text;
          return { paragraphId: p.id, whyThis: pp.whyThis, gloss };
        }),
      );
      return {
        id: pick.id,
        why: pick.why,
        paragraphs: paragraphs.filter((x): x is RecommendedParagraph => x !== null),
      };
    }),
  );

  return {
    summary: offline
      ? `智能服务暂时不可用，已用设备内的主题索引为你匹配 ${articlePicks.length} 篇文章。`
      : `你正在面对的状态, 毛选里这 ${articlePicks.length} 篇文章里 ${articlePicks.length === 1 ? '有一段' : '有几段'}话直接回应你。`,
    articles: enriched.filter((a): a is RecommendedArticle => Boolean(a && a.paragraphs.length > 0)),
  };
}

/**
 * The result of an AI call. `isFallback` is true when the network request
 * failed, the response was non-2xx, the body had no text, or the JSON
 * shape was unexpected. The UI can use this to render a real error
 * notice (rather than silently showing the offline fallback as if it
 * were a model answer — that was the source of multiple "I can't tell
 * if AI is broken" reports).
 */
export interface AIResult {
  text: string;
  isFallback: boolean;
}

async function callAI(
  prompt: string,
  system: string,
  fallback: () => string,
): Promise<AIResult> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system }),
    });
    if (!r.ok) {
      return { text: fallback(), isFallback: true };
    }
    const data = (await r.json()) as { text: string };
    if (data && typeof data.text === 'string' && data.text.trim()) {
      return { text: data.text, isFallback: false };
    }
    return { text: fallback(), isFallback: true };
  } catch {
    return { text: fallback(), isFallback: true };
  }
}

const TOPIC_ALIASES: Record<string, string[]> = {
  实践: ['实践', '行动', '执行', '落地', '理论', '学习'],
  矛盾: ['矛盾', '冲突', '关系', '分歧', 'partner'],
  群众: ['群众', '团队', '管理', '组织', '员工', '协作'],
  调查: ['调查', '信息', '事实', '现状', '不清楚', '看不清'],
  战略: ['战略', '坚持', '长期', '困难', '失败', '低谷', '项目'],
  民主: ['民主', '人民', '权力', '制度', '国家'],
  党建: ['党建', '作风', '整风', '文风', '官僚', '形式主义'],
};

function queryTerms(text: string): string[] {
  const terms = new Set<string>();
  for (const [topic, aliases] of Object.entries(TOPIC_ALIASES)) {
    if (aliases.some((alias) => text.toLowerCase().includes(alias.toLowerCase()))) {
      terms.add(topic);
      aliases.forEach((alias) => terms.add(alias));
    }
  }
  return [...terms];
}

function matchArticlesLocally(text: string): ArticleMetadata[] {
  const terms = queryTerms(text);
  const scored = ARTICLES.map((article, index) => {
    const haystack = [
      article.title,
      article.summary,
      article.interpretation,
      ...(article.themes ?? []),
      ...(article.situations ?? []),
    ]
      .filter(Boolean)
      .join(' ');
    const lowerTitle = article.title.toLowerCase();
    const lowerThemes = article.themes.join(' ').toLowerCase();
    const lowerHaystack = haystack.toLowerCase();
    const exactTitleBoost = text.toLowerCase().includes(lowerTitle) ? 8 : 0;
    const score =
      exactTitleBoost +
      terms.reduce((sum, term) => {
        const lowerTerm = term.toLowerCase();
        if (lowerTitle.includes(lowerTerm)) return sum + 4;
        if (lowerThemes.includes(lowerTerm)) return sum + 2;
        if (lowerHaystack.includes(lowerTerm)) return sum + 1;
        return sum;
      }, 0);
    return { article, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const matched = scored.filter((item) => item.score > 0).slice(0, 3);
  return (matched.length > 0 ? matched : scored.slice(0, 2)).map((item) => item.article);
}

function pickParagraphsLocally(
  text: string,
  paragraphs: Paragraph[],
): Array<{ paragraphId: string; whyThis: string }> {
  const terms = queryTerms(text);
  const candidates = paragraphs
    .filter((paragraph) => paragraph.kind !== 'heading' && paragraph.text.length > 30)
    .map((paragraph, index) => ({
      paragraph,
      index,
      score: terms.reduce(
        (sum, term) => sum + (paragraph.text.includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const matched = candidates.filter((item) => item.score > 0).slice(0, 2);
  return (matched.length > 0 ? matched : candidates.slice(0, 1)).map(({ paragraph }) => ({
    paragraphId: paragraph.id,
    whyThis: '这是本地主题索引找到的相关段落，建议结合上下文判断是否贴合你的处境。',
  }));
}

function offlineAnswer(question: string): string {
  const matches = matchArticlesLocally(question).slice(0, 2);
  return [
    '智能服务暂时不可用，先根据设备内的文章索引给你一个阅读方向：',
    ...matches.map(
      (article) =>
        `《${article.title}》：${article.interpretation ?? article.summary ?? article.themes.join('、')}`,
    ),
  ].join('\n');
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
