import type { TranscriptionProvider } from './provider';
import type { PodcastTranscriptResult, PodcastTranscriptSegment } from '@/types/podcast';

function normalizeSegments(rawSegments: any[]): PodcastTranscriptSegment[] {
  return rawSegments
    .map((segment, index) => ({
      index,
      start: Number(segment.start ?? segment.start_time ?? 0),
      end: Number(segment.end ?? segment.end_time ?? segment.start ?? 0),
      text: String(segment.text ?? '').trim(),
    }))
    .filter((segment) => segment.text.length > 0);
}

export class GroqWhisperTranscriptionProvider implements TranscriptionProvider {
  name = 'Groq Whisper';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'whisper-large-v3-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async transcribe(file: File): Promise<PodcastTranscriptResult> {
    if (!this.apiKey) {
      throw new Error('Missing Groq API key');
    }
    if (file.size <= 0) {
      throw new Error('Audio file is empty before upload');
    }

    const form = new FormData();
    form.append('file', file, file.name || 'voice-over.wav');
    form.append('model', this.model);
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');
    form.append('temperature', '0');

    let res: Response;
    try {
      res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
      });
    } catch (err: any) {
      throw new Error(`Groq transcription network error: ${err?.message || String(err)}. Reload the unpacked extension from dist so host permissions are active.`);
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Groq transcription error ${res.status}: ${text}`);
    }
    const data = JSON.parse(text);
    return {
      text: String(data.text || ''),
      segments: normalizeSegments(Array.isArray(data.segments) ? data.segments : []),
    };
  }
}
