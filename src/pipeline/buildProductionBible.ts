import type { ProductionBible, AnalysisOutput } from '@/types/pipeline';
import type { AIProvider } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { SYSTEM_PROMPT } from '@/ai/provider';
import { getMockBible } from '@/ai/mock';
import { extractJSON } from '@/ai/extractJSON';

export async function buildProductionBible(
  analysis: AnalysisOutput,
  settings: PipelineSettings,
  provider: AIProvider
): Promise<ProductionBible> {
  if (provider.name === 'Mock') {
    return JSON.parse(getMockBible());
  }

  const prompt = `Based on the script analysis below, build a production bible. Style preset: ${settings.stylePreset}. Aspect ratio: ${settings.aspectRatio}.

Analysis:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with:
- visual_style: string (detailed visual direction)
- color_palette: string[] (hex codes)
- lighting: string (detailed lighting direction)
- tone: string
- characters: array of { name, description, wardrobe, distinctive_features }
- locations: array of { name, description, atmosphere, key_elements: string[] }
- props: array of { name, description, importance }
- continuity_rules: string[] (rules to maintain visual consistency)

Return ONLY valid JSON, no other text. No markdown code blocks.`;

  const response = await provider.generate(prompt, SYSTEM_PROMPT);
  return extractJSON<ProductionBible>(response);
}