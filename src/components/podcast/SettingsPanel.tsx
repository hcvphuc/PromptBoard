import React from 'react';
import type { ProviderSelection } from '@/ai/provider';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface SettingsPanelProps {
  providers: ProviderSelection;
  onChange: (providers: ProviderSelection) => void;
  language: UiLanguage;
}

const copy = {
  en: {
    analysisProvider: 'Analysis provider',
    analysisKey: 'Analysis API key',
    analysisModel: 'Analysis model',
    ollamaBase: 'Ollama Cloud base URL',
    transcriptProvider: 'Transcript provider',
    groqKey: 'Groq API key for transcription',
    helper: 'Speech-to-text uses Groq Whisper. Slide image generation uses the ChatGPT adapter.',
  },
  vi: {
    analysisProvider: 'Analysis provider',
    analysisKey: 'Analysis API key',
    analysisModel: 'Analysis model',
    ollamaBase: 'Ollama Cloud base URL',
    transcriptProvider: 'Transcript provider',
    groqKey: 'Groq API key cho transcription',
    helper: 'Speech-to-text dùng Groq Whisper. Tạo ảnh slide dùng ChatGPT adapter.',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function SettingsPanel({ providers, onChange, language }: SettingsPanelProps) {
  const t = copy[language];
  return (
    <section className="p-3 border-b border-border bg-panel space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs text-secondary">
          {t.analysisProvider}
          <select
            value={providers.analysis.kind}
            onChange={(e) => {
              const kind = e.target.value as ProviderSelection['analysis']['kind'];
              onChange({
                ...providers,
                analysis: {
                  ...providers.analysis,
                  kind,
                  model: kind === 'openrouter' ? 'anthropic/claude-sonnet-4' : kind === 'openai' ? 'gpt-4o' : kind === 'ollama-cloud' ? 'gemini-3-flash-preview' : '',
                  baseUrl: kind === 'ollama-cloud' ? providers.analysis.baseUrl || 'https://ollama.com' : providers.analysis.baseUrl,
                },
              });
            }}
            className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary"
          >
            <option value="mock">Mock</option>
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
            <option value="ollama-cloud">Ollama Cloud</option>
          </select>
        </label>
        {providers.analysis.kind !== 'mock' && (
          <label className="space-y-1 text-xs text-secondary">
            {t.analysisKey}
            <input
              type="password"
              value={providers.analysis.apiKey || ''}
              onChange={(e) => onChange({
                ...providers,
                analysis: {
                  ...providers.analysis,
                  apiKey: e.target.value,
                },
              })}
              className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary"
            />
          </label>
        )}
      </div>
      {providers.analysis.kind !== 'mock' && (
        <div className="grid grid-cols-1 gap-2">
          <label className="space-y-1 text-xs text-secondary">
            {t.analysisModel}
            <input
              value={providers.analysis.model || ''}
              onChange={(e) => onChange({
                ...providers,
                analysis: {
                  ...providers.analysis,
                  model: e.target.value,
                },
              })}
              className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary"
            />
          </label>
          {providers.analysis.kind === 'ollama-cloud' && (
            <label className="space-y-1 text-xs text-secondary">
              {t.ollamaBase}
              <input
                value={providers.analysis.baseUrl || ''}
                onChange={(e) => onChange({
                  ...providers,
                  analysis: {
                    ...providers.analysis,
                    baseUrl: e.target.value,
                  },
                })}
                className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary"
              />
            </label>
          )}
        </div>
      )}
      <div className="border-t border-border pt-3">
        <label className="space-y-1 text-xs text-secondary block">
          {t.transcriptProvider}
          <div className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary">Groq Whisper</div>
        </label>
        <label className="space-y-1 text-xs text-secondary block mt-2">
          {t.groqKey}
          <input
            type="password"
            value={providers.transcript.apiKey || ''}
            onChange={(e) => onChange({
              ...providers,
              transcript: {
                ...providers.transcript,
                apiKey: e.target.value,
              },
            })}
            className="w-full bg-card border border-border rounded-btn px-2 py-1.5 text-primary"
          />
          <span className="block text-[10px] text-secondary mt-1">{t.helper}</span>
        </label>
      </div>
    </section>
  );
}
