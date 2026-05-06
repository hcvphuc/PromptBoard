import type { StylePreset } from '@/types/project';
import { STYLE_DICTIONARY } from '@/types/project';

/**
 * Inject style preset into a prompt.
 * Appends positive style keywords and negative style constraints.
 */
export function injectStyle(prompt: string, stylePreset: StylePreset): string {
  const style = STYLE_DICTIONARY[stylePreset];
  if (!style) return prompt;

  // Check if style keywords are already present to avoid duplication
  if (prompt.includes(style.positive.split(',')[0])) return prompt;

  // Remove any existing "Style: X" or "Aspect ratio: X" suffix to re-append cleanly
  const cleaned = prompt
    .replace(/\.?\s*Style:\s*[^.]+\.?/gi, '')
    .replace(/\.?\s*Aspect ratio:\s*[^.]+\.?/gi, '')
    .trim();

  return `${cleaned}. ${style.positive}. ${style.negative}.`;
}

/**
 * Inject style preset into a prompt that already ends with "Style: X. Aspect ratio: Y."
 * Replaces the existing style with the full style dictionary.
 */
export function injectStyleWithSuffix(prompt: string, stylePreset: StylePreset, aspectRatio: string): string {
  const style = STYLE_DICTIONARY[stylePreset];
  if (!style) return prompt;

  // Remove existing style/aspect ratio suffix
  const cleaned = prompt
    .replace(/\.?\s*Style:\s*[^.]+\.?/gi, '')
    .replace(/\.?\s*Aspect ratio:\s*[^.]+\.?/gi, '')
    .trim();

  return `${cleaned}. ${style.positive}. ${style.negative}. Style: ${stylePreset}. Aspect ratio: ${aspectRatio}.`;
}

/**
 * Get the style block for appending to prompts
 */
export function getStyleBlock(stylePreset: StylePreset): string {
  const style = STYLE_DICTIONARY[stylePreset];
  if (!style) return '';
  return `${style.positive}. ${style.negative}.`;
}