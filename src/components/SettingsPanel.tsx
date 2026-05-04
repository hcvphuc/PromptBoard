import React from 'react';
import type { PipelineSettings } from '@/types/project';
import { STYLE_PRESETS, ASPECT_RATIOS, LANGUAGES, SEEDANCE_MODES } from '@/types/project';

interface SettingsPanelProps {
  settings: PipelineSettings;
  onChange: (settings: PipelineSettings) => void;
  disabled?: boolean;
}

export function SettingsPanel({ settings, onChange, disabled }: SettingsPanelProps) {
  const update = <K extends keyof PipelineSettings>(key: K, value: PipelineSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Settings</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-secondary mb-1">Style Preset</label>
          <select
            value={settings.stylePreset}
            onChange={(e) => update('stylePreset', e.target.value as any)}
            disabled={disabled}
            className="w-full bg-card border border-border rounded-btn px-3 py-1.5 text-primary text-xs disabled:opacity-50"
          >
            {STYLE_PRESETS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Aspect Ratio</label>
          <select
            value={settings.aspectRatio}
            onChange={(e) => update('aspectRatio', e.target.value as any)}
            disabled={disabled}
            className="w-full bg-card border border-border rounded-btn px-3 py-1.5 text-primary text-xs disabled:opacity-50"
          >
            {ASPECT_RATIOS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Language</label>
          <select
            value={settings.language}
            onChange={(e) => update('language', e.target.value as any)}
            disabled={disabled}
            className="w-full bg-card border border-border rounded-btn px-3 py-1.5 text-primary text-xs disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Board Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={15}
              value={settings.boardDuration}
              onChange={(e) => update('boardDuration', Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-accent h-1"
            />
            <span className="text-xs text-primary w-8 text-right">{settings.boardDuration}s</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-secondary mb-1">Seedance Mode</label>
        <div className="flex gap-2">
          {SEEDANCE_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => update('seedanceMode', m.value)}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-xs rounded-btn border transition-colors ${
                settings.seedanceMode === m.value
                  ? 'bg-accent/20 border-accent text-primary'
                  : 'bg-card border-border text-secondary hover:text-primary hover:bg-border'
              } disabled:opacity-50`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}