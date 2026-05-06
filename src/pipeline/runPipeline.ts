import type { ProjectOutput } from '@/types/output';
import type { PipelineSettings } from '@/types/project';
import type { AIProvider } from '@/ai/provider';
import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport, SRTLine, StoryBeat } from '@/types/pipeline';

import { analyzeScript, type AnalyzeScriptOptions } from './analyzeScript';
import { buildProductionBible } from './buildProductionBible';
import { generateCharacterPrompts } from './generateCharacterPrompts';
import { generateLocationPrompts } from './generateLocationPrompts';
import { generateStoryboardPrompts, type StoryboardGenOptions } from './generateStoryboardPrompts';
import { generateSeedancePrompts } from './generateSeedancePrompts';
import { validateConsistency } from './validateConsistency';
import { parseSRT, getSRTDuration } from './srtParser';
import { parseScriptSpeakers, matchSRTLinesToScript } from './scriptParser';
import { analyzeAudioBeats, assignBoardsFromBeats } from './audioBeats';
import { logger } from '@/logger/logger';

export type PipelineStep = 'idle' | 'analyzing' | 'building-bible' | 'generating-characters' | 'generating-locations' | 'generating-storyboards' | 'generating-seedance' | 'validating' | 'done' | 'error';

export interface PipelineProgress {
  step: PipelineStep;
  stepLabel: string;
  percentage: number;
}

export interface AudioInput {
  srtContent: string;    // raw SRT file content
  audioDuration: number; // total audio duration in seconds
}

const STEP_MAP: { step: PipelineStep; label: string; pct: number }[] = [
  { step: 'analyzing', label: 'Analyzing script...', pct: 14 },
  { step: 'building-bible', label: 'Building production bible...', pct: 28 },
  { step: 'generating-characters', label: 'Generating character prompts...', pct: 42 },
  { step: 'generating-locations', label: 'Generating location prompts...', pct: 57 },
  { step: 'generating-storyboards', label: 'Generating storyboard prompts...', pct: 71 },
  { step: 'generating-seedance', label: 'Generating Seedance prompts...', pct: 85 },
  { step: 'validating', label: 'Validating consistency...', pct: 100 },
];

export async function runPipeline(
  script: string,
  settings: PipelineSettings,
  provider: AIProvider,
  onProgress?: (progress: PipelineProgress) => void,
  audioInput?: AudioInput
): Promise<ProjectOutput> {
  const emit = (step: PipelineStep, label: string, pct: number) => onProgress?.({ step, stepLabel: label, percentage: pct });

  const isAudioDriven = settings.mode === 'audio-driven' && !!audioInput;
  logger.info('Pipeline', 'Starting pipeline...', `Provider: ${provider.constructor.name}, Mode: ${settings.mode}`);

  // Pre-process audio-driven data
  let srtLines: SRTLine[] = [];
  let beats: StoryBeat[] = [];
  let boardBeats: StoryBeat[][] = [];
  let audioDuration = 0;

  if (isAudioDriven && audioInput) {
    logger.info('Pipeline', 'Audio-driven mode: parsing SRT...');
    srtLines = parseSRT(audioInput.srtContent);
    audioDuration = audioInput.audioDuration || getSRTDuration(srtLines);
    logger.info('Pipeline', 'SRT parsed', `${srtLines.length} lines, ${audioDuration.toFixed(1)}s total`);

    // Parse script to identify speakers
    logger.info('Pipeline', 'Parsing script speakers...');
    const scriptSegments = parseScriptSpeakers(script);
    srtLines = matchSRTLinesToScript(srtLines, scriptSegments);
    logger.info('Pipeline', 'Speaker matching complete', `${srtLines.filter(l => l.speaker === 'character').length} character lines`);

    // Analyze beats with AI
    emit('analyzing', 'Analyzing audio beats...', 0);
    logger.info('Pipeline', 'Analyzing audio beats...');
    const beatResult = await analyzeAudioBeats(srtLines, audioDuration, provider);
    beats = beatResult.beats;
    logger.info('Pipeline', 'Beats analyzed', `${beats.length} beats`);

    // Assign beats to boards
    const boardAssignment = assignBoardsFromBeats(beats, settings.boardDuration);
    boardBeats = boardAssignment.boardBeats;
    logger.info('Pipeline', 'Board assignment', `${boardAssignment.boardCount} boards`);
  }

  // Step 1: Analyze
  emit('analyzing', 'Analyzing script...', 0);
  logger.info('Pipeline', 'Step 1/7: Analyzing script...', `Script length: ${script.length} chars`);
  const analysisOpts: AnalyzeScriptOptions = isAudioDriven ? {
    audioDuration,
    beats,
    boardDuration: settings.boardDuration,
  } : {};
  const analysis = await analyzeScript(script, provider, analysisOpts);
  logger.info('Pipeline', 'Analysis complete', `Title: ${analysis.title}, Genre: ${analysis.genre}, Boards: ${analysis.suggested_boards}`);
  emit('analyzing', 'Analyzing script...', 14);

  // Step 2: Bible
  emit('building-bible', 'Building production bible...', 14);
  logger.info('Pipeline', 'Step 2/7: Building production bible...');
  const bible = await buildProductionBible(analysis, settings, provider);
  logger.info('Pipeline', 'Bible complete', `Style: ${bible.visual_style}, ${bible.characters.length} chars, ${bible.locations.length} locs`);
  emit('building-bible', 'Building production bible...', 28);

  // Step 3: Characters (with fallback)
  emit('generating-characters', 'Generating character prompts...', 28);
  let characters: CharacterPrompt[];
  try {
    characters = await generateCharacterPrompts(bible, settings, provider);
    logger.info('Pipeline', 'Step 3/7: Characters complete', `${characters.length} character prompts generated`);
  } catch (err) {
    console.warn('[PromptBoard] Characters step failed, using empty:', err);
    logger.warn('Pipeline', 'Characters step failed, using empty', String(err));
    characters = [];
  }
  emit('generating-characters', 'Generating character prompts...', 42);

  // Step 4: Locations (with fallback)
  emit('generating-locations', 'Generating location prompts...', 42);
  let locations: LocationPrompt[];
  try {
    locations = await generateLocationPrompts(bible, settings, provider);
    logger.info('Pipeline', 'Step 4/7: Locations complete', `${locations.length} location prompts generated`);
  } catch (err) {
    console.warn('[PromptBoard] Locations step failed, using empty:', err);
    logger.warn('Pipeline', 'Locations step failed, using empty', String(err));
    locations = [];
  }
  emit('generating-locations', 'Generating location prompts...', 57);

  // Step 5: Storyboards (with fallback)
  emit('generating-storyboards', 'Generating storyboard prompts...', 57);
  let storyboards: StoryboardBoard[];
  try {
    const storyOpts: StoryboardGenOptions = isAudioDriven ? { beats, boardBeats } : {};
    storyboards = await generateStoryboardPrompts(analysis, bible, settings, provider, storyOpts);
    if (!Array.isArray(storyboards)) {
      console.warn('[PromptBoard] Storyboards is not an array, wrapping:', typeof storyboards);
      logger.warn('Pipeline', 'Storyboards is not an array', typeof storyboards);
      storyboards = Array.isArray(storyboards) ? storyboards : [];
    }
    logger.info('Pipeline', 'Step 5/7: Storyboards complete', `${storyboards.length} boards generated`);
  } catch (err) {
    console.warn('[PromptBoard] Storyboards step failed, using empty:', err);
    logger.warn('Pipeline', 'Storyboards step failed, using empty', String(err));
    storyboards = [];
  }
  emit('generating-storyboards', 'Generating storyboard prompts...', 71);

  // Step 6: Seedance (with fallback)
  emit('generating-seedance', 'Generating Seedance prompts...', 71);
  let seedance: SeedancePromptPerBoard[] | SeedancePromptContinuous;
  try {
    seedance = await generateSeedancePrompts(storyboards, bible, settings, provider);
    logger.info('Pipeline', 'Step 6/7: Seedance complete');
  } catch (err) {
    console.warn('[PromptBoard] Seedance step failed, using empty:', err);
    logger.warn('Pipeline', 'Seedance step failed, using empty', String(err));
    seedance = settings.seedanceMode === 'per-board' ? [] : { total_duration: 0, master_prompt: '', negative_prompt: '' };
  }
  emit('generating-seedance', 'Generating Seedance prompts...', 85);

  // Step 7: Validate (with fallback)
  emit('validating', 'Validating consistency...', 85);
  let consistency: ConsistencyReport;
  try {
    const partialOutput = { analysis, bible, characters, locations, storyboards, seedance };
    consistency = await validateConsistency(partialOutput, provider);
    logger.info('Pipeline', 'Step 7/7: Validation complete', `Passed: ${consistency.passed}, Issues: ${consistency.issues.length}`);
  } catch (err) {
    console.warn('[PromptBoard] Consistency validation failed, using default:', err);
    logger.warn('Pipeline', 'Consistency validation failed', String(err));
    consistency = { passed: false, issues: [{ category: 'Validation', description: 'Could not validate consistency', affected_boards: [], suggestion: 'Manual review recommended' }] };
  }
  emit('validating', 'Validating consistency...', 100);

  logger.info('Pipeline', 'Pipeline complete!', `${characters.length} chars, ${locations.length} locs, ${storyboards.length} boards`);

  return {
    analysis,
    bible,
    characters,
    locations,
    storyboards,
    seedance,
    consistency,
  };
}