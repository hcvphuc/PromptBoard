import type { SeedancePromptPerBoard, SeedancePromptContinuous, StoryboardBoard, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockSeedancePerBoard, getMockSeedanceContinuous } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateSeedancePrompts(
  storyboards: StoryboardBoard[],
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<SeedancePromptPerBoard[] | SeedancePromptContinuous> {
  if (provider.name === 'Mock') {
    return settings.seedanceMode === 'per-board'
      ? JSON.parse(getMockSeedancePerBoard())
      : JSON.parse(getMockSeedanceContinuous());
  }

  if (settings.seedanceMode === 'per-board') {
    return generatePerBoard(storyboards, bible, settings, provider);
  } else {
    return generateContinuous(storyboards, bible, settings, provider);
  }
}

async function generatePerBoard(
  storyboards: StoryboardBoard[],
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<SeedancePromptPerBoard[]> {
  const prompt = `Generate Seedance video prompts for each storyboard board. Style: ${settings.stylePreset}. Max duration per board: ${settings.boardDuration}s. Language: ${settings.language}.

Storyboards:
${JSON.stringify(storyboards, null, 2)}

Production Bible (for continuity reference):
${JSON.stringify(bible, null, 2)}

For each board, return a JSON object with:
- board_number: number
- duration: number
- scene_setup: string (complete scene description maintaining character identity, wardrobe, location, lighting from bible)
- action_timeline: string (timestamped action: 0-5s: ..., 5-10s: ..., 10-15s: ...)
- camera_movement: string (detailed camera direction)
- motion: string (detailed motion description)
- negative_prompt: string (what to avoid: blurry, low quality, wrong wardrobe, wrong location, lighting inconsistency, etc.)

Return a JSON ARRAY of Seedance prompt objects. ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  const parsed = extractJSON<SeedancePromptPerBoard[]>(response);
  return unwrapArray<SeedancePromptPerBoard>(parsed);
}

async function generateContinuous(
  storyboards: StoryboardBoard[],
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<SeedancePromptContinuous> {
  const totalDuration = storyboards.reduce((sum, b) => sum + b.duration, 0);

  const prompt = `Generate a single continuous Seedance video prompt from the storyboard boards. Style: ${settings.stylePreset}. Total duration: ${totalDuration}s. Language: ${settings.language}.

Storyboards:
${JSON.stringify(storyboards, null, 2)}

Production Bible (for continuity reference):
${JSON.stringify(bible, null, 2)}

CRITICAL CONTINUOUS SCENE RULES:
- This must be a SINGLE continuous video
- Maintain same characters, wardrobe, environment, props, and lighting throughout
- No camera gear visible
- No scene reset between boards
- Continuous action timeline

Return a JSON object with:
- total_duration: number (${totalDuration})
- scene_description: string (unified scene description maintaining all visual continuity)
- action_timeline: string (timestamped: "0-15s: ..., 15-30s: ..., 30-45s: ..., 45-60s: ...")
- camera_movement: string (continuous camera direction across all boards)
- motion: string (detailed motion throughout)
- negative_prompt: string (must include: camera equipment visible, scene reset, character identity change, wardrobe change, lighting inconsistency, location change)

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  return extractJSON<SeedancePromptContinuous>(response);
}