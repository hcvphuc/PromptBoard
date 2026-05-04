import type { AnalysisOutput } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockAnalysis } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';

export async function analyzeScript(script: string, provider: AIProvider): Promise<AnalysisOutput> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockAnalysis());
  }

  const prompt = `Analyze the following video script and return a JSON object with these fields:
- title: string
- genre: string
- summary: string (2-3 sentences)
- emotional_arc: string (arrow-separated stages)
- main_characters: string[] (character names)
- main_locations: string[] (location names)
- key_props: string[] (important props/objects)
- estimated_duration_seconds: number
- suggested_boards: number (based on story beats, max 15s per board)

Script:
"""
${script}
"""

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  return extractJSON<AnalysisOutput>(response);
}