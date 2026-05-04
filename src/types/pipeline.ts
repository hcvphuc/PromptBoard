export interface AnalysisOutput {
  title: string;
  genre: string;
  summary: string;
  emotional_arc: string;
  main_characters: string[];
  main_locations: string[];
  key_props: string[];
  estimated_duration_seconds: number;
  suggested_boards: number;
}

export interface ProductionBible {
  visual_style: string;
  color_palette: string[];
  lighting: string;
  tone: string;
  characters: BibleCharacter[];
  locations: BibleLocation[];
  props: BibleProp[];
  continuity_rules: string[];
}

export interface BibleCharacter {
  name: string;
  description: string;
  wardrobe: string;
  distinctive_features: string;
}

export interface BibleLocation {
  name: string;
  description: string;
  atmosphere: string;
  key_elements: string[];
}

export interface BibleProp {
  name: string;
  description: string;
  importance: string;
}

// Merged: each character = 1 unified prompt (reference sheet + close-up + neutral + expressive)
export interface CharacterPrompt {
  character_name: string;
  prompt: string;
}

// Merged: each location = 1 unified prompt (wide + medium + detail)
export interface LocationPrompt {
  location_name: string;
  prompt: string;
}

export interface StoryboardBoard {
  board_number: number;
  duration: number;
  story_beat: string;
  characters_used: string[];
  location_used: string;
  shots: StoryboardShot[];
  image_generation_prompt: string;
}

export interface StoryboardShot {
  shot_number: number;
  shot_size: string;
  lens_feel: string;
  movement: string;
  action: string;
  emotion: string;
  dialogue_audio: string;
}

export interface SeedancePromptPerBoard {
  board_number: number;
  duration: number;
  scene_setup: string;
  action_timeline: string;
  camera_movement: string;
  motion: string;
  negative_prompt: string;
}

export interface SeedancePromptContinuous {
  total_duration: number;
  scene_description: string;
  action_timeline: string;
  camera_movement: string;
  motion: string;
  negative_prompt: string;
}

export interface ConsistencyReport {
  passed: boolean;
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  category: string;
  description: string;
  affected_boards: number[];
  suggestion: string;
}