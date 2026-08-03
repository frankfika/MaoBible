/**
 * Anthropic Messages API adapter.
 *
 * Endpoint: POST {baseUrl}/v1/messages
 * Auth:     x-api-key: <apiKey>, anthropic-version: 2023-06-01
 * Body:     { model, system?, messages: [{role, content}], max_tokens }
 * Response: { content: [{type: 'text', text}], stop_reason, usage }
 */
import type { ChatRequest, ChatResult, ProviderAdapter } from './types';

const ENDPOINT_SUFFIX = '/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export const anthropicProvider: ProviderAdapter = {
  id: 'anthropic',
  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = joinUrl(req.baseUrl, ENDPOINT_SUFFIX);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: req.model,
          max_tokens: req.maxTokens,
          system: req.system || undefined,
          messages: [{ role: 'user', content: req.prompt }],
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

    const data = (await response.json()) as AnthropicResponse;
    const text = data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('') ?? '';
    if (!text) {
      return {
        kind: 'err',
        error: { status: -1, message: 'API returned no text', isConfigError: false },
      };
    }
    return { kind: 'ok', text };
  },
};

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
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
