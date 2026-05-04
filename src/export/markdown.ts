import type { ProjectOutput } from '@/types/output';

export function exportMarkdown(output: ProjectOutput): string {
  const lines: string[] = [];

  lines.push('# PromptBoard AI — Production Output\n');

  // Analysis
  lines.push('## Analysis\n');
  lines.push(`**Title:** ${output.analysis.title}`);
  lines.push(`**Genre:** ${output.analysis.genre}`);
  lines.push(`**Summary:** ${output.analysis.summary}`);
  lines.push(`**Emotional Arc:** ${output.analysis.emotional_arc}`);
  lines.push(`**Characters:** ${output.analysis.main_characters.join(', ')}`);
  lines.push(`**Locations:** ${output.analysis.main_locations.join(', ')}`);
  lines.push(`**Key Props:** ${output.analysis.key_props.join(', ')}`);
  lines.push(`**Duration:** ${output.analysis.estimated_duration_seconds}s`);
  lines.push(`**Boards:** ${output.analysis.suggested_boards}\n`);

  // Bible
  lines.push('## Production Bible\n');
  lines.push(`**Visual Style:** ${output.bible.visual_style}`);
  lines.push(`**Color Palette:** ${output.bible.color_palette.join(', ')}`);
  lines.push(`**Lighting:** ${output.bible.lighting}`);
  lines.push(`**Tone:** ${output.bible.tone}\n`);
  lines.push('### Characters\n');
  output.bible.characters.forEach((c) => {
    lines.push(`**${c.name}**: ${c.description}  \nWardrobe: ${c.wardrobe}  \nDistinctive: ${c.distinctive_features}\n`);
  });
  lines.push('### Locations\n');
  output.bible.locations.forEach((l) => {
    lines.push(`**${l.name}**: ${l.description}  \nAtmosphere: ${l.atmosphere}  \nKey Elements: ${l.key_elements.join(', ')}\n`);
  });
  lines.push('### Props\n');
  output.bible.props.forEach((p) => {
    lines.push(`**${p.name}**: ${p.description} (${p.importance})\n`);
  });
  lines.push('### Continuity Rules\n');
  output.bible.continuity_rules.forEach((r) => lines.push(`- ${r}`));
  lines.push('');

  // Characters (merged — 1 prompt per character)
  lines.push('## Character Prompts\n');
  output.characters.forEach((c) => {
    lines.push(`### ${c.character_name}\n`);
    lines.push(`${c.prompt}\n`);
  });

  // Locations (merged — 1 prompt per location)
  lines.push('## Location Prompts\n');
  output.locations.forEach((l) => {
    lines.push(`### ${l.location_name}\n`);
    lines.push(`${l.prompt}\n`);
  });

  // Storyboards
  lines.push('## Storyboards\n');
  output.storyboards.forEach((b) => {
    lines.push(`### Board ${b.board_number} (${b.duration}s)\n`);
    lines.push(`**Beat:** ${b.story_beat}`);
    lines.push(`**Characters:** ${b.characters_used.join(', ')}`);
    lines.push(`**Location:** ${b.location_used}\n`);
    b.shots.forEach((s) => {
      lines.push(`#### Shot ${s.shot_number}`);
      lines.push(`- Size: ${s.shot_size} | Lens: ${s.lens_feel} | Movement: ${s.movement}`);
      lines.push(`- Action: ${s.action}`);
      lines.push(`- Emotion: ${s.emotion}`);
      lines.push(`- Audio: ${s.dialogue_audio}\n`);
    });
    lines.push(`**Image Prompt:** ${b.image_generation_prompt}\n`);
  });

  // Seedance
  lines.push('## Seedance Prompts\n');
  if (Array.isArray(output.seedance)) {
    output.seedance.forEach((s: any) => {
      lines.push(`### Board ${s.board_number} (${s.duration}s)\n`);
      lines.push(`**Scene Setup:** ${s.scene_setup}`);
      lines.push(`**Action Timeline:** ${s.action_timeline}`);
      lines.push(`**Camera Movement:** ${s.camera_movement}`);
      lines.push(`**Motion:** ${s.motion}`);
      lines.push(`**Negative Prompt:** ${s.negative_prompt}\n`);
    });
  } else {
    const s = output.seedance as any;
    lines.push(`### Continuous Scene (${s.total_duration}s)\n`);
    lines.push(`**Scene Description:** ${s.scene_description}`);
    lines.push(`**Action Timeline:** ${s.action_timeline}`);
    lines.push(`**Camera Movement:** ${s.camera_movement}`);
    lines.push(`**Motion:** ${s.motion}`);
    lines.push(`**Negative Prompt:** ${s.negative_prompt}\n`);
  }

  // Consistency
  lines.push('## Consistency Report\n');
  lines.push(`**Status:** ${output.consistency.passed ? '✅ PASSED' : '❌ ISSUES FOUND'}`);
  if (output.consistency.issues.length > 0) {
    lines.push('\n### Issues\n');
    output.consistency.issues.forEach((i) => {
      lines.push(`- **[${i.category}]** ${i.description} (Boards: ${i.affected_boards.join(', ')}) → ${i.suggestion}`);
    });
  }

  return lines.join('\n');
}