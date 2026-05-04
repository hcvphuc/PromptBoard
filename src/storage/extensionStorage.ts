import type { AIProviderConfig } from '@/ai/provider';
import type { PipelineSettings } from '@/types/project';
import { DEFAULT_SETTINGS } from '@/types/project';

const STORAGE_KEYS = {
  apiKey: 'apiKey',
  selectedProvider: 'selectedProvider',
  defaultStyle: 'defaultStyle',
  lastScript: 'lastScript',
  lastOutput: 'lastOutput',
  recentProjects: 'recentProjects',
  settings: 'settings',
} as const;

async function get<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] !== undefined ? result[key] : fallback);
      });
    } else {
      const stored = localStorage.getItem(key);
      resolve(stored !== null ? JSON.parse(stored) : fallback);
    }
  });
}

async function set(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [key]: value }, resolve);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
      resolve();
    }
  });
}

export const extensionStorage = {
  getProviderConfig: (): Promise<AIProviderConfig> =>
    get<AIProviderConfig>(STORAGE_KEYS.selectedProvider, {
      provider: 'mock',
    }),

  setProviderConfig: (config: AIProviderConfig): Promise<void> =>
    set(STORAGE_KEYS.selectedProvider, config),

  getApiKey: (): Promise<string> => get<string>(STORAGE_KEYS.apiKey, ''),

  setApiKey: (key: string): Promise<void> => set(STORAGE_KEYS.apiKey, key),

  getSettings: (): Promise<PipelineSettings> =>
    get<PipelineSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),

  setSettings: (s: PipelineSettings): Promise<void> =>
    set(STORAGE_KEYS.settings, s),

  getLastScript: (): Promise<string> => get<string>(STORAGE_KEYS.lastScript, ''),

  setLastScript: (script: string): Promise<void> =>
    set(STORAGE_KEYS.lastScript, script),

  getLastOutput: (): Promise<unknown> => get(STORAGE_KEYS.lastOutput, null),

  setLastOutput: (output: unknown): Promise<void> =>
    set(STORAGE_KEYS.lastOutput, output),

  getRecentProjects: (): Promise<unknown[]> => get(STORAGE_KEYS.recentProjects, []),

  setRecentProjects: (projects: unknown[]): Promise<void> =>
    set(STORAGE_KEYS.recentProjects, projects),
};