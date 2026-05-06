// Script Speaker Parser — distinguish character dialogue from narrator text
// Character dialogue = text inside double quotes "..."
// Narrator action = text outside quotes, describing visual events
// Narrator commentary = text outside quotes, expressing opinion/emotion

import type { SRTLine } from '@/types/pipeline';

export interface ScriptSegment {
  text: string;
  speaker: 'character' | 'narrator-action' | 'narrator-commentary';
  speakerName?: string;
}

/**
 * Parse script text into segments, distinguishing character dialogue from narrator
 */
export function parseScriptSpeakers(scriptText: string): ScriptSegment[] {
  const segments: ScriptSegment[] = [];

  // Split by quoted dialogue while preserving the quotes
  const regex = /"([^"]+)"|([^"]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(scriptText)) !== null) {
    if (match[1] !== undefined) {
      // Inside double quotes → character dialogue
      segments.push({
        text: match[1].trim(),
        speaker: 'character',
        speakerName: undefined, // will be inferred from context
      });
    } else if (match[2] !== undefined) {
      const text = match[2].trim();
      if (text.length === 0) continue;

      // Classify narrator text: action vs commentary
      const isCommentary = detectNarratorCommentary(text);
      segments.push({
        text,
        speaker: isCommentary ? 'narrator-commentary' : 'narrator-action',
      });
    }
  }

  return segments;
}

/**
 * Detect if narrator text is commentary (opinion/emotion/direct address)
 * vs action (describing what happens visually)
 */
function detectNarratorCommentary(text: string): boolean {
  const commentarySignals = [
    /\bthink about\b/i,
    /\bimagine\b/i,
    /\bremember\b/i,
    /\blet me\b/i,
    /\bask (you|yourself|me)\b/i,
    /\bif you\b/i,
    /\bwhat (would|does|do)\b/i,
    /\bthis (was|is) (never|not|about)\b/i,
    /\bthat's?\b.*\b(mean|cost|enough)\b/i,
    /\bthe (price|kind)\b/i,
    /\bthis story\b/i,
    /\bno miracles\b/i,
    /\bno shortcuts\b/i,
  ];

  return commentarySignals.some(pattern => pattern.test(text));
}

/**
 * Match script segments to SRT lines by text similarity
 * This assigns speaker info to SRT lines based on the script structure
 */
export function matchSRTLinesToScript(srtLines: SRTLine[], scriptSegments: ScriptSegment[]): SRTLine[] {
  // Build a flat script text for fuzzy matching
  const flatScript = scriptSegments.map(s => s.text).join(' ');

  for (const line of srtLines) {
    // Try to find this SRT text in the script segments
    const srtText = line.text.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    let bestMatch: ScriptSegment | null = null;
    let bestScore = 0;

    for (const seg of scriptSegments) {
      const segText = seg.text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      // Check if SRT text is a substring of segment or vice versa
      if (segText.includes(srtText) || srtText.includes(segText)) {
        const score = Math.min(srtText.length, segText.length) / Math.max(srtText.length, segText.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = seg;
        }
      }
    }

    if (bestMatch && bestScore > 0.3) {
      line.speaker = bestMatch.speaker;
      line.speakerName = bestMatch.speakerName;
    } else {
      // Default: if no match, check if text starts with common dialogue indicators
      line.speaker = inferSpeakerFromText(line.text);
    }
  }

  return srtLines;
}

/**
 * Infer speaker type from SRT text content
 */
function inferSpeakerFromText(text: string): 'character' | 'narrator-action' | 'narrator-commentary' {
  // Short, direct commands or statements often = character dialogue
  const dialoguePatterns = [
    /^(Pull|Get|Put|Come|Go|Don't|I'm|I'd|I can|This is|That's|Equally|Section)/i,
  ];

  if (dialoguePatterns.some(p => p.test(text))) {
    // Could be dialogue, but without quotes in SRT we can't be sure
    // Default to narrator-action for safety
    return 'narrator-action';
  }

  return 'narrator-action';
}