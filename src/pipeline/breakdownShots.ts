import type { StoryboardBoard, StoryboardShot, ProductionBible } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT_SHOT_BREAKDOWN } from '@/ai/provider';
import { generateWithRetry } from '@/ai/generateWithRetry';
import { unwrapArray } from '@/ai/unwrapArray';
import { logger } from '@/logger/logger';

export async function breakdownShots(
  board: StoryboardBoard,
  bible: ProductionBible,
  provider: AIProvider
): Promise<StoryboardShot[]> {
  // Find matching characters from bible
  const boardCharacters = bible.characters.filter(
    (c) => board.characters_used.some((name) => name.toLowerCase() === c.name.toLowerCase())
  );
  // Find matching location from bible
  const boardLocation = bible.locations.find(
    (l) => l.name.toLowerCase() === board.location_used.toLowerCase()
  );

  const prompt = `Break down this storyboard board into 3–5 cinematic shots.

BOARD:
- Board number: ${board.board_number}
- Duration: ${board.duration}s
- Story beat: ${board.story_beat}
- Characters: ${board.characters_used.join(', ')}
- Location: ${board.location_used}

CHARACTER DEFINITIONS:
${boardCharacters.length > 0 ? boardCharacters.map(c => `- ${c.name}: ${c.description}. Wardrobe: ${c.wardrobe}. Distinctive features: ${c.distinctive_features}`).join('\n') : '(no matching characters found in bible)'}

LOCATION:
${boardLocation ? `- ${boardLocation.name}: ${boardLocation.description}. Atmosphere: ${boardLocation.atmosphere}. Key elements: ${boardLocation.key_elements.join(', ')}` : '(no matching location found in bible)'}

CURRENT SHOTS (for reference — REPLACE with new breakdown):
${board.shots.map(s => `  Shot ${s.shot_number}: ${s.shot_size} | ${s.lens_feel} | ${s.movement} | ${s.action}`).join('\n')}

STORYBOARD PROMPT:
${board.storyboard_prompt}

Return a JSON ARRAY of shot objects. Each shot must have:
- shot_number: number
- shot_size: one of "Wide" / "Medium" / "Close-Up" / "Insert" / "Macro"
- lens_feel: string (e.g. "35mm", "50mm", "85mm")
- movement: string (e.g. "Static", "Slow push-in", "Tracking")
- composition: one of "LOCK" / "TENSION" / "BREAK" / "RESTORE"
- action: string (what we SEE — visual description, not dialogue)
- emotion: string (emotional intent)
- dialogue_audio: string (minimal dialogue or audio description, NOT dominant)
- master_prompt: string (ONE unified prompt for this shot — a single flowing paragraph combining scene setup, action, camera, and motion. This is the complete prompt you would paste into an image or video generation tool. Must include: shot size, character appearance/wardrobe, action/emotion, camera movement, lighting/atmosphere, style. Example: "Close-up shot, 85mm lens. Nala's face filling the frame, blue polyester vest visible at the bottom, hair in tight bun, eyes widening as she watches the trembling hand place copper coins on the metal counter. Harsh fluorescent overhead light creating deep shadows under her eyes. Slow push-in. Cinematic drama, anamorphic lens, muted teal/orange palette, shallow depth of field. Style: cinematic.")

ONLY valid JSON. No markdown code blocks. No extra text.`;

  logger.info('ShotBreakdown', `Breaking down board ${board.board_number}`, `${board.shots.length} current shots`);

  const result = await generateWithRetry<StoryboardShot[]>(
    provider, prompt, SYSTEM_PROMPT_SHOT_BREAKDOWN,
    (json) => unwrapArray<StoryboardShot>(json),
  );

  logger.info('ShotBreakdown', `Board ${board.board_number} broken down`, `${result.length} new shots`);
  return result;
}

export async function breakdownAllShots(
  boards: StoryboardBoard[],
  bible: ProductionBible,
  provider: AIProvider
): Promise<Map<number, StoryboardShot[]>> {
  const results = new Map<number, StoryboardShot[]>();

  for (const board of boards) {
    try {
      const shots = await breakdownShots(board, bible, provider);
      results.set(board.board_number, shots);
    } catch (err: any) {
      logger.error('ShotBreakdown', `Failed for board ${board.board_number}`, String(err));
      // Keep original shots on failure
      results.set(board.board_number, board.shots);
    }
  }

  return results;
}