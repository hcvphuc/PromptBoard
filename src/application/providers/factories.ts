import type {
  AnalysisProvider,
  AnalysisProviderConfig,
  ImageProvider,
  ProviderSelection,
  TranscriptionProvider,
  TranscriptProviderConfig,
} from '@/ai/provider';
import { MockProvider } from '@/ai/mock';
import { OpenAIProvider } from '@/ai/openai';
import { OllamaCloudProvider } from '@/ai/ollama';
import { OpenRouterProvider } from '@/ai/openrouter';
import { GroqWhisperTranscriptionProvider } from '@/ai/groqTranscribe';
import { ChatGPTImageProvider } from '@/adapters/image/chatgptImageProvider';

export function createAnalysisProvider(config: AnalysisProviderConfig): AnalysisProvider {
  switch (config.kind) {
    case 'openrouter':
      return new OpenRouterProvider(config.apiKey || '', config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey || '', config.model);
    case 'ollama-cloud':
      return new OllamaCloudProvider(config.baseUrl, config.model, config.apiKey);
    case 'mock':
    default:
      return new MockProvider();
  }
}

export function createTranscriptionProvider(config: TranscriptProviderConfig): TranscriptionProvider {
  switch (config.kind) {
    case 'groq-whisper':
    default:
      return new GroqWhisperTranscriptionProvider(config.apiKey || '', config.model);
  }
}

export function createImageProvider(_config: ProviderSelection['image']): ImageProvider {
  return new ChatGPTImageProvider();
}
