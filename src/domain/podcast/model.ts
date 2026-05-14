import type { ProviderSelection } from '@/ai/provider';

export type PodcastTemplate =
  | 'business-premium'
  | 'youtube-explainer'
  | 'apple-keynote'
  | 'news-documentary'
  | 'sticker-social-kit'
  | 'notebook-scrapbook'
  | 'neo-brutalist-deck'
  | 'editorial-collage'
  | 'paper-cutout-psychology'
  | 'vintage-academic-archive'
  | 'cyber-marketing-brutalism'
  | 'custom-reference';

export type PromptLanguageMode = 'english-prompts' | 'vietnamese-prompts';
export type PodcastProjectStage = 'draft' | 'transcribed' | 'analyzed' | 'slides-generated';
export type GenerationStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'done';
export type PromptRuleScope = 'all' | 'deck' | 'opening_still' | 'slides';

export interface PodcastSettings {
  template: PodcastTemplate;
  promptLanguage: PromptLanguageMode;
  aspectRatio: '16:9' | '9:16' | '1:1';
  maxSlideText: 'minimal' | 'balanced';
}

export interface PodcastSection {
  section_number: number;
  title: string;
  speaker_focus: string[];
  summary: string;
  keywords: string[];
  key_note: string;
  infographic_idea: string;
  image_idea: string;
  visual_style_notes: string;
  duration_weight: number;
  transcript_start_segment?: number;
  transcript_end_segment?: number;
  start_time: number;
  end_time: number;
}

export interface PodcastTranscriptSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

export interface PodcastTranscriptResult {
  text: string;
  segments: PodcastTranscriptSegment[];
}

export interface PodcastSlidePrompt {
  slide_number: number;
  section_title: string;
  timestamp_start: number;
  timestamp_end: number;
  display_text: string[];
  prompt: string;
  negative_prompt: string;
}

export interface PodcastSlideImage {
  slideNumber: number;
  sectionTitle: string;
  timestampStart: number;
  timestampEnd: number;
  prompt: string;
  imageDataUrl: string;
}

export interface PodcastDeckTemplateAsset {
  prompt: string;
  imageDataUrl: string;
}

export interface PodcastOutput {
  title: string;
  summary: string;
  total_duration_seconds: number;
  template: PodcastTemplate;
  prompt_language: PromptLanguageMode;
  sections: PodcastSection[];
  slide_prompts: PodcastSlidePrompt[];
}

export interface PodcastAudioMetadata {
  name: string;
  durationSeconds: number;
  mimeType: string;
}

export interface PodcastReferenceImage {
  fileName: string;
  dataUrl: string;
  name?: string;
}

export interface PodcastPromptRule {
  id: string;
  summary: string;
  scope: PromptRuleScope;
  promptOverride: string;
  enabled: boolean;
  createdAt: number;
}

export interface PodcastExportRow {
  slide: number;
  title: string;
  start: string;
  end: string;
  start_seconds: number;
  end_seconds: number;
  display_text?: string[];
}

export interface PodcastProject {
  id: string;
  updatedAt: number;
  stage: PodcastProjectStage;
  inputs: {
    script: string;
    audio?: PodcastAudioMetadata;
    templateReferenceDataUrl?: string;
    templateFileName?: string;
    characterOne?: PodcastReferenceImage;
    characterTwo?: PodcastReferenceImage;
    locationReference?: PodcastReferenceImage;
    locationDescription?: string;
  };
  settings: PodcastSettings;
  providers: ProviderSelection;
  transcript?: PodcastTranscriptResult;
  analysis?: PodcastOutput;
  assets: {
    deckTemplate?: PodcastDeckTemplateAsset;
    openingStill?: PodcastSlideImage;
    slides: PodcastSlideImage[];
  };
  generation: {
    status: GenerationStatus;
  };
  promptRules: PodcastPromptRule[];
  exports: {
    timestamps: PodcastExportRow[];
    transcriptSrt?: string;
  };
}

export const PODCAST_TEMPLATES: { value: PodcastTemplate; label: string; description: string }[] = [
  { value: 'business-premium', label: 'Business Premium', description: 'Dark, polished, boardroom-grade podcast visuals.' },
  { value: 'youtube-explainer', label: 'YouTube Explainer', description: 'Clear, punchy, thumbnail-aware education slides.' },
  { value: 'apple-keynote', label: 'Apple Keynote', description: 'Minimal, cinematic, high-contrast presentation style.' },
  { value: 'news-documentary', label: 'News Documentary', description: 'Editorial, credible, data and image-led framing.' },
  { value: 'sticker-social-kit', label: 'Sticker Social Kit', description: 'Bright social carousel with stickers, cutouts, emojis, and bold blocks.' },
  { value: 'notebook-scrapbook', label: 'Notebook Scrapbook', description: 'Grid paper, tape, polaroids, sticky notes, and hand-drawn arrows.' },
  { value: 'neo-brutalist-deck', label: 'Neo-Brutalist Deck', description: 'Raw bold typography, thick borders, loud shapes, and offbeat layouts.' },
  { value: 'editorial-collage', label: 'Editorial Collage', description: 'Magazine-style cutout collage with bold headline and symbolic objects.' },
  { value: 'paper-cutout-psychology', label: 'Paper Cutout Psychology', description: 'Navy and cream torn-paper carousel with serif type and doodles.' },
  { value: 'vintage-academic-archive', label: 'Vintage Academic Archive', description: 'Aged paper, archival photos, diagrams, serif type, and academic texture.' },
  { value: 'cyber-marketing-brutalism', label: 'Cyber Marketing Brutalism', description: 'Black and purple neon ads style with grayscale cutouts and 3D elements.' },
  { value: 'custom-reference', label: 'Custom Reference', description: 'Use uploaded template/reference image as the visual guide.' },
];

export const DEFAULT_PODCAST_SETTINGS: PodcastSettings = {
  template: 'business-premium',
  promptLanguage: 'english-prompts',
  aspectRatio: '16:9',
  maxSlideText: 'minimal',
};

export function createEmptyPodcastProject(providers: ProviderSelection): PodcastProject {
  return {
    id: `podcast-${Date.now()}`,
    updatedAt: Date.now(),
    stage: 'draft',
    inputs: {
      script: '',
    },
    settings: DEFAULT_PODCAST_SETTINGS,
    providers,
    assets: {
      slides: [],
    },
    generation: {
      status: 'idle',
    },
    promptRules: [],
    exports: {
      timestamps: [],
    },
  };
}
