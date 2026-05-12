import type { AnalysisProvider } from './provider';
import { proxyFetch } from './proxyFetch';

export class OpenAIProvider implements AnalysisProvider {
  name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await proxyFetch('https://api.openai.com/v1/models', {
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

    const res = await proxyFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 32768,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${res.body}`);
    }

    const data = JSON.parse(res.body);
    return data.choices?.[0]?.message?.content ?? '';
  }
}
