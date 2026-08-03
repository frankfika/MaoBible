/**
 * AI provider configuration — stored in IndexedDB, keyed only on the
 * client. Users bring their own key (BYOK) so we don't need a backend
 * and the app can run in any environment (PWA, native, offline).
 *
 * SECURITY:
 *  - The API key is a user secret. The app stores it in IndexedDB on
 *    the user's device, never transmits it to a third party other
 *    than the provider the user picked. See Privacy page for the
 *    full disclosure.
 *  - Browser-side storage is NOT a vault. A successful XSS could
 *    exfiltrate the key. We rely on React's automatic text-only
 *    rendering (article content is rendered as text, never as HTML)
 *    to keep the XSS surface small.
 *  - We never log the key. Console warnings reference the provider +
 *    model, never the key.
 */

export type ProviderId = 'minimax' | 'openai' | 'anthropic' | 'custom';

export interface AIConfig {
  provider: ProviderId;
  model: string;
  apiKey: string;
  /**
   * Required for `provider: 'custom'`. Ignored for the built-in
   * providers (their base URLs are hard-coded so a typo can't leak
   * the key to an attacker-controlled host).
   */
  baseUrl?: string;
  maxTokens?: number;
  updatedAt: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  docsUrl: string;
  keyFormat: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: ModelOption[];
  /**
   * When true, the user must also supply `baseUrl`. Used for
   * self-hosted proxies (LiteLLM, OpenRouter, a private gateway).
   */
  baseUrlEditable: boolean;
}

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  minimax: {
    id: 'minimax',
    label: 'MiniMax / MiniMax',
    docsUrl: 'https://platform.minimaxi.com/docs/api-reference/text-post',
    keyFormat: 'eyJ... — MiniMax 控制台 → API Keys',
    defaultBaseUrl: 'https://api.minimaxi.com',
    defaultModel: 'MiniMax-Text-01',
    baseUrlEditable: true,
    models: [
      { id: 'MiniMax-Text-01', label: 'MiniMax-Text-01', description: 'MiniMax 主力文本模型' },
      { id: 'MiniMax-Text-01-250515', label: 'MiniMax-Text-01-250515', description: '同上, 2025-05 snapshot' },
    ],
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat/create',
    keyFormat: 'sk-... — OpenAI 控制台 → API keys',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    baseUrlEditable: true,
    models: [
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini', description: '便宜, 快, 适合 4o 质量够用场景' },
      { id: 'gpt-4o', label: 'gpt-4o', description: 'OpenAI 主力' },
      { id: 'gpt-4-turbo', label: 'gpt-4-turbo', description: '稳定, 长上下文' },
      { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', description: '最便宜' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    docsUrl: 'https://docs.anthropic.com/en/api/messages',
    keyFormat: 'sk-ant-... — Anthropic Console → Settings → API Keys',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-haiku-latest',
    baseUrlEditable: true,
    models: [
      { id: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest', description: '便宜, 快' },
      { id: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest', description: '主力' },
      { id: 'claude-3-opus-latest', label: 'claude-3-opus-latest', description: '最强' },
    ],
  },
  custom: {
    id: 'custom',
    label: '自建 / 代理 (OpenAI-compatible)',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
    keyFormat: '由你的代理决定 (可空)',
    defaultBaseUrl: '',
    defaultModel: '',
    baseUrlEditable: true,
    models: [],
  },
};
