import type {
  PodcastDeckTemplateAsset,
  PodcastSlideImage,
  PodcastTranscriptResult,
} from '@/domain/podcast/model';

export type AnalysisProviderKind = 'mock' | 'openrouter' | 'openai' | 'ollama-cloud';
export type TranscriptProviderKind = 'groq-whisper';
export type ImageProviderKind = 'chatgpt';

export interface AnalysisProviderConfig {
  kind: AnalysisProviderKind;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TranscriptProviderConfig {
  kind: TranscriptProviderKind;
  apiKey?: string;
  model?: string;
}

export interface ImageProviderConfig {
  kind: ImageProviderKind;
}

export interface ProviderSelection {
  analysis: AnalysisProviderConfig;
  transcript: TranscriptProviderConfig;
  image: ImageProviderConfig;
}

export interface AnalysisProvider {
  name: string;
  generate(prompt: string, systemPrompt?: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface TranscriptionProvider {
  name: string;
  transcribe(file: File): Promise<PodcastTranscriptResult>;
  isAvailable(): Promise<boolean>;
}

export interface ImageGenerationResult {
  success: boolean;
  error?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface ImageProviderEnvironmentCheck {
  ok: boolean;
  detectedLocale?: string;
  reason?: 'chatgpt-vietnamese-locale' | 'unknown';
  message?: string;
}

export interface DeckTemplateImageResult {
  prompt: string;
  imageUrl: string;
}

export interface ImageProvider {
  name: string;
  startBatch(): void;
  checkEnvironment?(options?: { refreshChatGpt?: boolean }): Promise<ImageProviderEnvironmentCheck>;
  generateDeckTemplateImageUrl(prompt: string, referenceImages?: string[]): Promise<DeckTemplateImageResult>;
  generateDeckTemplate(prompt: string, referenceImages?: string[]): Promise<PodcastDeckTemplateAsset>;
  generateOpeningStill(
    slide: { prompt: string },
    options: { deckTemplateImageDataUrl?: string; referenceImages: string[] },
  ): Promise<PodcastSlideImage>;
  generateSlide(
    slide: { slideNumber: number; sectionTitle: string; timestampStart: number; timestampEnd: number; prompt: string },
    options: { deckTemplateImageDataUrl?: string; referenceImages?: string[] },
  ): Promise<PodcastSlideImage>;
  downloadImageAsDataUrl(imageUrl: string): Promise<string | null>;
}

export const DEFAULT_PROVIDER_SELECTION: ProviderSelection = {
  analysis: {
    kind: 'mock',
    model: '',
  },
  transcript: {
    kind: 'groq-whisper',
    model: 'whisper-large-v3-turbo',
  },
  image: {
    kind: 'chatgpt',
  },
};
