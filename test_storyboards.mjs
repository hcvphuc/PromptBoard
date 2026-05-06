// Quick test: just the storyboard generation step
// Uses the built dist files + direct API call

const OLLAMA_URL = 'https://ollama.com/v1/chat/completions';
const API_KEY = '95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1';
const MODEL = 'gemini-3-flash-preview';

// Mock analysis (matches what pipeline would produce)
const analysis = {
  title: "The Mentor's Justice",
  genre: "Social Justice Drama",
  summary: "A billionaire founder Nala Thorne working undercover as a cashier witnesses her mentor being humiliated by her own store manager. She must decide whether to reveal her identity and exact justice.",
  emotional_arc: "Calm -> Tension -> Humiliation -> Revelation -> Retribution",
  main_characters: ["Nala", "Elderly Man", "Sterling", "Shopper"],
  main_locations: ["Thorne Superstore"],
  key_props: ["Copper coins", "Bottle of milk", "Loaf of bread", "Phone cameras", "Barcode scanner"],
  estimated_duration_seconds: 120,
  suggested_boards: 10
};

// Mock bible (matches what pipeline would produce)
const bible = {
  visual_style: "Cinematic realism with high-fidelity textures and shallow depth of field. Intimate close-ups capturing micro-expressions, contrasting clinical cold superstore atmosphere with raw human warmth.",
  color_palette: ["#404040", "#D4C5A9", "#8B4513", "#4A90D9"],
  lighting: "Harsh fluorescent overhead lighting in store, warm key light on character faces during close-ups",
  tone: "Dramatic with moments of tension and emotional release",
  characters: [
    { name: "Nala", description: "Young Black woman, cashier, secretly billionaire founder", wardrobe: "Blue polyester vest, white shirt, tight bun", distinctive_features: "Focused eyes, calm demeanor, strong posture" },
    { name: "Elderly Man", description: "Frail old man in need, Nala's former mentor", wardrobe: "Frayed charcoal wool coat, worn shoes", distinctive_features: "Trembling hands, weathered face, deep eyes" },
    { name: "Sterling", description: "Store manager, cold and arrogant", wardrobe: "Tailored navy suit, silver tie", distinctive_features: "Sharp features, cold eyes, calculated movements" },
    { name: "Shopper", description: "Impatient shopper in line", wardrobe: "Business casual, phone in hand", distinctive_features: "Disgusted expression, recording with phone" }
  ],
  locations: [
    { name: "Thorne Superstore", description: "Modern convenience store, checkout counter area", atmosphere: "Cold, clinical, fluorescent-lit", key_elements: ["Checkout counter", "Barcode scanner", "Fluorescent lights", "Shopping aisles"] }
  ],
  props: [
    { name: "Copper coins", description: "Worn dull copper coins", importance: "Symbol of poverty and dignity" },
    { name: "Milk", description: "Single bottle of milk", importance: "Basic need denied" },
    { name: "Bread", description: "Loaf of bread", importance: "Sustenance" }
  ],
  continuity_rules: [
    "Camera is always on the checkout side facing characters",
    "Nala stays behind counter at all times",
    "Elderly man stands at counter facing Nala",
    "Sterling enters from screen left"
  ]
};

const settings = {
  stylePreset: 'cinematic',
  aspectRatio: '16:9',
  boardDuration: 15,
  language: 'English'
};

const styleDict = {
  positive: 'Cinematic drama, anamorphic lens, muted teal/orange palette',
  negative: 'No flat lighting, no amateur composition, no boring framing'
};
const styleBlock = `${styleDict.positive}. ${styleDict.negative}.`;

const boardCount = analysis.suggested_boards || 10;

// Compact summaries
const analysisSummary = `Title: ${analysis.title}
Genre: ${analysis.genre}
Summary: ${analysis.summary}
Emotional Arc: ${analysis.emotional_arc}
Main Characters: ${analysis.main_characters.join(', ')}
Main Locations: ${analysis.main_locations.join(', ')}
Key Props: ${analysis.key_props.join(', ')}
Duration: ${analysis.estimated_duration_seconds}s
Suggested Boards: ${analysis.suggested_boards}`;

const bibleSummary = `Visual Style: ${bible.visual_style}
Color Palette: ${bible.color_palette.join(', ')}
Lighting: ${bible.lighting}
Tone: ${bible.tone}
Characters: ${bible.characters.map(c => `${c.name}: ${c.description}. Wardrobe: ${c.wardrobe}. Features: ${c.distinctive_features}`).join('\n')}
Locations: ${bible.locations.map(l => `${l.name}: ${l.description}. Atmosphere: ${l.atmosphere}. Elements: ${l.key_elements.join(', ')}`).join('\n')}
Continuity Rules: ${bible.continuity_rules.join('; ')}`;

const systemPrompt = `You are a film director creating cinematic storyboards. Always respond with valid JSON only, no markdown, no code blocks.

CRITICAL RULES:
- Do NOT illustrate dialogue directly - translate emotion into visuals
- SHOW, DON'T TELL - props carry meaning, small actions replace dialogue
- CAMERA = EMOTION - wide=calm, close-up=pressure, push-in=rising tension
- Each shot MUST evolve from the previous one - no identical framing
- Use composition system: LOCK(symmetry), TENSION(imbalance), BREAK(disruption), RESTORE(balance)
- Follow emotional flow: Setup -> Disruption -> Escalation -> Peak -> Release
- Characters and wardrobe must match input EXACTLY
- Location must match input EXACTLY`;

const userPrompt = `Create a cinematic storyboard based on the analysis and production bible.

Style: ${settings.stylePreset}
Aspect ratio: ${settings.aspectRatio}
Board duration: ${settings.boardDuration}s (MAX - each board's shots MUST total <= ${settings.boardDuration}s)
Language: ${settings.language}

Analysis:
${analysisSummary}

Production Bible:
${bibleSummary}

Create ${boardCount} boards. Each board represents a CONTINUOUS SEQUENCE of shots totaling max ${settings.boardDuration}s.

BOARD DURATION RULE (CRITICAL):
- Each board = max ${settings.boardDuration}s of action
- Group consecutive shots until their total duration reaches ~${settings.boardDuration}s
- When total exceeds ${settings.boardDuration}s, start a new board
- A board MUST have 3-6 shots (not 1, not 10+)
- Shot duration by pacing: intense = 1-2s, moderate = 2-4s, slow = 4-6s
- All shot durations in a board MUST sum to <= ${settings.boardDuration}s

For each board, return a JSON object with:
- board_number: number (sequential: 1, 2, 3...)
- duration: number (total duration of all shots in this board, max ${settings.boardDuration}s)
- story_beat: string (what happens in this board - one beat per board)
- characters_used: string[] (must match bible character names EXACTLY)
- location_used: string (must match bible location name EXACTLY)
- shots: array of 3-6 objects, each with:
  - shot_number: number (1, 2, 3... within this board)
  - shot_size: one of "Extreme Wide" / "Wide" / "Medium" / "Medium Close-Up" / "Close-Up" / "Extreme Close-Up"
  - lens_feel: string (e.g. "35mm", "50mm", "85mm")
  - movement: string (e.g. "Static", "Slow push-in", "Tracking", "Dolly")
  - composition: one of "LOCK" / "TENSION" / "BREAK" / "RESTORE"
  - action: string (what we SEE happening - visual, not dialogue)
  - emotion: string (emotional intent of this shot)
  - dialogue_audio: string (minimal dialogue or audio description, NOT dominant)
- storyboard_prompt: string (MULTI-PANEL storyboard layout prompt - see rules below)

STORYBOARD PROMPT RULES (CRITICAL - MUST FOLLOW):
- storyboard_prompt MUST describe a MULTI-PANEL grid layout - NEVER a single panel
- If the board has N shots, the storyboard MUST have N panels in the grid
- Grid layout: 2 shots = 1x2, 3 shots = 1x3, 4 shots = 2x2, 5 shots = 2x3 (1 empty), 6 shots = 2x3
- START the prompt with: "Multi-panel cinematic storyboard, [N] still frames arranged in a [ROWS]x[COLS] grid."
- For EACH panel write: "Panel [N] ([shot_size], [lens]): [visual description of what we SEE]"
- EVERY panel MUST show a DIFFERENT shot - do NOT repeat or merge shots
- The grid is read left-to-right, top-to-bottom: Panel 1 is top-left, Panel 2 is top-right, etc.
- Between panels: thin directional arrows showing sequence flow
- Shared consistency: same character faces/wardrobe, same location across ALL panels
- STYLE: cinematic still frames, photorealistic, film grain, each panel looks like a paused frame from the actual film. NOT sketch, NOT illustration, NOT comic. Photorealistic cinematography.
- END with: "Cinematic still frames, photorealistic, film grain, each panel is a paused moment from the actual film."
- EXAMPLE (4 shots): "Multi-panel cinematic storyboard, 4 still frames arranged in 2x2 grid. Panel borders with thin black lines. Small panel number in top-left corner of each panel. Each panel is a photorealistic cinematic still frame. Panel 1 (Wide, 14mm): Wide shot establishing the convenience store interior - Nala behind counter, elderly man entering through glass door, fluorescent overhead lighting casting harsh shadows. Panel 2 (Medium, 35mm): Nala's face looking up, neutral expression, tight bun, blue polyester polo visible, shallow depth of field. Panel 3 (Close-Up, 85mm): Hands pausing over barcode scanner, item on counter, warm light on skin. Panel 4 (Medium, 50mm): Transaction moment - both figures framed across counter, realistic lighting. Thin directional arrows between panels. Cinematic still frames, photorealistic, film grain, each panel is a paused moment from the actual film."

CRITICAL RULES:
- Do NOT illustrate dialogue directly - translate emotion into visuals
- SHOW, DON'T TELL - props carry meaning, small actions replace dialogue
- CAMERA = EMOTION - wide = calm/distance, close-up = pressure/intimacy, push-in = rising tension
- Each shot MUST evolve from the previous one - do NOT repeat identical framing
- Use the composition system: LOCK (symmetry, stable), TENSION (slight imbalance), BREAK (strong motion, disruption), RESTORE (return to balance)
- Follow emotional flow: Setup -> Disruption -> Escalation -> Peak -> Release
- Characters and wardrobe must match bible EXACTLY - no redesign
- Location must match bible EXACTLY

Return a JSON ARRAY. ONLY valid JSON, no markdown code blocks, no extra text.`;

async function callAI() {
  console.log('Calling Ollama Cloud API...');
  const startTime = Date.now();
  
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 32768,
      response_format: { type: 'json_object' },
    }),
  });

  console.log(`API call took ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`Status: ${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    console.error(`Error: ${res.status} - ${body.substring(0, 500)}`);
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  console.log(`Response length: ${content.length} chars`);
  
  return content;
}

function validateBoards(boards) {
  console.log(`\n=== VALIDATION ===`);
  console.log(`Total boards: ${boards.length}`);
  
  if (!Array.isArray(boards) || boards.length === 0) {
    console.log('❌ FAIL: No boards returned');
    return false;
  }

  let failed = 0;
  let totalShots = 0;
  let emptyShotsBoards = 0;
  
  for (const board of boards) {
    const bNum = board.board_number;
    const shots = board.shots || [];
    totalShots += shots.length;
    
    if (!Array.isArray(shots) || shots.length === 0) {
      console.log(`  ❌ Board ${bNum}: No shots (story_beat: "${(board.story_beat || '').substring(0, 50)}")`);
      emptyShotsBoards++;
      failed++;
      continue;
    }
    
    // Check shots have valid fields
    for (const shot of shots) {
      if (!shot.shot_size || !shot.action || !shot.movement) {
        console.log(`  ❌ Board ${bNum}, Shot ${shot.shot_number}: Missing fields (size="${shot.shot_size}", action="${(shot.action || '').substring(0, 30)}", movement="${shot.movement}")`);
        failed++;
      }
    }
    
    const hasPrompt = board.storyboard_prompt && board.storyboard_prompt.length > 20;
    console.log(`  ✅ Board ${bNum}: ${shots.length} shots, duration=${board.duration}s, prompt=${hasPrompt ? '✅' : '❌'}, chars=${(board.characters_used || []).join(',')}, loc=${board.location_used}`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Boards: ${boards.length}`);
  console.log(`Total shots: ${totalShots}`);
  console.log(`Boards with empty shots: ${emptyShotsBoards}`);
  console.log(`Failed validations: ${failed}`);
  
  if (failed === 0 && boards.length >= 3) {
    console.log('✅ PASS: Storyboards look good!');
    return true;
  } else {
    console.log(`❌ FAIL: ${failed} validation errors, ${boards.length} boards (expected >= 3)`);
    return false;
  }
}

async function main() {
  console.log('=== STORYBOARD TEST ===');
  console.log(`Model: ${MODEL}`);
  console.log(`Requesting: ${boardCount} boards`);
  console.log('');

  const response = await callAI();
  
  if (!response) {
    console.log('\n❌ FAIL: API call failed');
    process.exit(1);
  }

  // Try to parse JSON - handle wrapping
  let data;
  try {
    data = JSON.parse(response);
  } catch (e) {
    console.log(`\n❌ FAIL: JSON parse error: ${e.message}`);
    console.log(`First 300 chars: ${response.substring(0, 300)}`);
    process.exit(1);
  }

  // Unwrap if needed
  let boards = data;
  if (!Array.isArray(data) && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        boards = data[key];
        break;
      }
    }
  }
  if (!Array.isArray(boards)) {
    boards = [boards];
  }

  console.log(`\nParsed boards: ${boards.length}`);
  if (boards.length > 0) {
    console.log(`\nFirst board sample:`);
    console.log(JSON.stringify(boards[0], null, 2).substring(0, 500));
  }

  const result = validateBoards(boards);
  
  // Print storyboard_prompt samples
  console.log(`\n=== STORYBOARD PROMPT SAMPLES ===`);
  for (const board of boards.slice(0, 3)) {
    if (board.storyboard_prompt) {
      console.log(`\nBoard ${board.board_number} prompt:`);
      console.log(board.storyboard_prompt.substring(0, 200) + '...');
    }
  }

  process.exit(result ? 0 : 1);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
