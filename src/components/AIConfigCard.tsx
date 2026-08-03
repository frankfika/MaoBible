import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAIConfig,
  setAIConfig,
  clearAIConfig,
  isConfigValid,
  effectiveBaseUrl,
  maskApiKey,
  defaultModelFor,
} from '@/lib/ai-config';
import { PROVIDERS } from '@/types/ai-config';
import type { AIConfig, ProviderId, ModelOption } from '@/types/ai-config';
import { callProvider } from '@/services/ai';

/**
 * AIConfigCard — user-facing BYOK + multi-provider config.
 *
 * The card is the single entry point for changing AI provider, model,
 * API key, and (for the `custom` provider) the base URL. It also
 * surfaces a "test connection" button so the user can verify their
 * config without leaving the page.
 */
export function AIConfigCard() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [draft, setDraft] = useState<AIConfig | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; message: string }>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAIConfig().then((c) => {
      setConfig(c ?? null);
      if (!c) {
        setDraft({
          provider: 'minimax',
          model: defaultModelFor('minimax'),
          apiKey: '',
          updatedAt: '',
        });
      } else {
        setDraft(c);
      }
    });
  }, []);

  if (!draft) return null;

  const providerMeta = PROVIDERS[draft.provider];
  const isCustom = draft.provider === 'custom';
  const modelList: ModelOption[] = isCustom
    ? [{ id: draft.model, label: draft.model || '(请在下方输入)' }]
    : providerMeta.models;

  const onProviderChange = (next: ProviderId) => {
    const nextMeta = PROVIDERS[next];
    setDraft((d) =>
      d
        ? {
            ...d,
            provider: next,
            model: next === 'custom' ? d.model : nextMeta.defaultModel,
            baseUrl: next === 'custom' ? d.baseUrl ?? '' : undefined,
          }
        : d,
    );
    setTestResult(null);
  };

  const onModelChange = (modelId: string) => {
    setDraft((d) => (d ? { ...d, model: modelId } : d));
    setTestResult(null);
  };

  const onSave = async () => {
    if (!isConfigValid(draft)) {
      setError('请填齐 provider / model / API key。');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setAIConfig({
        provider: draft.provider,
        model: draft.model,
        apiKey: draft.apiKey.trim(),
        baseUrl: draft.baseUrl?.trim() || undefined,
        maxTokens: draft.maxTokens,
      });
      const fresh = await getAIConfig();
      setConfig(fresh ?? null);
      setTestResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    if (!isConfigValid(draft)) {
      setError('请先填齐 provider / model / API key 再测试。');
      return;
    }
    setError(null);
    setTesting(true);
    setTestResult(null);
    try {
      // Save the draft so the dispatcher can read it, then test, then
      // restore the previous config.
      const previous = await getAIConfig();
      await setAIConfig({
        provider: draft.provider,
        model: draft.model,
        apiKey: draft.apiKey.trim(),
        baseUrl: draft.baseUrl?.trim() || undefined,
        maxTokens: draft.maxTokens,
      });
      const r = await callProvider(
        '你是一个测试 assistant。',
        '回复 OK',
        { maxTokens: 32 },
      );
      if (r.isFallback) {
        setTestResult({ ok: false, message: r.text });
      } else {
        setTestResult({ ok: true, message: `成功: 模型回了一句 "${r.text.slice(0, 80)}"` });
      }
      if (previous) {
        await setAIConfig(previous);
      } else {
        await clearAIConfig();
      }
      const fresh = await getAIConfig();
      setConfig(fresh ?? null);
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : '测试失败' });
    } finally {
      setTesting(false);
    }
  };

  const onClear = async () => {
    setError(null);
    await clearAIConfig();
    setConfig(null);
    setDraft({
      provider: 'minimax',
      model: defaultModelFor('minimax'),
      apiKey: '',
      updatedAt: '',
    });
    setTestResult(null);
  };

  const isDirty =
    !config ||
    config.provider !== draft.provider ||
    config.model !== draft.model ||
    config.apiKey !== draft.apiKey.trim() ||
    (config.baseUrl ?? '') !== (draft.baseUrl?.trim() ?? '');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-secondary dark:text-dark-secondary mb-0.5">
            AI 接入状态
          </p>
          <p className="text-sm text-ink dark:text-dark-ink">
            {config && isConfigValid(config) ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-moss mr-1.5 align-middle" />
                {PROVIDERS[config.provider].label} · {config.model} · key {maskApiKey(config.apiKey)}
                {' · '}<span className="text-secondary">{effectiveBaseUrl(config)}</span>
              </>
            ) : (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cinnabar mr-1.5 align-middle" />
                未配置
              </>
            )}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-secondary dark:text-dark-secondary mb-1">
          Provider
        </label>
        <select
          value={draft.provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderId)}
          className="w-full min-h-[40px] rounded-card border border-ink/10 dark:border-dark-line
                     bg-white/60 dark:bg-dark-ink/10 px-3 py-2 text-sm
                     focus:outline-none focus:border-cinnabar/60 transition-colors"
        >
          {(Object.values(PROVIDERS)).map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] text-secondary dark:text-dark-secondary mb-1">
          Model
        </label>
        {isCustom ? (
          <input
            type="text"
            value={draft.model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="例如 gpt-4o-mini / claude-3-5-sonnet-latest"
            className="w-full min-h-[40px] rounded-card border border-ink/10 dark:border-dark-line
                       bg-white/60 dark:bg-dark-ink/10 px-3 py-2 text-sm
                       focus:outline-none focus:border-cinnabar/60 transition-colors"
          />
        ) : (
          <select
            value={draft.model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full min-h-[40px] rounded-card border border-ink/10 dark:border-dark-line
                       bg-white/60 dark:bg-dark-ink/10 px-3 py-2 text-sm
                       focus:outline-none focus:border-cinnabar/60 transition-colors"
          >
            {modelList.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        )}
      </div>

      {(isCustom || providerMeta.baseUrlEditable) && (
        <div>
          <label className="block text-[11px] text-secondary dark:text-dark-secondary mb-1">
            Base URL{!isCustom && <span className="ml-1 text-secondary/70">(可选, 用于自建代理)</span>}
          </label>
          <input
            type="text"
            value={draft.baseUrl ?? ''}
            onChange={(e) => setDraft((d) => (d ? { ...d, baseUrl: e.target.value } : d))}
            placeholder={providerMeta.defaultBaseUrl || 'https://your-proxy.example.com/v1'}
            className="w-full min-h-[40px] rounded-card border border-ink/10 dark:border-dark-line
                       bg-white/60 dark:bg-dark-ink/10 px-3 py-2 text-sm
                       focus:outline-none focus:border-cinnabar/60 transition-colors font-mono"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] text-secondary dark:text-dark-secondary mb-1">
          API Key
          <span className="ml-1 text-secondary/70">({providerMeta.keyFormat})</span>
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={draft.apiKey}
            onChange={(e) => setDraft((d) => (d ? { ...d, apiKey: e.target.value } : d))}
            placeholder="sk-... / eyJ... / sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-h-[40px] rounded-card border border-ink/10 dark:border-dark-line
                       bg-white/60 dark:bg-dark-ink/10 px-3 py-2 text-sm
                       focus:outline-none focus:border-cinnabar/60 transition-colors font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            aria-pressed={showKey}
            className="min-h-[40px] min-w-[40px] px-3 rounded-card border border-ink/10 dark:border-dark-line
                       text-xs hover:border-cinnabar/40 transition-colors"
            title={showKey ? '隐藏' : '显示'}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-secondary dark:text-dark-secondary leading-relaxed">
          Key 仅保存在你本机的 IndexedDB 中, 不上传到任何服务器。
          浏览器存储不构成 vault — 切勿在公共电脑使用。
          {' '}
          <a
            href={providerMeta.docsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-cinnabar/40 hover:text-cinnabar"
          >
            Provider 文档 →
          </a>
        </p>
      </div>

      {error && (
        <p className="rounded-card border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 px-3 py-2 text-[11px] text-cinnabar">
          {error}
        </p>
      )}

      <AnimatePresence>
        {testResult && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={[
              'rounded-card border px-3 py-2 text-[11px] leading-relaxed',
              testResult.ok
                ? 'border-moss/30 bg-moss/5 dark:bg-moss/10 text-moss dark:text-dark-ink/85'
                : 'border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 text-cinnabar',
            ].join(' ')}
          >
            {testResult.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => void onTest()}
          disabled={testing || !isConfigValid(draft)}
          className="min-h-[36px] px-3 rounded-card border border-ink/10 dark:border-dark-line
                     text-sm hover:border-cinnabar/40 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testing ? '测试中…' : '测试连接'}
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !isDirty || !isConfigValid(draft)}
          className="min-h-[36px] px-3 rounded-card bg-cinnabar text-paper text-sm
                     hover:bg-cinnabar/90 active:scale-95 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '保存中…' : '保存配置'}
        </button>
        {config && (
          <button
            type="button"
            onClick={() => void onClear()}
            className="min-h-[36px] px-3 rounded-card border border-ink/10 dark:border-dark-line
                       text-sm text-secondary hover:border-cinnabar/40 hover:text-cinnabar transition-colors"
          >
            清除配置
          </button>
        )}
      </div>
    </div>
  );
}
