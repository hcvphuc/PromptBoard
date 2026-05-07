import React from 'react';
import type { ProjectOutput } from '@/types/output';
import type { OutputTab } from '@/types/output';
import { OUTPUT_TABS } from '@/types/output';
import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport, ReferenceImage, BoardImage, ShotImage, StoryboardShot } from '@/types/pipeline';
import { CopyButton } from './CopyButton';
import { PromptCard } from './PromptCard';
import { SendToChatGPTButton } from './SendToChatGPTButton';
import { ProductionBibleView } from './ProductionBibleView';
import { LogsTab } from './LogsTab';
import { ImageDropZone } from './ImageDropZone';
import { exportMarkdown } from '@/export/markdown';
import { exportJSON } from '@/export/json';

/** Edit action types — identifies which prompt field was edited */
export type PromptEditAction =
  | { type: 'character-prompt'; index: number; value: string }
  | { type: 'location-prompt'; index: number; value: string }
  | { type: 'storyboard-prompt'; boardNumber: number; value: string }
  | { type: 'shot-master-prompt'; boardNumber: number; shotNumber: number; value: string }
  | { type: 'seedance-board-prompt'; boardNumber: number; value: string }
  | { type: 'seedance-continuous-prompt'; value: string }
  | { type: 'seedance-continuous-negative'; value: string }
  | { type: 'seedance-board-negative'; boardNumber: number; value: string };

interface OutputTabsProps {
  output: ProjectOutput;
  onRegenerateTab?: (tab: OutputTab) => void;
  onEditPrompt?: (action: PromptEditAction) => void;
  refImages?: ReferenceImage[];
  boardImages?: BoardImage[];
  shotImages?: ShotImage[];
  onBreakdownShots?: (boardNumber: number) => void;
  onBreakdownAllShots?: () => void;
  onExtractShots?: () => void;
  shotBreakdownRunning?: boolean;
  extractingShots?: boolean;
  /** Override a reference image (character or location) by data URL */
  onOverrideRefImage?: (name: string, type: 'character' | 'location', dataUrl: string) => void;
  /** Override a board image by data URL */
  onOverrideBoardImage?: (boardNumber: number, dataUrl: string) => void;
  /** Revert a reference image override back to auto-generated */
  onRevertRefImage?: (name: string, type: 'character' | 'location') => void;
  /** Revert a board image override */
  onRevertBoardImage?: (boardNumber: number) => void;
}

export function OutputTabs({ output, onRegenerateTab, onEditPrompt, refImages = [], boardImages = [], shotImages = [], onBreakdownShots, onBreakdownAllShots, onExtractShots, shotBreakdownRunning, extractingShots, onOverrideRefImage, onOverrideBoardImage, onRevertRefImage, onRevertBoardImage }: OutputTabsProps) {
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
        {activeTab === 'characters' && <CharactersTab data={output.characters} refImages={refImages.filter(r => r.type === 'character')} onEditPrompt={onEditPrompt} onOverrideImage={onOverrideRefImage} onRevertImage={onRevertRefImage} />}
        {activeTab === 'locations' && <LocationsTab data={output.locations} refImages={refImages.filter(r => r.type === 'location')} onEditPrompt={onEditPrompt} onOverrideImage={onOverrideRefImage} onRevertImage={onRevertRefImage} />}
        {activeTab === 'storyboards' && <StoryboardsTab data={output.storyboards} boardImages={boardImages} shotImages={shotImages} onBreakdownShots={onBreakdownShots} onBreakdownAllShots={onBreakdownAllShots} onExtractShots={onExtractShots} shotBreakdownRunning={shotBreakdownRunning} extractingShots={extractingShots} onEditPrompt={onEditPrompt} onOverrideBoardImage={onOverrideBoardImage} onRevertBoardImage={onRevertBoardImage} />}
        {activeTab === 'shot-prompts' && <ShotPromptsTab data={output.storyboards} onEditPrompt={onEditPrompt} />}
        {activeTab === 'board-prompts' && <BoardPromptsTab data={output.seedance} onEditPrompt={onEditPrompt} />}
        {activeTab === 'export' && <ExportTab output={output} />}
        {activeTab === 'logs' && <LogsTab />}
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

  const duration = data.estimated_duration_seconds;
  const boardCount = data.suggested_boards;
  const avgBoardDuration = boardCount > 0 ? Math.round(duration / boardCount) : 0;
  const totalShots = boardCount * 4; // Estimate ~4 shots per board

  const hasBeats = data.story_beats && data.story_beats.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CopyButton text={fullText} label="Copy All" />
      </div>

      {/* Shot Estimation Card */}
      <div className="bg-accent/10 border border-accent/30 rounded-btn p-3 space-y-2">
        <h4 className="text-xs font-semibold text-accent">🎬 Shot Estimation</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{boardCount}</div>
            <div className="text-xs text-secondary">Boards</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">~{totalShots}</div>
            <div className="text-xs text-secondary">Shots</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{avgBoardDuration}s</div>
            <div className="text-xs text-secondary">Avg/Board</div>
          </div>
        </div>
        <div className="text-xs text-secondary">Total duration: {duration}s • ~4 shots per board • {boardCount} boards = ~{totalShots} shots</div>
      </div>

      {/* Pacing Map (audio-driven mode only) */}
      {hasBeats && (
        <div className="bg-card border border-accent/30 rounded-btn p-3 space-y-2">
          <h4 className="text-xs font-semibold text-accent">🎵 Pacing Map</h4>
          <p className="text-xs text-secondary">{data.story_beats!.length} story beats from audio analysis</p>
          <div className="space-y-1">
            {data.story_beats!.map((beat, i) => {
              const pacingColor = beat.pacing === 'intense' ? 'text-red-400 bg-red-500/10' : beat.pacing === 'slow' ? 'text-blue-400 bg-blue-500/10' : 'text-yellow-400 bg-yellow-500/10';
              const duration = (beat.end_time - beat.start_time).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0">
                  <span className="text-xs text-secondary w-6">{beat.beat_number}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${pacingColor}`}>{beat.pacing}</span>
                  <span className="text-xs text-secondary flex-1 truncate">{beat.description}</span>
                  <span className="text-xs text-primary font-mono">{duration}s</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

function CharactersTab({ data, refImages, onEditPrompt, onOverrideImage, onRevertImage }: { data: CharacterPrompt[]; refImages: ReferenceImage[]; onEditPrompt?: (action: PromptEditAction) => void; onOverrideImage?: (name: string, type: 'character' | 'location', dataUrl: string) => void; onRevertImage?: (name: string, type: 'character' | 'location') => void }) {
  const allText = data.map(c => c.prompt).join('\n\n---\n\n');
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {data.map((c, i) => {
        const ref = refImages.find(r => r.name.toLowerCase() === c.character_name.toLowerCase());
        const isManual = ref?.isManual;
        return (
          <div key={i} className="flex gap-2">
            <div className="flex-shrink-0">
              <ImageDropZone
                imageUrl={ref?.imageDataUrl}
                alt={c.character_name}
                size="sm"
                isManual={isManual}
                onImageChange={(dataUrl) => onOverrideImage?.(c.character_name, 'character', dataUrl)}
                onRevert={isManual ? () => onRevertImage?.(c.character_name, 'character') : undefined}
              />
            </div>
            <div className="flex-1 min-w-0">
              <PromptCard
                title={c.character_name}
                content={c.prompt}
                showSendToChatGPT
                editable
                onEdit={(newVal) => onEditPrompt?.({ type: 'character-prompt', index: i, value: newVal })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LocationsTab({ data, refImages, onEditPrompt, onOverrideImage, onRevertImage }: { data: LocationPrompt[]; refImages: ReferenceImage[]; onEditPrompt?: (action: PromptEditAction) => void; onOverrideImage?: (name: string, type: 'character' | 'location', dataUrl: string) => void; onRevertImage?: (name: string, type: 'character' | 'location') => void }) {
  const allText = data.map(l => l.prompt).join('\n\n---\n\n');
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {data.map((l, i) => {
        const ref = refImages.find(r => r.name.toLowerCase() === l.location_name.toLowerCase());
        const isManual = ref?.isManual;
        return (
          <div key={i} className="flex gap-2">
            <div className="flex-shrink-0">
              <ImageDropZone
                imageUrl={ref?.imageDataUrl}
                alt={l.location_name}
                size="sm"
                isManual={isManual}
                onImageChange={(dataUrl) => onOverrideImage?.(l.location_name, 'location', dataUrl)}
                onRevert={isManual ? () => onRevertImage?.(l.location_name, 'location') : undefined}
              />
            </div>
            <div className="flex-1 min-w-0">
              <PromptCard
                title={l.location_name}
                content={l.prompt}
                showSendToChatGPT
                editable
                onEdit={(newVal) => onEditPrompt?.({ type: 'location-prompt', index: i, value: newVal })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StoryboardsTab({ data, boardImages, shotImages, onBreakdownShots, onBreakdownAllShots, onExtractShots, shotBreakdownRunning, extractingShots, onEditPrompt, onOverrideBoardImage, onRevertBoardImage }: { data: StoryboardBoard[]; boardImages: BoardImage[]; shotImages: ShotImage[]; onBreakdownShots?: (boardNumber: number) => void; onBreakdownAllShots?: () => void; onExtractShots?: () => void; shotBreakdownRunning?: boolean; extractingShots?: boolean; onEditPrompt?: (action: PromptEditAction) => void; onOverrideBoardImage?: (boardNumber: number, dataUrl: string) => void; onRevertBoardImage?: (boardNumber: number) => void }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-secondary">No storyboard data available. Try running the pipeline again.</p>
      </div>
    );
  }

  const allStoryboardText = data.map(b => b.storyboard_prompt).filter(Boolean).join('\n\n---\n\n');
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 flex-wrap">
        {onBreakdownAllShots && (
          <button
            onClick={onBreakdownAllShots}
            disabled={shotBreakdownRunning}
            className={`px-3 py-1 text-xs rounded-btn border transition-colors ${
              shotBreakdownRunning
                ? 'border-border bg-card text-secondary cursor-not-allowed'
                : 'border-accent/50 bg-accent/10 text-accent hover:bg-accent/20'
            }`}
            title="Break down all boards into detailed cinematic shots"
          >
            🎬 Breakdown All
          </button>
        )}
        {onExtractShots && (
          <button
            onClick={onExtractShots}
            disabled={extractingShots || boardImages.length === 0}
            className={`px-3 py-1 text-xs rounded-btn border transition-colors ${
              extractingShots
                ? 'border-border bg-card text-secondary cursor-not-allowed'
                : 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
            }`}
            title="Extract individual shots from storyboard multi-panel images via ChatGPT"
          >
            🎯 Extract Shots
          </button>
        )}
        <SendToChatGPTButton text={allStoryboardText} label="📊 Send All to ChatGPT" />
        <CopyButton text={allStoryboardText} label="Copy All" />
      </div>
      {data.map((board) => (
        <div key={board.board_number} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-accent">Board {board.board_number}</h4>
            <span className="text-xs text-secondary">{board.duration}s{board.audio_duration ? ` (audio: ${board.audio_duration}s)` : ''}</span>
            <div className="flex-1" />
            {onBreakdownShots && (
              <button
                onClick={() => onBreakdownShots(board.board_number)}
                disabled={shotBreakdownRunning}
                className={`px-2 py-0.5 text-xs rounded-btn border transition-colors ${
                  shotBreakdownRunning
                    ? 'border-border bg-card text-secondary cursor-not-allowed'
                    : 'border-border bg-card text-secondary hover:text-accent hover:border-accent/50'
                }`}
                title="Break down this board into detailed cinematic shots"
              >
                🎬 Shots
              </button>
            )}
          </div>
          <div className="bg-card border border-border rounded-btn p-3 space-y-1">
            <p className="text-xs text-secondary"><span className="text-primary/70">Beat:</span> {board.story_beat}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Characters:</span> {board.characters_used.join(', ')}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Location:</span> {board.location_used}</p>
          </div>
          {board.shots.map((shot) => (
            <div key={shot.shot_number} className="bg-card border border-border rounded-btn p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-primary">Shot {shot.shot_number}{shot.start_time !== undefined ? ` (${shot.start_time.toFixed(1)}s–${shot.end_time?.toFixed(1)}s)` : ''}</h5>
                <CopyButton text={`${shot.shot_size} | ${shot.lens_feel} | ${shot.movement}${shot.composition ? ` | ${shot.composition}` : ''}\nAction: ${shot.action}\nEmotion: ${shot.emotion}\nAudio: ${shot.dialogue_audio}`} />
              </div>
              <p className="text-xs text-secondary">
                <span className="text-primary/70">Size:</span> {shot.shot_size} | 
                <span className="text-primary/70">Lens:</span> {shot.lens_feel} | 
                <span className="text-primary/70">Movement:</span> {shot.movement}
                {shot.composition && <> | <span className="text-primary/70">Comp:</span> {shot.composition}</>}
              </p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Action:</span> {shot.action}</p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Emotion:</span> {shot.emotion}</p>
              <p className="text-xs text-secondary"><span className="text-primary/70">Audio:</span> {shot.dialogue_audio}</p>
            </div>
          ))}
          <PromptCard
            title="📊 Storyboard Layout Prompt"
            content={board.storyboard_prompt}
            showSendToChatGPT
            editable
            onEdit={(newVal) => onEditPrompt?.({ type: 'storyboard-prompt', boardNumber: board.board_number, value: newVal })}
          />
          {(() => {
            const boardImg = boardImages.find(b => b.boardNumber === board.board_number);
            const isManual = boardImg?.isManual;
            return (
              <div className="mt-2">
                <ImageDropZone
                  imageUrl={boardImg?.imageDataUrl}
                  alt={`Board ${board.board_number}`}
                  size="lg"
                  isManual={isManual}
                  onImageChange={(dataUrl) => onOverrideBoardImage?.(board.board_number, dataUrl)}
                  onRevert={isManual ? () => onRevertBoardImage?.(board.board_number) : undefined}
                />
              </div>
            );
          })()}
          {(() => {
            const boardShotImages = shotImages.filter(s => s.boardNumber === board.board_number);
            if (boardShotImages.length === 0) return null;
            return (
              <div className="mt-2 space-y-1">
                <h5 className="text-xs font-semibold text-green-400">Extracted Shots</h5>
                <div className="grid grid-cols-2 gap-2">
                  {boardShotImages.map(s => (
                    <div key={s.shotNumber} className="space-y-1">
                      <img
                        src={s.imageDataUrl}
                        alt={`Board ${s.boardNumber} Shot ${s.shotNumber}`}
                        className="w-full rounded border border-border"
                      />
                      <p className="text-xs text-secondary text-center">Shot {s.shotNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

function ShotPromptsTab({ data, onEditPrompt }: { data: StoryboardBoard[]; onEditPrompt?: (action: PromptEditAction) => void }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-secondary">No storyboard data. Run the pipeline first.</p>
      </div>
    );
  }

  // Collect all shots with master_prompt across all boards
  const allShots = data.flatMap(board =>
    board.shots
      .filter(shot => shot.master_prompt)
      .map(shot => ({
        boardNumber: board.board_number,
        shot,
      }))
  );

  const allText = allShots.map(s => s.shot.master_prompt!).join('\n');

  // If no master_prompts yet, show instruction
  if (allShots.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-accent/10 border border-accent/30 rounded-btn p-3">
          <p className="text-xs text-secondary">No shot prompts yet. Run "🎬 Breakdown All" on the Storyboards tab first to generate per-shot master prompts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <CopyButton text={allText} label="Copy All" />
      </div>
      <div className="bg-accent/10 border border-accent/30 rounded-btn p-3">
        <p className="text-xs text-secondary">{allShots.length} video prompts across {data.length} boards. Edit each prompt below, then copy all.</p>
      </div>
      {allShots.map((s, i) => (
        <PromptCard
          key={i}
          title={`Board ${s.boardNumber} — Shot ${s.shot.shot_number}`}
          content={s.shot.master_prompt!}
          showSendToChatGPT
          editable
          onEdit={(newVal) => onEditPrompt?.({ type: 'shot-master-prompt', boardNumber: s.boardNumber, shotNumber: s.shot.shot_number, value: newVal })}
        />
      ))}
    </div>
  );
}

function BoardPromptsTab({ data, onEditPrompt }: { data: SeedancePromptPerBoard[] | SeedancePromptContinuous; onEditPrompt?: (action: PromptEditAction) => void }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-secondary">No board prompts yet. Run the pipeline to generate video prompts.</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    // Continuous mode — single master prompt
    const s = data as SeedancePromptContinuous;
    return (
      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          <SendToChatGPTButton text={s.master_prompt} label="🎬 Send Master Prompt" />
          <CopyButton text={s.master_prompt} label="Copy All" />
        </div>
        <div className="bg-accent/10 border border-accent/30 rounded-btn p-3">
          <h4 className="text-xs font-semibold text-accent mb-2">Continuous Scene — {s.total_duration}s</h4>
          <p className="text-xs text-secondary">Single master prompt for the entire scene.</p>
        </div>
        <PromptCard title="Master Prompt" content={s.master_prompt} showSendToChatGPT editable onEdit={(newVal) => onEditPrompt?.({ type: 'seedance-continuous-prompt', value: newVal })} />
        <PromptCard title="Negative Prompt" content={s.negative_prompt} editable onEdit={(newVal) => onEditPrompt?.({ type: 'seedance-continuous-negative', value: newVal })} />
      </div>
    );
  }

  // Per-board mode
  const allText = (data as SeedancePromptPerBoard[]).map(s => s.board_prompt).join('\n\n---\n\n');
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <SendToChatGPTButton text={allText} label="🎬 Send All Boards" />
        <CopyButton text={allText} label="Copy All" />
      </div>
      {(data as SeedancePromptPerBoard[]).map((s) => (
        <div key={s.board_number} className="space-y-2">
          <h4 className="text-xs font-semibold text-accent">Board {s.board_number} — {s.duration}s</h4>
          <PromptCard title="Board Prompt" content={s.board_prompt} showSendToChatGPT editable onEdit={(newVal) => onEditPrompt?.({ type: 'seedance-board-prompt', boardNumber: s.board_number, value: newVal })} />
          <PromptCard title="Negative Prompt" content={s.negative_prompt} editable onEdit={(newVal) => onEditPrompt?.({ type: 'seedance-board-negative', boardNumber: s.board_number, value: newVal })} />
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