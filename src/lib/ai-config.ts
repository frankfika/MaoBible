/**
 * AI configuration storage — thin wrapper over the safe storage layer.
 *
 * The config is stored under a single key in IndexedDB. We intentionally
 * don't split fields across keys so the user can clear the whole thing
 * in one call.
 */
import { safeGet, safeSet, safeDel } from './storage';
import type { AIConfig, ProviderId } from '@/types/ai-config';
import { PROVIDERS } from '@/types/ai-config';

const KEY = 'maobible:setting:ai-config';

export async function getAIConfig(): Promise<AIConfig | undefined> {
  return safeGet<AIConfig>(KEY);
}

export async function setAIConfig(config: Omit<AIConfig, 'updatedAt'>): Promise<void> {
  await safeSet(KEY, { ...config, updatedAt: new Date().toISOString() } satisfies AIConfig);
}

export async function clearAIConfig(): Promise<void> {
  await safeDel(KEY);
}

export function isConfigValid(config: AIConfig | undefined): config is AIConfig {
  if (!config) return false;
  if (!config.provider) return false;
  if (!config.model) return false;
  if (!config.apiKey) return false;
  if (config.provider === 'custom' && !config.baseUrl) return false;
  return true;
}

/**
 * Resolve the effective baseUrl for a config. Returns the user-supplied
 * baseUrl if present, otherwise the provider's default.
 */
export function effectiveBaseUrl(config: AIConfig): string {
  if (config.baseUrl && config.baseUrl.trim()) return config.baseUrl.trim();
  return PROVIDERS[config.provider as ProviderId]?.defaultBaseUrl ?? '';
}

/**
 * Re-snapshot the default model for a provider — used when the user
 * switches providers and the new provider's default is different from
 * the old one.
 */
export function defaultModelFor(provider: ProviderId): string {
  return PROVIDERS[provider]?.defaultModel ?? '';
}

/**
 * Mask an API key for display. Shows the first 3 and last 4 characters;
 * replaces the middle with dots. Returns '未配' for an empty key.
 */
export function maskApiKey(key: string): string {
  if (!key) return '未配';
  if (key.length <= 8) return '•'.repeat(key.length);
  return `${key.slice(0, 3)}${'•'.repeat(Math.min(8, key.length - 7))}${key.slice(-4)}`;
}
