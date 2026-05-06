// PromptBoard AI — Central Logger
// Collects logs from all extension components for the Logs tab

import type { LogEntry } from '@/types/pipeline';

type LogLevel = LogEntry['level'];

const MAX_LOGS = 500;

let listeners: Array<(entries: LogEntry[]) => void> = [];
let entries: LogEntry[] = [];

function addEntry(level: LogLevel, source: string, message: string, detail?: string): void {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    level,
    source,
    message,
    detail,
  };

  entries.push(entry);

  // Trim old entries
  if (entries.length > MAX_LOGS) {
    entries = entries.slice(-MAX_LOGS);
  }

  // Notify listeners
  for (const listener of listeners) {
    try {
      listener([...entries]);
    } catch {
      // ignore listener errors
    }
  }
}

export const logger = {
  debug(source: string, message: string, detail?: string) {
    addEntry('debug', source, message, detail);
  },
  info(source: string, message: string, detail?: string) {
    addEntry('info', source, message, detail);
  },
  warn(source: string, message: string, detail?: string) {
    addEntry('warn', source, message, detail);
  },
  error(source: string, message: string, detail?: string) {
    addEntry('error', source, message, detail);
  },

  /** Get all log entries */
  getEntries(): LogEntry[] {
    return [...entries];
  },

  /** Clear all log entries */
  clear() {
    entries = [];
    for (const listener of listeners) {
      try { listener([]); } catch { /* ignore */ }
    }
  },

  /** Subscribe to log updates. Returns unsubscribe function. */
  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    listeners.push(listener);
    // Immediately call with current entries
    try { listener([...entries]); } catch { /* ignore */ }
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  /** Format all logs as plain text for copying */
  formatAsText(): string {
    return entries.map(e => {
      const time = new Date(e.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const prefix = `[${time}] [${e.level.toUpperCase()}] [${e.source}]`;
      if (e.detail) {
        return `${prefix} ${e.message}\n${e.detail}`;
      }
      return `${prefix} ${e.message}`;
    }).join('\n');
  },
};

// Also log to console for DevTools debugging
const originalAddEntry = addEntry;
// We already call addEntry above; now add console mirroring
const _origDebug = logger.debug;
const _origInfo = logger.info;
const _origWarn = logger.warn;
const _origError = logger.error;

// Override to also console.log
logger.debug = (source: string, message: string, detail?: string) => {
  _origDebug(source, message, detail);
  console.debug(`[PromptBoard] [${source}] ${message}`, detail || '');
};
logger.info = (source: string, message: string, detail?: string) => {
  _origInfo(source, message, detail);
  console.info(`[PromptBoard] [${source}] ${message}`, detail || '');
};
logger.warn = (source: string, message: string, detail?: string) => {
  _origWarn(source, message, detail);
  console.warn(`[PromptBoard] [${source}] ${message}`, detail || '');
};
logger.error = (source: string, message: string, detail?: string) => {
  _origError(source, message, detail);
  console.error(`[PromptBoard] [${source}] ${message}`, detail || '');
};