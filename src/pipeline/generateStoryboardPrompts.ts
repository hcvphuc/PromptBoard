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
Board duration: ${settings.boardDuration}s
Language: ${settings.language}

Analysis:
${JSON.stringify(analysis, null, 2)}

Production Bible:
${JSON.stringify(bible, null, 2)}
${audioSection}
Create ${boardCount} boards. For each board, return a JSON object with:
- board_number: number
- duration: number (${isAudioDriven ? `EXACTLY ${settings.boardDuration}s` : `max ${settings.boardDuration}s`})
${isAudioDriven ? '- audio_duration: number (EXACTLY ' + settings.boardDuration + 's)\n' : ''}- story_beat: string
- characters_used: string[] (must match bible character names EXACTLY)
- location_used: string (must match bible location name EXACTLY)
- shots: array of objects, each with:
  - shot_number: number
  - shot_size: one of "Extreme Wide" / "Wide" / "Medium" / "Medium Close-Up" / "Close-Up" / "Extreme Close-Up"
  - lens_feel: string (e.g. "35mm", "50mm", "85mm")
  - movement: string (e.g. "Static", "Slow push-in", "Tracking", "Dolly")
  - composition: one of "LOCK" / "TENSION" / "BREAK" / "RESTORE"
  - action: string (what we SEE happening — visual, not dialogue)
  - emotion: string (emotional intent of this shot)
  - dialogue_audio: string (minimal dialogue or audio description, NOT dominant)${isAudioDriven ? '\n  - start_time: number (seconds, relative to board start)\n  - end_time: number (seconds, relative to board start)' : ''}
- storyboard_prompt: string (MULTI-PANEL storyboard layout prompt — see rules below)

STORYBOARD PROMPT RULES:
- storyboard_prompt describes a MULTI-PANEL production storyboard layout showing ALL shots in this board
- This is a GRID of panels — each panel shows ONE shot from the board
- The image must look like a professional production storyboard sheet on paper
- Format: start with "Multi-panel production storyboard layout, [N] panels arranged in a grid,"
- Then for EACH panel, describe: the shot size, what we see, camera angle, character action/emotion
- Panels should be numbered ("Panel 1:", "Panel 2:", etc.)
- Between panels, draw thin arrows or numbers showing the sequence flow
- All panels must share the SAME character designs, wardrobe, and location (consistency across panels)
- The overall layout should be clean, professional — like a hand-drawn or sketched storyboard sheet
- Style: sketch/render hybrid — enough detail to read the shot, but with a storyboard aesthetic (pencil lines, light shading, panel borders)
- Must include character descriptions and wardrobe from the bible (consistency!)
- Must include location atmosphere and lighting from the bible
- Each panel must show: shot size, character pose/expression, key action, camera angle
- Include: "Production storyboard, panel grid layout, sketch aesthetic, panel borders, thin arrows between panels, ${styleBlock}"
- Example: "Multi-panel production storyboard layout, 4 panels arranged in 2x2 grid on off-white paper. Panel borders with thin black lines. Small panel number in corner. Panel 1 (Wide, 14mm): Wide shot establishing the convenience store interior — Nala behind counter, elderly man entering through glass door, fluorescent overhead lighting. Panel 2 (Medium, 35mm): Nala's face looking up, neutral expression, tight bun, blue polyester polo visible. Panel 3 (Close-Up, 85mm): Hands pausing over barcode scanner, item on counter. Panel 4 (Medium, 50mm): Transaction moment — both figures framed across counter, dented watering can visible on shelf. Thin directional arrows between panels. Production storyboard, panel grid layout, sketch aesthetic, panel borders, cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9."

CRITICAL RULES:
- Do NOT illustrate dialogue directly — translate emotion into visuals
- SHOW, DON'T TELL — props carry meaning, small actions replace dialogue
- CAMERA = EMOTION — wide = calm/distance, close-up = pressure/intimacy, push-in = rising tension
- Each shot MUST evolve from the previous one — do NOT repeat identical framing
- Use the composition system: LOCK (symmetry, stable), TENSION (slight imbalance), BREAK (strong motion, disruption), RESTORE (return to balance)
- Follow emotional flow: Setup → Disruption → Escalation → Peak → Release
- Characters and wardrobe must match bible EXACTLY — no redesign
- Location must match bible EXACTLY

Return a JSON ARRAY. ONLY valid JSON, no markdown code blocks, no extra text.`;

  const result = await generateWithRetry<StoryboardBoard[]>(
    provider, prompt, SYSTEM_PROMPT_STORYBOARD,
    (json) => unwrapArray<StoryboardBoard>(json),
  );
  console.log('[PromptBoard] Storyboard result:', result.length, 'boards');
  if (result.length > 0) {
    console.log('[PromptBoard] First board sample:', JSON.stringify(result[0]).substring(0, 300));
  }
  return result;
}