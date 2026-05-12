import React from 'react';
import type { PodcastProject } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface SlidesPanelProps {
  project: PodcastProject;
  generating: boolean;
  onGenerate: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: () => Promise<void>;
  language: UiLanguage;
}

const copy = {
  en: {
    title: 'Slide generation',
    detail: 'Deck template, opening still frame, then content slides.',
    resume: 'Resume',
    generating: 'Generating...',
    generateAgain: 'Generate Again',
    generateSlides: 'Generate Slides',
    pause: 'Pause',
    cancel: 'Cancel',
    missingCharacters: 'Upload both character images in Input before generating the opening still frame.',
    deckTemplate: 'Deck template',
    openingStill: 'Opening still frame',
    slide: 'Slide',
    generated: 'Generated',
    pending: 'Pending',
  },
  vi: {
    title: 'Tạo slide',
    detail: 'Deck template, opening still frame, rồi tới content slides.',
    resume: 'Resume',
    generating: 'Đang tạo...',
    generateAgain: 'Tạo lại',
    generateSlides: 'Generate Slides',
    pause: 'Pause',
    cancel: 'Cancel',
    missingCharacters: 'Upload đủ hai ảnh nhân vật ở Input trước khi tạo opening still frame.',
    deckTemplate: 'Deck template',
    openingStill: 'Opening still frame',
    slide: 'Slide',
    generated: 'Đã tạo',
    pending: 'Chờ tạo',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function SlidesPanel({ project, generating, onGenerate, onPause, onResume, onCancel, language }: SlidesPanelProps) {
  if (!project.analysis) return null;
  const canGenerate = Boolean(project.inputs.characterOne?.dataUrl && project.inputs.characterTwo?.dataUrl);
  const isPaused = project.generation.status === 'paused';
  const isCancelled = project.generation.status === 'cancelled';
  const t = copy[language];

  return (
    <section className="space-y-4">
      <div className="rounded-[22px] border border-border bg-panel p-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="text-xs text-secondary mt-1">{t.detail}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {isPaused ? (
            <button onClick={() => { void onResume(); }} disabled={!canGenerate || generating} className="rounded-full bg-accent text-black font-semibold px-4 py-2 disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">
              {t.resume}
            </button>
          ) : (
            <button onClick={() => { void onGenerate(); }} disabled={!canGenerate || generating} className="rounded-full bg-accent text-black font-semibold px-4 py-2 disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">
              {generating ? t.generating : isCancelled ? t.generateAgain : t.generateSlides}
            </button>
          )}
          <button onClick={() => { void onPause(); }} disabled={!generating || isPaused} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold disabled:text-secondary">
            {t.pause}
          </button>
          <button onClick={() => { void onCancel(); }} disabled={!generating && !isPaused} className="rounded-full border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-semibold text-danger disabled:text-secondary disabled:border-border disabled:bg-card">
            {t.cancel}
          </button>
        </div>
      </div>

      {!canGenerate && (
        <div className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
          {t.missingCharacters}
        </div>
      )}

      {project.assets.deckTemplate && (
        <article className="rounded-[20px] border border-border bg-card p-4">
          <div className="text-xs text-secondary mb-3">{t.deckTemplate}</div>
          <img src={project.assets.deckTemplate.imageDataUrl} alt={t.deckTemplate} className="w-full rounded-[16px] border border-border" />
        </article>
      )}

      {project.assets.openingStill && (
        <article className="rounded-[20px] border border-border bg-card p-4">
          <div className="text-xs text-secondary mb-3">{t.openingStill}</div>
          <img src={project.assets.openingStill.imageDataUrl} alt={t.openingStill} className="w-full rounded-[16px] border border-border" />
        </article>
      )}

      <div className="space-y-3">
        {project.analysis.slide_prompts.map((slide) => {
          const generated = project.assets.slides.find((item) => item.slideNumber === slide.slide_number);
          return (
            <article key={slide.slide_number} className="rounded-[20px] border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{t.slide} {slide.slide_number}: {slide.section_title}</div>
                  <div className="text-[11px] text-secondary">{Math.round(slide.timestamp_start)}s - {Math.round(slide.timestamp_end)}s</div>
                </div>
                <span className={`text-[11px] ${generated ? 'text-accent' : 'text-secondary'}`}>{generated ? t.generated : t.pending}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {slide.display_text.map((token) => (
                  <span key={token} className="rounded-full border border-border px-2 py-1 text-[11px] text-secondary">{token}</span>
                ))}
              </div>
              <pre className="whitespace-pre-wrap text-xs text-secondary leading-5">{slide.prompt}</pre>
              {generated && <img src={generated.imageDataUrl} alt={generated.sectionTitle} className="w-full rounded-[16px] border border-border" />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
