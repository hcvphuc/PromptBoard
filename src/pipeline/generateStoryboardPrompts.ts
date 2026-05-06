import type { StoryboardBoard, ProductionBible, AnalysisOutput, StoryBeat } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT_STORYBOARD } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { STYLE_DICTIONARY } from '@/types/project';
import { getMockStoryboards } from '@/ai/mock';
import { generateWithRetry } from '@/ai/generateWithRetry';
import { unwrapArray } from '@/ai/unwrapArray';
import { estimateShotCount, assignBoardsFromBeats } from './audioBeats';

export interface StoryboardGenOptions {
  beats?: StoryBeat[];
  boardBeats?: StoryBeat[][]; // pre-assigned beats per board
}

function buildGridLabel(shotCount: number): string {
  if (shotCount <= 1) return '1x1';
  if (shotCount === 2) return '1x2';
  if (shotCount === 3) return '1x3';
  if (shotCount === 4) return '2x2';
  if (shotCount === 5) return '2x3 (1 panel blank)';
  if (shotCount === 6) return '2x3';
  if (shotCount <= 8) return '2x4';
  if (shotCount <= 9) return '3x3';
  if (shotCount <= 12) return '3x4';
  return `${Math.ceil(shotCount / 4)}x4`;
}

/** Post-validate: ensure storyboard_prompt matches shot count, fix missing fields */
function validateStoryboardPrompt(board: StoryboardBoard, styleBlock: string, aspectRatio: string): StoryboardBoard {
  // Ensure shots array exists
  if (!board.shots || !Array.isArray(board.shots) || board.shots.length === 0) {
    console.warn('[PromptBoard] Board', board.board_number, 'has no shots, skipping prompt rebuild');
    return board;
  }

  const shotCount = board.shots.length;

  // Check if prompt already mentions correct panel count
  const prompt = board.storyboard_prompt || '';
  const panelMatch = prompt.match(/(\d+)\s*panel/i);
  const promptPanels = panelMatch ? parseInt(panelMatch[1]) : 0;

  // If prompt has correct panel count, it's probably fine
  if (promptPanels === shotCount) return board;

  // Rebuild storyboard_prompt from shots
  const grid = buildGridLabel(shotCount);
  const panelDescriptions = board.shots.map(shot => {
    return `Panel ${shot.shot_number} (${shot.shot_size}, ${shot.lens_feel}): ${shot.action} ${shot.emotion ? `— ${shot.emotion}` : ''}. ${shot.movement !== 'Static' ? `Camera: ${shot.movement}.` : ''}`;
  }).join(' ');

  const characters = board.characters_used?.join(', ') || '';
  const location = board.location_used || '';

  const rebuiltPrompt = `Multi-panel cinematic storyboard, ${shotCount} still frames arranged in ${grid} grid. Each panel is a photorealistic cinematic still frame that looks like a paused moment from the actual film. Panel borders with thin black lines. Small panel number in top-left corner. ${panelDescriptions} Characters: ${characters}. Location: ${location}. Thin directional arrows between panels showing sequence. Cinematic still frames, photorealistic, film grain, each panel looks like a paused frame from the actual film. ${styleBlock} Aspect ratio: ${aspectRatio}.`;

  return { ...board, storyboard_prompt: rebuiltPrompt };
}

export async function generateStoryboardPrompts(
  analysis: AnalysisOutput,
  bible: ProductionBible,
  settings: PipelineSettings,
  provider: AIProvider,
  audioOptions?: StoryboardGenOptions
): Promise<StoryboardBoard[]> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockStoryboards());
  }

  const isAudioDriven = !!(audioOptions?.beats || audioOptions?.boardBeats);
  const boardCount = analysis.suggested_boards;

  // Build audio-driven section of the prompt
  let audioSection = '';
  if (isAudioDriven && audioOptions!.boardBeats) {
    const boardDescriptions = audioOptions!.boardBeats.map((beats, i) => {
      const shotCount = estimateShotCount(beats, settings.boardDuration);
      const beatDesc = beats.map(b =>
        `  - [${b.start_time.toFixed(1)}s→${b.end_time.toFixed(1)}s] ${b.pacing}: ${b.description}`
      ).join('\n');
      const dialogueLines = beats.flatMap(b => b.dialogue_lines).map(l =>
        `    [${l.startTime.toFixed(1)}s→${l.endTime.toFixed(1)}s] ${l.speaker === 'character' ? `(${l.speakerName || 'Character'})` : '(N)'} ${l.text}`
      ).join('\n');
      return `Board ${i + 1} (${settings.boardDuration}s, ~${shotCount} shots):\n  Beats:\n${beatDesc}\n  Dialogue:\n${dialogueLines || '    (none)'}`;
    }).join('\n\n');

    audioSection = `
AUDIO-DRIVEN MODE — CRITICAL:
Each board has FIXED audio duration of ${settings.boardDuration}s.
Shots must fit within this exact duration.
Each shot MUST have start_time and end_time that align with the audio.

BOARD ASSIGNMENTS (beats + dialogue already grouped):
${boardDescriptions}

SHOT TIMING RULES:
- Each shot MUST have start_time and end_time (in seconds)
- Total of all shot durations in a board MUST equal ${settings.boardDuration}s
- Shot duration depends on pacing: intense = 1-2s, moderate = 2-4s, slow = 4-6s
- Shots must cover the ENTIRE board duration with no gaps
- start_time and end_time are relative to the BOARD (0 = start of board)`;
  }

  const styleDict = STYLE_DICTIONARY[settings.stylePreset];
  const styleBlock = styleDict ? `${styleDict.positive}. ${styleDict.negative}.` : '';

  const prompt = `Create a cinematic storyboard based on the analysis and production bible.

Style: ${settings.stylePreset}
Aspect ratio: ${settings.aspectRatio}
Board duration: ${settings.boardDuration}s (MAX — each board's shots MUST total <= ${settings.boardDuration}s)
Language: ${settings.language}

Analysis:
${JSON.stringify(analysis, null, 2)}

Production Bible:
${JSON.stringify(bible, null, 2)}
${audioSection}
Create ${boardCount} boards. Each board represents a CONTINUOUS SEQUENCE of shots totaling max ${settings.boardDuration}s.

BOARD DURATION RULE (CRITICAL):
- Each board = max ${settings.boardDuration}s of action
- Group consecutive shots until their total duration reaches ~${settings.boardDuration}s
- When total exceeds ${settings.boardDuration}s, start a new board
- A board MUST have 3-6 shots (not 1, not 10+)
- Shot duration by pacing: intense = 1-2s, moderate = 2-4s, slow = 4-6s
- All shot durations in a board MUST sum to <= ${settings.boardDuration}s

For each board, return a JSON object with:
- board_number: number (sequential: 1, 2, 3...)
- duration: number (total duration of all shots in this board, max ${settings.boardDuration}s)
${isAudioDriven ? '- audio_duration: number (EXACTLY ' + settings.boardDuration + 's)\n' : ''}- story_beat: string (what happens in this board - one beat per board)
- characters_used: string[] (must match bible character names EXACTLY)
- location_used: string (must match bible location name EXACTLY)
- shots: array of 3-6 objects, each with:
  - shot_number: number (1, 2, 3... within this board)
  - shot_size: one of "Extreme Wide" / "Wide" / "Medium" / "Medium Close-Up" / "Close-Up" / "Extreme Close-Up"
  - lens_feel: string (e.g. "35mm", "50mm", "85mm")
  - movement: string (e.g. "Static", "Slow push-in", "Tracking", "Dolly")
  - composition: one of "LOCK" / "TENSION" / "BREAK" / "RESTORE"
  - action: string (what we SEE happening - visual, not dialogue)
  - emotion: string (emotional intent of this shot)
  - dialogue_audio: string (minimal dialogue or audio description, NOT dominant)${isAudioDriven ? '\n  - start_time: number (seconds, relative to board start)\n  - end_time: number (seconds, relative to board start)' : ''}
- storyboard_prompt: string (MULTI-PANEL storyboard layout prompt - see rules below)

STORYBOARD PROMPT RULES (CRITICAL - MUST FOLLOW):
- storyboard_prompt MUST describe a MULTI-PANEL grid layout - NEVER a single panel
- If the board has N shots, the storyboard MUST have N panels in the grid
- Grid layout: 2 shots = 1x2, 3 shots = 1x3, 4 shots = 2x2, 5 shots = 2x3 (1 empty), 6 shots = 2x3
- START the prompt with: "Multi-panel cinematic storyboard, [N] still frames arranged in a [ROWS]x[COLS] grid."
- For EACH panel write: "Panel [N] ([shot_size], [lens]): [visual description of what we SEE]"
- EVERY panel MUST show a DIFFERENT shot - do NOT repeat or merge shots
- The grid is read left-to-right, top-to-bottom: Panel 1 is top-left, Panel 2 is top-right, etc.
- Between panels: thin directional arrows showing sequence flow
- Shared consistency: same character faces/wardrobe, same location across ALL panels
- STYLE: cinematic still frames, photorealistic, film grain, each panel looks like a paused frame from the actual film. NOT sketch, NOT illustration, NOT comic. Photorealistic cinematography.
- END with: "Cinematic still frames, photorealistic, film grain, each panel is a paused moment from the actual film. ${styleBlock}"
- EXAMPLE (4 shots): "Multi-panel cinematic storyboard, 4 still frames arranged in 2x2 grid. Panel borders with thin black lines. Small panel number in top-left corner of each panel. Each panel is a photorealistic cinematic still frame. Panel 1 (Wide, 14mm): Wide shot establishing the convenience store interior - Nala behind counter, elderly man entering through glass door, fluorescent overhead lighting casting harsh shadows. Panel 2 (Medium, 35mm): Nala's face looking up, neutral expression, tight bun, blue polyester polo visible, shallow depth of field. Panel 3 (Close-Up, 85mm): Hands pausing over barcode scanner, item on counter, warm light on skin. Panel 4 (Medium, 50mm): Transaction moment - both figures framed across counter, realistic lighting. Thin directional arrows between panels. Cinematic still frames, photorealistic, film grain, each panel is a paused moment from the actual film. Cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9."

CRITICAL RULES:
- Do NOT illustrate dialogue directly - translate emotion into visuals
- SHOW, DON'T TELL - props carry meaning, small actions replace dialogue
- CAMERA = EMOTION - wide = calm/distance, close-up = pressure/intimacy, push-in = rising tension
- Each shot MUST evolve from the previous one - do NOT repeat identical framing
- Use the composition system: LOCK (symmetry, stable), TENSION (slight imbalance), BREAK (strong motion, disruption), RESTORE (return to balance)
- Follow emotional flow: Setup -> Disruption -> Escalation -> Peak -> Release
- Characters and wardrobe must match bible EXACTLY - no redesign
- Location must match bible EXACTLY

Return a JSON ARRAY. ONLY valid JSON, no markdown code blocks, no extra text.`;

  const rawResult = await generateWithRetry<StoryboardBoard[]>(
    provider, prompt, SYSTEM_PROMPT_STORYBOARD,
    (json) => unwrapArray<StoryboardBoard>(json),
  );

  // Validate: ensure each board has required fields
  const result = rawResult.map((board, i) => ({
    ...board,
    board_number: board.board_number ?? (i + 1),
    shots: Array.isArray(board.shots) ? board.shots : [],
    characters_used: Array.isArray(board.characters_used) ? board.characters_used : [],
    location_used: board.location_used || '',
    story_beat: board.story_beat || '',
    duration: board.duration || settings.boardDuration,
    storyboard_prompt: board.storyboard_prompt || '',
  }));

  // Post-validate: ensure storyboard_prompt matches shot count for each board
  const validated = result.map(board => validateStoryboardPrompt(board, styleBlock, settings.aspectRatio));

  console.log('[PromptBoard] Storyboard result:', validated.length, 'boards');
  if (validated.length > 0) {
    console.log('[PromptBoard] First board sample:', JSON.stringify(validated[0]).substring(0, 300));
  }
  return validated;
}