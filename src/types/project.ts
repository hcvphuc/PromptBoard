import type { ProjectOutput } from './output';

export interface Project {
  id: string;
  title: string;
  script: string;
  settings: PipelineSettings;
  output: ProjectOutput | null;
  createdAt: number;
  updatedAt: number;
}

export interface PipelineSettings {
  stylePreset: StylePreset;
  aspectRatio: AspectRatio;
  language: OutputLanguage;
  boardDuration: number; // max seconds per board (video duration for Seedance)
  seedanceMode: SeedanceMode;
  sendDelayMin: number; // min seconds between ChatGPT sends
  sendDelayMax: number; // max seconds between ChatGPT sends
  mode: PipelineMode;
}

export type StylePreset = 'cinematic' | 'realistic' | '3d-animation' | '2d-anime';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type OutputLanguage = 'english' | 'vietnamese' | 'bilingual';
export type SeedanceMode = 'per-board' | 'continuous-scene';
export type PipelineMode = 'simple' | 'audio-driven';

export interface StyleDictionary {
  positive: string;
  negative: string;
}

export const STYLE_DICTIONARY: Record<StylePreset, StyleDictionary> = {
  'cinematic': {
    positive: 'cinematic drama, anamorphic lens, muted teal/orange palette, shallow depth of field, natural lighting, film grain texture',
    negative: 'NOT sitcom, NOT vintage, NOT retro, NOT flat TV lighting, NOT cartoon, NOT 1970s',
  },
  'realistic': {
    positive: 'photorealistic, natural lighting, true-to-life colors, sharp focus, documentary quality',
    negative: 'NOT stylized, NOT cartoon, NOT painting, NOT illustration, NOT exaggerated',
  },
  '3d-animation': {
    positive: '3D rendered animation, Pixar-quality, volumetric lighting, rich textures, subsurface scattering',
    negative: 'NOT photorealistic, NOT live action, NOT flat 2D, NOT low-poly, NOT clay',
  },
  '2d-anime': {
    positive: '2D anime animation, clean line art, cel-shaded, vibrant flat colors, anime-inspired, hand-drawn feel',
    negative: 'NOT photorealistic, NOT 3D rendered, NOT live action, NOT gritty, NOT dark realism',
  },
};

export const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'cinematic', label: '🎬 Cinematic' },
  { value: 'realistic', label: '📷 Realistic' },
  { value: '3d-animation', label: '🧊 3D Animation' },
  { value: '2d-anime', label: '✏️ 2D Anime' },
];

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
];

export const LANGUAGES: { value: OutputLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'bilingual', label: 'Bilingual' },
];

export const SEEDANCE_MODES: { value: SeedanceMode; label: string }[] = [
  { value: 'per-board', label: 'Per Board' },
  { value: 'continuous-scene', label: 'Continuous Scene' },
];

export const PIPELINE_MODES: { value: PipelineMode; label: string; desc: string }[] = [
  { value: 'simple', label: 'Simple', desc: 'AI estimates duration and shots' },
  { value: 'audio-driven', label: 'Audio-Driven', desc: 'Import SRT + audio, shots sync to timestamps' },
];

export const DEFAULT_SETTINGS: PipelineSettings = {
  stylePreset: 'cinematic',
  aspectRatio: '16:9',
  language: 'english',
  boardDuration: 15,
  seedanceMode: 'per-board',
  sendDelayMin: 5,
  sendDelayMax: 30,
  mode: 'simple',
};