import React from 'react';
import { DEFAULT_PROVIDER_SELECTION } from '@/ai/provider';
import type { ProviderSelection } from '@/ai/provider';
import { createAnalysisProvider, createImageProvider, createTranscriptionProvider } from '@/application/providers/factories';
import { buildTimestampRows, exportPodcastZip, exportTimestampsJson, exportTranscriptSrt, transcriptSegmentsToSrt } from './export';
import { getAudioDuration, fileToDataUrl } from './audio';
import { buildDeckTemplatePrompt } from '@/domain/podcast/style';
import { estimateScriptOnlyDuration } from '@/domain/podcast/timing';
import type { PodcastProgress } from '@/domain/podcast/pipeline';
import { runPodcastPipeline } from '@/domain/podcast/pipeline';
import type { PodcastProject, PodcastPromptRule, PodcastSettings, PodcastSlideImage } from '@/domain/podcast/model';
import { createEmptyPodcastProject } from '@/domain/podcast/model';
import { extensionStorage } from '@/storage/extensionStorage';
import { appendPromptRules, buildPromptRule, createPromptRuleDraft, type PromptRuleDraft } from './promptRules';

function cloneProject(project: PodcastProject): PodcastProject {
  return JSON.parse(JSON.stringify(project)) as PodcastProject;
}

function withProjectUpdate(project: PodcastProject, updater: (draft: PodcastProject) => void): PodcastProject {
  const next = cloneProject(project);
  updater(next);
  next.updatedAt = Date.now();
  return next;
}

function clearGeneratedAssets(draft: PodcastProject): void {
  draft.assets.deckTemplate = undefined;
  draft.assets.openingStill = undefined;
  draft.assets.slides = [];
  draft.generation.status = 'idle';
  draft.stage = draft.analysis ? 'analyzed' : 'draft';
}

function buildOpeningStillPrompt(project: PodcastProject): string {
  const title = project.analysis?.title || 'Podcast Opening';
  const locationInstruction = project.inputs.locationReference
    ? 'Use the attached location reference as the podcast studio/environment anchor.'
    : 'Create a credible real podcast recording room with practical room lighting, microphones, cables, table details, and natural background texture.';

  return `Create a natural, real-photo opening still frame for a two-person podcast episode.

Episode/deck title: "${title}"
Aspect ratio: ${project.settings.aspectRatio}

Use the first attached character image as speaker 1 and the second attached character image as speaker 2. Preserve their identity, facial structure, age impression, hair, skin tone, and wardrobe cues as much as possible. Show both people seated across or angled toward each other in a real podcast setup with microphones, table, headphones or studio gear where appropriate.

${locationInstruction}

Camera and composition: medium-wide real camera photo, straight-on stable camera angle, level horizon, no Dutch angle, no tilted framing, both speakers visible, natural eye contact or active conversation posture. Use believable human imperfections: natural skin texture, small facial asymmetry, normal room-light shadows, slight lens softness, realistic fabric folds, subtle table clutter, real microphone hardware.

Avoid AI polish: no plastic skin, no beauty retouching, no overly symmetrical faces, no perfect studio render, no glossy poster look, no fantasy lighting, no ultra-clean showroom, no cinematic color grading, no exaggerated depth of field, no text overlays, no logos, no watermarks, no slide UI, no infographic elements.`;
}

function mergeSlide(existingSlides: PodcastSlideImage[], nextSlide: PodcastSlideImage): PodcastSlideImage[] {
  const withoutDuplicate = existingSlides.filter((slide) => slide.slideNumber !== nextSlide.slideNumber);
  return [...withoutDuplicate, nextSlide].sort((a, b) => a.slideNumber - b.slideNumber);
}

function withSpeakerNameRule(prompt: string, project: PodcastProject): string {
  const names = [project.inputs.characterOne?.name, project.inputs.characterTwo?.name]
    .map((name) => name?.trim())
    .filter(Boolean);
  const nameText = names.length > 0 ? ` User-provided speaker names: ${names.join(', ')}.` : '';
  return `${prompt}

SPEAKER NAME RULE:${nameText} If the image includes speaker names, render only the standalone person names. Do not render "Podcast", "show", "episode", "channel", brand text, or phrases like "Nam và Thủy Podcast" after the names.`;
}

export function usePodcastWorkflow() {
  const [project, setProject] = React.useState<PodcastProject>(createEmptyPodcastProject(DEFAULT_PROVIDER_SELECTION));
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [running, setRunning] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [generatingSlides, setGeneratingSlides] = React.useState(false);
  const [progress, setProgress] = React.useState<PodcastProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [analyzeCompletedAt, setAnalyzeCompletedAt] = React.useState(0);
  const projectRef = React.useRef(project);
  const generationControlRef = React.useRef<'idle' | 'running' | 'paused' | 'cancelled'>('idle');
  const generationStopResolverRef = React.useRef<(() => void) | null>(null);
  const analyzeRunIdRef = React.useRef(0);

  React.useEffect(() => {
    projectRef.current = project;
  }, [project]);

  React.useEffect(() => {
    (async () => {
      const stored = await extensionStorage.getProject();
      projectRef.current = stored;
      setProject(stored);
    })();
  }, []);

  const persistProject = React.useCallback(async (nextProject: PodcastProject) => {
    projectRef.current = nextProject;
    setProject(nextProject);
    await extensionStorage.saveProject(nextProject);
  }, []);

  const updateProject = React.useCallback(async (updater: (draft: PodcastProject) => void) => {
    const next = withProjectUpdate(projectRef.current, updater);
    await persistProject(next);
  }, [persistProject]);

  const waitForGenerationStep = React.useCallback(async <T,>(operation: Promise<T>): Promise<T | null> => {
    if (generationControlRef.current !== 'running') return null;

    const stopSignal = new Promise<null>((resolve) => {
      generationStopResolverRef.current = () => resolve(null);
    });
    const result = await Promise.race([operation, stopSignal]);

    if (generationStopResolverRef.current) {
      generationStopResolverRef.current = null;
    }
    return result;
  }, []);

  const requestGenerationStop = React.useCallback((status: 'paused' | 'cancelled') => {
    generationControlRef.current = status;
    generationStopResolverRef.current?.();
    generationStopResolverRef.current = null;
  }, []);

  const updateScript = React.useCallback(async (script: string) => {
    await updateProject((draft) => {
      if (draft.inputs.script === script) return;
      draft.inputs.script = script;
      draft.analysis = undefined;
      clearGeneratedAssets(draft);
      draft.exports.timestamps = [];
    });
  }, [updateProject]);

  const updateSettings = React.useCallback(async (settings: PodcastSettings) => {
    await updateProject((draft) => {
      const templateChanged = draft.settings.template !== settings.template;
      draft.settings = settings;
      if (templateChanged) clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const updateProviders = React.useCallback(async (providers: ProviderSelection) => {
    await updateProject((draft) => {
      draft.providers = providers;
    });
  }, [updateProject]);

  const previewPromptRule = React.useCallback(async (userRequest: string): Promise<PromptRuleDraft> => {
    const currentProject = projectRef.current;
    const provider = createAnalysisProvider(currentProject.providers.analysis);
    return createPromptRuleDraft(provider, userRequest, {
      activeRules: currentProject.promptRules,
      speakerNames: [currentProject.inputs.characterOne?.name || '', currentProject.inputs.characterTwo?.name || ''],
    });
  }, []);

  const applyPromptRule = React.useCallback(async (draft: PromptRuleDraft) => {
    await updateProject((projectDraft) => {
      projectDraft.promptRules = [
        buildPromptRule(`rule-${Date.now()}`, draft),
        ...projectDraft.promptRules,
      ];
      clearGeneratedAssets(projectDraft);
    });
  }, [updateProject]);

  const updatePromptRule = React.useCallback(async (rule: PodcastPromptRule) => {
    await updateProject((draft) => {
      draft.promptRules = draft.promptRules.map((item) => item.id === rule.id ? rule : item);
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const deletePromptRule = React.useCallback(async (ruleId: string) => {
    await updateProject((draft) => {
      draft.promptRules = draft.promptRules.filter((rule) => rule.id !== ruleId);
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const updateCharacterOneName = React.useCallback(async (name: string) => {
    await updateProject((draft) => {
      draft.inputs.characterOne = {
        fileName: draft.inputs.characterOne?.fileName || '',
        dataUrl: draft.inputs.characterOne?.dataUrl || '',
        name,
      };
      draft.analysis = undefined;
      clearGeneratedAssets(draft);
      draft.exports.timestamps = [];
    });
  }, [updateProject]);

  const updateCharacterTwoName = React.useCallback(async (name: string) => {
    await updateProject((draft) => {
      draft.inputs.characterTwo = {
        fileName: draft.inputs.characterTwo?.fileName || '',
        dataUrl: draft.inputs.characterTwo?.dataUrl || '',
        name,
      };
      draft.analysis = undefined;
      clearGeneratedAssets(draft);
      draft.exports.timestamps = [];
    });
  }, [updateProject]);

  const uploadAudio = React.useCallback(async (file: File) => {
    const duration = await getAudioDuration(file);
    setAudioFile(file);
    setError(null);
    await updateProject((draft) => {
      draft.inputs.audio = {
        name: file.name,
        durationSeconds: duration,
        mimeType: file.type || 'audio/mpeg',
      };
      draft.transcript = undefined;
      draft.analysis = undefined;
      clearGeneratedAssets(draft);
      draft.exports.timestamps = [];
      draft.exports.transcriptSrt = undefined;
      draft.stage = 'draft';
    });
  }, [updateProject]);

  const clearAudio = React.useCallback(async () => {
    setAudioFile(null);
    await updateProject((draft) => {
      draft.inputs.audio = undefined;
      draft.transcript = undefined;
      draft.analysis = undefined;
      clearGeneratedAssets(draft);
      draft.exports.timestamps = [];
      draft.exports.transcriptSrt = undefined;
      draft.stage = 'draft';
    });
  }, [updateProject]);

  const uploadTemplateReference = React.useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    await updateProject((draft) => {
      draft.inputs.templateReferenceDataUrl = dataUrl;
      draft.inputs.templateFileName = file.name;
      draft.settings.template = 'custom-reference';
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const clearTemplateReference = React.useCallback(async () => {
    await updateProject((draft) => {
      draft.inputs.templateReferenceDataUrl = undefined;
      draft.inputs.templateFileName = undefined;
      if (draft.settings.template === 'custom-reference') {
        draft.settings.template = 'business-premium';
      }
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const uploadCharacterOne = React.useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    await updateProject((draft) => {
      draft.inputs.characterOne = { fileName: file.name, dataUrl, name: draft.inputs.characterOne?.name };
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const clearCharacterOne = React.useCallback(async () => {
    await updateProject((draft) => {
      draft.inputs.characterOne = undefined;
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const uploadCharacterTwo = React.useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    await updateProject((draft) => {
      draft.inputs.characterTwo = { fileName: file.name, dataUrl, name: draft.inputs.characterTwo?.name };
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const clearCharacterTwo = React.useCallback(async () => {
    await updateProject((draft) => {
      draft.inputs.characterTwo = undefined;
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const uploadLocationReference = React.useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    await updateProject((draft) => {
      draft.inputs.locationReference = { fileName: file.name, dataUrl };
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const clearLocationReference = React.useCallback(async () => {
    await updateProject((draft) => {
      draft.inputs.locationReference = undefined;
      clearGeneratedAssets(draft);
    });
  }, [updateProject]);

  const analyze = React.useCallback(async () => {
    const currentProject = projectRef.current;
    if (!currentProject.inputs.script.trim()) return;
    const hasAudio = Boolean(audioFile && currentProject.inputs.audio?.durationSeconds);
    const runId = analyzeRunIdRef.current + 1;
    analyzeRunIdRef.current = runId;

    setRunning(true);
    setError(null);
    setTranscribing(hasAudio);
    setProgress({
      step: 'analyzing',
      label: hasAudio ? 'Transcribing voice-over with Groq Whisper...' : 'Analyzing script...',
      percentage: 10,
    });

    try {
      let transcript: PodcastProject['transcript'] = undefined;
      let audioDuration = estimateScriptOnlyDuration(currentProject.inputs.script);

      if (hasAudio && audioFile && currentProject.inputs.audio?.durationSeconds) {
        const transcriptProvider = createTranscriptionProvider(currentProject.providers.transcript);
        const transcription = await transcriptProvider.transcribe(audioFile);
        if (analyzeRunIdRef.current !== runId) return;
        const syncedSegments = transcription.segments.map((segment, index) => ({
          ...segment,
          index,
          end: segment.end > segment.start ? segment.end : Math.min(currentProject.inputs.audio!.durationSeconds, segment.start + 4),
        }));
        if (syncedSegments.length === 0) {
          throw new Error('Groq transcription returned no timestamped segments.');
        }

        transcript = {
          text: transcription.text,
          segments: syncedSegments,
        };
        audioDuration = currentProject.inputs.audio.durationSeconds;
      }

      const analysisProvider = createAnalysisProvider(currentProject.providers.analysis);
      setTranscribing(false);
      const analysis = await runPodcastPipeline({
        script: currentProject.inputs.script,
        audioDuration,
        settings: currentProject.settings,
        speakerNames: [currentProject.inputs.characterOne?.name || '', currentProject.inputs.characterTwo?.name || ''],
        promptRules: currentProject.promptRules,
        transcriptSegments: transcript?.segments || [],
      }, analysisProvider, setProgress);
      if (analyzeRunIdRef.current !== runId) return;

      const next = withProjectUpdate(projectRef.current, (draft) => {
        draft.transcript = transcript;
        draft.analysis = analysis;
        clearGeneratedAssets(draft);
        draft.exports.timestamps = buildTimestampRows({
          ...draft,
          analysis,
        } as PodcastProject);
        draft.exports.transcriptSrt = transcript ? transcriptSegmentsToSrt(transcript.segments) : undefined;
        draft.stage = 'analyzed';
      });
      await persistProject(next);
      setAnalyzeCompletedAt(Date.now());
    } catch (err: any) {
      if (analyzeRunIdRef.current !== runId) return;
      setError(err.message || 'Podcast analysis failed');
    } finally {
      if (analyzeRunIdRef.current === runId) {
        setRunning(false);
        setTranscribing(false);
        setProgress(null);
      }
    }
  }, [audioFile, persistProject]);

  const cancelAnalyze = React.useCallback(() => {
    analyzeRunIdRef.current += 1;
    setRunning(false);
    setTranscribing(false);
    setProgress(null);
    setError(null);
  }, []);

  const generateSlides = React.useCallback(async () => {
    const currentProject = projectRef.current;
    if (!currentProject.analysis || generatingSlides) return;
    if (!currentProject.inputs.characterOne?.dataUrl || !currentProject.inputs.characterTwo?.dataUrl) {
      setError('Please upload both character images before generating slides.');
      return;
    }

    setGeneratingSlides(true);
    setError(null);
    setProgress({ step: 'slides', label: 'Starting image batch...', percentage: 5 });
    generationControlRef.current = 'running';
    await persistProject(withProjectUpdate(projectRef.current, (draft) => {
      draft.generation.status = 'running';
    }));

    try {
      const imageProvider = createImageProvider(currentProject.providers.image);
      if (!currentProject.assets.deckTemplate && !currentProject.assets.openingStill && currentProject.assets.slides.length === 0) {
        imageProvider.startBatch();
      }
      const templatePrompt = appendPromptRules(buildDeckTemplatePrompt(currentProject.analysis, currentProject.settings), currentProject.promptRules, 'deck');
      const templateReferenceImages = currentProject.inputs.templateReferenceDataUrl && currentProject.settings.template === 'custom-reference'
        ? [
          `${templatePrompt}

Use the attached user template/reference as the design source. Create a cleaner master template slide that follows it closely.`,
        ]
        : [];
      let deckTemplate = projectRef.current.assets.deckTemplate;
      let deckTemplateDownloadPromise: Promise<PodcastProject['assets']['deckTemplate'] | null> | null = null;
      if (!deckTemplate) {
        setProgress({ step: 'slides', label: 'Generating deck template...', percentage: 15 });
        const generatedDeckTemplate = await waitForGenerationStep(imageProvider.generateDeckTemplateImageUrl(
          templateReferenceImages[0] || templatePrompt,
          currentProject.inputs.templateReferenceDataUrl && currentProject.settings.template === 'custom-reference'
            ? [currentProject.inputs.templateReferenceDataUrl]
            : [],
        ));
        if (!generatedDeckTemplate || generationControlRef.current !== 'running') return;
        deckTemplateDownloadPromise = imageProvider.downloadImageAsDataUrl(generatedDeckTemplate.imageUrl)
          .then((imageDataUrl) => imageDataUrl ? { prompt: generatedDeckTemplate.prompt, imageDataUrl } : null)
          .catch(() => null);
      }

      if (generationControlRef.current !== 'running') return;

      let openingStill = projectRef.current.assets.openingStill;
      if (!openingStill) {
        setProgress({ step: 'slides', label: 'Generating opening still frame...', percentage: 35 });
        const openingRefs = [
          currentProject.inputs.characterOne.dataUrl,
          currentProject.inputs.characterTwo.dataUrl,
          ...(currentProject.inputs.locationReference ? [currentProject.inputs.locationReference.dataUrl] : []),
        ];
        const generatedOpeningStill = await waitForGenerationStep(imageProvider.generateOpeningStill({
          prompt: appendPromptRules(buildOpeningStillPrompt(projectRef.current), currentProject.promptRules, 'opening_still'),
        }, {
          deckTemplateImageDataUrl: undefined,
          referenceImages: openingRefs,
        }));
        if (!generatedOpeningStill || generationControlRef.current !== 'running') return;
        openingStill = generatedOpeningStill;
        await persistProject(withProjectUpdate(projectRef.current, (draft) => {
          draft.assets.openingStill = openingStill;
        }));
      }

      if (generationControlRef.current !== 'running') return;

      if (!deckTemplate && deckTemplateDownloadPromise) {
        setProgress({ step: 'slides', label: 'Saving deck template...', percentage: 42 });
        const downloadedDeckTemplate = await waitForGenerationStep(deckTemplateDownloadPromise);
        if (!downloadedDeckTemplate || generationControlRef.current !== 'running') {
          throw new Error('Could not save generated deck template');
        }
        deckTemplate = downloadedDeckTemplate;
        await persistProject(withProjectUpdate(projectRef.current, (draft) => {
          draft.assets.deckTemplate = deckTemplate;
        }));
      }

      if (!deckTemplate) {
        throw new Error('Deck template is missing.');
      }

      const totalSlides = currentProject.analysis.slide_prompts.length;
      for (const [index, slide] of currentProject.analysis.slide_prompts.entries()) {
        if (projectRef.current.assets.slides.some((item) => item.slideNumber === slide.slide_number)) continue;
        setProgress({
          step: 'slides',
          label: `Generating slide ${slide.slide_number} of ${totalSlides}...`,
          percentage: Math.min(95, 45 + Math.round((index / Math.max(totalSlides, 1)) * 50)),
        });

        const generatedSlide = await waitForGenerationStep(imageProvider.generateSlide({
          slideNumber: slide.slide_number,
          sectionTitle: slide.section_title,
          timestampStart: slide.timestamp_start,
          timestampEnd: slide.timestamp_end,
          prompt: appendPromptRules(withSpeakerNameRule(slide.prompt, currentProject), currentProject.promptRules, 'slides'),
        }, {
          deckTemplateImageDataUrl: deckTemplate.imageDataUrl,
          referenceImages: currentProject.inputs.templateReferenceDataUrl && currentProject.settings.template === 'custom-reference'
            ? [currentProject.inputs.templateReferenceDataUrl]
            : [],
        }));
        if (!generatedSlide || generationControlRef.current !== 'running') return;

        const partial = withProjectUpdate(projectRef.current, (draft) => {
          draft.assets.deckTemplate = deckTemplate;
          draft.assets.openingStill = openingStill;
          draft.assets.slides = mergeSlide(draft.assets.slides, generatedSlide);
          draft.stage = draft.assets.slides.length > 0 ? 'slides-generated' : draft.stage;
        });
        await persistProject(partial);

        if (generationControlRef.current !== 'running') return;
      }
      generationControlRef.current = 'idle';
      setProgress({ step: 'done', label: 'Slide generation complete.', percentage: 100 });
      await persistProject(withProjectUpdate(projectRef.current, (draft) => {
        draft.generation.status = 'done';
      }));
    } catch (err: any) {
      setError(err.message || 'Slide image generation failed');
      generationControlRef.current = 'idle';
      await persistProject(withProjectUpdate(projectRef.current, (draft) => {
        draft.generation.status = 'idle';
      }));
    } finally {
      const status = (generationControlRef as React.MutableRefObject<PodcastProject['generation']['status']>).current;
      if (status === 'paused' || status === 'cancelled') {
        await persistProject(withProjectUpdate(projectRef.current, (draft) => {
          draft.generation.status = status;
        }));
      }
      setGeneratingSlides(false);
      setProgress(null);
    }
  }, [generatingSlides, persistProject, waitForGenerationStep]);

  const pauseGeneration = React.useCallback(async () => {
    if (!generatingSlides) return;
    requestGenerationStop('paused');
    await updateProject((draft) => {
      draft.generation.status = 'paused';
    });
  }, [generatingSlides, requestGenerationStop, updateProject]);

  const resumeGeneration = React.useCallback(async () => {
    if (generatingSlides) return;
    generationControlRef.current = 'running';
    await generateSlides();
  }, [generateSlides, generatingSlides]);

  const cancelGeneration = React.useCallback(async () => {
    requestGenerationStop('cancelled');
    await updateProject((draft) => {
      draft.generation.status = 'cancelled';
    });
  }, [requestGenerationStop, updateProject]);

  const resetProject = React.useCallback(async () => {
    const providers = cloneProject(projectRef.current).providers;
    setAudioFile(null);
    setError(null);
    setProgress(null);
    setRunning(false);
    setGeneratingSlides(false);
    setTranscribing(false);
    generationControlRef.current = 'idle';
    const next = await extensionStorage.resetProject(providers);
    projectRef.current = next;
    setProject(next);
  }, []);

  return {
    project,
    audioFile,
    running,
    transcribing,
    generatingSlides,
    progress,
    error,
    analyzeCompletedAt,
    setError,
    updateScript,
    updateSettings,
    updateProviders,
    previewPromptRule,
    applyPromptRule,
    updatePromptRule,
    deletePromptRule,
    updateCharacterOneName,
    updateCharacterTwoName,
    uploadAudio,
    clearAudio,
    uploadTemplateReference,
    clearTemplateReference,
    uploadCharacterOne,
    clearCharacterOne,
    uploadCharacterTwo,
    clearCharacterTwo,
    uploadLocationReference,
    clearLocationReference,
    analyze,
    cancelAnalyze,
    generateSlides,
    pauseGeneration,
    resumeGeneration,
    cancelGeneration,
    exportTimestamps: () => exportTimestampsJson(project),
    exportTranscript: () => exportTranscriptSrt(project),
    exportZip: () => exportPodcastZip(project),
    resetProject,
  };
}
