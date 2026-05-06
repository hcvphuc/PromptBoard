import type { PipelineSettings } from '@/types/project';
import type { ProjectOutput } from '@/types/output';
import type { AIProviderConfig } from '@/ai/provider';
import type { ReferenceImage, BoardImage, ShotImage } from '@/types/pipeline';

export interface ProjectFile {
  version: number;
  savedAt: number;
  project: {
    id: string;
    title: string;
    script: string;
    settings: PipelineSettings;
    output: ProjectOutput | null;
    providerConfig: AIProviderConfig;
    refImages: ReferenceImage[];
    boardImages: BoardImage[];
    shotImages: ShotImage[];
    createdAt: number;
    updatedAt: number;
  };
}

export interface ProjectMeta {
  id: string;
  title: string;
  savedAt: number;
  scriptPreview: string; // first 100 chars of script
}

const PROJECT_VERSION = 1;

/** Serialize current state into a ProjectFile */
export function serializeProject(data: {
  script: string;
  settings: PipelineSettings;
  output: ProjectOutput | null;
  providerConfig: AIProviderConfig;
  refImages: ReferenceImage[];
  boardImages: BoardImage[];
  shotImages: ShotImage[];
}): ProjectFile {
  const now = Date.now();
  const title = data.output?.analysis?.title || data.script.slice(0, 60).replace(/\n/g, ' ').trim();

  return {
    version: PROJECT_VERSION,
    savedAt: now,
    project: {
      id: crypto.randomUUID?.() || `p_${now}`,
      title,
      script: data.script,
      settings: data.settings,
      output: data.output,
      providerConfig: data.providerConfig,
      refImages: data.refImages,
      boardImages: data.boardImages,
      shotImages: data.shotImages,
      createdAt: now,
      updatedAt: now,
    },
  };
}

/** Deserialize a ProjectFile (validates version) */
export function deserializeProject(raw: unknown): ProjectFile {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid project file');
  const pf = raw as ProjectFile;
  if (pf.version !== PROJECT_VERSION) {
    throw new Error(`Unsupported project version: ${pf.version} (expected ${PROJECT_VERSION})`);
  }
  if (!pf.project) throw new Error('Missing project data');
  return pf;
}

/** Save project as JSON file download */
export function saveProjectToFile(data: Parameters<typeof serializeProject>[0]): void {
  const pf = serializeProject(data);
  const json = JSON.stringify(pf, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = pf.project.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  a.download = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.promptboard.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Read project from a File (file picker result) */
export function readProjectFromFile(file: File): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string);
        resolve(deserializeProject(raw));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Extract metadata from project file for recent projects list */
export function getProjectMeta(pf: ProjectFile): ProjectMeta {
  return {
    id: pf.project.id,
    title: pf.project.title,
    savedAt: pf.savedAt,
    scriptPreview: pf.project.script.slice(0, 100).replace(/\n/g, ' ').trim(),
  };
}

const RECENT_PROJECTS_KEY = 'recentProjects';
const MAX_RECENT = 10;

/** Save project metadata to chrome.storage for "recent projects" list */
export async function saveRecentProject(meta: ProjectMeta, projectData: ProjectFile): Promise<void> {
  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;
  if (storage) {
    await new Promise<void>(resolve => storage.set({ [`project_${meta.id}`]: projectData }, resolve));
  } else {
    localStorage.setItem(`project_${meta.id}`, JSON.stringify(projectData));
  }

  // Update recent list
  const recents: ProjectMeta[] = await getRecentProjects();
  const filtered = recents.filter(r => r.id !== meta.id);
  filtered.unshift(meta);
  if (filtered.length > MAX_RECENT) filtered.length = MAX_RECENT;

  if (storage) {
    await new Promise<void>(resolve => storage.set({ [RECENT_PROJECTS_KEY]: filtered }, resolve));
  } else {
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
  }
}

/** Get recent projects metadata list */
export async function getRecentProjects(): Promise<ProjectMeta[]> {
  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;
  if (storage) {
    return new Promise(resolve => {
      storage.get(RECENT_PROJECTS_KEY, (result) => {
        resolve(Array.isArray(result[RECENT_PROJECTS_KEY]) ? result[RECENT_PROJECTS_KEY] : []);
      });
    });
  }
  const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Load a stored project by id */
export async function loadStoredProject(id: string): Promise<ProjectFile | null> {
  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;
  const key = `project_${id}`;
  if (storage) {
    return new Promise(resolve => {
      storage.get(key, (result) => {
        resolve(result[key] || null);
      });
    });
  }
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

/** Delete a stored project */
export async function deleteStoredProject(id: string): Promise<void> {
  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;
  const key = `project_${id}`;
  if (storage) {
    await new Promise<void>(resolve => storage.remove(key, resolve));
  } else {
    localStorage.removeItem(key);
  }

  // Remove from recent list
  const recents = await getRecentProjects();
  const filtered = recents.filter(r => r.id !== id);
  if (storage) {
    await new Promise<void>(resolve => storage.set({ [RECENT_PROJECTS_KEY]: filtered }, resolve));
  } else {
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
  }
}