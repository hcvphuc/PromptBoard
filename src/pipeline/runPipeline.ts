import type { ProjectOutput } from '@/types/output';
import type { PipelineSettings } from '@/types/project';
import type { AIProvider } from '@/ai/provider';
import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport } from '@/types/pipeline';

import { analyzeScript } from './analyzeScript';
import { buildProductionBible } from './buildProductionBible';
import { generateCharacterPrompts } from './generateCharacterPrompts';
import { generateLocationPrompts } from './generateLocationPrompts';
import { generateStoryboardPrompts } from './generateStoryboardPrompts';
import { generateSeedancePrompts } from './generateSeedancePrompts';
import { validateConsistency } from './validateConsistency';

export type PipelineStep = 'idle' | 'analyzing' | 'building-bible' | 'generating-characters' | 'generating-locations' | 'generating-storyboards' | 'generating-seedance' | 'validating' | 'done' | 'error';

export interface PipelineProgress {
  step: PipelineStep;
  stepLabel: string;
  percentage: number;
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
  onProgress?: (progress: PipelineProgress) => void
): Promise<ProjectOutput> {
  const emit = (step: PipelineStep, label: string, pct: number) => onProgress?.({ step, stepLabel: label, percentage: pct });

  // Step 1: Analyze (required — no fallback)
  emit('analyzing', 'Analyzing script...', 0);
  const analysis = await analyzeScript(script, provider);
  emit('analyzing', 'Analyzing script...', 14);

  // Step 2: Bible (required — no fallback)
  emit('building-bible', 'Building production bible...', 14);
  const bible = await buildProductionBible(analysis, settings, provider);
  emit('building-bible', 'Building production bible...', 28);

  // Step 3: Characters (with fallback)
  emit('generating-characters', 'Generating character prompts...', 28);
  let characters: CharacterPrompt[];
  try {
    characters = await generateCharacterPrompts(bible, settings, provider);
  } catch (err) {
    console.warn('[PromptBoard] Characters step failed, using empty:', err);
    characters = [];
  }
  emit('generating-characters', 'Generating character prompts...', 42);

  // Step 4: Locations (with fallback)
  emit('generating-locations', 'Generating location prompts...', 42);
  let locations: LocationPrompt[];
  try {
    locations = await generateLocationPrompts(bible, settings, provider);
  } catch (err) {
    console.warn('[PromptBoard] Locations step failed, using empty:', err);
    locations = [];
  }
  emit('generating-locations', 'Generating location prompts...', 57);

  // Step 5: Storyboards (with fallback)
  emit('generating-storyboards', 'Generating storyboard prompts...', 57);
  let storyboards: StoryboardBoard[];
  try {
    storyboards = await generateStoryboardPrompts(analysis, bible, settings, provider);
    // Validate: ensure it's an array
    if (!Array.isArray(storyboards)) {
      console.warn('[PromptBoard] Storyboards is not an array, wrapping:', typeof storyboards);
      storyboards = Array.isArray(storyboards) ? storyboards : [];
    }
  } catch (err) {
    console.warn('[PromptBoard] Storyboards step failed, using empty:', err);
    storyboards = [];
  }
  emit('generating-storyboards', 'Generating storyboard prompts...', 71);

  // Step 6: Seedance (with fallback)
  emit('generating-seedance', 'Generating Seedance prompts...', 71);
  let seedance: SeedancePromptPerBoard[] | SeedancePromptContinuous;
  try {
    seedance = await generateSeedancePrompts(storyboards, bible, settings, provider);
  } catch (err) {
    console.warn('[PromptBoard] Seedance step failed, using empty:', err);
    seedance = settings.seedanceMode === 'per-board' ? [] : { total_duration: 0, scene_description: '', action_timeline: '', camera_movement: '', motion: '', negative_prompt: '' };
  }
  emit('generating-seedance', 'Generating Seedance prompts...', 85);

  // Step 7: Validate (with fallback)
  emit('validating', 'Validating consistency...', 85);
  let consistency: ConsistencyReport;
  try {
    const partialOutput = { analysis, bible, characters, locations, storyboards, seedance };
    consistency = await validateConsistency(partialOutput, provider);
  } catch (err) {
    console.warn('[PromptBoard] Consistency validation failed, using default:', err);
    consistency = { passed: false, issues: [{ category: 'Validation', description: 'Could not validate consistency', affected_boards: [], suggestion: 'Manual review recommended' }] };
  }
  emit('validating', 'Validating consistency...', 100);

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