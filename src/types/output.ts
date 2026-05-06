import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport, ReferenceImage, BoardImage } from './pipeline';

export interface ProjectOutput {
  analysis: AnalysisOutput;
  bible: ProductionBible;
  characters: CharacterPrompt[];
  locations: LocationPrompt[];
  storyboards: StoryboardBoard[];
  seedance: SeedancePromptPerBoard[] | SeedancePromptContinuous;
  consistency: ConsistencyReport;
  // Image generation results (populated after image gen run)
  refImages?: ReferenceImage[];
  boardImages?: BoardImage[];
}

export type OutputTab = 'analysis' | 'bible' | 'characters' | 'locations' | 'storyboards' | 'shot-prompts' | 'board-prompts' | 'export' | 'logs';

export const OUTPUT_TABS: { key: OutputTab; label: string }[] = [
  { key: 'analysis', label: 'Analysis' },
  { key: 'bible', label: 'Bible' },
  { key: 'characters', label: 'Characters' },
  { key: 'locations', label: 'Locations' },
  { key: 'storyboards', label: 'Storyboards' },
  { key: 'shot-prompts', label: 'Shot Prompts' },
  { key: 'board-prompts', label: 'Board Prompts' },
  { key: 'export', label: 'Export' },
  { key: 'logs', label: '📋 Logs' },
];