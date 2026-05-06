import React from 'react';
import type { LogEntry } from '@/types/pipeline';
import { logger } from '@/logger/logger';
import { CopyButton } from './CopyButton';

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  debug: 'text-gray-500',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const LEVEL_BG: Record<LogEntry['level'], string> = {
  debug: 'bg-gray-500/10',
  info: 'bg-blue-500/10',
  warn: 'bg-yellow-500/10',
  error: 'bg-red-500/10',
};

const LEVEL_BADGE: Record<LogEntry['level'], string> = {
  debug: 'bg-gray-600 text-gray-300',
  info: 'bg-blue-600 text-blue-100',
  warn: 'bg-yellow-600 text-yellow-100',
  error: 'bg-red-600 text-red-100',
};

export function LogsTab() {
  const [entries, setEntries] = React.useState<LogEntry[]>(logger.getEntries());
  const [filter, setFilter] = React.useState<LogEntry['level'] | 'all'>('all');
  const [autoScroll, setAutoScroll] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsubscribe = logger.subscribe((updated) => {
      setEntries(updated);
    });
    return unsubscribe;
  }, []);

  // Auto-scroll to bottom on new entries
  React.useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll]);

  const filteredEntries = React.useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter(e => e.level === filter);
  }, [entries, filter]);

  const counts = React.useMemo(() => ({
    debug: entries.filter(e => e.level === 'debug').length,
    info: entries.filter(e => e.level === 'info').length,
    warn: entries.filter(e => e.level === 'warn').length,
    error: entries.filter(e => e.level === 'error').length,
    total: entries.length,
  }), [entries]);

  const handleClear = () => {
    logger.clear();
  };

  return (
    <div className="flex flex-col h-full -m-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-panel">
        <span className="text-xs font-semibold text-primary">Logs</span>
        <span className="text-xs text-secondary">({counts.total})</span>
        <div className="flex-1" />

        {/* Filter buttons */}
        <div className="flex gap-1">
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                filter === level
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-secondary hover:text-primary'
              }`}
            >
              {level === 'all'
                ? 'All'
                : level === 'info'
                ? `ℹ ${counts.info}`
                : level === 'warn'
                ? `⚠ ${counts.warn}`
                : `✕ ${counts.error}`}
            </button>
          ))}
        </div>

        <CopyButton text={logger.formatAsText()} label="Copy All" />
        <button
          onClick={handleClear}
          className="px-2 py-0.5 text-xs rounded-btn border border-border bg-card text-secondary hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs"
      >
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-secondary text-xs">No logs yet. Run a pipeline to see activity.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`flex gap-2 px-2 py-1 rounded-sm hover:bg-card/50 ${LEVEL_BG[entry.level]}`}
            >
              <span className="text-secondary/60 flex-shrink-0 w-[70px]">
                {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={`flex-shrink-0 px-1.5 py-0 rounded text-[10px] font-semibold uppercase ${LEVEL_BADGE[entry.level]}`}>
                {entry.level}
              </span>
              <span className="text-accent/70 flex-shrink-0">[{entry.source}]</span>
              <span className={`${LEVEL_COLORS[entry.level]} break-all`}>
                {entry.message}
                {entry.detail && (
                  <span className="text-secondary/50 block ml-4 whitespace-pre-wrap">{entry.detail}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-panel text-xs text-secondary">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-3 h-3"
          />
          Auto-scroll
        </label>
        <span>{filteredEntries.length} of {counts.total} entries</span>
      </div>
    </div>
  );
}