import React from 'react';
import type { PodcastProgress } from '@/domain/podcast/pipeline';
import type { UiLanguage } from '@/components/podcast/guide/GuideDrawer';

interface ProgressPanelProps {
  progress: PodcastProgress | null;
  transcribing: boolean;
  language: UiLanguage;
}

const copy = {
  en: {
    transcribing: 'Transcribing voice-over with Groq Whisper...',
    sync: 'sync',
  },
  vi: {
    transcribing: 'Đang transcribe voice-over bằng Groq Whisper...',
    sync: 'sync',
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export function ProgressPanel({ progress, transcribing, language }: ProgressPanelProps) {
  if (!progress) return null;
  const t = copy[language];

  return (
    <section className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-secondary">{transcribing ? t.transcribing : progress.label}</span>
        <span>{transcribing ? t.sync : `${progress.percentage}%`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${progress.percentage}%` }} />
      </div>
    </section>
  );
}
