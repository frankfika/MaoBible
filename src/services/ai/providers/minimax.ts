/**
 * MiniMax / MiniMax API adapter.
 *
 * Endpoint: POST {baseUrl}/v1/text/chatcompletion_v2
 * Auth:     Authorization: Bearer <apiKey>
 * Body:     { model, messages: [{role, content}, ...], max_tokens, temperature? }
 * Response: { base_resp: {status_code, status_msg}, choices: [{message: {content}}], usage? }
 *
 * Note: MiniMax uses a custom error envelope (`base_resp.status_code`
 * != 0 means failure) — we map both HTTP errors and `base_resp`
 * errors to the same ChatError shape.
 */
import type { ChatRequest, ChatResult, ProviderAdapter } from './types';

const ENDPOINT_SUFFIX = '/v1/text/chatcompletion_v2';

export const minimaxProvider: ProviderAdapter = {
  id: 'minimax',
  async chat(req: ChatRequest): Promise<ChatResult> {
    const url = joinUrl(req.baseUrl, ENDPOINT_SUFFIX);
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
      return {
        kind: 'err',
        error: {
          status: response.status,
          message: `HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
          isConfigError: response.status === 401 || response.status === 403,
        },
      };
    }

    const data = (await response.json()) as MiniMaxResponse;
    if (data.base_resp && data.base_resp.status_code !== 0) {
      return {
        kind: 'err',
        error: {
          status: data.base_resp.status_code ?? -1,
          message: data.base_resp.status_msg ?? 'MiniMax API error',
          isConfigError: true,
        },
      };
    }
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) {
      return {
        kind: 'err',
        error: { status: -1, message: 'API returned no text', isConfigError: false },
      };
    }
    return { kind: 'ok', text };
  },
};

interface MiniMaxResponse {
  base_resp?: { status_code?: number; status_msg?: string };
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
