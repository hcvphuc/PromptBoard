import React from 'react';
import type { PodcastProject, PodcastSlidePrompt } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface SlidesPanelProps {
  project: PodcastProject;
  generating: boolean;
  onGenerate: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: () => Promise<void>;
  onUpdateSlidePrompt: (slidePrompt: PodcastSlidePrompt) => Promise<void>;
  onDeleteSlideImage: (slideNumber: number) => Promise<void>;
  onRegenerateSlide: (slideNumber: number) => Promise<void>;
  onDeleteOpeningStill: () => Promise<void>;
  onRegenerateOpeningStill: () => Promise<void>;
  regeneratingSlideNumber: number | null;
  regeneratingOpeningStill: boolean;
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
    noOpeningStill: 'No character image is uploaded, so PodcastBoard will skip the opening still frame and generate content slides only.',
    deckTemplate: 'Deck template',
    openingStill: 'Opening still frame',
    deleteOpeningStill: 'Delete opening still frame',
    regenerateOpeningStill: 'Regenerate',
    regeneratingOpeningStill: 'Regenerating...',
    slide: 'Slide',
    generated: 'Generated',
    pending: 'Pending',
    deleting: 'Delete slide image',
    regenerate: 'Regenerate',
    regeneratingSlide: 'Regenerating...',
    edit: 'Edit Prompt',
    save: 'Save',
    close: 'Cancel',
    sectionTitle: 'Section title',
    displayText: 'Display text',
    prompt: 'Prompt',
    negativePrompt: 'Negative prompt',
    timestampStart: 'Start',
    timestampEnd: 'End',
    editHint: 'Saving this prompt clears only this generated slide image. The deck template and other slides stay intact.',
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
    noOpeningStill: 'Chưa upload ảnh nhân vật, nên PodcastBoard sẽ bỏ qua opening still frame và chỉ tạo content slides.',
    deckTemplate: 'Deck template',
    openingStill: 'Opening still frame',
    deleteOpeningStill: 'Xóa opening still frame',
    regenerateOpeningStill: 'Tạo lại',
    regeneratingOpeningStill: 'Đang tạo lại...',
    slide: 'Slide',
    generated: 'Đã tạo',
    pending: 'Chờ tạo',
    deleting: 'Xóa ảnh slide',
    regenerate: 'Tạo lại',
    regeneratingSlide: 'Đang tạo lại...',
    edit: 'Sửa prompt',
    save: 'Lưu',
    close: 'Hủy',
    sectionTitle: 'Tên section',
    displayText: 'Text hiển thị',
    prompt: 'Prompt',
    negativePrompt: 'Negative prompt',
    timestampStart: 'Bắt đầu',
    timestampEnd: 'Kết thúc',
    editHint: 'Lưu prompt này chỉ xóa ảnh đã generate của slide này. Deck template và các slide khác vẫn giữ nguyên.',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function parseDisplayText(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function SlidesPanel({
  project,
  generating,
  onGenerate,
  onPause,
  onResume,
  onCancel,
  onUpdateSlidePrompt,
  onDeleteSlideImage,
  onRegenerateSlide,
  onDeleteOpeningStill,
  onRegenerateOpeningStill,
  regeneratingSlideNumber,
  regeneratingOpeningStill,
  language,
}: SlidesPanelProps) {
  const [editingSlide, setEditingSlide] = React.useState<PodcastSlidePrompt | null>(null);
  if (!project.analysis) return null;
  const hasCharacterReference = Boolean(project.inputs.characterOne?.dataUrl || project.inputs.characterTwo?.dataUrl);
  const isPaused = project.generation.status === 'paused';
  const isCancelled = project.generation.status === 'cancelled';
  const t = copy[language];

  const saveSlidePrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSlide) return;
    await onUpdateSlidePrompt(editingSlide);
    setEditingSlide(null);
  };

  return (
    <section className="space-y-4 pb-28">
      <div className="rounded-[22px] border border-border bg-panel p-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="text-xs text-secondary mt-1">{t.detail}</div>
        </div>
      </div>

      {!hasCharacterReference && (
        <div className="rounded-btn border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
          {t.noOpeningStill}
        </div>
      )}

      {project.assets.deckTemplate && (
        <article className="rounded-[20px] border border-border bg-card p-4">
          <div className="text-xs text-secondary mb-3">{t.deckTemplate}</div>
          <img src={project.assets.deckTemplate.imageDataUrl} alt={t.deckTemplate} className="w-full rounded-[16px] border border-border" />
        </article>
      )}

      {project.assets.openingStill && (
        <article className="rounded-[20px] border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-secondary">{t.openingStill}</div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={t.deleteOpeningStill}
                title={t.deleteOpeningStill}
                disabled={generating}
                onClick={() => { void onDeleteOpeningStill(); }}
                className="grid h-7 w-7 place-items-center rounded-full border border-danger/40 bg-danger/10 text-sm font-black text-danger hover:border-danger disabled:border-border disabled:bg-bg disabled:text-secondary"
              >
                ×
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => { void onRegenerateOpeningStill(); }}
                className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent hover:border-accent disabled:border-border disabled:bg-bg disabled:text-secondary"
              >
                {regeneratingOpeningStill ? t.regeneratingOpeningStill : t.regenerateOpeningStill}
              </button>
            </div>
          </div>
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
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span className={`text-[11px] ${generated ? 'text-accent' : 'text-secondary'}`}>{generated ? t.generated : t.pending}</span>
                  {generated && (
                    <button
                      type="button"
                      aria-label={t.deleting}
                      title={t.deleting}
                      disabled={generating}
                      onClick={() => { void onDeleteSlideImage(slide.slide_number); }}
                      className="grid h-7 w-7 place-items-center rounded-full border border-danger/40 bg-danger/10 text-sm font-black text-danger hover:border-danger disabled:border-border disabled:bg-bg disabled:text-secondary"
                    >
                      ×
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => { void onRegenerateSlide(slide.slide_number); }}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent hover:border-accent disabled:border-border disabled:bg-bg disabled:text-secondary"
                  >
                    {regeneratingSlideNumber === slide.slide_number ? t.regeneratingSlide : t.regenerate}
                  </button>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => setEditingSlide(slide)}
                    className="rounded-full border border-border bg-bg px-3 py-1.5 text-[11px] font-semibold hover:border-accent/60 disabled:text-secondary"
                  >
                    {t.edit}
                  </button>
                </div>
              </div>
              {editingSlide?.slide_number === slide.slide_number ? (
                <form onSubmit={(event) => { void saveSlidePrompt(event); }} className="space-y-3">
                  <div className="rounded-btn border border-accent/30 bg-accent/10 p-3 text-[11px] text-accent">{t.editHint}</div>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.sectionTitle}</span>
                    <input
                      value={editingSlide.section_title}
                      onChange={(event) => setEditingSlide({ ...editingSlide, section_title: event.target.value })}
                      className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.displayText}</span>
                    <input
                      value={editingSlide.display_text.join(', ')}
                      onChange={(event) => setEditingSlide({ ...editingSlide, display_text: parseDisplayText(event.target.value) })}
                      className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.prompt}</span>
                    <textarea
                      value={editingSlide.prompt}
                      onChange={(event) => setEditingSlide({ ...editingSlide, prompt: event.target.value })}
                      className="min-h-36 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.negativePrompt}</span>
                    <textarea
                      value={editingSlide.negative_prompt}
                      onChange={(event) => setEditingSlide({ ...editingSlide, negative_prompt: event.target.value })}
                      className="min-h-20 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                      <span>{t.timestampStart}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingSlide.timestamp_start}
                        onChange={(event) => setEditingSlide({ ...editingSlide, timestamp_start: normalizeNumber(event.currentTarget.valueAsNumber, editingSlide.timestamp_start) })}
                        className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                      />
                    </label>
                    <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                      <span>{t.timestampEnd}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingSlide.timestamp_end}
                        onChange={(event) => setEditingSlide({ ...editingSlide, timestamp_end: normalizeNumber(event.currentTarget.valueAsNumber, editingSlide.timestamp_end) })}
                        className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingSlide(null)} className="rounded-full border border-border bg-bg px-4 py-2 text-xs font-semibold">
                      {t.close}
                    </button>
                    <button type="submit" className="rounded-full bg-accent px-4 py-2 text-xs font-black text-black">
                      {t.save}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {slide.display_text.map((token) => (
                      <span key={token} className="rounded-full border border-border px-2 py-1 text-[11px] text-secondary">{token}</span>
                    ))}
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-secondary leading-5">{slide.prompt}</pre>
                  {generated && <img src={generated.imageDataUrl} alt={generated.sectionTitle} className="w-full rounded-[16px] border border-border" />}
                </>
              )}
            </article>
          );
        })}
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-border bg-panel/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-primary">{t.title}</div>
            <div className="text-[10px] text-secondary">{project.assets.slides.length}/{project.analysis.slide_prompts.length} {t.generated}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {isPaused ? (
              <button onClick={() => { void onResume(); }} disabled={generating} className="rounded-full bg-accent text-black font-semibold px-4 py-2 text-xs disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">
                {t.resume}
              </button>
            ) : (
              <button onClick={() => { void onGenerate(); }} disabled={generating} className="rounded-full bg-accent text-black font-semibold px-4 py-2 text-xs disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">
                {generating ? t.generating : isCancelled ? t.generateAgain : t.generateSlides}
              </button>
            )}
            <button onClick={() => { void onPause(); }} disabled={!generating || isPaused} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold disabled:text-secondary">
              {t.pause}
            </button>
            <button onClick={() => { void onCancel(); }} disabled={!generating && !isPaused} className="rounded-full border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger disabled:text-secondary disabled:border-border disabled:bg-card">
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
