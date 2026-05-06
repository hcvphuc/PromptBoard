import type { AIProvider } from './provider';
import { proxyFetch } from './proxyFetch';

export class OllamaProvider implements AIProvider {
  name = 'Ollama';
  private baseUrl: string;
  private model: string;
  private apiKey?: string;

  constructor(baseUrl = 'https://ollama.com', model = 'gemini-3-flash-preview', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const base = this.baseUrl.replace(/\/$/, '');
      if (this.apiKey) {
        const res = await proxyFetch(`${base}/v1/models`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        return res.ok;
      }
      const res = await proxyFetch(`${base}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ];

    const base = this.baseUrl.replace(/\/$/, '');

    // Cloud API uses OpenAI-compatible /v1/chat/completions
    if (this.apiKey) {
      const res = await proxyFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama Cloud API error ${res.status}: ${res.body}`);
      }

      const data = JSON.parse(res.body);
      return data.choices?.[0]?.message?.content ?? '';
    }

    // Local API uses /api/chat
    const res = await proxyFetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama Local API error ${res.status}: ${res.body}`);
    }

    const data = JSON.parse(res.body);
    return data.message?.content ?? '';
  }
}