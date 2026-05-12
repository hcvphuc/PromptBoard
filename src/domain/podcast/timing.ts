import type { PodcastSection, PodcastSlidePrompt, PodcastTranscriptSegment } from './model.ts';

export const ESTIMATED_SECONDS_PER_SCRIPT_ONLY_SLIDE = 30;
export const DEFAULT_SCRIPT_ONLY_SLIDE_COUNT = 6;

export function estimateScriptOnlyDuration(script: string): number {
  const speakerTurns = script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[^:\n]{1,40}:\s+/.test(line)).length;
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSlides = Math.max(
    3,
    Math.min(12, speakerTurns || Math.ceil(wordCount / 90) || DEFAULT_SCRIPT_ONLY_SLIDE_COUNT),
  );
  return estimatedSlides * ESTIMATED_SECONDS_PER_SCRIPT_ONLY_SLIDE;
}

export function allocateTiming<T extends { duration_weight?: number; start_time?: number; end_time?: number }>(
  items: T[],
  totalDuration: number,
): T[] {
  const safeDuration = Math.max(1, totalDuration || items.length * 30);
  const totalWeight = items.reduce((sum, item) => sum + Math.max(1, Number(item.duration_weight || 1)), 0);
  let cursor = 0;

  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const duration = isLast
      ? safeDuration - cursor
      : Math.max(4, Math.round((safeDuration * Math.max(1, Number(item.duration_weight || 1))) / totalWeight));
    const next = isLast ? safeDuration : Math.min(safeDuration, cursor + duration);
    const withTiming = { ...item, start_time: cursor, end_time: next };
    cursor = next;
    return withTiming;
  });
}

export function applyTranscriptTiming(
  sections: PodcastSection[],
  transcriptSegments: PodcastTranscriptSegment[],
  totalDuration: number,
): PodcastSection[] {
  if (transcriptSegments.length === 0) return allocateTiming(sections, totalDuration);

  return sections.map((section, index) => {
    const startSegment = section.transcript_start_segment !== undefined
      ? transcriptSegments[Math.max(0, Math.min(transcriptSegments.length - 1, section.transcript_start_segment))]
      : undefined;
    const endSegment = section.transcript_end_segment !== undefined
      ? transcriptSegments[Math.max(0, Math.min(transcriptSegments.length - 1, section.transcript_end_segment))]
      : undefined;

    if (startSegment && endSegment && endSegment.end > startSegment.start) {
      return { ...section, start_time: startSegment.start, end_time: endSegment.end };
    }

    const fallbackStart = transcriptSegments[Math.floor((index / sections.length) * transcriptSegments.length)];
    const fallbackEnd = transcriptSegments[Math.max(0, Math.ceil(((index + 1) / sections.length) * transcriptSegments.length) - 1)];
    return {
      ...section,
      start_time: fallbackStart?.start ?? 0,
      end_time: fallbackEnd?.end ?? totalDuration,
    };
  });
}

export function attachSlideTiming(
  slidePrompts: PodcastSlidePrompt[],
  sections: PodcastSection[],
  totalDuration: number,
): PodcastSlidePrompt[] {
  return slidePrompts.map((slide, index) => ({
    ...slide,
    timestamp_start: sections[index]?.start_time || 0,
    timestamp_end: sections[index]?.end_time || totalDuration,
  }));
}
