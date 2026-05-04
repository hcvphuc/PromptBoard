/**
 * Extract and parse JSON from AI response text.
 * AI models often wrap JSON in markdown code blocks or add extra text.
 * This function handles:
 * - Pure JSON response
 * - JSON wrapped in ```json ... ```
 * - JSON wrapped in ``` ... ```
 * - JSON with leading/trailing text
 * - Multiple JSON objects (returns first valid one)
 */
export function extractJSON<T = unknown>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid response from AI');
  }

  // Trim whitespace
  const trimmed = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to extraction
  }

  // Extract from markdown code block: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Find JSON array or object using balanced brackets
  const jsonPatterns = [
    /(\[[\s\S]*\])/,   // Array
    /(\{[\s\S]*\})/,   // Object
  ];

  for (const pattern of jsonPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      // Try to find the largest valid JSON starting from the match
      const candidates = match[1];
      // Try the whole match first
      try {
        return JSON.parse(candidates);
      } catch {
        // Try progressively smaller slices for nested JSON
      }

      // Try finding valid JSON by scanning from each { or [
      const startChars = candidates.startsWith('[') ? ['['] : ['{', '['];
      for (const startChar of startChars) {
        let startIdx = candidates.indexOf(startChar);
        while (startIdx !== -1) {
          const endChars = startChar === '[' ? ']' : '}';
          // Find the matching closing bracket
          let depth = 0;
          let inString = false;
          let escape = false;
          for (let i = startIdx; i < candidates.length; i++) {
            const ch = candidates[i];
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{' || ch === '[') depth++;
            if (ch === '}' || ch === ']') {
              depth--;
              if (depth === 0) {
                try {
                  return JSON.parse(candidates.substring(startIdx, i + 1));
                } catch {
                  break;
                }
              }
            }
          }
          startIdx = candidates.indexOf(startChar, startIdx + 1);
        }
      }
    }
  }

  // Last resort: try to fix common issues
  // Sometimes AI adds trailing comma before } or ]
  let fixed = trimmed;
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(fixed);
  } catch {
    // Give up
  }

  throw new Error(
    `Failed to parse AI response as JSON. Response starts with: "${trimmed.substring(0, 200)}..."` +
    `\n\nRaw response length: ${trimmed.length} characters.`
  );
}