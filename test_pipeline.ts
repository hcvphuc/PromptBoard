/**
 * PromptBoard Pipeline Test
 * Tests the full pipeline: analyzeScript → buildProductionBible → characters → locations → storyboards → seedance → validateConsistency
 */

import { OllamaProvider } from './src/ai/ollama';
import { runPipeline, type PipelineProgress } from './src/pipeline/runPipeline';
import type { PipelineSettings } from './src/types/project';

const SCRIPT = `"Please, I only need one more dollar... I will pay it tomorrow, I promise!" The voice was a dry and fragile rasp that seemed to carry the weight of a thousand winters as the elderly man's trembling fingers dropped a few worn copper coins onto the cold plastic of the counter. His eyes were filled with a raw and ancient desperation while the cashier, a young and focused Black woman named Nala, watched him with an intensity that suggested she was searching for something deep within his soul.
Behind the old man, the line of shoppers began to groan with a polished and cruel impatience while several people lifted their phones to record the scene as if his poverty were nothing more than a background prop for their next viral video. A man in a tailored suit standing further back let out a sharp and jagged laugh, mocking the old man for not having the currency to buy a single bottle of milk and a loaf of bread.
The store manager, a man named Sterling, walked over with a face that was a mask of cold and calculated arrogance. He didn't look at the old man's face but instead reached out to push the milk back across the scanner, telling him that Thorne Superstores were a place for patrons and not for beggars who couldn't balance a checkbook. But what no one in that building realized was that the woman behind the register was not just a cashier named Nala. She was Nala Thorne, the billionaire founder of the entire empire, and the man pleading for his life was the person who had saved her when she had nothing. The king had returned to find her mentor, and she was about to show Sterling exactly what happens when you treat a hero like a ghost.`;

const API_KEY = '95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1';
const BASE_URL = 'https://ollama.com'; // OllamaProvider appends /v1/ internally

async function main() {
  console.log('=== PromptBoard Pipeline Test ===\n');

  // Create provider
  const provider = new OllamaProvider(BASE_URL, 'gemini-3-flash-preview', API_KEY);
  console.log('1. Provider created:', provider.name);

  // Check availability
  console.log('2. Checking provider availability...');
  const available = await provider.isAvailable();
  console.log('   Available:', available);
  if (!available) {
    console.error('   FAIL: Provider not available. Check API key and base URL.');
    process.exit(1);
  }

  // Settings
  const settings: PipelineSettings = {
    stylePreset: 'cinematic',
    aspectRatio: '16:9',
    language: 'english',
    boardDuration: 15,
    seedanceMode: 'per-board',
    sendDelayMin: 5,
    sendDelayMax: 30,
    mode: 'simple',
  };
  console.log('3. Settings:', JSON.stringify(settings, null, 2));

  // Progress tracker
  const progressLog: PipelineProgress[] = [];
  function onProgress(progress: PipelineProgress) {
    progressLog.push(progress);
    console.log(`   [${progress.percentage}%] ${progress.stepLabel}`);
  }

  // Run pipeline
  console.log('\n4. Running pipeline...\n');
  const startTime = Date.now();

  let result;
  try {
    result = await runPipeline(SCRIPT, settings, provider, onProgress);
  } catch (err) {
    console.error('\n   PIPELINE ERROR:', err);
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n5. Pipeline completed in ${elapsed}s\n`);

  // Validate results
  console.log('=== Validation ===\n');

  let allPassed = true;

  // a) storyboards.length > 0
  const boards = result.storyboards;
  if (!Array.isArray(boards) || boards.length === 0) {
    console.log('   ❌ FAIL: storyboards is empty or not an array');
    console.log('      Type:', typeof boards, '| Value:', JSON.stringify(boards)?.substring(0, 200));
    allPassed = false;
  } else {
    console.log(`   ✅ storyboards.length = ${boards.length} (> 0)`);
  }

  // b) each board has non-empty shots array
  let shotsOk = true;
  for (const board of boards) {
    if (!Array.isArray(board.shots) || board.shots.length === 0) {
      console.log(`   ❌ FAIL: Board ${board.board_number} has empty or missing shots`);
      shotsOk = false;
    }
  }
  if (shotsOk && boards.length > 0) {
    console.log(`   ✅ All boards have non-empty shots arrays`);
    for (const board of boards) {
      console.log(`      Board ${board.board_number}: ${board.shots.length} shots`);
    }
  }

  // c) each shot has basic fields
  const requiredShotFields = ['shot_number', 'shot_size', 'action', 'movement'];
  let shotFieldsOk = true;
  for (const board of boards) {
    for (const shot of board.shots) {
      for (const field of requiredShotFields) {
        if (!(field in shot) || shot[field] === undefined || shot[field] === '') {
          console.log(`   ❌ FAIL: Board ${board.board_number} Shot ${shot.shot_number} missing field "${field}"`);
          shotFieldsOk = false;
        }
      }
    }
  }
  if (shotFieldsOk && boards.length > 0) {
    console.log(`   ✅ All shots have required fields (${requiredShotFields.join(', ')})`);
  }

  // Summary
  console.log('\n=== Summary ===\n');
  console.log(`  Title: ${result.analysis?.title || 'N/A'}`);
  console.log(`  Genre: ${result.analysis?.genre || 'N/A'}`);
  console.log(`  Characters: ${result.bible?.characters?.length || 0}`);
  console.log(`  Locations: ${result.bible?.locations?.length || 0}`);
  console.log(`  Storyboards: ${boards.length}`);
  console.log(`  Character prompts: ${result.characters?.length || 0}`);
  console.log(`  Location prompts: ${result.locations?.length || 0}`);
  console.log(`  Consistency passed: ${result.consistency?.passed}`);
  console.log(`  Consistency issues: ${result.consistency?.issues?.length || 0}`);

  if (allPassed && shotsOk && shotFieldsOk) {
    console.log('\n✅ SUCCESS: All checks passed!');
  } else {
    console.log('\n❌ FAIL: Some checks failed. See details above.');
  }

  process.exit(0);
}

main().catch(e => {
  console.error('UNCAUGHT FATAL:', e);
  process.exit(1);
});