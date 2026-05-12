import type { AnalysisProvider } from './provider';
import { proxyFetch } from './proxyFetch';

export class OpenRouterProvider implements AnalysisProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'anthropic/claude-sonnet-4') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await proxyFetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await proxyFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'chrome-extension://podcastboard',
        'X-Title': 'PodcastBoard',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 32768,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error ${res.status}: ${res.body}`);
    }

    const data = JSON.parse(res.body);
    return data.choices?.[0]?.message?.content ?? '';
  }
}
