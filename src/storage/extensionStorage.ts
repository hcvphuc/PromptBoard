import { DEFAULT_PROVIDER_SELECTION } from '@/ai/provider';
import type { ProviderSelection } from '@/ai/provider';
import type { PodcastProject } from '@/domain/podcast/model';
import { createEmptyPodcastProject } from '@/domain/podcast/model';

const STORAGE_KEYS = {
  project: 'podcastProject',
} as const;

async function get<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] !== undefined ? result[key] : fallback);
      });
      return;
    }

    const stored = localStorage.getItem(key);
    resolve(stored !== null ? JSON.parse(stored) : fallback);
  });
}

async function set(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [key]: value }, resolve);
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
    resolve();
  });
}

async function remove(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(key, resolve);
      return;
    }

    localStorage.removeItem(key);
    resolve();
  });
}

function normalizeProject(raw: PodcastProject | null): PodcastProject {
  if (!raw) return createEmptyPodcastProject(DEFAULT_PROVIDER_SELECTION);
  return {
    ...createEmptyPodcastProject(DEFAULT_PROVIDER_SELECTION),
    ...raw,
    inputs: {
      ...raw.inputs,
    },
    providers: {
      ...DEFAULT_PROVIDER_SELECTION,
      ...raw.providers,
      analysis: {
        ...DEFAULT_PROVIDER_SELECTION.analysis,
        ...raw.providers?.analysis,
      },
      transcript: {
        ...DEFAULT_PROVIDER_SELECTION.transcript,
        ...raw.providers?.transcript,
      },
      image: {
        ...DEFAULT_PROVIDER_SELECTION.image,
        ...raw.providers?.image,
      },
    },
    assets: {
      deckTemplate: raw.assets?.deckTemplate,
      openingStill: raw.assets?.openingStill,
      slides: raw.assets?.slides || [],
    },
    generation: {
      status: raw.generation?.status || 'idle',
    },
    promptRules: raw.promptRules || [],
    exports: {
      timestamps: raw.exports?.timestamps || [],
      transcriptSrt: raw.exports?.transcriptSrt,
    },
  };
}

export const extensionStorage = {
  async getProject(): Promise<PodcastProject> {
    const project = await get<PodcastProject | null>(STORAGE_KEYS.project, null);
    return normalizeProject(project);
  },

  async saveProject(project: PodcastProject): Promise<void> {
    await set(STORAGE_KEYS.project, {
      ...project,
      updatedAt: Date.now(),
    });
  },

  async resetProject(providers: ProviderSelection = DEFAULT_PROVIDER_SELECTION): Promise<PodcastProject> {
    await remove(STORAGE_KEYS.project);
    const next = createEmptyPodcastProject(providers);
    await set(STORAGE_KEYS.project, next);
    return next;
  },
};
