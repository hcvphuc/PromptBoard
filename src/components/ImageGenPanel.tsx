import React from 'react';
import type { ImageGenState } from '@/types/pipeline';

interface ImageGenPanelProps {
  state: ImageGenState;
  onCancel?: () => void;
  onDownloadAll?: () => void;
}

const PHASE_LABELS: Record<ImageGenState['phase'], string> = {
  'idle': 'Ready',
  'generating-characters': 'Generating character reference images...',
  'generating-locations': 'Generating location reference images...',
  'generating-boards': 'Generating storyboard images...',
  'downloading': 'Downloading images...',
  'done': '✅ All images generated!',
  'error': '❌ Error occurred',
};

export function ImageGenPanel({ state, onCancel, onDownloadAll }: ImageGenPanelProps) {
  const isRunning = !['idle', 'done', 'error'].includes(state.phase);

  return (
    <div className="bg-card border border-border rounded-btn p-3 space-y-3">
      {/* Phase label */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-primary">
          🎨 Image Generation
        </h4>
        {isRunning && onCancel && (
          <button
            onClick={onCancel}
            className="px-2 py-0.5 text-xs rounded-btn border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Cancel
          </button>
        )}
        {state.phase === 'done' && onDownloadAll && (
          <button
            onClick={onDownloadAll}
            className="px-2 py-0.5 text-xs rounded-btn border border-accent/50 text-accent hover:bg-accent/10 transition-colors"
          >
            ⬇ Download All
          </button>
        )}
      </div>

      {/* Status */}
      <p className="text-xs text-secondary">
        {PHASE_LABELS[state.phase]}
        {state.currentItem ? ` — ${state.currentItem}` : ''}
      </p>

      {/* Progress bar */}
      {(isRunning || state.phase === 'done') && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary">{state.completedSteps} / {state.totalSteps}</span>
            <span className="text-primary">{state.progress}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                state.phase === 'done' ? 'bg-green-500' : 'bg-accent'
              }`}
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reference images thumbnails */}
      {state.refImages.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-primary/70">Reference Images</h5>
          <div className="grid grid-cols-4 gap-1.5">
            {state.refImages.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.imageDataUrl}
                  alt={img.name}
                  className="w-full aspect-square object-cover rounded border border-border"
                  title={`${img.type}: ${img.name}`}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-bg/80 text-[9px] text-primary px-1 py-0.5 truncate">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board images thumbnails */}
      {state.boardImages.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-primary/70">Board Images</h5>
          <div className="grid grid-cols-3 gap-1.5">
            {state.boardImages.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.imageDataUrl}
                  alt={`Board ${img.boardNumber}`}
                  className="w-full aspect-video object-cover rounded border border-border"
                  title={`Board ${img.boardNumber}`}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-bg/80 text-[9px] text-primary px-1 py-0.5 truncate">
                  Board {img.boardNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-red-400">Errors</h5>
          {state.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400/80">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}