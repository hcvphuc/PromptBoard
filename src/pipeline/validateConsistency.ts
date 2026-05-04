import type { ConsistencyReport } from '@/types/pipeline';
import type { ProjectOutput } from '@/types/output';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockConsistency } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';

export async function validateConsistency(
  output: Partial<ProjectOutput>,
  provider: AIProvider
): Promise<ConsistencyReport> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockConsistency());
  }

  const prompt = `Validate visual continuity across the following production outputs. Check for:
1. Character identity consistency (same descriptions, features, wardrobe across all prompts)
2. Wardrobe consistency (same clothing in storyboards, character prompts, and seedance)
3. Location consistency (same descriptions, atmosphere, lighting)
4. Lighting and color palette consistency
5. Shot variety (no repetitive shot sizes or camera movements)

Outputs to validate:
${JSON.stringify(output, null, 2)}

Return a JSON object with:
- passed: boolean (true if no critical issues)
- issues: array of { category: string, description: string, affected_boards: number[], suggestion: string }

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  return extractJSON<ConsistencyReport>(response);
}