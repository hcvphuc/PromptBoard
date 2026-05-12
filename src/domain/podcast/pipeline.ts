import type { AnalysisProvider } from '@/ai/provider';
import { generateWithRetry } from '@/ai/generateWithRetry';
import type { PodcastOutput, PodcastPromptRule, PodcastSettings, PodcastTranscriptSegment } from './model.ts';
import { parsePodcast } from './parser.ts';
import { buildPodcastAnalysisPrompt, SYSTEM_PROMPT_PODCAST } from './promptBuilder.ts';
import { withStyleLock } from './style.ts';
import { applyTranscriptTiming, attachSlideTiming } from './timing.ts';
import { buildMockPodcast } from './mock.ts';

export interface PodcastProgress {
  step: 'analyzing' | 'timing' | 'slides' | 'done';
  label: string;
  percentage: number;
}

export async function runPodcastPipeline(
  input: {
    script: string;
    audioDuration: number;
    settings: PodcastSettings;
    speakerNames?: string[];
    promptRules?: PodcastPromptRule[];
    transcriptSegments?: PodcastTranscriptSegment[];
  },
  provider: AnalysisProvider,
  onProgress?: (progress: PodcastProgress) => void,
): Promise<PodcastOutput> {
  onProgress?.({ step: 'analyzing', label: 'Analyzing podcast sections...', percentage: 20 });

  if (provider.name.toLowerCase() === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 450));
    onProgress?.({ step: 'timing', label: 'Mapping slides to audio...', percentage: 55 });
    await new Promise((resolve) => setTimeout(resolve, 300));
    onProgress?.({ step: 'slides', label: 'Building slide prompts...', percentage: 85 });
    await new Promise((resolve) => setTimeout(resolve, 300));
    onProgress?.({ step: 'done', label: 'Podcast slide plan ready.', percentage: 100 });
    return buildMockPodcast(input);
  }

  const generated = await generateWithRetry(
    provider,
    buildPodcastAnalysisPrompt(input),
    SYSTEM_PROMPT_PODCAST,
    parsePodcast,
  );

  onProgress?.({ step: 'timing', label: 'Mapping slides to audio...', percentage: 60 });

  const sections = applyTranscriptTiming(generated.sections, input.transcriptSegments || [], input.audioDuration);
  const slidePrompts = attachSlideTiming(
    generated.slide_prompts.map((slide) => ({
      ...slide,
      prompt: withStyleLock(slide.prompt, input.settings),
      negative_prompt: [
        slide.negative_prompt,
        'inconsistent style between slides, different font families, random palette changes, mixed icon styles, uneven spacing, cluttered layout, unreadable text',
      ].filter(Boolean).join(', '),
    })),
    sections,
    input.audioDuration,
  );

  onProgress?.({ step: 'done', label: 'Podcast slide plan ready.', percentage: 100 });

  return {
    ...generated,
    total_duration_seconds: input.audioDuration,
    template: input.settings.template,
    prompt_language: input.settings.promptLanguage,
    sections,
    slide_prompts: slidePrompts,
  };
}
