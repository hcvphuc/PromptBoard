import React from 'react';
import type { PodcastProject } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

export type WorkspaceTab = 'input' | 'analysis' | 'slides' | 'export';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  project: PodcastProject;
  generatingSlides: boolean;
  language: UiLanguage;
  onChange: (tab: WorkspaceTab) => void;
}

const labels = {
  en: {
    input: 'Input',
    analysis: 'Analysis',
    slides: 'Slides',
    export: 'Export',
    audio: 'audio',
    run: 'run',
  },
  vi: {
    input: 'Input',
    analysis: 'Analysis',
    slides: 'Slides',
    export: 'Export',
    audio: 'audio',
    run: 'run',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function getBadge(tab: WorkspaceTab, project: PodcastProject, generatingSlides: boolean, language: UiLanguage): string {
  if (tab === 'analysis') return project.analysis ? String(project.analysis.sections.length) : '';
  if (tab === 'slides') return generatingSlides ? labels[language].run : project.assets.openingStill ? String(project.assets.slides.length + 1) : project.assets.slides.length ? String(project.assets.slides.length) : '';
  if (tab === 'export') return project.exports.timestamps.length ? String(project.exports.timestamps.length) : '';
  return project.inputs.audio ? labels[language].audio : '';
}

export function WorkspaceTabs({ activeTab, project, generatingSlides, language, onChange }: WorkspaceTabsProps) {
  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'input', label: labels[language].input },
    { id: 'analysis', label: labels[language].analysis },
    { id: 'slides', label: labels[language].slides },
    { id: 'export', label: labels[language].export },
  ];

  return (
    <nav className="border-b border-border bg-panel px-3 py-2">
      <div className="grid grid-cols-4 gap-1 rounded-btn bg-bg p-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const badge = getBadge(tab.id, project, generatingSlides, language);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`min-h-9 rounded-[10px] px-2 text-xs font-semibold transition-colors ${
                active ? 'bg-accent text-black' : 'text-secondary hover:bg-card hover:text-primary'
              }`}
            >
              <span>{tab.label}</span>
              {badge && <span className={`ml-1 text-[10px] ${active ? 'text-black/70' : 'text-secondary'}`}>{badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
