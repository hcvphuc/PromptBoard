import type { AnalysisProvider } from './provider';
import { extractJSON } from './extractJSON';
import { logger } from '@/logger/logger';

const REPAIR_PROMPT = `The previous JSON output was invalid or could not be parsed. Fix the JSON structure and return ONLY valid JSON matching the required schema. Fix any missing fields, incorrect types, or malformed JSON. No markdown code blocks, no extra text.`;

export interface RetryOptions {
  /** Maximum number of retries after the first attempt fails. Default: 1 */
  maxRetries?: number;
  /** Whether to log retry attempts. Default: true */
  log?: boolean;
}

/**
 * Call an AI provider with automatic retry on JSON parse failure.
 *
 * 1. First attempt: send prompt, try to parse as JSON.
 * 2. If parse fails: retry once with a repair prompt that includes the error.
 *
 * This is lighter than the full-script-resubmit approach —
 * we only send the error context, not the entire input again.
 */
export async function generateWithRetry<T>(
  provider: AnalysisProvider,
  prompt: string,
  systemPrompt: string,
  parser: (raw: unknown) => T,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 1;
  const shouldLog = options?.log ?? true;

  // First attempt
  const raw = await provider.generate(prompt, systemPrompt);

  try {
    const json = extractJSON<unknown>(raw);
    return parser(json);
  } catch (firstError) {
    if (maxRetries <= 0) throw firstError;

    if (shouldLog) {
      logger.warn('generateWithRetry', 'First attempt parse failed, retrying...', String(firstError));
    }

    // Retry: send error context so the model can fix its output
    const retryPrompt = `${prompt}\n\n---\n${REPAIR_PROMPT}\n\nError: ${String(firstError).substring(0, 500)}`;
    const retryRaw = await provider.generate(retryPrompt, systemPrompt);

    try {
      const retryJson = extractJSON<unknown>(retryRaw);
      return parser(retryJson);
    } catch (retryError) {
      if (shouldLog) {
        logger.error('generateWithRetry', 'Retry also failed', String(retryError));
      }
      throw retryError;
    }
  }
}
