# PromptBoard AI

Chrome/Edge extension that turns a raw video script into a complete cinematic prompt production package for ChatGPT / AI video generation tools.

## Install

1. Build: `npm run build`
2. Open Chrome → `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked" → select the `dist/` folder
5. Click the PromptBoard AI icon in the toolbar to open the side panel

## Dev

```bash
npm install
npm run dev    # Vite dev server for UI preview
npm run build  # Production build to dist/
```

## Features

- **7-step pipeline**: Script → Analysis → Bible → Characters → Locations → Storyboards → Seedance
- **AI providers**: Mock (demo), OpenRouter, OpenAI, Ollama (local)
- **Copy-first UX**: Copy any section, copy all, download .md / .json
- **Dark theme**: Clean, compact, production-ready UI
- **Side Panel**: Opens as Chrome side panel via extension icon
- **Persistence**: Saves last script, settings, and output via chrome.storage.local

## Architecture

```
src/
├── ai/           — Provider abstraction (Mock, OpenRouter, OpenAI, Ollama)
├── background/   — Service worker (Manifest V3)
├── components/   — React UI components
├── export/       — Markdown & JSON export
├── pipeline/     — 7-step prompt pipeline
├── sidepanel/    — Side panel entry (App, HTML, CSS)
├── storage/      — chrome.storage.local wrapper
└── types/        — TypeScript interfaces
```

## Mock Mode

By default, the extension runs in **Mock** mode with pre-built demo data (sci-fi script "The Last Signal"). No API key needed. Click ⚙ to switch to OpenRouter/OpenAI/Ollama.