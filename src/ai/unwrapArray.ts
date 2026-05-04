/**
 * Unwrap AI response that may be wrapped in an object instead of returning an array directly.
 * AI models often return { "characters": [...] } or { "storyboards": [...] } instead of [...]
 */
export function unwrapArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Look for the first array value in the object
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }

    // Single object — wrap in array (e.g. AI returned one item without array)
    if (Object.keys(obj).length > 0) {
      // Check if it looks like a valid item (has typical fields)
      return [data as T];
    }
  }

  // Fallback: return empty array
  return [];
}