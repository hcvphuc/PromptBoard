import React from 'react';
import type { PodcastProject } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface ExportPanelProps {
  project: PodcastProject;
  onExportTimestamps: () => void;
  onExportTranscript: () => void;
  onExportZip: () => void;
  language: UiLanguage;
}

const copy = {
  en: {
    title: 'Export',
    detail: 'Export timestamps JSON, Whisper transcript SRT, or a ZIP bundle with deck template, opening still, and slides.',
    timestamps: 'Timestamps JSON',
    transcript: 'Transcript SRT',
    zip: 'Slides ZIP',
    rows: 'Timestamp rows',
    slide: 'Slide',
  },
  vi: {
    title: 'Export',
    detail: 'Export timestamps JSON, Whisper transcript SRT, hoặc ZIP gồm deck template, opening still và slides.',
    timestamps: 'Timestamps JSON',
    transcript: 'Transcript SRT',
    zip: 'Slides ZIP',
    rows: 'Timestamp rows',
    slide: 'Slide',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function ExportPanel({ project, onExportTimestamps, onExportTranscript, onExportZip, language }: ExportPanelProps) {
  if (!project.analysis) return null;
  const t = copy[language];

  return (
    <section className="space-y-4">
      <div className="rounded-[22px] border border-border bg-panel p-4">
        <div className="text-sm font-semibold">{t.title}</div>
        <div className="text-xs text-secondary mt-1">{t.detail}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={onExportTimestamps} className="rounded-btn border border-border bg-card py-2 text-xs hover:border-accent/60">{t.timestamps}</button>
        <button onClick={onExportTranscript} disabled={!project.exports.transcriptSrt} className="rounded-btn border border-border bg-card py-2 text-xs hover:border-accent/60 disabled:text-secondary">{t.transcript}</button>
        <button onClick={onExportZip} disabled={!project.assets.openingStill && project.assets.slides.length === 0} className="rounded-btn border border-border bg-card py-2 text-xs hover:border-accent/60 disabled:text-secondary">{t.zip}</button>
      </div>

      <article className="rounded-[20px] border border-border bg-card p-4">
        <div className="text-xs text-secondary mb-2">{t.rows}</div>
        <div className="space-y-2">
          {project.exports.timestamps.map((row) => (
            <div key={row.slide} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-primary">{t.slide} {row.slide}: {row.title}</span>
              <span className="text-secondary">{row.start} - {row.end}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
