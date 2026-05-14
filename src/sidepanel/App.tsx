import React from 'react';
import { usePodcastWorkflow } from '@/application/podcast/usePodcastWorkflow';
import { AnalysisPanel } from '@/components/podcast/AnalysisPanel';
import { ExportPanel } from '@/components/podcast/ExportPanel';
import { InputPanel } from '@/components/podcast/InputPanel';
import { ProgressPanel } from '@/components/podcast/ProgressPanel';
import { ProjectHeader } from '@/components/podcast/ProjectHeader';
import { SettingsPanel } from '@/components/podcast/SettingsPanel';
import { SlidesPanel } from '@/components/podcast/SlidesPanel';
import { EmptyState } from '@/components/podcast/EmptyState';
import { WorkspaceTabs, type WorkspaceTab } from '@/components/podcast/WorkspaceTabs';
import { WorkflowStatusModal } from '@/components/podcast/WorkflowStatusModal';
import { PromptAssistantDrawer } from '@/components/podcast/prompt-assistant/PromptAssistantDrawer';
import { GuideDrawer, type UiLanguage } from '@/components/podcast/guide/GuideDrawer';

const uiCopy = {
  en: {
    backToInput: '← Back to Input',
    noAnalysisTitle: 'No analysis yet',
    noAnalysisDetail: 'Add a script in Input, then run Analyze Podcast.',
    noSlidesTitle: 'No slide plan yet',
    noSlidesDetail: 'Run analysis before generating deck template and slide images.',
    noExportTitle: 'Nothing to export yet',
    noExportDetail: 'Analyze the podcast first to create timestamps and transcript exports.',
    analysisReady: 'Analysis ready',
    analyzingPodcast: 'Analyzing podcast',
    transcribing: 'Transcribing voice-over with Groq Whisper...',
    analyzingSections: 'Analyzing podcast sections...',
    processing: 'Processing',
    cancel: 'Cancel',
    chatgptLanguageTitle: 'Switch ChatGPT to English',
    chatgptLanguageDetail: 'PodcastBoard detected ChatGPT is using Vietnamese. Image generation needs the ChatGPT interface in English so the extension can find the correct controls. After changing it, click Generate again. You do not need to reload the extension or analyze again.',
    chatgptLanguageSteps: 'Settings -> General -> Language -> English',
    chatgptLanguageLocale: 'Detected locale',
    chatgptLanguageButton: 'I will change it',
  },
  vi: {
    backToInput: '← Quay lại Input',
    noAnalysisTitle: 'Chưa có analysis',
    noAnalysisDetail: 'Nhập script ở Input, rồi bấm Analyze Podcast.',
    noSlidesTitle: 'Chưa có slide plan',
    noSlidesDetail: 'Analyze trước khi tạo deck template và slide images.',
    noExportTitle: 'Chưa có gì để export',
    noExportDetail: 'Analyze podcast trước để tạo timestamps và transcript export.',
    analysisReady: 'Analysis đã sẵn sàng',
    analyzingPodcast: 'Đang analyze podcast',
    transcribing: 'Đang transcribe voice-over bằng Groq Whisper...',
    analyzingSections: 'Đang analyze podcast sections...',
    processing: 'Đang xử lý',
    cancel: 'Cancel',
    chatgptLanguageTitle: 'Đổi ChatGPT sang tiếng Anh',
    chatgptLanguageDetail: 'PodcastBoard phát hiện ChatGPT đang dùng tiếng Việt. Phần tạo ảnh cần giao diện ChatGPT tiếng Anh để extension tìm đúng nút điều khiển. Sau khi đổi xong, bấm Generate lại. Không cần reload extension hoặc analyze lại.',
    chatgptLanguageSteps: 'Cài đặt -> Chung -> Ngôn ngữ -> chọn Tiếng Anh.',
    chatgptLanguageLocale: 'Locale phát hiện',
    chatgptLanguageButton: 'Đã hiểu',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

function ChatGptLanguageWarningModal({
  language,
  detectedLocale,
  onClose,
}: {
  language: UiLanguage;
  detectedLocale?: string;
  onClose: () => void;
}) {
  const t = uiCopy[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-md">
      <section className="w-full max-w-[360px] rounded-[28px] border border-border bg-panel p-5 shadow-2xl shadow-black/60">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[20px] border border-accent/40 bg-accent/10 text-accent">
          <svg viewBox="0 0 64 64" className="h-8 w-8" role="img" aria-hidden="true">
            <path d="M32 8 58 54H6L32 8Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            <path d="M32 24V38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="47" r="3.5" fill="currentColor" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-base font-black tracking-tight text-primary">{t.chatgptLanguageTitle}</h2>
          <p className="mt-2 text-xs leading-5 text-secondary">{t.chatgptLanguageDetail}</p>
          <div className="mt-4 rounded-[16px] border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-bold text-accent">
            {t.chatgptLanguageSteps}
          </div>
          {detectedLocale && (
            <div className="mt-3 text-[11px] text-secondary">{t.chatgptLanguageLocale}: {detectedLocale}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-accent px-4 py-2 text-xs font-black text-black hover:brightness-110"
        >
          {t.chatgptLanguageButton}
        </button>
      </section>
    </div>
  );
}

export default function App() {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPromptAssistant, setShowPromptAssistant] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>('input');
  const [showAnalyzeSuccess, setShowAnalyzeSuccess] = React.useState(false);
  const [uiLanguage, setUiLanguage] = React.useState<UiLanguage>(() => {
    const stored = window.localStorage.getItem('podcastboard-ui-language');
    return stored === 'vi' ? 'vi' : 'en';
  });
  const workflow = usePodcastWorkflow();
  const lastShownAnalyzeCompletedAtRef = React.useRef(0);
  const t = uiCopy[uiLanguage];

  const updateUiLanguage = React.useCallback((language: UiLanguage) => {
    setUiLanguage(language);
    window.localStorage.setItem('podcastboard-ui-language', language);
  }, []);

  React.useEffect(() => {
    if (
      workflow.analyzeCompletedAt > 0 &&
      workflow.analyzeCompletedAt !== lastShownAnalyzeCompletedAtRef.current &&
      activeTab === 'input'
    ) {
      lastShownAnalyzeCompletedAtRef.current = workflow.analyzeCompletedAt;
      setShowAnalyzeSuccess(true);
      const timer = window.setTimeout(() => {
        setShowAnalyzeSuccess(false);
        setActiveTab('analysis');
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, workflow.analyzeCompletedAt]);

  React.useEffect(() => {
    if (workflow.project.assets.deckTemplate && activeTab !== 'slides' && workflow.generatingSlides) {
      setActiveTab('slides');
    }
  }, [activeTab, workflow.generatingSlides, workflow.project.assets.deckTemplate]);

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col">
      <ProjectHeader
        analysisLabel={workflow.project.providers.analysis.kind === 'mock' ? 'Mock' : workflow.project.providers.analysis.kind}
        language={uiLanguage}
        onLanguageChange={updateUiLanguage}
        onToggleSettings={() => setShowSettings(true)}
        onTogglePromptAssistant={() => setShowPromptAssistant(true)}
        onToggleGuide={() => setShowGuide(true)}
        onReset={() => { void workflow.resetProject(); }}
      />

      <SettingsPanel
        open={showSettings}
        providers={workflow.project.providers}
        onChange={(providers) => workflow.updateProviders(providers)}
        onClose={() => setShowSettings(false)}
        language={uiLanguage}
      />

      <WorkspaceTabs
        activeTab={activeTab}
        project={workflow.project}
        generatingSlides={workflow.generatingSlides}
        language={uiLanguage}
        onChange={setActiveTab}
      />

      <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {workflow.error && <div className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-xs text-danger">{workflow.error}</div>}
        {!workflow.running && <ProgressPanel progress={workflow.progress} transcribing={workflow.transcribing} language={uiLanguage} />}

        {activeTab !== 'input' && (
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-primary hover:border-accent/70"
          >
            {t.backToInput}
          </button>
        )}

        {activeTab === 'input' && (
          <InputPanel
            project={workflow.project}
            onScriptChange={(script) => { void workflow.updateScript(script); }}
            onSettingsChange={(settings) => { void workflow.updateSettings(settings); }}
            onAudioUpload={workflow.uploadAudio}
            onAudioClear={workflow.clearAudio}
            onTemplateUpload={workflow.uploadTemplateReference}
            onTemplateClear={workflow.clearTemplateReference}
            onCharacterOneNameChange={workflow.updateCharacterOneName}
            onCharacterOneUpload={workflow.uploadCharacterOne}
            onCharacterOneClear={workflow.clearCharacterOne}
            onCharacterTwoNameChange={workflow.updateCharacterTwoName}
            onCharacterTwoUpload={workflow.uploadCharacterTwo}
            onCharacterTwoClear={workflow.clearCharacterTwo}
            onLocationUpload={workflow.uploadLocationReference}
            onLocationClear={workflow.clearLocationReference}
            onLocationDescriptionChange={workflow.updateLocationDescription}
            onAnalyze={workflow.analyze}
            running={workflow.running}
            language={uiLanguage}
          />
        )}

        {activeTab === 'analysis' && (
          workflow.project.analysis
            ? (
              <AnalysisPanel
                project={workflow.project}
                language={uiLanguage}
                onGoToSlides={() => setActiveTab('slides')}
                onUpdateSection={workflow.updateAnalysisSection}
              />
            )
            : <EmptyState title={t.noAnalysisTitle} detail={t.noAnalysisDetail} />
        )}

        {activeTab === 'slides' && (
          workflow.project.analysis
            ? (
              <SlidesPanel
                project={workflow.project}
                generating={workflow.generatingSlides}
                onGenerate={workflow.generateSlides}
                onPause={workflow.pauseGeneration}
                onResume={workflow.resumeGeneration}
                onCancel={workflow.cancelGeneration}
                onUpdateSlidePrompt={workflow.updateSlidePrompt}
                onDeleteSlideImage={workflow.deleteSlideImage}
                onRegenerateSlide={workflow.regenerateSlide}
                onDeleteOpeningStill={workflow.deleteOpeningStill}
                onRegenerateOpeningStill={workflow.regenerateOpeningStill}
                regeneratingSlideNumber={workflow.regeneratingSlideNumber}
                regeneratingOpeningStill={workflow.regeneratingOpeningStill}
                language={uiLanguage}
              />
            )
            : <EmptyState title={t.noSlidesTitle} detail={t.noSlidesDetail} />
        )}

        {activeTab === 'export' && (
          workflow.project.analysis
            ? (
              <ExportPanel
                project={workflow.project}
                onExportTimestamps={workflow.exportTimestamps}
                onExportTranscript={workflow.exportTranscript}
                onExportZip={workflow.exportZip}
                language={uiLanguage}
              />
            )
            : <EmptyState title={t.noExportTitle} detail={t.noExportDetail} />
        )}
      </main>

      <WorkflowStatusModal
        open={workflow.running || showAnalyzeSuccess}
        mode={showAnalyzeSuccess ? 'success' : 'loading'}
        title={showAnalyzeSuccess ? t.analysisReady : t.analyzingPodcast}
        detail={workflow.transcribing ? t.transcribing : t.analyzingSections}
        processingLabel={t.processing}
        cancelLabel={t.cancel}
        progress={workflow.progress}
        onCancel={showAnalyzeSuccess ? undefined : workflow.cancelAnalyze}
      />

      <PromptAssistantDrawer
        open={showPromptAssistant}
        project={workflow.project}
        onClose={() => setShowPromptAssistant(false)}
        onPreview={workflow.previewPromptRule}
        onApply={workflow.applyPromptRule}
        onUpdateRule={workflow.updatePromptRule}
        onDeleteRule={workflow.deletePromptRule}
      />

      <GuideDrawer
        open={showGuide}
        language={uiLanguage}
        onClose={() => setShowGuide(false)}
        onStart={() => {
          setShowGuide(false);
          setActiveTab('input');
        }}
      />

      {workflow.chatgptLanguageWarning && (
        <ChatGptLanguageWarningModal
          language={uiLanguage}
          detectedLocale={workflow.chatgptLanguageWarning.detectedLocale}
          onClose={workflow.dismissChatgptLanguageWarning}
        />
      )}
    </div>
  );
}
