/**
 * OpenAI Chat Completions adapter.
 *
 * Endpoint: POST {baseUrl}/chat/completions
 * Auth:     Authorization: Bearer <apiKey>
 * Body:     { model, messages: [{role, content}, ...], max_tokens, temperature? }
 * Response: { choices: [{message: {content}}], usage? }
 *
 * This same shape is also what LiteLLM / OpenRouter / vLLM / Ollama's
 * OpenAI-compatible mode expose, so the `custom` provider reuses this
 * adapter.
 */
import type { ChatRequest, ChatResult, ProviderAdapter } from './types';

export const openaiProvider: ProviderAdapter = {
  id: 'openai',
  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = joinUrl(req.baseUrl, '/chat/completions');
    return postAndParse(url, req);
  },
};

/**
 * For the `custom` provider, the user supplies baseUrl. We assume the
 * server speaks the OpenAI chat completions protocol. If it doesn't,
 * the user can switch to one of the built-in providers.
 */
export const customOpenAIProvider: ProviderAdapter = {
  id: 'custom',
  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = joinUrl(req.baseUrl, '/chat/completions');
    return postAndParse(url, req);
  },
};

async function postAndParse(url: string, req: ChatRequest): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens,
        messages: [
          ...(req.system ? [{ role: 'system', content: req.system }] : []),
          { role: 'user', content: req.prompt },
        ],
      }),
      signal: req.signal,
    });
  } catch (e) {
    return {
      kind: 'err',
      error: {
        status: 0,
        message: e instanceof Error ? e.message : 'network error',
        isConfigError: false,
      },
    };
  }

  if (!response.ok) {
    const body = await safeBody(response);
    let parsed: { error?: { message?: string } } | null = null;
    if (body) {
      try { parsed = JSON.parse(body); } catch { /* not JSON */ }
    }
    return {
      kind: 'err',
      error: {
        status: response.status,
        message: parsed?.error?.message ?? `HTTP ${response.status}`,
        isConfigError: response.status === 401 || response.status === 403,
      },
    };
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) {
    return {
      kind: 'err',
      error: { status: -1, message: 'API returned no text', isConfigError: false },
    };
  }
  return { kind: 'ok', text };
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function joinUrl(base: string, suffix: string): string {
  if (!base) return suffix;
  return base.replace(/\/+$/, '') + suffix;
}

async function safeBody(response: Response): Promise<string | null> {
  try {
    return await response.text();
  } catch {
    return null;
  }
}
