import React from 'react';
import { CopyButton } from './CopyButton';
import { SendToChatGPTButton } from './SendToChatGPTButton';

interface PromptCardProps {
  title: string;
  content: string;
  label?: string;
  showSendToChatGPT?: boolean;
  editable?: boolean;
  onEdit?: (newContent: string) => void;
}

export function PromptCard({ title, content, label, showSendToChatGPT, editable, onEdit }: PromptCardProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(content);

  // Sync draft when content changes externally (e.g., regeneration)
  React.useEffect(() => {
    if (!editing) {
      setDraft(content);
    }
  }, [content, editing]);

  const handleSave = () => {
    if (draft.trim() !== content.trim()) {
      onEdit?.(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(content);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="bg-card border border-border rounded-btn p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-primary">{title}</h4>
        <div className="flex gap-1.5 items-center">
          {editable && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded hover:bg-border text-secondary hover:text-accent transition-colors"
              title="Edit prompt"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {showSendToChatGPT && !editing && <SendToChatGPTButton text={content} />}
          {!editing && <CopyButton text={content} label={label || 'Copy'} />}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-bg border border-accent/50 rounded-btn p-2 text-xs text-primary leading-relaxed resize-y min-h-[80px] focus:outline-none focus:border-accent"
            autoFocus
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs rounded-btn bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
            >
              ✅ Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs rounded-btn border border-border bg-card text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <span className="text-xs text-secondary ml-auto">Ctrl+Enter to save • Esc to cancel</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      )}
    </div>
  );
}