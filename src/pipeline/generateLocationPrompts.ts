import type { LocationPrompt, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockLocations } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateLocationPrompts(
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<LocationPrompt[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockLocations());
  }

  const prompt = `Generate ONE complete location reference prompt for each location in the production bible. Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}. Language: ${settings.language}.

Production Bible:
${JSON.stringify(bible, null, 2)}

For each location, return a JSON object with:
- location_name: string
- prompt: string (a SINGLE unified prompt that covers ALL of the following in one production-ready prompt:)

Each prompt must include ALL of these elements combined into ONE cohesive prompt:
1. Wide establishing shot showing the full space, atmosphere, scale, and environment
2. Medium usable production frame with key elements visible and well-composed
3. Close-up detail textures, surfaces, and small atmospheric details

The prompt must reference the location's color palette, lighting, and atmosphere from the bible to ensure visual consistency. Write it as a single flowing prompt that can be pasted directly into an AI image generator.

Example prompt format:
"[LOCATION NAME]. [DESCRIPTION]. [ATMOSPHERE]. Wide establishing shot showing full space with [KEY ELEMENTS]. Medium production frame with [SPECIFIC ELEMENTS] well-composed. Close-up detail on [TEXTURES/SURFACES]. [LIGHTING]. [COLOR PALETTE MOOD]. Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}."

Return a JSON ARRAY of location prompt objects. ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  const parsed = extractJSON<LocationPrompt[]>(response);
  return unwrapArray<LocationPrompt>(parsed);
}