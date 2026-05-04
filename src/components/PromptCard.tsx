import React from 'react';
import { CopyButton } from './CopyButton';
import { SendToChatGPTButton } from './SendToChatGPTButton';

interface PromptCardProps {
  title: string;
  content: string;
  label?: string;
  showSendToChatGPT?: boolean;
}

export function PromptCard({ title, content, label, showSendToChatGPT }: PromptCardProps) {
  return (
    <div className="bg-card border border-border rounded-btn p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-primary">{title}</h4>
        <div className="flex gap-1.5">
          {showSendToChatGPT && <SendToChatGPTButton text={content} />}
          <CopyButton text={content} label={label || 'Copy'} />
        </div>
      </div>
      <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </p>
    </div>
  );
}