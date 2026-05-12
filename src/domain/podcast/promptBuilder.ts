import type { PodcastPromptRule, PodcastSettings, PodcastTranscriptSegment } from './model.ts';
import { TEMPLATE_STYLE, TEMPLATE_STYLE_LOCK } from './style.ts';

export const SYSTEM_PROMPT_PODCAST = `You are a senior podcast presentation producer. Return valid JSON only. Analyze a two-speaker podcast script and create a slide plan with concise on-slide text, keywords, infographic ideas, and complete image-generation prompts for presentation slide images.`;

export function buildPodcastAnalysisPrompt(input: {
  script: string;
  audioDuration: number;
  settings: PodcastSettings;
  speakerNames?: string[];
  promptRules?: PodcastPromptRule[];
  transcriptSegments?: PodcastTranscriptSegment[];
}): string {
  const languageRule = input.settings.promptLanguage === 'english-prompts'
    ? 'Write image-generation prompts in English. On-slide display text may preserve short Vietnamese keywords/notes from the podcast when useful.'
    : 'Write image-generation prompts in Vietnamese. On-slide display text should be Vietnamese.';

  const transcriptSegments = input.transcriptSegments || [];
  const hasTranscript = transcriptSegments.length > 0;
  const timingRule = hasTranscript
    ? [
      'Use the timestamped transcript to choose exact start/end audio timing for each section.',
      'Set transcript_start_segment and transcript_end_segment for every section.',
    ].join('\n- ')
    : [
      'No audio transcript is provided.',
      'Create an estimated slide timing plan using duration_weight.',
      'Do not invent transcript_start_segment or transcript_end_segment values.',
    ].join('\n- ');

  const transcriptContext = hasTranscript
    ? `\nTimestamped transcript from voice-over audio:\n${transcriptSegments.map((segment) => `[${segment.index}] ${segment.start.toFixed(2)}-${segment.end.toFixed(2)}s: ${segment.text}`).join('\n')}\n`
    : '';
  const speakerNames = (input.speakerNames || []).map((name) => name.trim()).filter(Boolean);
  const speakerRule = speakerNames.length > 0
    ? [
      `Speaker/character names provided by the user: ${speakerNames.join(', ')}.`,
      'If a slide shows speaker names, use only these exact names as standalone labels.',
      `Never write "${speakerNames.join(' và ')} Podcast", "${speakerNames.join(' & ')} Podcast", "Podcast", "show", "episode", or any title/brand phrase after the names.`,
    ].join('\n- ')
    : 'If a slide shows speaker names, use names only as standalone labels. Never append "Podcast", "show", "episode", or any title/brand phrase after the names.';
  const activeSlideRules = (input.promptRules || [])
    .filter((rule) => rule.enabled && (rule.scope === 'all' || rule.scope === 'slides'))
    .map((rule, index) => `${index + 1}. ${rule.promptOverride}`);
  const customRules = activeSlideRules.length > 0
    ? `\nCustom user prompt rules to apply to slide prompts:\n${activeSlideRules.join('\n')}\n`
    : '';

  return `Analyze this two-speaker podcast script and create a slide-image generation package.

Requirements:
- Automatically split the podcast into the right number of sections/slides based on content.
- ${timingRule}
- Each section becomes one complete slide image prompt.
- Each slide must include a small amount of text only: keywords, one short note, or compact labels.
- Include infographic and illustrative image ideas for each section.
- Use this visual template direction: ${TEMPLATE_STYLE[input.settings.template]}.
- Use this exact deck-wide design system in EVERY slide prompt: ${TEMPLATE_STYLE_LOCK[input.settings.template]}
- Every slide_prompt.prompt must explicitly repeat the same brand style lock: palette, typography, image/icon style, spacing, grid, and slide composition rules.
- Aspect ratio: ${input.settings.aspectRatio}.
- Total audio duration in seconds: ${Math.round(input.audioDuration || 0)}.
- ${languageRule}
- ${speakerRule}
- If template is custom-reference, assume a reference image is attached/available and describe how the slide should follow it.
- Avoid dense paragraphs, tiny text, fake UI clutter, watermarks, logos, unreadable text, malformed letters, and excessive captions.
${customRules}

Return JSON with this exact shape:
{
  "title": "short podcast title",
  "summary": "one paragraph summary",
  "sections": [
    {
      "section_number": 1,
      "title": "section title",
      "speaker_focus": ["Speaker A", "Speaker B"],
      "summary": "what happens in this section",
      "keywords": ["keyword"],
      "key_note": "one short slide note",
      "infographic_idea": "specific infographic idea",
      "image_idea": "specific illustration/photo idea",
      "visual_style_notes": "layout and style notes",
      "duration_weight": 1,
      "transcript_start_segment": ${hasTranscript ? '0' : 'null'},
      "transcript_end_segment": ${hasTranscript ? '2' : 'null'},
      "start_time": 0.0,
      "end_time": 12.5
    }
  ],
  "slide_prompts": [
    {
      "slide_number": 1,
      "section_title": "matching section title",
      "display_text": ["2-5 short text elements shown on slide"],
      "prompt": "complete prompt to create one finished presentation slide image with text and infographic/image illustration, including the repeated brand style lock",
      "negative_prompt": "things to avoid"
    }
  ]
}

${transcriptContext}

Podcast script:
${input.script}`;
}
