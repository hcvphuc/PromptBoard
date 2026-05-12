type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  detail?: string;
}

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
  if (entries.length > MAX_LOGS) {
    entries = entries.slice(-MAX_LOGS);
  }

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
    console.debug(`[PodcastBoard] [${source}] ${message}`, detail || '');
  },
  info(source: string, message: string, detail?: string) {
    addEntry('info', source, message, detail);
    console.info(`[PodcastBoard] [${source}] ${message}`, detail || '');
  },
  warn(source: string, message: string, detail?: string) {
    addEntry('warn', source, message, detail);
    console.warn(`[PodcastBoard] [${source}] ${message}`, detail || '');
  },
  error(source: string, message: string, detail?: string) {
    addEntry('error', source, message, detail);
    console.error(`[PodcastBoard] [${source}] ${message}`, detail || '');
  },
  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    listeners.push(listener);
    listener([...entries]);
    return () => {
      listeners = listeners.filter((entry) => entry !== listener);
    };
  },
  clear() {
    entries = [];
  },
};
