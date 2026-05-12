import React from 'react';

interface EmptyStateProps {
  title: string;
  detail: string;
}

export function EmptyState({ title, detail }: EmptyStateProps) {
  return (
    <section className="rounded-btn border border-border bg-panel p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-xs text-secondary mt-2">{detail}</p>
    </section>
  );
}
