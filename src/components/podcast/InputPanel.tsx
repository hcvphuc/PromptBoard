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
  onLocationDescriptionChange: (description: string) => Promise<void>;
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
    characterDetail: 'Optional: upload one speaker or two speakers for an opening still frame.',
    character1: 'Character 1',
    character2: 'Character 2',
    required: 'Required',
    optional: 'Optional',
    name1: 'Name 1',
    name2: 'Name 2',
    chooseTemplate: 'Choose slide template',
    templateIntro: 'Pick a visual system. The full template gallery stays here so Input remains clean.',
    close: 'Close',
    heroSubtitle: 'Turn podcasts into visual stories.',
    podcastScript: 'Podcast script',
    voiceOver: 'Voice-over',
    voiceOverDetail: 'Optional MP3/WAV for exact sync',
    templateRef: 'Template ref',
    templateRefDetail: 'Optional visual style reference',
    location: 'Location',
    locationImage: 'Location image',
    locationDetail: 'Optional: upload a location image or describe the podcast setting.',
    locationImageDetail: 'Optional studio/location reference',
    locationText: 'Location description',
    locationTextPlaceholder: 'Warm podcast studio, wood table, two microphones, city window at night...',
    locationWarning: 'No location image or text. PodcastBoard will prompt a random credible podcast location.',
    locationConfirmTitle: 'Location missing',
    locationConfirmCancel: 'Cancel',
    locationConfirmContinue: 'Continue',
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
    characterDetail: 'Tùy chọn: upload 1 speaker hoặc 2 speaker để tạo opening still frame.',
    character1: 'Nhân vật 1',
    character2: 'Nhân vật 2',
    required: 'Bắt buộc',
    optional: 'Tùy chọn',
    name1: 'Tên 1',
    name2: 'Tên 2',
    chooseTemplate: 'Chọn slide template',
    templateIntro: 'Chọn hệ visual. Gallery template nằm ở đây để Input gọn hơn.',
    close: 'Đóng',
    heroSubtitle: 'Turn podcasts into visual stories.',
    podcastScript: 'Script podcast',
    voiceOver: 'Voice-over',
    voiceOverDetail: 'MP3/WAV tùy chọn để sync chính xác',
    templateRef: 'Template ref',
    templateRefDetail: 'Ảnh reference style tùy chọn',
    location: 'Location',
    locationImage: 'Location image',
    locationDetail: 'Tùy chọn: upload ảnh location hoặc mô tả bối cảnh podcast.',
    locationImageDetail: 'Ảnh studio/location tùy chọn',
    locationText: 'Mô tả location',
    locationTextPlaceholder: 'Studio podcast ấm, bàn gỗ, hai microphone, cửa sổ nhìn ra thành phố ban đêm...',
    locationWarning: 'Chưa có location image hoặc mô tả. PodcastBoard sẽ prompt ngẫu nhiên một podcast location hợp lý.',
    locationConfirmTitle: 'Thiếu location',
    locationConfirmCancel: 'Hủy',
    locationConfirmContinue: 'Tiếp tục',
    slideTemplate: 'Slide template',
    change: 'Đổi',
    clickStyle: 'Click để chọn style',
    ratio: 'Tỉ lệ',
    slideLanguage: 'Ngôn ngữ slide',
    analyze: 'Analyze Podcast',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function UploadTile({ title, detail, accept, required, previewUrl, fileName, compact, onUpload, onClear, language }: UploadTileProps) {
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
          <div className="text-xs font-semibold">{t.characterImages}</div>
          <div className="text-[11px] text-secondary">{t.characterDetail}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <UploadTile
            title={t.character1}
            detail={t.optional}
            accept="image/*"
            previewUrl={characterOne?.dataUrl}
            fileName={characterOne?.fileName}
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
            detail={t.optional}
            accept="image/*"
            previewUrl={characterTwo?.dataUrl}
            fileName={characterTwo?.fileName}
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

interface LocationTileProps {
  locationReference?: { fileName: string; dataUrl: string };
  locationDescription?: string;
  onLocationUpload: (file: File) => Promise<void>;
  onLocationClear: () => Promise<void>;
  onLocationDescriptionChange: (description: string) => Promise<void>;
  language: UiLanguage;
}

function LocationTile({
  locationReference,
  locationDescription,
  onLocationUpload,
  onLocationClear,
  onLocationDescriptionChange,
  language,
}: LocationTileProps) {
  const t = inputCopy[language];

  return (
    <div className="rounded-[20px] border border-border bg-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold">{t.location}</div>
          <div className="text-[11px] text-secondary">{t.locationDetail}</div>
        </div>
      </div>
      <div className="space-y-2">
        <UploadTile
          title={t.locationImage}
          detail={t.locationImageDetail}
          accept="image/*"
          previewUrl={locationReference?.dataUrl}
          fileName={locationReference?.fileName}
          compact
          onUpload={onLocationUpload}
          onClear={onLocationClear}
          language={language}
        />
        <input
          value={locationDescription || ''}
          onChange={(event) => { void onLocationDescriptionChange(event.target.value); }}
          placeholder={t.locationTextPlaceholder}
          className="w-full rounded-[12px] border border-border bg-bg px-2 py-2 text-xs text-primary placeholder:text-secondary focus:border-accent"
        />
      </div>
    </div>
  );
}

function LocationConfirmModal({
  language,
  onCancel,
  onContinue,
}: {
  language: UiLanguage;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const t = inputCopy[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-md">
      <section className="w-full max-w-[340px] rounded-[28px] border border-border bg-panel p-5 shadow-2xl shadow-black/60">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[20px] border border-accent/40 bg-accent/10 text-accent">
          <svg viewBox="0 0 64 64" className="h-8 w-8" role="img" aria-hidden="true">
            <path d="M32 8 58 54H6L32 8Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            <path d="M32 24V38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="47" r="3.5" fill="currentColor" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-base font-black tracking-tight text-primary">{t.locationConfirmTitle}</h2>
          <p className="mt-2 text-xs leading-5 text-secondary">{t.locationWarning}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-primary hover:border-danger/70"
          >
            {t.locationConfirmCancel}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-accent px-4 py-2 text-xs font-black text-black hover:brightness-110"
          >
            {t.locationConfirmContinue}
          </button>
        </div>
      </section>
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
  const presetTemplates = PODCAST_TEMPLATES.filter((template) => template.value !== 'custom-reference');
  const customTemplate = PODCAST_TEMPLATES.find((template) => template.value === 'custom-reference');
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
            {presetTemplates.map((template) => {
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
          {customTemplate && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  onSelect(customTemplate.value);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-[20px] border bg-card p-3 text-left transition ${selected === customTemplate.value ? 'border-accent shadow-[0_0_0_1px_rgba(248,199,65,0.45)]' : 'border-border hover:border-accent/60'}`}
              >
                <div className="w-32 shrink-0">
                  <TemplateThumbnail template={customTemplate.value} />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{customTemplate.label}</div>
                  <div className="mt-1 text-xs leading-5 text-secondary">{customTemplate.description}</div>
                </div>
              </button>
            </div>
          )}
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
  onLocationDescriptionChange,
  onAnalyze,
  running,
  language,
}: InputPanelProps) {
  const [showTemplatePicker, setShowTemplatePicker] = React.useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = React.useState(false);
  const currentTemplate = PODCAST_TEMPLATES.find((template) => template.value === project.settings.template) || PODCAST_TEMPLATES[0];
  const t = inputCopy[language];
  const hasLocationInput = Boolean(project.inputs.locationReference?.dataUrl || project.inputs.locationDescription?.trim());

  const handleAnalyze = React.useCallback(() => {
    if (!hasLocationInput) {
      setShowLocationConfirm(true);
      return;
    }
    void onAnalyze();
  }, [hasLocationInput, onAnalyze]);

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
        <LocationTile
          locationReference={project.inputs.locationReference}
          locationDescription={project.inputs.locationDescription}
          onLocationUpload={onLocationUpload}
          onLocationClear={onLocationClear}
          onLocationDescriptionChange={onLocationDescriptionChange}
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
          <div className="space-y-1 text-xs text-secondary">
            {t.slideLanguage}
            <div className="grid grid-cols-2 gap-1 rounded-btn border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => onSettingsChange({ ...project.settings, promptLanguage: 'english-prompts' })}
                className={`rounded-[10px] px-2 py-1.5 text-xs font-bold ${project.settings.promptLanguage === 'english-prompts' ? 'bg-accent text-black' : 'text-secondary hover:bg-bg hover:text-primary'}`}
              >
                ENG Slide
              </button>
              <button
                type="button"
                onClick={() => onSettingsChange({ ...project.settings, promptLanguage: 'vietnamese-prompts' })}
                className={`rounded-[10px] px-2 py-1.5 text-xs font-bold ${project.settings.promptLanguage === 'vietnamese-prompts' ? 'bg-accent text-black' : 'text-secondary hover:bg-bg hover:text-primary'}`}
              >
                VIE Slide
              </button>
            </div>
          </div>
        </div>
      </section>

      <button onClick={handleAnalyze} disabled={running || !project.inputs.script.trim()} className="w-full rounded-full bg-accent text-black font-bold py-3 disabled:bg-card disabled:text-secondary disabled:border disabled:border-border">{t.analyze}</button>

      {showTemplatePicker && (
        <TemplatePickerModal
          selected={project.settings.template}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={(template) => onSettingsChange({ ...project.settings, template })}
          language={language}
        />
      )}

      {showLocationConfirm && (
        <LocationConfirmModal
          language={language}
          onCancel={() => setShowLocationConfirm(false)}
          onContinue={() => {
            setShowLocationConfirm(false);
            void onAnalyze();
          }}
        />
      )}
    </>
  );
}
