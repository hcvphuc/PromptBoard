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
  boardDuration: number; // max seconds per board
  seedanceMode: SeedanceMode;
}

export type StylePreset = 'cinematic' | 'wes-anderson' | 'anime' | 'documentary';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type OutputLanguage = 'english' | 'vietnamese' | 'bilingual';
export type SeedanceMode = 'per-board' | 'continuous-scene';

export const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'wes-anderson', label: 'Wes Anderson' },
  { value: 'anime', label: 'Anime' },
  { value: 'documentary', label: 'Documentary' },
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

export const DEFAULT_SETTINGS: PipelineSettings = {
  stylePreset: 'cinematic',
  aspectRatio: '16:9',
  language: 'english',
  boardDuration: 15,
  seedanceMode: 'per-board',
};