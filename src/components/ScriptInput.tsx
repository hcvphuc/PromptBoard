import React from 'react';

interface ScriptInputProps {
  script: string;
  onChange: (script: string) => void;
  disabled?: boolean;
}

export function ScriptInput({ script, onChange, disabled }: ScriptInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
        Script Input
      </label>
      <textarea
        value={script}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your video script here..."
        className="w-full h-32 bg-card border border-border rounded-btn px-3 py-2 text-primary text-xs resize-y placeholder:text-secondary/50 disabled:opacity-50 focus:border-accent/50"
      />
    </div>
  );
}