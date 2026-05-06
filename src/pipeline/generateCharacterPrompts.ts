import type { CharacterPrompt, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT_CHARACTER } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { STYLE_DICTIONARY } from '@/types/project';
import { getMockCharacters } from '@/ai/mock';
import { generateWithRetry } from '@/ai/generateWithRetry';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateCharacterPrompts(
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<CharacterPrompt[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockCharacters());
  }

  const styleDict = STYLE_DICTIONARY[settings.stylePreset];
  const styleBlock = styleDict ? `${styleDict.positive}. ${styleDict.negative}.` : '';

  const prompt = `Generate a complete character sheet prompt for each character in the production bible.

Style: ${settings.stylePreset}
${styleBlock}
Aspect ratio: ${settings.aspectRatio}
Language: ${settings.language}

Production Bible:
${JSON.stringify(bible, null, 2)}

For each character, return a JSON object with:
- character_name: string
- prompt: string

Each prompt MUST be a SINGLE unified prompt following the STUDIO CHARACTER SHEET format:

1. Start with: "Character sheet of [NAME]"
2. Include: face structure, body type, posture, overall vibe
3. Include: exact wardrobe (materials, colors, condition) — this is CRITICAL for consistency
4. Include: key accessories
5. Include: expression range (neutral + one key emotion)
6. End with: "Pure white background. Soft even studio lighting. No environment. No scenery. No shadows on background. Full body front view, side view, back view, 3/4 view, close-up portrait. ${styleBlock} Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}."

STRICT: The prompt must produce a CLEAN CHARACTER REFERENCE SHEET on white/background — NOT a cinematic scene. The character must NOT be placed in any location.

Return a JSON ARRAY. ONLY valid JSON, no markdown code blocks, no extra text.`;

  const parsed = await generateWithRetry<CharacterPrompt[]>(
    provider, prompt, SYSTEM_PROMPT_CHARACTER,
    (json) => unwrapArray<CharacterPrompt>(json),
  );
  return parsed;
}