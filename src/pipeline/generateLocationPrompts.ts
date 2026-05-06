import type { LocationPrompt, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT_LOCATION } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { STYLE_DICTIONARY } from '@/types/project';
import { getMockLocations } from '@/ai/mock';
import { generateWithRetry } from '@/ai/generateWithRetry';
import { unwrapArray } from '@/ai/unwrapArray';

export async function generateLocationPrompts(
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<LocationPrompt[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockLocations());
  }

  const styleDict = STYLE_DICTIONARY[settings.stylePreset];
  const styleBlock = styleDict ? `${styleDict.positive}. ${styleDict.negative}.` : '';

  const bibleSummary = `Visual Style: ${bible.visual_style}\nColor Palette: ${bible.color_palette.join(', ')}\nLocations: ${bible.locations.map(l => `${l.name}: ${l.description}. Atmosphere: ${l.atmosphere}. Elements: ${l.key_elements.join(', ')}`).join('\n')}\nContinuity: ${bible.continuity_rules.join('; ')}`;

  const prompt = `Generate a complete location reference prompt for each location in the production bible.

Style: ${settings.stylePreset}
${styleBlock}
Aspect ratio: ${settings.aspectRatio}
Language: ${settings.language}

Production Bible:
${bibleSummary}

For each location, return a JSON object with:
- location_name: string
- prompt: string

Each prompt MUST be a SINGLE unified prompt covering:

1. Start with: "[LOCATION NAME] — WIDE ESTABLISHING VIEW, EMPTY SET, NO PEOPLE"
2. Include: environment type, function in story
3. Include: spatial layout — where things are placed, key visual axis
4. Include: visual breakdown — wide establishing view as PRIMARY image content
5. Include: scene elements — furniture/architecture, props, foreground/midground/background layering
6. Include: lighting — source, direction, intensity, quality (soft/flat/contrast)
7. Include: color system — dominant palette + accent colors
8. Include: atmosphere — emotional feel
9. Include: time of day
10. End with: "${styleBlock} Style: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}."

STRICT RULES FOR LOCATION PROMPTS:
- The prompt MUST describe a WIDE ESTABLISHING VIEW — the full environment visible
- The prompt MUST specify NO PEOPLE, NO CHARACTERS, NO HUMAN FIGURES — empty set
- Character positions are described in text for reference only — they MUST NOT appear in the image
- The space should look like a film set BEFORE actors arrive
- Must produce a CONSISTENT, FILMABLE ENVIRONMENT
- Every object must feel intentional. No clutter, no randomness
- Must support character interaction and remain consistent across storyboard shots

Return a JSON ARRAY. ONLY valid JSON, no markdown code blocks, no extra text.`;

  const parsed = await generateWithRetry<LocationPrompt[]>(
    provider, prompt, SYSTEM_PROMPT_LOCATION,
    (json) => unwrapArray<LocationPrompt>(json),
  );
  return parsed;
}