import type { ProviderId } from '@/types/ai-config';

export interface ChatRequest {
  system: string;
  prompt: string;
  model: string;
  maxTokens: number;
  apiKey: string;
  baseUrl: string;
  signal?: AbortSignal;
}

export interface ChatError {
  status: number;
  message: string;
  /** Whether the user can fix this by editing their config. */
  isConfigError: boolean;
}

/**
 * The discriminated outcome of a chat call. We don't throw on HTTP
 * errors — the UI layer inspects `error` and renders either the
 * result text or a "check your API key / provider config" notice.
 */
export type ChatResult =
  | { kind: 'ok'; text: string }
  | { kind: 'err'; error: ChatError };

export interface ProviderAdapter {
  id: ProviderId;
  chat(req: ChatRequest): Promise<ChatResult>;
}
