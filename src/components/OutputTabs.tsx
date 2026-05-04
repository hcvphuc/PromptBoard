import React from 'react';
import type { ProjectOutput } from '@/types/output';
import type { OutputTab } from '@/types/output';
import { OUTPUT_TABS } from '@/types/output';
import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport } from '@/types/pipeline';
import { CopyButton } from './CopyButton';
import { PromptCard } from './PromptCard';
import { SendToChatGPTButton } from './SendToChatGPTButton';
import { ProductionBibleView } from './ProductionBibleView';
import { exportMarkdown } from '@/export/markdown';
import { exportJSON } from '@/export/json';

interface OutputTabsProps {
  output: ProjectOutput;
  onRegenerateTab?: (tab: OutputTab) => void;
}

export function OutputTabs({ output, onRegenerateTab }: OutputTabsProps) {
  const [activeTab, setActiveTab] = React.useState<OutputTab>('analysis');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border bg-panel -mx-1 px-1">
        {OUTPUT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-primary'
                : 'border-transparent text-secondary hover:text-primary hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'analysis' && <AnalysisTab data={output.analysis} />}
        {activeTab === 'bible' && <ProductionBibleView bible={output.bible} />}
        {activeTab === 'characters' && <CharactersTab data={output.characters} />}
        {activeTab === 'locations' && <LocationsTab data={output.locations} />}
        {activeTab === 'storyboards' && <StoryboardsTab data={output.storyboards} />}
        {activeTab === 'seedance' && <SeedanceTab data={output.seedance} />}
        {activeTab === 'export' && <ExportTab output={output} />}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border bg-panel p-2 flex gap-2">
        <button
          onClick={() => onRegenerateTab?.(activeTab)}
          className="px-3 py-1 text-xs rounded-btn border border-border bg-card text-secondary hover:text-primary hover:bg-border transition-colors"
        >
          ↻ Regenerate
        </button>
      </div>
    </div>
  );
}

function AnalysisTab({ data }: { data: AnalysisOutput }) {
  const fullText = JSON.stringify(data, null, 2);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CopyButton text={fullText} label="Copy All" />
      </div>
      {[
        ['Title', data.title],
        ['Genre', data.genre],
        ['Summary', data.summary],
        ['Emotional Arc', data.emotional_arc],
        ['Characters', data.main_characters.join(', ')],
        ['Locations', data.main_locations.join(', ')],
        ['Key Props', data.key_props.join(', ')],
        ['Duration', `${data.estimated_duration_seconds}s`],
        ['Suggested Boards', String(data.suggested_boards)],
      ].map(([label, value]) => (
        <div key={label} className="bg-card border border-border rounded-btn p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-primary">{label}</h4>
            <CopyButton text={value} />
          </div>
          <p className="text-xs text-secondary mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}

function CharactersTab({ data }: { data: CharacterPrompt[] }) {
  const allText = data.map(c => c.prompt).join('\n\n---\n\n');
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {data.map((c, i) => (
        <PromptCard
          key={i}
          title={c.character_name}
          content={c.prompt}
          showSendToChatGPT
        />
      ))}
    </div>
  );
}

function LocationsTab({ data }: { data: LocationPrompt[] }) {
  const allText = data.map(l => l.prompt).join('\n\n---\n\n');
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {data.map((l, i) => (
        <PromptCard
          key={i}
          title={l.location_name}
          content={l.prompt}
          showSendToChatGPT
        />
      ))}
    </div>
  );
}

function StoryboardsTab({ data }: { data: StoryboardBoard[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-secondary">No storyboard data available. Try running the pipeline again.</p>
      </div>
    );
  }

  const allText = data.map(b => b.image_generation_prompt).filter(Boolean).join('\n\n---\n\n');
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} label="Send All to ChatGPT" />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {data.map((board) => (
        <div key={board.board_number} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-accent">Board {board.board_number}</h4>
            <span className="text-xs text-secondary">{board.duration}s</span>
          </div>
          <div className="bg-card border border-border rounded-btn p-3 space-y-1">
            <p className="text-xs text-secondary"><span className="text-primary/70">Beat:</span> {board.story_beat}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Characters:</span> {board.characters_used.join(', ')}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Location:</span> {board.location_used}</p>
          </div>
          {board.shots.map((shot) => (
            <div key={shot.shot_number} className="bg-card border border-border rounded-btn p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-primary">Shot {shot.shot_number}</h5>
                <CopyButton text={`${shot.shot_size} | ${shot.lens_feel} | ${shot.movement}\nAction: ${shot.action}\nEmotion: ${shot.emotion}\nAudio: ${shot.dialogue_audio}`} />
              </div>
              <p className="text-xs text-secondary"><span className="text-primary/70">Size:</span> {shot.shot_size} | <span className="text-primary/70">Lens:</span> {shot.lens_feel} | <span className="text-primary/70">Movement:</span> {shot.movement}</p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Action:</span> {shot.action}</p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Emotion:</span> {shot.emotion}</p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Audio:</span> {shot.dialogue_audio}</p>
            </div>
          ))}
          <PromptCard
            title="Image Generation Prompt"
            content={board.image_generation_prompt}
            showSendToChatGPT
          />
        </div>
      ))}
    </div>
  );
}

function SeedanceTab({ data }: { data: SeedancePromptPerBoard[] | SeedancePromptContinuous }) {
  const allText = JSON.stringify(data, null, 2);

  if (!Array.isArray(data)) {
    const s = data as SeedancePromptContinuous;
    return (
      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          <SendToChatGPTButton text={allText} />
          <CopyButton text={allText} label="Copy All" />
        </div>
        <div className="bg-accent/10 border border-accent/30 rounded-btn p-3">
          <h4 className="text-xs font-semibold text-accent mb-2">Continuous Scene — {s.total_duration}s</h4>
        </div>
        <PromptCard title="Scene Description" content={s.scene_description} />
        <PromptCard title="Action Timeline" content={s.action_timeline} />
        <PromptCard title="Camera Movement" content={s.camera_movement} />
        <PromptCard title="Motion" content={s.motion} />
        <PromptCard title="Negative Prompt" content={s.negative_prompt} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {(data as SeedancePromptPerBoard[]).map((s) => (
        <div key={s.board_number} className="space-y-2">
          <h4 className="text-xs font-semibold text-accent">Board {s.board_number} — {s.duration}s</h4>
          <PromptCard title="Scene Setup" content={s.scene_setup} />
          <PromptCard title="Action Timeline" content={s.action_timeline} />
          <PromptCard title="Camera Movement" content={s.camera_movement} />
          <PromptCard title="Motion" content={s.motion} />
          <PromptCard title="Negative Prompt" content={s.negative_prompt} />
        </div>
      ))}
    </div>
  );
}

function ExportTab({ output }: { output: ProjectOutput }) {
  const md = exportMarkdown(output);
  const json = exportJSON(output);

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">Export</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-btn p-3 space-y-2">
          <h5 className="text-xs font-semibold text-primary">Markdown</h5>
          <div className="flex gap-2">
            <CopyButton text={md} label="Copy" />
            <button
              onClick={() => download(md, 'promptboard-output.md', 'text/markdown')}
              className="px-3 py-1 text-xs rounded-btn border border-border bg-card hover:bg-border text-secondary hover:text-primary transition-colors"
            >
              Download .md
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-btn p-3 space-y-2">
          <h5 className="text-xs font-semibold text-primary">JSON</h5>
          <div className="flex gap-2">
            <CopyButton text={json} label="Copy" />
            <button
              onClick={() => download(json, 'promptboard-output.json', 'application/json')}
              className="px-3 py-1 text-xs rounded-btn border border-border bg-card hover:bg-border text-secondary hover:text-primary transition-colors"
            >
              Download .json
            </button>
          </div>
        </div>
      </div>

      {/* Consistency report */}
      <div className="bg-card border border-border rounded-btn p-3 space-y-2">
        <h4 className="text-xs font-semibold text-primary">Consistency Report</h4>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${output.consistency.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {output.consistency.passed ? '✅ Passed' : '❌ Issues Found'}
        </div>
        {output.consistency.issues.length > 0 && (
          <ul className="space-y-1 mt-2">
            {output.consistency.issues.map((issue, i) => (
              <li key={i} className="text-xs text-secondary">
                <span className="text-accent">[{issue.category}]</span> {issue.description}
                <span className="text-primary/50"> → {issue.suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}