import type { AnalysisOutput, ProductionBible, CharacterPrompt, LocationPrompt, StoryboardBoard, SeedancePromptPerBoard, SeedancePromptContinuous, ConsistencyReport } from './pipeline';

export interface ProjectOutput {
  analysis: AnalysisOutput;
  bible: ProductionBible;
  characters: CharacterPrompt[];
  locations: LocationPrompt[];
  storyboards: StoryboardBoard[];
  seedance: SeedancePromptPerBoard[] | SeedancePromptContinuous;
  consistency: ConsistencyReport;
}

export type OutputTab = 'analysis' | 'bible' | 'characters' | 'locations' | 'storyboards' | 'seedance' | 'export';

export const OUTPUT_TABS: { key: OutputTab; label: string }[] = [
  { key: 'analysis', label: 'Analysis' },
  { key: 'bible', label: 'Bible' },
  { key: 'characters', label: 'Characters' },
  { key: 'locations', label: 'Locations' },
  { key: 'storyboards', label: 'Storyboards' },
  { key: 'seedance', label: 'Seedance' },
  { key: 'export', label: 'Export' },
];