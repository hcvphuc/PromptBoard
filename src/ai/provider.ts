export interface AIProvider {
  name: string;
  generate(prompt: string, systemPrompt?: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface AIProviderConfig {
  provider: 'mock' | 'openrouter' | 'openai' | 'ollama';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export const SYSTEM_PROMPT = `You are a cinematic prompt engineer. You analyze video scripts and produce structured JSON outputs for film production. Always respond with valid JSON only, no markdown formatting, no code blocks, no extra text. Be specific, visual, and production-ready.`;