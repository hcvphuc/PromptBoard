// Audio Beat Analyzer — group SRT lines into story beats with pacing
// This is the core logic for audio-driven mode

import type { SRTLine, StoryBeat } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { generateWithRetry } from '@/ai/generateWithRetry';

export interface BeatAnalysisOutput {
  beats: StoryBeat[];
  total_duration: number;
}

/**
 * Analyze SRT lines with AI to produce story beats with pacing
 */
export async function analyzeAudioBeats(
  srtLines: SRTLine[],
  audioDuration: number,
  provider: AIProvider
): Promise<BeatAnalysisOutput> {
  // If few lines, create simple beats without AI
  if (srtLines.length <= 5) {
    return createSimpleBeats(srtLines, audioDuration);
  }

  // Format SRT lines for the AI prompt
  const srtSummary = srtLines.map(l =>
    `[${formatTime(l.startTime)}→${formatTime(l.endTime)}] ${l.speaker === 'character' ? `("${l.speakerName || 'Character'}")` : '(N)'} ${l.text}`
  ).join('\n');

  const prompt = `Analyze these subtitle lines from a film/short video and group them into story beats.

Each beat is a continuous narrative segment. Group lines that belong together based on:
- Same scene/location
- Same emotional tone
- Same characters speaking
- Natural story rhythm

TOTAL AUDIO DURATION: ${audioDuration.toFixed(1)} seconds

SUBTITLE LINES:
${srtSummary}

For each beat, determine its PACING:
- "intense": fast cuts, action, conflict, confrontation → shots are 1-2 seconds each
- "moderate": normal flow, dialogue exchange → shots are 2-4 seconds each  
- "slow": emotional stillness, reflection, atmosphere → shots are 4-6 seconds each

Return a JSON ARRAY of beat objects:
- beat_number: number
- start_time: number (seconds)
- end_time: number (seconds)
- description: string (brief description of what happens)
- pacing: "intense" | "moderate" | "slow"
- characters: string[] (character names involved)
- location: string (location name or brief description)

RULES:
- Beats must cover the ENTIRE duration (0 to ${audioDuration.toFixed(1)}s) with no gaps
- Beats must NOT overlap
- Pacing should vary — don't make everything "moderate"
- Look for emotional shifts to determine pacing changes
- Character dialogue/confrontation → often intense or moderate
- Description/narration of details → often slow
- Transition moments can shift pacing

ONLY valid JSON. No markdown code blocks. No extra text.`;

  const parsed = await generateWithRetry<StoryBeat[]>(
    provider, prompt, SYSTEM_PROMPT,
    (json) => json as StoryBeat[],
  );

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return createSimpleBeats(srtLines, audioDuration);
  }

  // Add computed avg_shot_duration based on pacing
  const beats: StoryBeat[] = parsed.map(b => ({
    ...b,
    dialogue_lines: [],
    avg_shot_duration: pacingToShotDuration(b.pacing),
  }));

  // Attach SRT lines to beats
  for (const line of srtLines) {
    const beat = beats.find(b => line.startTime >= b.start_time - 0.1 && line.endTime <= b.end_time + 0.1);
    if (beat) {
      beat.dialogue_lines.push(line);
    }
  }

  return {
    beats,
    total_duration: audioDuration,
  };
}

/**
 * Create simple beats without AI (fallback or for very short scripts)
 */
function createSimpleBeats(srtLines: SRTLine[], audioDuration: number): BeatAnalysisOutput {
  if (srtLines.length === 0) {
    return {
      beats: [{
        beat_number: 1,
        start_time: 0,
        end_time: audioDuration,
        description: 'Full script',
        pacing: 'moderate',
        characters: [],
        location: 'Unknown',
        dialogue_lines: [],
        avg_shot_duration: 3,
      }],
      total_duration: audioDuration,
    };
  }

  // Group every 5-8 lines into a beat
  const GROUP_SIZE = 6;
  const beats: StoryBeat[] = [];

  for (let i = 0; i < srtLines.length; i += GROUP_SIZE) {
    const group = srtLines.slice(i, i + GROUP_SIZE);
    beats.push({
      beat_number: beats.length + 1,
      start_time: group[0].startTime,
      end_time: group[group.length - 1].endTime,
      description: group.map(l => l.text).join(' ').slice(0, 80),
      pacing: 'moderate',
      characters: [],
      location: '',
      dialogue_lines: group,
      avg_shot_duration: 3,
    });
  }

  return { beats, total_duration: audioDuration };
}

/**
 * Map pacing to average shot duration
 */
function pacingToShotDuration(pacing: string): number {
  switch (pacing) {
    case 'intense': return 1.5;
    case 'slow': return 5;
    case 'moderate':
    default: return 3;
  }
}

/**
 * Group beats into boards based on board duration setting
 */
export function assignBoardsFromBeats(
  beats: StoryBeat[],
  boardDuration: number
): { boardBeats: StoryBeat[][]; boardCount: number } {
  if (beats.length === 0) return { boardBeats: [], boardCount: 0 };

  const boardBeats: StoryBeat[][] = [];
  let currentBoard: StoryBeat[] = [];
  let currentDuration = 0;

  for (const beat of beats) {
    const beatDuration = beat.end_time - beat.start_time;

    // If adding this beat exceeds board duration AND current board is not empty,
    // finalize current board and start new one
    if (currentDuration + beatDuration > boardDuration && currentBoard.length > 0) {
      boardBeats.push(currentBoard);
      currentBoard = [beat];
      currentDuration = beatDuration;
    } else {
      currentBoard.push(beat);
      currentDuration += beatDuration;
    }
  }

  // Push last board
  if (currentBoard.length > 0) {
    boardBeats.push(currentBoard);
  }

  return { boardBeats, boardCount: boardBeats.length };
}

/**
 * Estimate shot count for a board based on its beats
 */
export function estimateShotCount(boardBeats: StoryBeat[], boardDuration: number): number {
  if (boardBeats.length === 0) return 3;

  // Weight average shot duration by beat duration
  let totalWeight = 0;
  let weightedAvg = 0;

  for (const beat of boardBeats) {
    const weight = beat.end_time - beat.start_time;
    totalWeight += weight;
    weightedAvg += beat.avg_shot_duration * weight;
  }

  const avgShotDur = totalWeight > 0 ? weightedAvg / totalWeight : 3;
  return Math.max(2, Math.round(boardDuration / avgShotDur));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}