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
