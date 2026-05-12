# PodcastBoard

Chrome/Edge extension that turns a two-speaker podcast script plus one MP3/WAV voice-over file into timestamped presentation slide prompts and generated slide images.

## Product Shape

PodcastBoard is now a podcast-only codebase with a layered architecture:

- `src/sidepanel`: thin UI shell
- `src/components/podcast`: presentation components
- `src/application/podcast`: workflow, export, audio helpers
- `src/application/providers`: provider factories
- `src/domain/podcast`: core podcast model, prompt building, parsing, timing
- `src/adapters/image`: ChatGPT image adapter
- `src/ai`: analysis and transcription providers

## Workflow

1. Paste a podcast dialogue script with speakers already separated.
2. Upload one voice-over file (`.mp3` or `.wav`).
3. Choose a deck template direction or upload a template/reference image.
4. Transcribe the voice-over with Groq Whisper for exact timing.
5. Analyze the script with the selected analysis provider.
6. Generate a master deck template and one image per analyzed section with the ChatGPT image adapter.
7. Export timestamps JSON, transcript SRT, or a ZIP containing slide images plus metadata.

## Providers

- Analysis: `Mock`, `OpenRouter`, `OpenAI`, `Ollama Cloud`
- Transcript: `Groq Whisper`
- Image: `ChatGPT`

## Dev

```bash
npm install
npm run dev
npm run build
npm test
```
