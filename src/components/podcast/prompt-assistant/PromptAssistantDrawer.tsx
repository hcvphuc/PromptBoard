import React from 'react';
import type { PodcastProject, PodcastPromptRule, PromptRuleScope } from '@/domain/podcast/model';
import type { PromptRuleDraft } from '@/application/podcast/promptRules';

interface PromptAssistantDrawerProps {
  open: boolean;
  project: PodcastProject;
  onClose: () => void;
  onPreview: (request: string) => Promise<PromptRuleDraft>;
  onApply: (draft: PromptRuleDraft) => Promise<void>;
  onUpdateRule: (rule: PodcastPromptRule) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

const scopeLabels: Record<PromptRuleScope, string> = {
  all: 'All',
  deck: 'Deck template',
  opening_still: 'Opening still',
  slides: 'Content slides',
};

export function PromptAssistantDrawer({
  open,
  project,
  onClose,
  onPreview,
  onApply,
  onUpdateRule,
  onDeleteRule,
}: PromptAssistantDrawerProps) {
  const [request, setRequest] = React.useState('');
  const [preview, setPreview] = React.useState<PromptRuleDraft | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  const askAssistant = async () => {
    if (!request.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const next = await onPreview(request);
      setPreview(next);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Prompt assistant failed');
    } finally {
      setBusy(false);
    }
  };

  const applyPreview = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      await onApply(preview);
      setPreview(null);
      setRequest('');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Could not apply rule');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50">
      <aside className="ml-auto flex h-full w-full max-w-[390px] flex-col border-l border-border bg-bg shadow-2xl shadow-black/50">
        <header className="border-b border-border bg-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold">Prompt Assistant</div>
              <p className="mt-1 text-xs text-secondary">Chat to create prompt rules. Preview before applying.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-accent/70">Close</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-xs text-danger">{error}</div>}

          <section className="rounded-[20px] border border-border bg-panel p-3 space-y-3">
            <label className="text-xs font-semibold text-secondary">Tell assistant what to change</label>
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="VD: Slide chỉ hiện tên nhân vật, không thêm chữ Podcast."
              className="min-h-24 w-full resize-y rounded-btn border border-border bg-card p-3 text-sm text-primary placeholder:text-secondary focus:border-accent"
            />
            <button
              type="button"
              onClick={() => { void askAssistant(); }}
              disabled={busy || !request.trim()}
              className="w-full rounded-full bg-accent py-2 text-xs font-bold text-black disabled:bg-card disabled:text-secondary disabled:border disabled:border-border"
            >
              {busy ? 'Thinking...' : 'Ask Assistant'}
            </button>
          </section>

          {preview && (
            <section className="rounded-[20px] border border-accent/50 bg-accent/10 p-3 space-y-3">
              <div className="text-xs font-bold text-accent">Rule Preview</div>
              <label className="space-y-1 block">
                <span className="text-[11px] text-secondary">Summary</span>
                <input
                  value={preview.summary}
                  disabled={!editing}
                  onChange={(event) => setPreview({ ...preview, summary: event.target.value })}
                  className="w-full rounded-[12px] border border-border bg-card px-2 py-2 text-xs text-primary disabled:opacity-80"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] text-secondary">Scope</span>
                <select
                  value={preview.scope}
                  disabled={!editing}
                  onChange={(event) => setPreview({ ...preview, scope: event.target.value as PromptRuleScope })}
                  className="w-full rounded-[12px] border border-border bg-card px-2 py-2 text-xs text-primary disabled:opacity-80"
                >
                  {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] text-secondary">Prompt override</span>
                <textarea
                  value={preview.promptOverride}
                  disabled={!editing}
                  onChange={(event) => setPreview({ ...preview, promptOverride: event.target.value })}
                  className="min-h-24 w-full resize-y rounded-[12px] border border-border bg-card px-2 py-2 text-xs text-primary disabled:opacity-80"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold">
                  {editing ? 'Preview' : 'Edit'}
                </button>
                <button type="button" onClick={() => setPreview(null)} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold">
                  Discard
                </button>
                <button type="button" onClick={() => { void applyPreview(); }} disabled={busy} className="rounded-full bg-accent px-3 py-2 text-xs font-bold text-black disabled:bg-card disabled:text-secondary">
                  Apply
                </button>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <div className="text-xs font-bold">Active Prompt Rules</div>
            {project.promptRules.length === 0 && (
              <div className="rounded-btn border border-border bg-card p-3 text-xs text-secondary">No custom rules yet.</div>
            )}
            {project.promptRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onUpdate={onUpdateRule}
                onDelete={onDeleteRule}
              />
            ))}
          </section>
        </div>
      </aside>
    </div>
  );
}

function RuleCard({
  rule,
  onUpdate,
  onDelete,
}: {
  rule: PodcastPromptRule;
  onUpdate: (rule: PodcastPromptRule) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(rule);

  React.useEffect(() => {
    setDraft(rule);
  }, [rule]);

  return (
    <article className="rounded-[18px] border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold">{rule.summary}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-accent">{scopeLabels[rule.scope]}</div>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-secondary">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(event) => { void onUpdate({ ...rule, enabled: event.target.checked }); }}
          />
          On
        </label>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} className="w-full rounded-[12px] border border-border bg-bg px-2 py-2 text-xs" />
          <select value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value as PromptRuleScope })} className="w-full rounded-[12px] border border-border bg-bg px-2 py-2 text-xs">
            {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <textarea value={draft.promptOverride} onChange={(event) => setDraft({ ...draft, promptOverride: event.target.value })} className="min-h-20 w-full resize-y rounded-[12px] border border-border bg-bg px-2 py-2 text-xs" />
        </div>
      ) : (
        <p className="text-xs leading-5 text-secondary">{rule.promptOverride}</p>
      )}

      <div className="flex gap-2">
        {editing ? (
          <button type="button" onClick={() => { void onUpdate(draft); setEditing(false); }} className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-black">Save</button>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">Edit</button>
        )}
        <button type="button" onClick={() => { void onDelete(rule.id); }} className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">Delete</button>
      </div>
    </article>
  );
}
