/**
 * AI service — calls /api/ai/* (Vite dev middleware runs `mmx` server-side).
 * In production, replace with a real backend.
 */
import { ARTICLES } from '@/data/manifest';
import type { ArticleMetadata } from '@/types';

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

export interface SituationAnalysis {
  /** 1-2 句处境分析: "你正在..." */
  summary: string;
  /** 1-3 篇推荐文章 */
  articles: {
    id: string;
    /** 为什么推荐这篇文章, 1 句 */
    why: string;
    /** 推荐看哪几个章节 (来自 manifest themes, 或留空表示整篇都值得看) */
    sections: string[];
  }[];
}

/**
 * Analyze the user's current mood + situation, recommend matching
 * articles from Mao Selected Works. Returns structured JSON.
 */
export async function analyzeSituation(text: string): Promise<SituationAnalysis> {
  const validIds = new Set(ARTICLES.map((a) => a.id));
  const validTitles = ARTICLES.map((a) => `${a.id} 《${a.title}》 (${a.themes.join('/')})`);

  const system = `你是毛选 AI 助手。用户会描述他/她现在的心情和现状。你的任务:

1. 简短识别用户处境 (1-2 句, "你正在..." 开头)
2. 从下面的 22 篇文章中推荐 1-3 篇最贴切的
3. 对每篇: 给一句话说明为什么推荐

**重要**: articles 里的 id 字段必须用下面列表中标注的 id (英文/数字格式, 如 "1930-01-05"), 不是文章标题。比如 id 不能是 "实践论", 必须是 "1937-07"。如果不确定 id, 就不推荐那篇。

sections 字段: 必须是 string 数组, 每个元素是从 manifest themes 里挑的标签 (如 ["实践", "认识论"], ["矛盾", "方法论"], ["整篇"])。sections 不能是对象, 必须是字符串数组。

可推荐的文章 (id - 标题 - 主题):
${validTitles.join('\n')}

严格按 JSON 格式返回, 不要 markdown, 不要解释, 不要用代码块包裹:
{"summary":"...","articles":[{"id":"...","why":"...","sections":["实践","认识论"]}]}`;

  const prompt = `用户的描述:\n${text}\n\n请按要求返回 JSON。`;

  // Use raw fetch here so we can distinguish "AI returned something unparseable"
  // (fall back to keyword match) from "AI backend is unreachable" (throw so the
  // UI can show a real reason instead of pretending the keyword fallback is the
  // AI's answer).
  const raw = await callAIJson(prompt, system);
  try {
    // Try to extract JSON from response (model sometimes wraps it)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : raw;
    const parsed = JSON.parse(jsonText) as SituationAnalysis;

    // Validate: keep only known article ids, normalize sections to string[]
    parsed.articles = (parsed.articles ?? []).filter((a) => validIds.has(a.id));
    parsed.articles = parsed.articles.map((a) => ({
      id: a.id,
      why: typeof a.why === 'string' ? a.why : '',
      // Coerce sections: LLM sometimes returns [{title, content}] instead of strings.
      // Accept any shape and squash to a flat string[].
      sections: Array.isArray(a.sections)
        ? a.sections
            .map((s: any) =>
              typeof s === 'string' ? s : s?.title ?? s?.name ?? s?.theme ?? '',
            )
            .filter((s: string) => s.length > 0)
        : [],
    }));
    if (parsed.articles.length === 0) {
      // Fallback: pick first 2 articles
      parsed.articles = ARTICLES.slice(0, 2).map((a) => ({
        id: a.id,
        why: a.interpretation ?? '',
        sections: a.themes,
      }));
    }
    return {
      summary: parsed.summary || '你的处境已收到, 看看这些文章。',
      articles: parsed.articles.slice(0, 3),
    };
  } catch (e) {
    // Parse failed — fallback to keyword search
    const lower = text.toLowerCase();
    const matched = ARTICLES.filter((a) =>
      a.situations?.some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())),
    ).slice(0, 3);
    const articles = (matched.length > 0 ? matched : ARTICLES.slice(0, 3)).map((a) => ({
      id: a.id,
      why: a.interpretation ?? a.summary ?? '',
      sections: a.themes,
    }));
    return { summary: '这些文章可能对你有用。', articles };
  }
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
