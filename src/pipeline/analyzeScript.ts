import type { AnalysisOutput, StoryBeat } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockAnalysis } from '@/ai/mock';
import { generateWithRetry } from '@/ai/generateWithRetry';

export interface AnalyzeScriptOptions {
  audioDuration?: number;
  beats?: StoryBeat[];
  boardDuration?: number;
}

export async function analyzeScript(
  script: string,
  provider: AIProvider,
  options?: AnalyzeScriptOptions
): Promise<AnalysisOutput> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockAnalysis());
  }

  const isAudioDriven = !!(options?.audioDuration && options?.beats);
  const boardDuration = options?.boardDuration || 15;

  let durationInfo = '';
  if (isAudioDriven && options!.audioDuration && options!.beats) {
    const beatsSummary = options!.beats.map(b =>
      `  Beat ${b.beat_number}: [${b.start_time.toFixed(1)}s→${b.end_time.toFixed(1)}s] ${b.pacing} — ${b.description}`
    ).join('\n');

    durationInfo = `
AUDIO DURATION: ${options!.audioDuration.toFixed(1)} seconds (KNOWN — do NOT estimate)
BOARD DURATION: ${boardDuration} seconds per board
SUGGESTED BOARDS: ${Math.ceil(options!.audioDuration / boardDuration)}

STORY BEATS (already analyzed from audio timestamps):
${beatsSummary}

Use the EXACT audio duration above. Do NOT estimate your own duration.`;
  } else {
    durationInfo = `
- estimated_duration_seconds: number (your best estimate based on script content)
- suggested_boards: number (based on story beats, max ${boardDuration}s per board)`;
  }

  const prompt = `Analyze the following video script and return a JSON object with these fields:
- title: string
- genre: string
- summary: string (2-3 sentences)
- emotional_arc: string (arrow-separated stages)
- main_characters: string[] (character names)
- main_locations: string[] (location names)
- key_props: string[] (important props/objects)
${durationInfo}

Script:
"""
${script}
"""

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  const parsed = await generateWithRetry<AnalysisOutput>(
    provider, prompt, SYSTEM_PROMPT,
    (json) => json as AnalysisOutput,
  );

  // In audio-driven mode, override with actual values
  if (isAudioDriven && options!.audioDuration && options!.beats) {
    parsed.estimated_duration_seconds = Math.round(options!.audioDuration);
    parsed.suggested_boards = Math.ceil(options!.audioDuration / boardDuration);
    parsed.story_beats = options!.beats;
  }

  return parsed;
}