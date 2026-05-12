import type { PodcastOutput, PodcastSection, PodcastSlidePrompt } from './model.ts';

export function parsePodcast(raw: unknown): Omit<PodcastOutput, 'total_duration_seconds' | 'template' | 'prompt_language'> {
  const obj = raw as Record<string, any>;
  if (!obj || typeof obj !== 'object') throw new Error('Podcast output must be an object');
  if (!Array.isArray(obj.sections)) throw new Error('Podcast output missing sections array');
  if (!Array.isArray(obj.slide_prompts)) throw new Error('Podcast output missing slide_prompts array');

  return {
    title: String(obj.title || 'Podcast Slides'),
    summary: String(obj.summary || ''),
    sections: obj.sections.map((section: any, index: number): PodcastSection => ({
      section_number: Number(section.section_number || index + 1),
      title: String(section.title || `Section ${index + 1}`),
      speaker_focus: Array.isArray(section.speaker_focus) ? section.speaker_focus.map(String) : [],
      summary: String(section.summary || ''),
      keywords: Array.isArray(section.keywords) ? section.keywords.map(String).slice(0, 8) : [],
      key_note: String(section.key_note || ''),
      infographic_idea: String(section.infographic_idea || ''),
      image_idea: String(section.image_idea || ''),
      visual_style_notes: String(section.visual_style_notes || ''),
      duration_weight: Math.max(1, Number(section.duration_weight || 1)),
      transcript_start_segment: section.transcript_start_segment !== undefined ? Number(section.transcript_start_segment) : undefined,
      transcript_end_segment: section.transcript_end_segment !== undefined ? Number(section.transcript_end_segment) : undefined,
      start_time: Number(section.start_time ?? 0),
      end_time: Number(section.end_time ?? 0),
    })),
    slide_prompts: obj.slide_prompts.map((slide: any, index: number): PodcastSlidePrompt => ({
      slide_number: Number(slide.slide_number || index + 1),
      section_title: String(slide.section_title || `Section ${index + 1}`),
      timestamp_start: 0,
      timestamp_end: 0,
      display_text: Array.isArray(slide.display_text) ? slide.display_text.map(String).slice(0, 5) : [],
      prompt: String(slide.prompt || ''),
      negative_prompt: String(slide.negative_prompt || ''),
    })),
  };
}
