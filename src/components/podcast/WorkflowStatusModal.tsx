import React from 'react';
import type { PodcastProgress } from '@/domain/podcast/pipeline';

type ModalMode = 'loading' | 'success';

interface WorkflowStatusModalProps {
  open: boolean;
  mode: ModalMode;
  title: string;
  detail: string;
  processingLabel?: string;
  cancelLabel?: string;
  progress?: PodcastProgress | null;
  onCancel?: () => void;
}

export function WorkflowStatusModal({ open, mode, title, detail, processingLabel = 'Processing', cancelLabel = 'Cancel', progress, onCancel }: WorkflowStatusModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-md">
      <div className="w-full max-w-[320px] rounded-[28px] border border-border bg-panel p-5 text-center shadow-2xl shadow-black/60">
        <div className="mx-auto h-36 w-36">
          {mode === 'loading' ? <AnalyzingRings /> : <DoneCheck />}
        </div>

        <div className="mt-3 text-base font-bold">{title}</div>
        <div className="mt-1 text-xs text-secondary">{progress?.label || detail}</div>

        {mode === 'loading' && progress && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-secondary">
              <span>{processingLabel}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress.percentage}%` }} />
            </div>
          </div>
        )}

        {mode === 'loading' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 rounded-full border border-danger/40 bg-danger/10 px-5 py-2 text-xs font-semibold text-danger hover:border-danger"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function AnalyzingRings() {
  return (
    <div className="relative h-full w-full">
      <span className="analyze-ring analyze-ring-outer" />
      <span className="analyze-ring analyze-ring-mid" />
      <span className="analyze-ring analyze-ring-inner" />
      <span className="analyze-core" />
    </div>
  );
}

function DoneCheck() {
  return (
    <svg className="done-check" viewBox="0 0 160 160" role="img" aria-label="Analysis done">
      <circle className="done-check-ring" cx="80" cy="80" r="58" />
      <path className="done-check-mark" d="M48 82 L70 104 L114 56" />
    </svg>
  );
}
