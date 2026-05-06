// SRT Parser — parse .srt subtitle files into structured lines with timestamps

import type { SRTLine } from '@/types/pipeline';

/**
 * Parse SRT file content into structured lines
 * Supports standard SRT format:
 *   1
 *   00:00:00,000 --> 00:00:02,394
 *   Text here
 */
export function parseSRT(content: string): SRTLine[] {
  const lines: SRTLine[] = [];
  const blocks = content.trim().replace(/\r\n/g, '\n').split(/\n\n+/);

  for (const block of blocks) {
    const blockLines = block.split('\n');
    if (blockLines.length < 3) continue;

    const index = parseInt(blockLines[0], 10);
    if (isNaN(index)) continue;

    const timeMatch = blockLines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) continue;

    const startTime = hmsToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
    const endTime = hmsToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

    const text = blockLines.slice(2).join(' ').trim();

    if (text.length === 0) continue;

    lines.push({ index, startTime, endTime, text });
  }

  return lines;
}

function hmsToSeconds(h: string, m: string, s: string, ms: string): number {
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

/**
 * Get total duration from parsed SRT lines
 */
export function getSRTDuration(lines: SRTLine[]): number {
  if (lines.length === 0) return 0;
  const last = lines[lines.length - 1];
  return last.endTime;
}

/**
 * Get SRT lines within a time range
 */
export function getLinesInRange(lines: SRTLine[], start: number, end: number): SRTLine[] {
  return lines.filter(l => l.startTime >= start - 0.1 && l.endTime <= end + 0.1);
}