import React from 'react';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface ProjectHeaderProps {
  analysisLabel: string;
  language: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
  onToggleSettings: () => void;
  onTogglePromptAssistant: () => void;
  onToggleGuide: () => void;
  onReset: () => void;
}

const copy = {
  en: {
    subtitle: 'Turn podcasts into visual stories',
    prompt: 'Prompt',
    guide: 'Guide',
    settings: 'Settings',
    reset: 'Reset',
    languageLabel: 'UI language',
  },
  vi: {
    subtitle: 'Turn podcasts into visual stories',
    prompt: 'Prompt',
    guide: 'Guide',
    settings: 'Cài đặt',
    reset: 'Reset',
    languageLabel: 'Ngôn ngữ UI',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function ProjectHeader({
  analysisLabel,
  language,
  onLanguageChange,
  onToggleSettings,
  onTogglePromptAssistant,
  onToggleGuide,
  onReset,
}: ProjectHeaderProps) {
  const t = copy[language];
  return (
    <header className="min-h-12 px-3 py-2 border-b border-border bg-panel flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-[140px]">
        <div className="text-sm font-bold tracking-tight"><span className="text-accent">Podcast</span>Board</div>
        <div className="text-[10px] text-secondary -mt-0.5">{t.subtitle}</div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="text-xs text-secondary">{analysisLabel}</span>
        <div className="rounded-btn border border-border bg-card p-0.5" aria-label={t.languageLabel}>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`rounded-[8px] px-2 py-0.5 text-xs font-bold ${language === 'en' ? 'bg-accent text-black' : 'text-secondary hover:text-primary'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('vi')}
            className={`rounded-[8px] px-2 py-0.5 text-xs font-bold ${language === 'vi' ? 'bg-accent text-black' : 'text-secondary hover:text-primary'}`}
          >
            VIE
          </button>
        </div>
        <button onClick={onTogglePromptAssistant} className="px-2 py-1 rounded-btn bg-card border border-border text-xs hover:border-accent/60">{t.prompt}</button>
        <button onClick={onToggleGuide} className="px-2 py-1 rounded-btn bg-card border border-border text-xs hover:border-accent/60">{t.guide}</button>
        <button onClick={onToggleSettings} className="px-2 py-1 rounded-btn bg-card border border-border text-xs hover:border-accent/60">{t.settings}</button>
        <button onClick={onReset} className="px-2 py-1 rounded-btn bg-card border border-border text-xs hover:border-danger/60">{t.reset}</button>
      </div>
    </header>
  );
}
