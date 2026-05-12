import React from 'react';
import type { PodcastProject, PodcastSettings, PodcastTemplate } from '@/domain/podcast/model';
import { PODCAST_TEMPLATES } from '@/domain/podcast/model';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface InputPanelProps {
  project: PodcastProject;
  onScriptChange: (script: string) => void;
  onSettingsChange: (settings: PodcastSettings) => void;
  onAudioUpload: (file: File) => Promise<void>;
  onAudioClear: () => Promise<void>;
  onTemplateUpload: (file: File) => Promise<void>;
  onTemplateClear: () => Promise<void>;
  onCharacterOneNameChange: (name: string) => Promise<void>;
  onCharacterOneUpload: (file: File) => Promise<void>;
  onCharacterOneClear: () => Promise<void>;
  onCharacterTwoNameChange: (name: string) => Promise<void>;
  onCharacterTwoUpload: (file: File) => Promise<void>;
  onCharacterTwoClear: () => Promise<void>;
  onLocationUpload: (file: File) => Promise<void>;
  onLocationClear: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  running: boolean;
  language: UiLanguage;
}

interface UploadTileProps {
  title: string;
  detail: string;
  accept: string;
  required?: boolean;
  previewUrl?: string;
  fileName?: string;
  icon: string;
  compact?: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => Promise<void>;
  language: UiLanguage;
}

const inputCopy = {
  en: {
    uploaded: 'Uploaded',
    drop: 'Drop',
    clickOrDrop: 'Click or drop',
    clear: 'Clear',
    characterImages: 'Character images',
    characterDetail: 'Drop images here or upload each speaker.',
    character1: 'Character 1',
    character2: 'Character 2',
    required: 'Required',
    name1: 'Name 1',
    name2: 'Name 2',
    chooseTemplate: 'Choose slide template',
    templateIntro: 'Pick a visual system. The full template gallery stays here so Input remains clean.',
    close: 'Close',
    heroSubtitle: 'Turn a two-speaker podcast script and optional voice-over into timestamped visual slides.',
    podcastScript: 'Podcast script',
    voiceOver: 'Voice-over',
    voiceOverDetail: 'Optional MP3/WAV for exact sync',
    templateRef: 'Template ref',
    templateRefDetail: 'Optional visual style reference',
    locationImage: 'Location image',
    locationDetail: 'Optional studio/location reference',
    slideTemplate: 'Slide template',
    change: 'Change',
    clickStyle: 'Click to choose style',
    ratio: 'Ratio',
    slideLanguage: 'Slide language',
    analyze: 'Analyze Podcast',
  },
  vi: {
    uploaded: 'Đã upload',
    drop: 'Thả file',
    clickOrDrop: 'Click hoặc thả file',
    clear: 'Bỏ chọn',
    characterImages: 'Ảnh nhân vật',
    characterDetail: 'Thả ảnh vào đây hoặc upload từng speaker.',
    character1: 'Nhân vật 1',
    character2: 'Nhân vật 2',
    required: 'Bắt buộc',
    name1: 'Tên 1',
    name2: 'Tên 2',
    chooseTemplate: 'Chọn slide template',
    templateIntro: 'Chọn hệ visual. Gallery template nằm ở đây để Input gọn hơn.',
    close: 'Đóng',
    heroSubtitle: 'Biến script podcast hai người và voice-over tùy chọn thành slide hình ảnh có timestamp.',
    podcastScript: 'Script podcast',
    voiceOver: 'Voice-over',
    voiceOverDetail: 'MP3/WAV tùy chọn để sync chính xác',
    templateRef: 'Template ref',
    templateRefDetail: 'Ảnh reference style tùy chọn',
    locationImage: 'Location image',
    locationDetail: 'Ảnh studio/location tùy chọn',
    slideTemplate: 'Slide template',
    change: 'Đổi',
    clickStyle: 'Click để chọn style',
    ratio: 'Tỉ lệ',
    slideLanguage: 'Ngôn ngữ slide',
    analyze: 'Analyze Podcast',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function UploadTile({ title, detail, accept, required, previewUrl, fileName, icon, compact, onUpload, onClear, language }: UploadTileProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const t = inputCopy[language];

  const handleFile = React.useCallback(async (file?: File) => {
    if (!file) return;
    await onUpload(file);
  }, [onUpload]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFile(event.dataTransfer.files?.[0]);
      }}
      className={`group relative ${compact ? 'min-h-[96px]' : 'min-h-[140px]'} rounded-[20px] border bg-card p-3 cursor-pointer overflow-hidden transition ${dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/70'}`}
    >
      {previewUrl ? (
        <img src={previewUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-black/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {fileName && onClear && (
        <button
          type="button"
          aria-label={`${t.clear} ${title}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void onClear();
          }}
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/70 text-sm font-bold text-white hover:border-danger hover:text-danger"
        >
          x
        </button>
      )}

      <div className={`relative z-[1] flex h-full ${compact ? 'min-h-[72px]' : 'min-h-[116px]'} flex-col justify-between`}>
        <div className="flex items-start justify-between gap-2 pr-7">
          <div>
            <div className="text-xs font-semibold">
              {title} {required && <span className="text-danger">*</span>}
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] text-secondary">{fileName || detail}</div>
          </div>
          <div className="text-xs font-bold opacity-80">{icon}</div>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{fileName ? t.uploaded : compact ? t.drop : t.clickOrDrop}</div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void handleFile(file);
        }}
      />
    </div>
  );
}

interface CharacterTileProps {
  characterOne?: { fileName: string; dataUrl: string; name?: string };
  characterTwo?: { fileName: string; dataUrl: string; name?: string };
  onCharacterOneNameChange: (name: string) => Promise<void>;
  onCharacterOneUpload: (file: File) => Promise<void>;
  onCharacterOneClear: () => Promise<void>;
  onCharacterTwoNameChange: (name: string) => Promise<void>;
  onCharacterTwoUpload: (file: File) => Promise<void>;
  onCharacterTwoClear: () => Promise<void>;
  language: UiLanguage;
}

function CharacterTile({
  characterOne,
  characterTwo,
  onCharacterOneNameChange,
  onCharacterOneUpload,
  onCharacterOneClear,
  onCharacterTwoNameChange,
  onCharacterTwoUpload,
  onCharacterTwoClear,
  language,
}: CharacterTileProps) {
  const t = inputCopy[language];
  const handleDrop = React.useCallback(async (file?: File) => {
    if (!file) return;
    if (!characterOne) {
      await onCharacterOneUpload(file);
      return;
    }
    await onCharacterTwoUpload(file);
  }, [characterOne, onCharacterOneUpload, onCharacterTwoUpload]);

  return (
    <div
      className="rounded-[20px] border border-border bg-card p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void handleDrop(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold">{t.characterImages} <span className="text-danger">*</span></div>
          <div className="text-[11px] text-secondary">{t.characterDetail}</div>
        </div>
        <div className="text-xs font-bold opacity-80">2P</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <UploadTile
            title={t.character1}
            detail={t.required}
            accept="image/*"
            required
            previewUrl={characterOne?.dataUrl}
            fileName={characterOne?.fileName}
            icon="1"
            compact
            onUpload={onCharacterOneUpload}
            onClear={onCharacterOneClear}
            language={language}
          />
          <input
            value={characterOne?.name || ''}
            onChange={(event) => { void onCharacterOneNameChange(event.target.value); }}
            placeholder={t.name1}
            className="w-full rounded-[12px] border border-border bg-bg px-2 py-2 text-xs text-primary placeholder:text-secondary focus:border-accent"
          />
        </div>
        <div className="space-y-2">
          <UploadTile
            title={t.character2}
            detail={t.required}
            accept="image/*"
            required
            previewUrl={characterTwo?.dataUrl}
            fileName={characterTwo?.fileName}
            icon="2"
            compact
            onUpload={onCharacterTwoUpload}
            onClear={onCharacterTwoClear}
            language={language}
          />
          <input
            value={characterTwo?.name || ''}
            onChange={(event) => { void onCharacterTwoNameChange(event.target.value); }}
            placeholder={t.name2}
            className="w-full rounded-[12px] border border-border bg-bg px-2 py-2 text-xs text-primary placeholder:text-secondary focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
}

function TemplateThumbnail({ template }: { template: PodcastTemplate }) {
  return (
    <div className={`template-thumb template-thumb-${template}`}>
      <span className="thumb-title" />
      <span className="thumb-subtitle" />
      <span className="thumb-visual thumb-visual-a" />
      <span className="thumb-visual thumb-visual-b" />
      <span className="thumb-visual thumb-visual-c" />
    </div>
  );
}

function TemplatePickerModal({
  selected,
  onSelect,
  onClose,
  language,
}: {
  selected: PodcastTemplate;
  onSelect: (template: PodcastTemplate) => void;
  onClose: () => void;
  language: UiLanguage;
}) {
  const t = inputCopy[language];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <section className="max-h-[86vh] w-full max-w-[720px] overflow-hidden rounded-[28px] border border-border bg-bg shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-3 border-b border-border bg-panel p-4">
          <div>
            <div className="text-base font-bold">{t.chooseTemplate}</div>
            <p className="mt-1 text-xs text-secondary">{t.templateIntro}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-accent/70">{t.close}</button>
        </header>
        <div className="max-h-[calc(86vh-76px)] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PODCAST_TEMPLATES.map((template) => {
              const active = selected === template.value;
              return (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => {
                    onSelect(template.value);
                    onClose();
                  }}
                  className={`rounded-[20px] border bg-card p-2 text-left transition ${active ? 'border-accent shadow-[0_0_0_1px_rgba(248,199,65,0.45)]' : 'border-border hover:border-accent/60'}`}
                >
                  <TemplateThumbnail template={template.value} />
                  <div className="mt-2 text-xs font-bold text-primary">{template.label}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-secondary">{template.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export function InputPanel({
  project,
  onScriptChange,
  onSettingsChange,
  onAudioUpload,
  onAudioClear,
  onTemplateUpload,
  onTemplateClear,
  onCharacterOneNameChange,
  onCharacterOneUpload,
  onCharacterOneClear,
  onCharacterTwoNameChange,
  onCharacterTwoUpload,
  onCharacterTwoClear,
  onLocationUpload,
  onLocationClear,
  onAnalyze,
  running,
  language,
}: InputPanelProps) {
  const [showTemplatePicker, setShowTemplatePicker] = React.useState(false);
  const currentTemplate = PODCAST_TEMPLATES.find((template) => template.value === project.settings.template) || PODCAST_TEMPLATES[0];
  const t = inputCopy[language];

  return (
    <>
      <section className="rounded-[22px] border border-border bg-gradient-to-b from-[#151515] to-[#080808] p-4 min-h-[132px] flex flex-col justify-end shadow-2xl shadow-black/30">
        <div className="text-[34px] leading-none font-bold tracking-tight">Podcast<span className="text-accent">Board</span></div>
        <p className="text-xs text-secondary mt-2 max-w-[280px]">{t.heroSubtitle}</p>
      </section>

      <section className="space-y-2">
        <label className="text-xs text-secondary font-medium">{t.podcastScript}</label>
        <textarea
          value={project.inputs.script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder={'Speaker A: ...\nSpeaker B: ...'}
          className="w-full min-h-40 resize-y rounded-btn bg-card border border-border p-3 text-sm text-primary placeholder:text-secondary focus:border-accent"
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <UploadTile
          title={t.voiceOver}
          detail={t.voiceOverDetail}
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          fileName={project.inputs.audio
            ? `${project.inputs.audio.name} · ${Math.round(project.inputs.audio.durationSeconds)}s${project.transcript ? ` · ${project.transcript.segments.length} segments` : ''}`
            : undefined}
          icon="VO"
          onUpload={onAudioUpload}
          onClear={onAudioClear}
          language={language}
        />
        <UploadTile
          title={t.templateRef}
          detail={t.templateRefDetail}
          accept="image/*"
          previewUrl={project.inputs.templateReferenceDataUrl}
          fileName={project.inputs.templateFileName}
          icon="REF"
          onUpload={onTemplateUpload}
          onClear={onTemplateClear}
          language={language}
        />
        <CharacterTile
          characterOne={project.inputs.characterOne}
          characterTwo={project.inputs.characterTwo}
          onCharacterOneNameChange={onCharacterOneNameChange}
          onCharacterOneUpload={onCharacterOneUpload}
          onCharacterOneClear={onCharacterOneClear}
          onCharacterTwoNameChange={onCharacterTwoNameChange}
          onCharacterTwoUpload={onCharacterTwoUpload}
          onCharacterTwoClear={onCharacterTwoClear}
          language={language}
        />
        <UploadTile
          title={t.locationImage}
          detail={t.locationDetail}
          accept="image/*"
          previewUrl={project.inputs.locationReference?.dataUrl}
          fileName={project.inputs.locationReference?.fileName}
          icon="LOC"
          onUpload={onLocationUpload}
          onClear={onLocationClear}
          language={language}
        />
      </section>

      <section className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-secondary">{t.slideTemplate}</div>
            <button type="button" onClick={() => setShowTemplatePicker(true)} className="text-[10px] font-semibold text-accent hover:text-primary">{t.change}</button>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplatePicker(true)}
            className="flex w-full items-center gap-3 rounded-[20px] border border-border bg-card p-2 text-left transition hover:border-accent/70"
          >
            <div className="w-28 shrink-0">
              <TemplateThumbnail template={currentTemplate.value} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-primary">{currentTemplate.label}</div>
              <div className="mt-1 line-clamp-2 text-xs text-secondary">{currentTemplate.description}</div>
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{t.clickStyle}</div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs text-secondary">
            {t.ratio}
            <select
              value={project.settings.aspectRatio}
              onChange={(e) => onSettingsChange({ ...project.settings, aspectRatio: e.target.value as PodcastSettings['aspectRatio'] })}
              className="w-full rounded-btn bg-card border border-border px-2 py-2 text-primary"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-secondary">
            {t.slideLanguage}
            <select
              value={project.settings.promptLanguage}
              onChange={(e) => onSettingsChange({ ...project.settings, promptLanguage: e.target.value as PodcastSettings['promptLanguage'] })}
              className="w-full rounded-btn bg-card border border-border px-2 py-2 text-primary"
            >
              <option value="english-prompts">ENG Slide</option>
              <option value="vietnamese-prompts">VIE Slide</option>
            </select>
          </label>
        </div>
      </section>

      <button onClick={() => { void onAnalyze(); }} disabled={running || !project.inputs.script.trim()} className="w-full rounded-full bg-accent text-black font-bold py-3 disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">{t.analyze}</button>

      {showTemplatePicker && (
        <TemplatePickerModal
          selected={project.settings.template}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={(template) => onSettingsChange({ ...project.settings, template })}
          language={language}
        />
      )}
    </>
  );
}
