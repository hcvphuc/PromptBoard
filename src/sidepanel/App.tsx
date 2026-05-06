import React from 'react';
import type { PipelineSettings } from '@/types/project';
import { DEFAULT_SETTINGS } from '@/types/project';
import type { ProjectOutput } from '@/types/output';
import type { AIProvider } from '@/ai/provider';
import type { AIProviderConfig } from '@/ai/provider';
import { MockProvider } from '@/ai/mock';
import { OpenRouterProvider } from '@/ai/openrouter';
import { OpenAIProvider } from '@/ai/openai';
import { OllamaProvider } from '@/ai/ollama';
import { runPipeline, type PipelineProgress } from '@/pipeline/runPipeline';
import { ScriptInput } from '@/components/ScriptInput';
import { SettingsPanel } from '@/components/SettingsPanel';
import { OutputTabs } from '@/components/OutputTabs';
import { extensionStorage } from '@/storage/extensionStorage';
import { saveProjectToFile, readProjectFromFile, saveRecentProject, getRecentProjects, loadStoredProject, deleteStoredProject, getProjectMeta, type ProjectMeta } from '@/storage/projectFile';
import { runImageGeneration, extractShotsFromBoards } from '@/imagegen/runImageGen';
import type { ImageGenState, ShotImage } from '@/types/pipeline';
import { ImageGenPanel } from '@/components/ImageGenPanel';
import { logger } from '@/logger/logger';
import { breakdownShots, breakdownAllShots } from '@/pipeline/breakdownShots';
import { parseSRT, getSRTDuration } from '@/pipeline/srtParser';

function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterProvider(config.apiKey || '', config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey || '', config.model);
    case 'ollama':
      return new OllamaProvider(config.baseUrl, config.model, config.apiKey);
    case 'mock':
    default:
      return new MockProvider();
  }
}

export default function App() {
  const [script, setScript] = React.useState('');
  const [settings, setSettings] = React.useState<PipelineSettings>(DEFAULT_SETTINGS);
  const [providerConfig, setProviderConfig] = React.useState<AIProviderConfig>({ provider: 'mock' });
  const [output, setOutput] = React.useState<ProjectOutput | null>(null);
  const [progress, setProgress] = React.useState<PipelineProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [imageGenState, setImageGenState] = React.useState<ImageGenState>({
    phase: 'idle',
    currentItem: '',
    progress: 0,
    totalSteps: 0,
    completedSteps: 0,
    refImages: [],
    boardImages: [],
    shotImages: [],
    errors: [],
  });
  const [imageGenRunning, setImageGenRunning] = React.useState(false);
  const [refImages, setRefImages] = React.useState<any[]>([]);
  const [boardImages, setBoardImages] = React.useState<any[]>([]);
  const [shotImages, setShotImages] = React.useState<ShotImage[]>([]);
  const [shotBreakdownRunning, setShotBreakdownRunning] = React.useState(false);
  const [extractingShots, setExtractingShots] = React.useState(false);
  const [srtContent, setSrtContent] = React.useState<string>('');
  const [srtFileName, setSrtFileName] = React.useState<string>('');
  const [audioDuration, setAudioDuration] = React.useState<number>(0);
  const [showRecentProjects, setShowRecentProjects] = React.useState(false);
  const [recentProjects, setRecentProjects] = React.useState<ProjectMeta[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load saved state on mount
  React.useEffect(() => {
    (async () => {
      const savedScript = await extensionStorage.getLastScript();
      const savedSettings = await extensionStorage.getSettings();
      const savedConfig = await extensionStorage.getProviderConfig();
      if (savedScript) setScript(savedScript);
      setSettings(savedSettings);
      setProviderConfig(savedConfig);
      // Load recent projects list
      const recents = await getRecentProjects();
      setRecentProjects(recents);
    })();
  }, []);

  const handleSRTUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = parseSRT(text);
      const duration = getSRTDuration(lines);
      setSrtContent(text);
      setSrtFileName(file.name);
      setAudioDuration(duration);
      logger.info('App', 'SRT loaded', `${file.name}: ${lines.length} lines, ${duration.toFixed(1)}s`);
    } catch (err: any) {
      setError(`Failed to parse SRT: ${err.message}`);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;

    // Validate: audio-driven mode requires SRT
    if (settings.mode === 'audio-driven' && !srtContent) {
      setError('Audio-driven mode requires an SRT file. Please upload one.');
      return;
    }

    setRunning(true);
    setError(null);
    setOutput(null);

    logger.info('App', 'Pipeline started', `Provider: ${providerConfig.provider}, Model: ${providerConfig.model || 'default'}, Mode: ${settings.mode}`);
    const provider = createProvider(providerConfig);

    // Build audio input for audio-driven mode
    const audioInput = settings.mode === 'audio-driven' && srtContent ? {
      srtContent,
      audioDuration,
    } : undefined;

    try {
      const result = await runPipeline(script, settings, provider, (p) => {
        setProgress(p);
      }, audioInput);

      setOutput(result);
      logger.info('App', 'Pipeline completed successfully');

      // Save to storage
      await extensionStorage.setLastScript(script);
      await extensionStorage.setLastOutput(result);
    } catch (err: any) {
      setError(err.message || 'Pipeline failed');
      logger.error('App', 'Pipeline failed', err.message || String(err));
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  const handleRegenerate = async (tab: string) => {
    // For now, re-run the full pipeline
    await handleGenerate();
  };

  const handleGenerateImages = async () => {
    if (!output) return;

    setImageGenRunning(true);
    logger.info('App', 'Image generation started', `${output.characters?.length || 0} chars, ${output.locations?.length || 0} locs, ${output.storyboards?.length || 0} boards`);
    setImageGenState({
      phase: 'generating-characters',
      currentItem: '',
      progress: 0,
      totalSteps: (output.characters?.length || 0) + (output.locations?.length || 0) + (output.storyboards?.length || 0),
      completedSteps: 0,
      refImages: [],
      boardImages: [],
      shotImages: [],
      errors: [],
    });

    try {
      const result = await runImageGeneration(output, (state) => {
        setImageGenState({ ...state });
      }, settings);
      setRefImages(result.refImages);
      setBoardImages(result.boardImages);
      setImageGenState((prev) => ({ ...prev, phase: 'done' }));
      logger.info('App', 'Image generation completed', `${result.refImages.length} refs, ${result.boardImages.length} boards`);
    } catch (err: any) {
      setImageGenState((prev) => ({ ...prev, phase: 'error', errors: [...prev.errors, String(err)] }));
      logger.error('App', 'Image generation failed', String(err));
    } finally {
      setImageGenRunning(false);
    }
  };

  const handleDownloadAllImages = () => {
    // Download reference images
    for (const img of refImages) {
      const filename = `${img.type}_${img.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        payload: { dataUrl: img.imageDataUrl, filename },
      });
    }
    // Download board images
    for (const img of boardImages) {
      const filename = `board_${img.boardNumber}.png`;
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        payload: { dataUrl: img.imageDataUrl, filename },
      });
    }
  };

  const handleBreakdownShots = async (boardNumber: number) => {
    if (!output || shotBreakdownRunning) return;
    const board = output.storyboards.find(b => b.board_number === boardNumber);
    if (!board) return;

    setShotBreakdownRunning(true);
    const provider = createProvider(providerConfig);

    try {
      const newShots = await breakdownShots(board, output.bible, provider);
      setOutput(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          storyboards: prev.storyboards.map(b =>
            b.board_number === boardNumber ? { ...b, shots: newShots } : b
          ),
        };
      });
      logger.info('App', `Shot breakdown complete for board ${boardNumber}`, `${newShots.length} shots`);
    } catch (err: any) {
      logger.error('App', 'Shot breakdown failed', String(err));
    } finally {
      setShotBreakdownRunning(false);
    }
  };

  const handleBreakdownAllShots = async () => {
    if (!output || shotBreakdownRunning) return;
    setShotBreakdownRunning(true);
    const provider = createProvider(providerConfig);

    try {
      const results = await breakdownAllShots(output.storyboards, output.bible, provider);
      setOutput(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          storyboards: prev.storyboards.map(b => {
            const newShots = results.get(b.board_number);
            return newShots ? { ...b, shots: newShots } : b;
          }),
        };
      });
      logger.info('App', 'All shot breakdowns complete', `${results.size} boards processed`);
    } catch (err: any) {
      logger.error('App', 'All shot breakdowns failed', String(err));
    } finally {
      setShotBreakdownRunning(false);
    }
  };

  // Save project to JSON file
  const handleSaveProject = () => {
    saveProjectToFile({
      script, settings, output, providerConfig, refImages, boardImages, shotImages,
    });
    logger.info('App', 'Project saved to file');
  };

  // Open project from file
  const handleOpenProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pf = await readProjectFromFile(file);
      applyProjectFile(pf);
      // Also save to recent
      const meta = getProjectMeta(pf);
      await saveRecentProject(meta, pf);
      const recents = await getRecentProjects();
      setRecentProjects(recents);
      logger.info('App', 'Project loaded from file', pf.project.title);
    } catch (err: any) {
      setError(`Failed to open project: ${err.message}`);
    }
    // Reset file input
    e.target.value = '';
  };

  // Open project from storage
  const handleOpenRecentProject = async (id: string) => {
    try {
      const pf = await loadStoredProject(id);
      if (!pf) throw new Error('Project not found in storage');
      applyProjectFile(pf);
      setShowRecentProjects(false);
      logger.info('App', 'Project loaded from storage', pf.project.title);
    } catch (err: any) {
      setError(`Failed to load project: ${err.message}`);
    }
  };

  // Delete a recent project
  const handleDeleteRecentProject = async (id: string) => {
    await deleteStoredProject(id);
    const recents = await getRecentProjects();
    setRecentProjects(recents);
  };

  // Apply a loaded ProjectFile to app state
  const applyProjectFile = (pf: { project: { script: string; settings: PipelineSettings; output: ProjectOutput | null; providerConfig: AIProviderConfig; refImages?: any[]; boardImages?: any[]; shotImages?: any[] } }) => {
    const p = pf.project;
    setScript(p.script);
    setSettings(p.settings);
    setOutput(p.output);
    setProviderConfig(p.providerConfig);
    setRefImages(p.refImages || []);
    setBoardImages(p.boardImages || []);
    setShotImages(p.shotImages || []);
    setError(null);
  };

  const handleExtractShots = async () => {
    if (!output || extractingShots || boardImages.length === 0) return;
    setExtractingShots(true);

    try {
      const result = await extractShotsFromBoards(output, boardImages, (state) => {
        setImageGenState(state);
      });
      setShotImages(prev => [...prev, ...result.shotImages]);
      logger.info('App', 'Shot extraction complete', `${result.shotImages.length} shots, ${result.errors.length} errors`);
      if (result.errors.length > 0) {
        logger.warn('App', 'Shot extraction errors', result.errors.join('; '));
      }
    } catch (err: any) {
      logger.error('App', 'Shot extraction failed', String(err));
    } finally {
      setExtractingShots(false);
      setImageGenState(prev => ({ ...prev, phase: 'done' }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-panel border-b border-border">
        <h1 className="text-sm font-bold text-primary tracking-tight">
          <span className="text-accent">PromptBoard</span> AI
        </h1>
        <div className="flex items-center gap-1.5">
          {/* Save Project */}
          <button
            onClick={handleSaveProject}
            className="p-1 rounded-md hover:bg-card text-secondary hover:text-primary transition-colors"
            title="Save Project (.json)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
          {/* Open Project File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded-md hover:bg-card text-secondary hover:text-primary transition-colors"
            title="Open Project (.json)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.promptboard.json"
            className="hidden"
            onChange={handleOpenProjectFile}
          />
          {/* Recent Projects */}
          <button
            onClick={() => setShowRecentProjects(!showRecentProjects)}
            className="p-1 rounded-md hover:bg-card text-secondary hover:text-primary transition-colors"
            title="Recent Projects"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <span className="text-xs text-secondary">
            {providerConfig.provider === 'mock' ? '🎭 Mock' : providerConfig.provider}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md hover:bg-card text-secondary hover:text-primary transition-colors"
            title="Provider Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Provider Settings Drawer */}
      {showSettings && (
        <div className="px-3 py-2 bg-panel border-b border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-secondary mb-1">AI Provider</label>
              <select
                value={providerConfig.provider}
                onChange={(e) => {
                  const newProvider = e.target.value as any;
                  const defaultModels: Record<string, string> = {
                    mock: '',
                    openrouter: 'anthropic/claude-sonnet-4',
                    openai: 'gpt-4o',
                    ollama: 'gemini-3-flash-preview',
                  };
                  const newConfig = {
                    ...providerConfig,
                    provider: newProvider,
                    model: providerConfig.model || defaultModels[newProvider] || '',
                  };
                  // Auto-set base URL for Ollama
                  if (newProvider === 'ollama' && !providerConfig.baseUrl) {
                    newConfig.baseUrl = 'https://ollama.com';
                  }
                  setProviderConfig(newConfig);
                  extensionStorage.setProviderConfig(newConfig);
                }}
                className="w-full bg-card border border-border rounded-btn px-2 py-1 text-primary text-xs"
              >
                <option value="mock">Mock (Demo)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            {providerConfig.provider !== 'mock' && (
              <div>
                <label className="block text-xs text-secondary mb-1">API Key</label>
                <input
                  type="password"
                  value={providerConfig.apiKey || ''}
                  onChange={(e) => {
                    const newConfig = { ...providerConfig, apiKey: e.target.value };
                    setProviderConfig(newConfig);
                    extensionStorage.setProviderConfig(newConfig);
                  }}
                  placeholder="sk-..."
                  className="w-full bg-card border border-border rounded-btn px-2 py-1 text-primary text-xs"
                />
              </div>
            )}
            {providerConfig.provider === 'ollama' && (
              <div>
                <label className="block text-xs text-secondary mb-1">Base URL</label>
                <input
                  type="text"
                  value={providerConfig.baseUrl || 'https://ollama.com'}
                  onChange={(e) => {
                    const newConfig = { ...providerConfig, baseUrl: e.target.value };
                    setProviderConfig(newConfig);
                    extensionStorage.setProviderConfig(newConfig);
                  }}
                  className="w-full bg-card border border-border rounded-btn px-2 py-1 text-primary text-xs"
                />
              </div>
            )}
          </div>
          {providerConfig.provider !== 'mock' && (
            <div>
              <label className="block text-xs text-secondary mb-1">Model</label>
              <input
                type="text"
                value={providerConfig.model || ''}
                onChange={(e) => {
                  const newConfig = { ...providerConfig, model: e.target.value };
                  setProviderConfig(newConfig);
                  extensionStorage.setProviderConfig(newConfig);
                }}
                placeholder={
                  providerConfig.provider === 'openrouter'
                    ? 'anthropic/claude-sonnet-4'
                    : providerConfig.provider === 'ollama'
                    ? 'gemini-3-flash-preview'
                    : 'gpt-4o'
                }
                className="w-full bg-card border border-border rounded-btn px-2 py-1 text-primary text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Recent Projects Dropdown */}
      {showRecentProjects && (
        <div className="px-3 py-2 bg-panel border-b border-border">
          <div className="text-xs text-secondary mb-2 font-medium">Recent Projects</div>
          {recentProjects.length === 0 ? (
            <div className="text-xs text-secondary py-2 text-center">No saved projects</div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {recentProjects.map((rp) => (
                <div
                  key={rp.id}
                  className="flex items-center gap-2 p-2 rounded-btn hover:bg-card cursor-pointer group"
                  onClick={() => handleOpenRecentProject(rp.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-primary font-medium truncate">{rp.title}</div>
                    <div className="text-xs text-secondary truncate">{rp.scriptPreview}</div>
                    <div className="text-xs text-secondary">{new Date(rp.savedAt).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRecentProject(rp.id); }}
                    className="p-1 rounded hover:bg-red-500/20 text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete project"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {!output ? (
          <div className="p-3 space-y-4">
            {/* Script Input */}
            <ScriptInput script={script} onChange={setScript} disabled={running} />

            {/* SRT Upload (audio-driven mode only) */}
            {settings.mode === 'audio-driven' && (
              <div className="space-y-2">
                <label className="block text-xs text-secondary font-medium">SRT Subtitles</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-btn cursor-pointer hover:border-accent/50 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <span className="text-xs text-secondary">{srtFileName || 'Upload .srt file'}</span>
                    <input
                      type="file"
                      accept=".srt"
                      onChange={handleSRTUpload}
                      className="hidden"
                      disabled={running}
                    />
                  </label>
                  {srtFileName && (
                    <button
                      onClick={() => { setSrtContent(''); setSrtFileName(''); setAudioDuration(0); }}
                      className="text-xs text-secondary hover:text-accent transition-colors"
                      title="Remove SRT"
                    >✕</button>
                  )}
                </div>
                {audioDuration > 0 && (
                  <div className="text-xs text-secondary">
                    Duration: <span className="text-accent font-medium">{Math.floor(audioDuration / 60)}m {(audioDuration % 60).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <SettingsPanel settings={settings} onChange={setSettings} disabled={running} />

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-btn p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Progress */}
            {running && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary">{progress.stepLabel}</span>
                  <span className="text-xs text-primary">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={running || !script.trim()}
              className={`w-full py-2.5 rounded-btn text-sm font-semibold transition-all ${
                running || !script.trim()
                  ? 'bg-card border border-border text-secondary cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20'
              }`}
            >
              {running ? 'Generating...' : 'Generate Prompts'}
            </button>
          </div>
        ) : (
          <OutputTabs output={output} onRegenerateTab={handleRegenerate} refImages={refImages} boardImages={boardImages} shotImages={shotImages} onBreakdownShots={handleBreakdownShots} onBreakdownAllShots={handleBreakdownAllShots} onExtractShots={handleExtractShots} shotBreakdownRunning={shotBreakdownRunning} extractingShots={extractingShots} />
        )}
      </div>

      {/* Image generation panel (shown when output exists) */}
      {output && (
        <div className="px-3 py-2 bg-panel border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOutput(null)}
              className="text-xs text-secondary hover:text-primary transition-colors"
            >
              ← Back to input
            </button>
            <div className="flex-1" />
            <button
              onClick={handleGenerateImages}
              disabled={imageGenRunning || !output}
              className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all ${
                imageGenRunning
                  ? 'bg-card border border-border text-secondary cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20'
              }`}
            >
              {imageGenRunning ? '🎨 Generating...' : '🎨 Generate Images'}
            </button>
          </div>
          {imageGenState.phase !== 'idle' && (
            <ImageGenPanel
              state={imageGenState}
              onCancel={() => { setImageGenRunning(false); setImageGenState((prev) => ({ ...prev, phase: 'idle' })); }}
              onDownloadAll={handleDownloadAllImages}
            />
          )}
        </div>
      )}
    </div>
  );
}