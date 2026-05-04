import type { StoryboardBoard, ProductionBible, AnalysisOutput } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockStoryboards } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateStoryboardPrompts(
  analysis: AnalysisOutput,
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<StoryboardBoard[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockStoryboards());
  }

  const prompt = `Generate storyboard boards based on the analysis and production bible. Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}. Max board duration: ${settings.boardDuration}s. Language: ${settings.language}.

Analysis:
${JSON.stringify(analysis, null, 2)}

Production Bible:
${JSON.stringify(bible, null, 2)}

Create ${analysis.suggested_boards} boards. For each board, return a JSON object with:
- board_number: number
- duration: number (max ${settings.boardDuration}s)
- story_beat: string
- characters_used: string[] (must match bible character names exactly)
- location_used: string (must match bible location name exactly)
- shots: array of { shot_number, shot_size (Extreme Wide/Wide/Medium/Medium Close-Up/Close-Up/Extreme Close-Up), lens_feel (e.g. "35mm"), movement (e.g. "Slow dolly in"), action (detailed), emotion (detailed), dialogue_audio (dialogue or audio description) }
- image_generation_prompt: string (complete, production-ready prompt for this board's key image, must include character descriptions, wardrobe, location, lighting, mood, style, aspect ratio ${settings.aspectRatio})

CRITICAL CONTINUITY RULES:
- Characters must match bible names and descriptions exactly
- Wardrobe must remain consistent with bible
- Location must match bible exactly
- Shots must avoid repetition - vary shot sizes, lens feels, and movements
- Image prompts must embed character identity, wardrobe, and location details from the bible

Return a JSON ARRAY of storyboard board objects. ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  console.log('[PromptBoard] Storyboard raw response length:', response?.length, 'first 300 chars:', response?.substring(0, 300));
  const parsed = extractJSON<StoryboardBoard[]>(response);
  console.log('[PromptBoard] Storyboard parsed type:', typeof parsed, Array.isArray(parsed));
  const result = unwrapArray<StoryboardBoard>(parsed);
  console.log('[PromptBoard] Storyboard unwrapped:', result.length, 'boards');
  return result;
}