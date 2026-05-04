import type { CharacterPrompt, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockCharacters } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateCharacterPrompts(
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<CharacterPrompt[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockCharacters());
  }

  const prompt = `Generate ONE complete character sheet prompt for each character in the production bible. Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}. Language: ${settings.language}.

Production Bible:
${JSON.stringify(bible, null, 2)}

For each character, return a JSON object with:
- character_name: string
- prompt: string (a SINGLE unified prompt that covers ALL of the following in one production-ready prompt:)

Each prompt must include ALL of these elements combined into ONE cohesive prompt:
1. Full body character reference sheet showing front view, side view, back view, and 3/4 view
2. Close-up portrait with cinematic shallow depth of field
3. Neutral standing pose in character's environment
4. Dynamic expressive pose showing the character's key emotion

The prompt must embed the character's distinctive features, wardrobe, and identity markers directly in the description to ensure consistency. Write it as a single flowing prompt that can be pasted directly into an AI image generator.

Example prompt format:
"Character sheet of [NAME]. [DESCRIPTION]. [WARDROBE DETAILS]. [DISTINCTIVE FEATURES]. Full body front view, side view, back view, 3/4 view. Close-up portrait with cinematic shallow DOF. Neutral pose in [ENVIRONMENT]. Dynamic [EMOTION] pose showing [SPECIFIC ACTION/EXPRESSION]. Clean white studio background for reference views, cinematic lighting. Consistent identity throughout. Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}."

Return a JSON ARRAY of character prompt objects. ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  const parsed = extractJSON<CharacterPrompt[]>(response);
  return unwrapArray<CharacterPrompt>(parsed);
}