import type { SeedancePromptPerBoard, SeedancePromptContinuous, StoryboardBoard, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { STYLE_DICTIONARY } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockSeedancePerBoard, getMockSeedanceContinuous } from '@/ai/mock';
import { generateWithRetry } from '@/ai/generateWithRetry';
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
  const styleDict = STYLE_DICTIONARY[settings.stylePreset];
  const styleBlock = styleDict ? `${styleDict.positive}. ${styleDict.negative}.` : '';

  // Compact storyboard summary instead of full JSON
  const storyboardSummary = storyboards.map(b => {
    const shotsDesc = (b.shots || []).map(s => `  Shot ${s.shot_number}: ${s.shot_size}, ${s.lens_feel}, ${s.movement}. ${s.action} [${s.emotion}]`).join('\n');
    return `Board ${b.board_number}: ${b.story_beat} | Duration: ${b.duration}s | Characters: ${(b.characters_used || []).join(', ')} | Location: ${b.location_used}\n${shotsDesc}`;
  }).join('\n\n');

  const bibleSummary = `Visual Style: ${bible.visual_style}\nColor Palette: ${bible.color_palette.join(', ')}\nCharacters: ${bible.characters.map(c => `${c.name}: ${c.wardrobe}, ${c.distinctive_features}`).join('; ')}\nLocations: ${bible.locations.map(l => `${l.name}: ${l.atmosphere}`).join('; ')}`;

  const prompt = `Generate a single unified video prompt for each storyboard board. Style: ${settings.stylePreset}. ${styleBlock} Max duration per board: ${settings.boardDuration}s. Language: ${settings.language}.

Storyboards:
${storyboardSummary}

Production Bible (for continuity):
${bibleSummary}

For each board, return a JSON object with:
- board_number: number
- duration: number
- board_prompt: string (ONE unified prompt combining scene setup, action timeline, camera movement, and motion into a single flowing paragraph — this is the complete prompt you would paste into a video generation tool like Seedance, Figure, or Kling)
- negative_prompt: string (what to avoid: blurry, low quality, wrong wardrobe, wrong location, lighting inconsistency, etc.)

BOARD PROMPT RULES:
- board_prompt must be a SINGLE unified paragraph — no sections, no line breaks, no bullet points
- Combine scene setup, action, camera, and motion into one flowing description
- Must maintain character identity, wardrobe, location, and lighting from the bible
- Include specific camera movements (e.g. "slow dolly left", "push in to close-up")
- Include specific actions and emotions (e.g. "Nala looks up, pauses, hands trembling")
- Include atmosphere and lighting (e.g. "harsh fluorescent light cutting across the counter")
- Start with the scene description, flow into action, then camera
- Example: "Interior convenience store checkout lane, harsh fluorescent overhead lighting, teal/orange color palette. Nala stands behind the brushed-steel counter in blue polyester vest, hair in a tight bun. An elderly man in a frayed charcoal wool coat approaches with a loaf of bread and bottle of milk. Camera slowly pushes in from medium to close-up as his trembling hands place dull copper coins on the metal counter. Nala watches, face neutral, then her eyes widen slightly. Shallow depth of field, cinematic grain. Style: cinematic."
- End with: "Style: ${settings.stylePreset}."
- Include style keywords: ${styleBlock}

Return a JSON ARRAY. ONLY valid JSON, no other text. No markdown code blocks.`;

  return generateWithRetry<SeedancePromptPerBoard[]>(
    provider, prompt, SYSTEM_PROMPT,
    (json) => unwrapArray<SeedancePromptPerBoard>(json),
  );
}

async function generateContinuous(
  storyboards: StoryboardBoard[],
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<SeedancePromptContinuous> {
  const totalDuration = storyboards.reduce((sum, b) => sum + b.duration, 0);
  const styleDict = STYLE_DICTIONARY[settings.stylePreset];
  const styleBlock = styleDict ? `${styleDict.positive}. ${styleDict.negative}.` : '';

  // Compact storyboard summary
  const storyboardSummary = storyboards.map(b => {
    const shotsDesc = (b.shots || []).map(s => `  Shot ${s.shot_number}: ${s.shot_size}, ${s.lens_feel}, ${s.movement}. ${s.action} [${s.emotion}]`).join('\n');
    return `Board ${b.board_number}: ${b.story_beat} | Duration: ${b.duration}s | Characters: ${(b.characters_used || []).join(', ')} | Location: ${b.location_used}\n${shotsDesc}`;
  }).join('\n\n');

  const bibleSummary = `Visual Style: ${bible.visual_style}\nColor Palette: ${bible.color_palette.join(', ')}\nCharacters: ${bible.characters.map(c => `${c.name}: ${c.wardrobe}, ${c.distinctive_features}`).join('; ')}\nLocations: ${bible.locations.map(l => `${l.name}: ${l.atmosphere}`).join('; ')}`;

  const prompt = `Generate a single continuous video prompt from the storyboard boards. Style: ${settings.stylePreset}. ${styleBlock} Total duration: ${totalDuration}s. Language: ${settings.language}.

Storyboards:
${storyboardSummary}

Production Bible (for continuity):
${bibleSummary}

CRITICAL CONTINUOUS SCENE RULES:
- This must be a SINGLE continuous video
- Maintain same characters, wardrobe, environment, props, and lighting throughout
- No camera gear visible
- No scene reset between boards
- Continuous action timeline

Return a JSON object with:
- total_duration: number (${totalDuration})
- master_prompt: string (ONE unified paragraph combining scene description, action timeline, camera direction, and motion — this is the complete prompt you would paste into a video generation tool like Seedance, Figure, or Kling. Must be a single flowing paragraph with no sections or bullet points.)
- negative_prompt: string (must include: camera equipment visible, scene reset, character identity change, wardrobe change, lighting inconsistency, location change)

MASTER PROMPT RULES:
- Must be a SINGLE unified paragraph — no sections, no line breaks, no bullet points
- Flow naturally: scene → action → camera → transitions
- Must maintain character identity and wardrobe throughout
- Must include specific camera movements and transitions between boards
- Must include specific actions and emotional beats with timing
- Include atmosphere and lighting
- End with: "Style: ${settings.stylePreset}."
- Include style keywords: ${styleBlock}

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  return generateWithRetry<SeedancePromptContinuous>(
    provider, prompt, SYSTEM_PROMPT,
    (json) => json as SeedancePromptContinuous,
  );
}