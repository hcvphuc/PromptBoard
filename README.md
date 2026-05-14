# PodcastBoard 0.2.0

Chrome/Edge extension that turns podcasts into visual stories with deck templates, optional podcast still frames, and generated slide images.

Turn podcasts into visual stories.

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
2. Optionally upload a voice-over file (`.mp3` or `.wav`) for transcript-based timing.
3. Optionally upload one or two character images for the opening still frame.
4. Optionally add a location image or location description; if both are empty, PodcastBoard confirms before using a random podcast setting.
5. Choose a deck template direction or upload a template/reference image.
6. Analyze the script with the selected analysis provider; audio is transcribed with Groq Whisper when present.
7. Generate a master deck template, an optional opening still frame, and one image per analyzed section with the ChatGPT image adapter.
8. Export timestamps JSON, transcript SRT when audio exists, or a ZIP containing slide images plus metadata.

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
