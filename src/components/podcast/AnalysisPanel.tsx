import React from 'react';
import type { PodcastProject } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface AnalysisPanelProps {
  project: PodcastProject;
  language: UiLanguage;
}

const copy = {
  en: {
    note: 'Note:',
    infographic: 'Infographic:',
    imageIdea: 'Image idea:',
  },
  vi: {
    note: 'Ghi chú:',
    infographic: 'Infographic:',
    imageIdea: 'Ý tưởng ảnh:',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function AnalysisPanel({ project, language }: AnalysisPanelProps) {
  if (!project.analysis) return null;
  const t = copy[language];

  return (
    <section className="space-y-4">
      <div className="rounded-[22px] border border-border bg-panel p-4">
        <div className="text-sm font-semibold">{project.analysis.title}</div>
        <p className="text-xs text-secondary mt-2">{project.analysis.summary}</p>
      </div>

      <div className="space-y-3">
        {project.analysis.sections.map((section) => (
          <article key={section.section_number} className="rounded-[20px] border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{section.section_number}. {section.title}</div>
                <div className="text-[11px] text-secondary">{Math.round(section.start_time)}s - {Math.round(section.end_time)}s</div>
              </div>
            </div>
            <p className="text-xs text-secondary">{section.summary}</p>
            <div className="flex flex-wrap gap-2">
              {section.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full border border-border px-2 py-1 text-[11px] text-secondary">{keyword}</span>
              ))}
            </div>
            <div className="text-xs"><span className="text-secondary">{t.note}</span> {section.key_note}</div>
            <div className="text-xs"><span className="text-secondary">{t.infographic}</span> {section.infographic_idea}</div>
            <div className="text-xs"><span className="text-secondary">{t.imageIdea}</span> {section.image_idea}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
