import React from 'react';
import type { ProviderSelection } from '@/ai/provider';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';
import { createAnalysisProvider } from '@/application/providers/factories';
import { proxyFetch } from '@/ai/proxyFetch';

interface SettingsPanelProps {
  open: boolean;
  providers: ProviderSelection;
  onChange: (providers: ProviderSelection) => void | Promise<void>;
  onClose: () => void;
  language: UiLanguage;
}

type CheckState = 'idle' | 'checking' | 'success' | 'failed';

const copy = {
  en: {
    title: 'Settings',
    subtitle: 'Configure providers before running analysis and transcription.',
    analysisProvider: 'Analysis provider',
    analysisKey: 'Analysis API key',
    transcriptProvider: 'Transcript provider',
    groqKey: 'Groq API key for transcription',
    helper: 'Speech-to-text uses Groq Whisper. Slide image generation uses the ChatGPT adapter.',
    cancel: 'Cancel',
    confirm: 'Confirm settings',
    checkingTitle: 'Checking API',
    checkingDetail: 'Validating provider settings...',
    successTitle: 'Settings ready',
    successDetail: 'API check passed. Settings are now active.',
    failedTitle: 'API check failed',
    failedDetail: 'Check the provider, model, API key, and network permission.',
    processing: 'Processing',
    tryAgain: 'Back to settings',
    author: 'Author:',
    groqSkipped: 'Groq check is skipped when no transcription key is provided.',
  },
  vi: {
    title: 'Cài đặt',
    subtitle: 'Cấu hình provider trước khi analyze và transcription.',
    analysisProvider: 'Analysis provider',
    analysisKey: 'Analysis API key',
    transcriptProvider: 'Transcript provider',
    groqKey: 'Groq API key cho transcription',
    helper: 'Speech-to-text dùng Groq Whisper. Tạo ảnh slide dùng ChatGPT adapter.',
    cancel: 'Hủy',
    confirm: 'Confirm settings',
    checkingTitle: 'Đang check API',
    checkingDetail: 'Đang kiểm tra provider settings...',
    successTitle: 'Settings sẵn sàng',
    successDetail: 'API check đã pass. Settings đã được sử dụng.',
    failedTitle: 'API check lỗi',
    failedDetail: 'Kiểm tra provider, model, API key và network permission.',
    processing: 'Đang xử lý',
    tryAgain: 'Quay lại settings',
    author: 'Author:',
    groqSkipped: 'Bỏ qua Groq check nếu chưa nhập transcription key.',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function SettingsPanel({ open, providers, onChange, onClose, language }: SettingsPanelProps) {
  const [draft, setDraft] = React.useState<ProviderSelection>(providers);
  const [checkState, setCheckState] = React.useState<CheckState>('idle');
  const [checkMessage, setCheckMessage] = React.useState('');
  const t = copy[language];

  React.useEffect(() => {
    if (!open) return;
    setDraft(providers);
    setCheckState('idle');
    setCheckMessage('');
  }, [open, providers]);

  const updateDraft = React.useCallback((next: ProviderSelection) => {
    setDraft(next);
    setCheckState('idle');
    setCheckMessage('');
  }, []);

  const validateSettings = React.useCallback(async () => {
    const analysisProvider = createAnalysisProvider(draft.analysis);
    const analysisOk = await analysisProvider.isAvailable();
    if (!analysisOk) {
      throw new Error(`${analysisProvider.name} is not available. Check API key, model, or base URL.`);
    }

    if (draft.transcript.apiKey?.trim()) {
      const res = await proxyFetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${draft.transcript.apiKey}` },
      });
      if (!res.ok) {
        throw new Error(`Groq Whisper check failed ${res.status}: ${res.body || 'Invalid API key or network error.'}`);
      }
    }
  }, [draft]);

  const handleConfirm = React.useCallback(async () => {
    setCheckState('checking');
    setCheckMessage(t.checkingDetail);
    try {
      await validateSettings();
      await onChange(draft);
      setCheckState('success');
      setCheckMessage(draft.transcript.apiKey?.trim() ? t.successDetail : `${t.successDetail} ${t.groqSkipped}`);
      window.setTimeout(() => {
        setCheckState('idle');
        onClose();
      }, 1100);
    } catch (err: any) {
      setCheckState('failed');
      setCheckMessage(err?.message || t.failedDetail);
    }
  }, [draft, onChange, onClose, t, validateSettings]);

  if (!open) return null;

  if (checkState === 'checking' || checkState === 'success' || checkState === 'failed') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-md">
        <div className="w-full max-w-[340px] rounded-[28px] border border-border bg-panel p-5 text-center shadow-2xl shadow-black/60">
          <div className="mx-auto h-36 w-36">
            {checkState === 'checking' && <SettingsLoading />}
            {checkState === 'success' && <SettingsDone />}
            {checkState === 'failed' && <SettingsFail />}
          </div>
          <div className="mt-3 text-base font-bold">
            {checkState === 'checking' ? t.checkingTitle : checkState === 'success' ? t.successTitle : t.failedTitle}
          </div>
          <div className="mt-1 text-xs leading-5 text-secondary">{checkMessage}</div>
          {checkState === 'checking' && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-secondary">
                <span>{t.processing}</span>
                <span>API</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-accent" />
              </div>
            </div>
          )}
          {checkState === 'failed' && (
            <button
              type="button"
              onClick={() => setCheckState('idle')}
              className="mt-5 rounded-full border border-border bg-card px-5 py-2 text-xs font-semibold hover:border-accent/70"
            >
              {t.tryAgain}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <section className="max-h-[88vh] w-full max-w-[620px] overflow-hidden rounded-[28px] border border-border bg-bg shadow-2xl shadow-black/70">
        <header className="flex items-start justify-between gap-3 border-b border-border bg-panel p-4">
          <div>
            <div className="text-base font-black tracking-tight">{t.title}</div>
            <p className="mt-1 text-xs leading-5 text-secondary">{t.subtitle}</p>
            <div className="mt-2 text-xs text-secondary">
              {t.author} <a href="https://t.me/modos_space" target="_blank" rel="noreferrer" className="font-bold text-accent hover:text-primary">Modos.space</a>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-accent/70">
            {t.cancel}
          </button>
        </header>

        <div className="max-h-[calc(88vh-150px)] overflow-y-auto p-4 space-y-3">
          <div className="rounded-[20px] border border-border bg-card p-3">
            <label className="space-y-1 text-xs text-secondary">
              {t.analysisProvider}
              <select
                value={draft.analysis.kind}
                onChange={(e) => {
                  const kind = e.target.value as ProviderSelection['analysis']['kind'];
                  updateDraft({
                    ...draft,
                    analysis: {
                      ...draft.analysis,
                      kind,
                      model: kind === 'openrouter' ? 'anthropic/claude-sonnet-4' : kind === 'openai' ? 'gpt-4o' : kind === 'ollama-cloud' ? 'gemini-3-flash-preview' : '',
                      baseUrl: kind === 'ollama-cloud' ? draft.analysis.baseUrl || 'https://ollama.com' : draft.analysis.baseUrl,
                    },
                  });
                }}
                className="w-full bg-bg border border-border rounded-btn px-2 py-2 text-primary"
              >
                <option value="mock">Mock</option>
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="ollama-cloud">Ollama Cloud</option>
              </select>
            </label>
            {draft.analysis.kind !== 'mock' && (
              <label className="mt-2 block space-y-1 text-xs text-secondary">
                {t.analysisKey}
                <input
                  type="password"
                  value={draft.analysis.apiKey || ''}
                  onChange={(e) => updateDraft({
                    ...draft,
                    analysis: {
                      ...draft.analysis,
                      apiKey: e.target.value,
                    },
                  })}
                  className="w-full bg-bg border border-border rounded-btn px-2 py-2 text-primary"
                />
              </label>
            )}
          </div>

          <div className="rounded-[20px] border border-border bg-card p-3">
            <label className="space-y-1 text-xs text-secondary block">
              {t.transcriptProvider}
              <div className="w-full bg-bg border border-border rounded-btn px-2 py-2 text-primary">Groq Whisper</div>
            </label>
            <label className="space-y-1 text-xs text-secondary block mt-2">
              {t.groqKey}
              <input
                type="password"
                value={draft.transcript.apiKey || ''}
                onChange={(e) => updateDraft({
                  ...draft,
                  transcript: {
                    ...draft.transcript,
                    apiKey: e.target.value,
                  },
                })}
                className="w-full bg-bg border border-border rounded-btn px-2 py-2 text-primary"
              />
              <span className="block text-[10px] text-secondary mt-1">{t.helper}</span>
            </label>
          </div>

        </div>

        <footer className="border-t border-border bg-panel p-4">
          <button
            type="button"
            onClick={() => { void handleConfirm(); }}
            className="w-full rounded-full bg-accent py-3 text-sm font-black text-black hover:brightness-110"
          >
            {t.confirm}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="relative h-full w-full">
      <span className="analyze-ring analyze-ring-outer" />
      <span className="analyze-ring analyze-ring-mid" />
      <span className="analyze-ring analyze-ring-inner" />
      <span className="analyze-core" />
    </div>
  );
}

function SettingsDone() {
  return (
    <svg className="done-check" viewBox="0 0 160 160" role="img" aria-label="Settings ready">
      <circle className="done-check-ring" cx="80" cy="80" r="58" />
      <path className="done-check-mark" d="M48 82 L70 104 L114 56" />
    </svg>
  );
}

function SettingsFail() {
  return (
    <svg className="fail-check" viewBox="0 0 160 160" role="img" aria-label="Settings check failed">
      <circle className="fail-check-ring" cx="80" cy="80" r="58" />
      <path className="fail-check-mark fail-check-a" d="M55 55 L105 105" />
      <path className="fail-check-mark fail-check-b" d="M105 55 L55 105" />
    </svg>
  );
}
