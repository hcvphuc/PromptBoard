import React from 'react';
import type { PodcastProject, PodcastSection } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface AnalysisPanelProps {
  project: PodcastProject;
  language: UiLanguage;
  onGoToSlides: () => void;
  onUpdateSection: (section: PodcastSection) => Promise<void>;
}

const copy = {
  en: {
    note: 'Note:',
    infographic: 'Infographic:',
    imageIdea: 'Image idea:',
    goToSlides: 'Go to Slides',
    sections: 'sections',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    title: 'Title',
    summary: 'Summary',
    keywords: 'Keywords',
    keyNote: 'Key note',
    styleNotes: 'Style notes',
    timing: 'Timing',
    editHint: 'Saving analysis changes will clear generated images so the next batch matches the updated structure.',
  },
  vi: {
    note: 'Ghi chú:',
    infographic: 'Infographic:',
    imageIdea: 'Ý tưởng ảnh:',
    goToSlides: 'Qua Slides',
    sections: 'sections',
    edit: 'Sửa',
    save: 'Lưu',
    cancel: 'Hủy',
    title: 'Tiêu đề',
    summary: 'Tóm tắt',
    keywords: 'Từ khóa',
    keyNote: 'Ghi chú chính',
    styleNotes: 'Style notes',
    timing: 'Timing',
    editHint: 'Lưu thay đổi analysis sẽ xóa ảnh đã generate để batch sau khớp với cấu trúc mới.',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function parseKeywords(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function AnalysisPanel({ project, language, onGoToSlides, onUpdateSection }: AnalysisPanelProps) {
  const [editingSection, setEditingSection] = React.useState<PodcastSection | null>(null);
  if (!project.analysis) return null;
  const t = copy[language];

  const saveSection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSection) return;
    await onUpdateSection(editingSection);
    setEditingSection(null);
  };

  return (
    <section className="space-y-4 pb-24">
      <div className="rounded-[22px] border border-border bg-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{project.analysis.title}</div>
            <p className="text-xs text-secondary mt-2">{project.analysis.summary}</p>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{project.analysis.sections.length} {t.sections}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {project.analysis.sections.map((section) => (
          <article key={section.section_number} className="rounded-[20px] border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{section.section_number}. {section.title}</div>
                <div className="text-[11px] text-secondary">{Math.round(section.start_time)}s - {Math.round(section.end_time)}s</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(section)}
                className="rounded-full border border-border bg-bg px-3 py-1.5 text-[11px] font-semibold hover:border-accent/60"
              >
                {t.edit}
              </button>
            </div>
            {editingSection?.section_number === section.section_number ? (
              <form onSubmit={(event) => { void saveSection(event); }} className="space-y-3">
                <div className="rounded-btn border border-accent/30 bg-accent/10 p-3 text-[11px] text-accent">{t.editHint}</div>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.title}</span>
                  <input
                    value={editingSection.title}
                    onChange={(event) => setEditingSection({ ...editingSection, title: event.target.value })}
                    className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.summary}</span>
                  <textarea
                    value={editingSection.summary}
                    onChange={(event) => setEditingSection({ ...editingSection, summary: event.target.value })}
                    className="min-h-20 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.keywords}</span>
                  <input
                    value={editingSection.keywords.join(', ')}
                    onChange={(event) => setEditingSection({ ...editingSection, keywords: parseKeywords(event.target.value) })}
                    className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.keyNote}</span>
                  <textarea
                    value={editingSection.key_note}
                    onChange={(event) => setEditingSection({ ...editingSection, key_note: event.target.value })}
                    className="min-h-16 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.infographic}</span>
                  <textarea
                    value={editingSection.infographic_idea}
                    onChange={(event) => setEditingSection({ ...editingSection, infographic_idea: event.target.value })}
                    className="min-h-16 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.imageIdea}</span>
                  <textarea
                    value={editingSection.image_idea}
                    onChange={(event) => setEditingSection({ ...editingSection, image_idea: event.target.value })}
                    className="min-h-16 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                  <span>{t.styleNotes}</span>
                  <textarea
                    value={editingSection.visual_style_notes}
                    onChange={(event) => setEditingSection({ ...editingSection, visual_style_notes: event.target.value })}
                    className="min-h-16 w-full resize-y rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.timing} start</span>
                    <input
                      type="number"
                      min="0"
                      value={editingSection.start_time}
                      onChange={(event) => setEditingSection({ ...editingSection, start_time: normalizeNumber(event.currentTarget.valueAsNumber, editingSection.start_time) })}
                      className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>{t.timing} end</span>
                    <input
                      type="number"
                      min="0"
                      value={editingSection.end_time}
                      onChange={(event) => setEditingSection({ ...editingSection, end_time: normalizeNumber(event.currentTarget.valueAsNumber, editingSection.end_time) })}
                      className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold text-secondary">
                    <span>Weight</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={editingSection.duration_weight}
                      onChange={(event) => setEditingSection({ ...editingSection, duration_weight: normalizeNumber(event.currentTarget.valueAsNumber, editingSection.duration_weight) })}
                      className="w-full rounded-[12px] border border-border bg-bg px-3 py-2 text-xs text-primary"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingSection(null)} className="rounded-full border border-border bg-bg px-4 py-2 text-xs font-semibold">
                    {t.cancel}
                  </button>
                  <button type="submit" className="rounded-full bg-accent px-4 py-2 text-xs font-black text-black">
                    {t.save}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-xs text-secondary">{section.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {section.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-border px-2 py-1 text-[11px] text-secondary">{keyword}</span>
                  ))}
                </div>
                <div className="text-xs"><span className="text-secondary">{t.note}</span> {section.key_note}</div>
                <div className="text-xs"><span className="text-secondary">{t.infographic}</span> {section.infographic_idea}</div>
                <div className="text-xs"><span className="text-secondary">{t.imageIdea}</span> {section.image_idea}</div>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-border bg-panel/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-primary">{project.analysis.title}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{project.analysis.sections.length} {t.sections}</div>
          </div>
          <button
            type="button"
            onClick={onGoToSlides}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-black text-black hover:brightness-110"
          >
            {t.goToSlides}
          </button>
        </div>
      </div>
    </section>
  );
}
