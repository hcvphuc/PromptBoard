import type { PodcastOutput } from './model.ts';
import { parsePodcast } from './parser.ts';
import { withStyleLock } from './style.ts';
import { applyTranscriptTiming, attachSlideTiming } from './timing.ts';
import type { PodcastTranscriptSegment, PodcastSettings } from './model.ts';

export function buildMockPodcast(input: {
  audioDuration: number;
  settings: PodcastSettings;
  transcriptSegments?: PodcastTranscriptSegment[];
}): PodcastOutput {
  const base = parsePodcast({
    title: 'Podcast Insight Deck',
    summary: 'A two-host conversation distilled into a concise visual slide sequence.',
    sections: [
      {
        section_number: 1,
        title: 'Opening Context',
        speaker_focus: ['Host 1', 'Host 2'],
        summary: 'The hosts introduce the central question and why it matters.',
        keywords: ['Context', 'Problem', 'Why now'],
        key_note: 'Why this topic matters now',
        infographic_idea: 'Simple three-node context map',
        image_idea: 'Premium podcast studio with abstract topic visualization',
        visual_style_notes: 'Large headline, one quote note, small context diagram',
        duration_weight: 1,
      },
      {
        section_number: 2,
        title: 'Core Debate',
        speaker_focus: ['Host 1', 'Host 2'],
        summary: 'The speakers compare two points of view and surface the main tradeoff.',
        keywords: ['Tradeoff', 'Signal', 'Decision'],
        key_note: 'The tradeoff is the story',
        infographic_idea: 'Two-column comparison with one highlighted tension',
        image_idea: 'Clean split composition with contrasting visual metaphors',
        visual_style_notes: 'Editorial split layout, minimal text, refined contrast',
        duration_weight: 2,
      },
      {
        section_number: 3,
        title: 'Takeaway',
        speaker_focus: ['Host 1', 'Host 2'],
        summary: 'The episode closes with practical implications and a memorable takeaway.',
        keywords: ['Takeaway', 'Action', 'Next step'],
        key_note: 'Turn insight into action',
        infographic_idea: 'Three-step action ladder',
        image_idea: 'Key visual of a clear path forward',
        visual_style_notes: 'Strong final note, spacious composition, premium finish',
        duration_weight: 1,
      },
    ],
    slide_prompts: [
      {
        slide_number: 1,
        section_title: 'Opening Context',
        display_text: ['Context', 'Why now', 'Problem'],
        prompt: withStyleLock('Create a finished premium business podcast presentation slide, 16:9, dark editorial background, large concise title "Opening Context", three-node context map, small note "Why this topic matters now", refined typography, minimal Vietnamese-friendly text, polished infographic, no clutter.', input.settings),
        negative_prompt: 'long paragraphs, unreadable text, watermarks, messy layouts, extra logos',
      },
      {
        slide_number: 2,
        section_title: 'Core Debate',
        display_text: ['Tradeoff', 'Signal', 'Decision'],
        prompt: withStyleLock('Create a finished premium podcast slide image, 16:9, split editorial composition showing two viewpoints in a clean comparison, concise labels "Tradeoff", "Signal", "Decision", one highlighted tension line, elegant infographic, low text density, business premium style.', input.settings),
        negative_prompt: 'tiny captions, crowded dashboard, misspelled words, generic stock photo look',
      },
      {
        slide_number: 3,
        section_title: 'Takeaway',
        display_text: ['Takeaway', 'Action', 'Next step'],
        prompt: withStyleLock('Create a finished final takeaway slide image, 16:9, Apple keynote inspired black premium canvas, three-step action ladder infographic, concise text only: "Takeaway", "Action", "Next step", strong calm ending, polished presentation design.', input.settings),
        negative_prompt: 'busy background, dense paragraphs, fake brand logos, watermark',
      },
    ],
  });

  const sections = applyTranscriptTiming(base.sections, input.transcriptSegments || [], input.audioDuration || 180);
  const slidePrompts = attachSlideTiming(base.slide_prompts, sections, input.audioDuration || 180);

  return {
    ...base,
    total_duration_seconds: input.audioDuration || 180,
    template: input.settings.template,
    prompt_language: input.settings.promptLanguage,
    sections,
    slide_prompts: slidePrompts,
  };
}
