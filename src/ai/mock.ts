import type { AIProvider } from './provider';

export class MockProvider implements AIProvider {
  name = 'Mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(_prompt: string, _systemPrompt?: string): Promise<string> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));
    return '';
  }
}

// Returns specific mock data based on which pipeline step calls it
export function getMockAnalysis(): string {
  return JSON.stringify({
    title: 'The Last Signal',
    genre: 'Sci-Fi Drama',
    summary: 'A lone astronaut receives a mysterious signal from an abandoned space station and must decide whether to investigate, risking everything for a chance at contact.',
    emotional_arc: 'Isolation → Curiosity → Tension → Revelation → Bittersweet Hope',
    main_characters: ['Commander Lena Vasquez', 'AI Companion ORION'],
    main_locations: ['Deep Space Vessel Horizon', 'Abandoned Station Omega-9'],
    key_props: ['Signal receiver device', 'Lena\'s family photo', 'Station access keycard'],
    estimated_duration_seconds: 60,
    suggested_boards: 4,
  });
}

export function getMockBible(): string {
  return JSON.stringify({
    visual_style: 'Hard sci-fi with warm practical lighting. Clean lines contrasted with lived-in textures. Inspired by Arrival and Interiors of Alien.',
    color_palette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#f5c518', '#d4d4d8'],
    lighting: 'Low-key practical lighting with warm amber from control panels. Cool blue ambient from starlight through viewports. High contrast rim lighting on characters.',
    tone: 'Contemplative, melancholic, building to tense revelation',
    characters: [
      {
        name: 'Commander Lena Vasquez',
        description: 'Mid-40s, Hispanic woman. Short practical hair. Weathered face with sharp observant eyes. Lean athletic build from years of zero-G conditioning.',
        wardrobe: 'Fitted dark navy flight suit with mission patches on shoulders. Sleeves rolled to elbows revealing a worn silver watch. Utility belt with minimal tools.',
        distinctive_features: 'Small scar above left eyebrow. Always wears her wedding ring on a chain around her neck. Slight squint when thinking.',
      },
      {
        name: 'AI Companion ORION',
        description: 'Appears as a soft blue holographic sphere that pulses when speaking. No humanoid form. Projects text and simple diagrams on nearby surfaces.',
        wardrobe: 'N/A - holographic entity',
        distinctive_features: 'Voice has slight digital warmth. Sphere brightens with emotional emphasis. Flickers when processing complex data.',
      },
    ],
    locations: [
      {
        name: 'Deep Space Vessel Horizon',
        description: 'Compact command module. Curved walls lined with display screens and tactile button panels. Central pilot seat on a swivel base. Narrow corridor leads to sleeping quarters.',
        atmosphere: 'Cluttered but organized. Personal items give warmth to utilitarian metal surfaces.',
        key_elements: ['Central holographic display', 'Pilot seat', 'Viewports showing stars', 'Wall-mounted photo of Earth'],
      },
      {
        name: 'Abandoned Station Omega-9',
        description: 'Derelict rotating station. Long corridors with emergency lighting. Zero-G central hub. Overgrown hydroponics bay with bioluminescent plants.',
        atmosphere: 'Eerie beauty. Nature reclaiming technology. Faint hum of residual power.',
        key_elements: ['Floating debris', 'Bioluminescent plants', 'Flickering emergency strips', 'Central zero-G hub'],
      },
    ],
    props: [
      { name: 'Signal receiver device', description: 'Handheld device with analog dials and a small green oscilloscope screen.', importance: 'Critical - drives the entire plot' },
      { name: "Lena's family photo", description: 'Faded polaroid tucked into console frame. Shows a woman and child on a beach.', importance: 'Emotional anchor for character motivation' },
      { name: 'Station access keycard', description: 'Old magnetic stripe card with peeling Omega-9 label.', importance: 'Plot device for station entry' },
    ],
    continuity_rules: [
      'Lena always wears the ring on the chain, never on her finger',
      'ORION sphere color consistency: calm = soft blue, alert = bright cyan, distress = amber pulse',
      'Horizon interior: amber panel lighting + blue starlight through viewports at all times',
      'Station Omega-9: green bioluminescent glow as only light source unless emergency strips activate',
      'Lena\'s flight suit: navy with visible mission patches, never pristine - shows wear',
    ],
  });
}

export function getMockCharacters(): string {
  return JSON.stringify([
    {
      character_name: 'Commander Lena Vasquez',
      prompt: 'Character sheet of Commander Lena Vasquez. Mid-40s Hispanic woman, short practical hair, weathered face with sharp observant eyes, small scar above left eyebrow, lean athletic build from years of zero-G conditioning. Fitted dark navy flight suit with mission patches on shoulders, sleeves rolled to elbows revealing a worn silver watch, wedding ring on a chain around her neck, utility belt with minimal tools. Full body front view, side view, back view, 3/4 view on clean white studio background. Close-up portrait with cinematic shallow depth of field, slight squint expression as if deep in thought, warm amber rim lighting. Neutral standing pose at ease in Deep Space Vessel command module, hands at sides, observing viewport. Dynamic expressive pose leaning forward intensely at control console, one hand gripping edge, other reaching toward holographic display, face showing determination mixed with fear. Consistent identity throughout all views. Hard sci-fi cinematic style. 16:9 aspect ratio.',
    },
    {
      character_name: 'AI Companion ORION',
      prompt: 'Character sheet of AI Companion ORION. Soft blue holographic sphere that pulses gently when speaking, no humanoid form, translucent with inner light patterns, projects faint text on nearby surfaces. Voice has slight digital warmth, sphere brightens with emotional emphasis, flickers when processing complex data. Full body reference showing sphere from multiple angles: front, side, top-down, 3/4 view. Three pulse states: calm soft blue, alert bright cyan, distress amber pulse. Close-up with cinematic shallow DOF, internal light patterns swirling, subtle text projections. Neutral pose floating stationary above central console in deep space vessel, calm gentle pulse. Dynamic expressive pose in alert state, bright cyan sphere pulsing rapidly, light projections scattering across console surfaces showing urgent data streams. Clean white studio background for reference views, dark ambient background for cinematic poses. Consistent sphere form throughout. Hard sci-fi cinematic style. 16:9 aspect ratio.',
    },
  ]);
}

export function getMockLocations(): string {
  return JSON.stringify([
    {
      location_name: 'Deep Space Vessel Horizon',
      prompt: 'Deep Space Vessel Horizon command module interior. Compact curved walls lined with glowing display screens and tactile button panels, central pilot seat on swivel base, narrow corridor leading to sleeping quarters. Wide establishing shot showing full space with amber practical lighting from control panels, cool blue starlight through viewports, personal items giving warmth to utilitarian metal surfaces. Medium production frame focusing on central pilot seat and holographic display, amber panel lighting reflecting off console surfaces, tactile button panel details, lived-in organized clutter. Close-up detail on worn console surface textures, finger-smudge patina on buttons, amber LED indicators, small faded polaroid photo tucked into frame, scratched metal with mission designation stenciled. Hard sci-fi cinematic style. 16:9 aspect ratio.',
    },
    {
      location_name: 'Abandoned Station Omega-9',
      prompt: 'Abandoned Station Omega-9 interior. Derelict rotating station with long dark corridors, emergency strip lighting, zero-G central hub, overgrown hydroponics bay with bioluminescent plants. Wide establishing shot showing full corridor with floating debris in zero-G, green bioluminescent glow casting eerie light, nature reclaiming technology, faint hum of residual power. Medium production frame of central zero-G hub, floating debris gently rotating, green glow from hydroponics visible through doorway, flickering emergency strips. Close-up detail on bioluminescent plant tendrils wrapping around corroded metal strut, green glow illuminating rust patterns, water droplets floating in zero-G catching light. Hard sci-fi cinematic style. 16:9 aspect ratio.',
    },
  ]);
}

export function getMockStoryboards(): string {
  return JSON.stringify([
    {
      board_number: 1,
      duration: 15,
      story_beat: 'Lena detects the mysterious signal while alone on the Horizon',
      characters_used: ['Commander Lena Vasquez', 'AI Companion ORION'],
      location_used: 'Deep Space Vessel Horizon',
      shots: [
        {
          shot_number: 1,
          shot_size: 'Extreme Wide',
          lens_feel: '14mm anamorphic',
          movement: 'Slow dolly in through corridor',
          action: 'Establish the Horizon adrift in deep space, camera pushes through corridor toward command module',
          emotion: 'Vast emptiness, isolation',
          dialogue_audio: 'Ambient: low ship hum, distant cosmic static',
        },
        {
          shot_number: 2,
          shot_size: 'Medium Close-Up',
          lens_feel: '35mm',
          movement: 'Static, slight rack focus',
          action: 'Lena at console, head tilted listening, hand slowly reaching toward signal receiver',
          emotion: 'Curiosity breaking through routine',
          dialogue_audio: 'ORION: "Commander, I\'m detecting an anomalous transmission."',
        },
        {
          shot_number: 3,
          shot_size: 'Close-Up',
          lens_feel: '85mm',
          movement: 'Slight push in',
          action: 'Signal receiver screen showing green waveform spike, Lena\'s eyes reflected in the oscilloscope glass',
          emotion: 'Fascination, wariness',
          dialogue_audio: 'Lena: "Play it." / Signal: faint rhythmic pulse',
        },
      ],
      storyboard_prompt: 'Multi-panel production storyboard layout, 4 panels arranged in 2x2 grid on off-white paper. Panel borders with thin black lines. Panel 1 (Wide, 14mm): Wide shot of Deep Space Vessel Horizon command module, amber panel lighting, Commander Lena Vasquez mid-40s Hispanic woman in dark navy flight suit at console, holographic ORION sphere casting soft blue glow. Panel 2 (Medium, 35mm): Lena leaning toward signal receiver, face showing intense curiosity, weathered features lit by screen glow. Panel 3 (Close-Up, 85mm): Signal receiver screen showing green waveform spike, Lena\'s eyes reflected in the oscilloscope glass. Panel 4 (Medium, 50mm): Lena at console with ORION sphere, decision moment. Thin directional arrows between panels. Production storyboard, panel grid layout, sketch aesthetic, panel borders, cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9.',
    },
    {
      board_number: 2,
      duration: 15,
      story_beat: 'Lena debates investigating with ORION, revealing her emotional stakes',
      characters_used: ['Commander Lena Vasquez', 'AI Companion ORION'],
      location_used: 'Deep Space Vessel Horizon',
      shots: [
        {
          shot_number: 1,
          shot_size: 'Medium',
          lens_feel: '50mm',
          movement: 'Slow orbit around Lena',
          action: 'Lena standing at viewport, ORION sphere floating beside her, she touches the ring on her chain',
          emotion: 'Internal conflict, longing',
          dialogue_audio: 'Lena: "How long since anyone heard from Omega-9?"',
        },
        {
          shot_number: 2,
          shot_size: 'Over-shoulder',
          lens_feel: '35mm',
          movement: 'Static',
          action: 'Lena\'s POV looking at ORION holographic display showing station schematics, ORION sphere calm blue',
          emotion: 'Weighing options',
          dialogue_audio: 'ORION: "Seventeen years, Commander. The risk assessment is..."',
        },
        {
          shot_number: 3,
          shot_size: 'Close-Up',
          lens_feel: '85mm shallow DOF',
          movement: 'Handheld, intimate',
          action: 'Lena\'s hand clutching the ring on the chain, family photo visible in background on console',
          emotion: 'Deep personal stakes surfacing',
          dialogue_audio: 'Lena: "I know the risk. Set a course."',
        },
      ],
      storyboard_prompt: 'Multi-panel production storyboard layout, 4 panels arranged in 2x2 grid on off-white paper. Panel borders with thin black lines. Panel 1 (Medium, 50mm): Lena standing at viewport, ORION sphere floating beside her, she touches the ring on her chain, amber panel lighting. Panel 2 (Over-shoulder, 35mm): ORION display projecting star map, Lena silhouette against viewport, blue starlight. Panel 3 (Close-Up, 85mm): Lena hand on chain ring, eyes distant with longing, soft blue holographic light on face. Panel 4 (Wide, 24mm): Full command module, Lena small figure at viewport, ORION sphere hovering, vast emptiness of space outside. Thin directional arrows between panels. Production storyboard, panel grid layout, sketch aesthetic, panel borders, cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9.',
    },
    {
      board_number: 3,
      duration: 15,
      story_beat: 'Lena arrives at Omega-9 and enters the abandoned station',
      characters_used: ['Commander Lena Vasquez', 'AI Companion ORION'],
      location_used: 'Abandoned Station Omega-9',
      shots: [
        {
          shot_number: 1,
          shot_size: 'Wide',
          lens_feel: '24mm',
          movement: 'Slow push through airlock',
          action: 'Lena floating through airlock into dark corridor, flashlight beam cutting through dust particles, keycard in hand',
          emotion: 'Tension, awe at the derelict scale',
          dialogue_audio: 'Ambient: airlock seal release, distant station groan',
        },
        {
          shot_number: 2,
          shot_size: 'Medium',
          lens_feel: '35mm',
          movement: 'Floating zero-G camera',
          action: 'Lena drifting through zero-G hub, debris floating around her, bioluminescent glow in distance, ORION sphere scanning',
          emotion: 'Wonder mixed with unease',
          dialogue_audio: 'ORION: "Atmosphere breathable. Detecting power fluctuations in section 7."',
        },
        {
          shot_number: 3,
          shot_size: 'Close-Up',
          lens_feel: '50mm',
          movement: 'Steady tracking',
          action: 'Lena\'s face lit by green bioluminescent glow, eyes wide with discovery, hand reaching toward glowing plants',
          emotion: 'Revelation dawning',
          dialogue_audio: 'Lena: "Something is still alive here."',
        },
      ],
      storyboard_prompt: 'Multi-panel production storyboard layout, 4 panels arranged in 2x2 grid on off-white paper. Panel borders with thin black lines. Panel 1 (Wide, 14mm): Abandoned Station Omega-9 interior, dark corridor, emergency strip lighting, Lena floating in zero-G central hub, green bioluminescent plant glow. Panel 2 (Medium, 35mm): Lena pushing through airlock, flashlight illuminating derelict walls, floating debris. Panel 3 (Close-Up, 85mm): ORION sphere in bright cyan alert state, Lena eyes wide with wonder and unease. Panel 4 (Medium, 50mm): Eerie beauty of the derelict station, volumetric lighting through cracks. Thin directional arrows between panels. Production storyboard, panel grid layout, sketch aesthetic, panel borders, cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9.',
    },
    {
      board_number: 4,
      duration: 15,
      story_beat: 'Lena discovers the signal source — the station is still inhabited by something beautiful',
      characters_used: ['Commander Lena Vasquez', 'AI Companion ORION'],
      location_used: 'Abandoned Station Omega-9',
      shots: [
        {
          shot_number: 1,
          shot_size: 'Wide',
          lens_feel: '14mm anamorphic',
          movement: 'Crane up revealing scale',
          action: 'Hydroponics bay revealed in full — massive bioluminescent garden filling the station bay, Lena small at the entrance',
          emotion: 'Awe, bittersweet hope',
          dialogue_audio: 'Ambient: gentle hum of living station, signal pattern matching plant bioluminescence pulse',
        },
        {
          shot_number: 2,
          shot_size: 'Medium',
          lens_feel: '50mm',
          movement: 'Slow approach',
          action: 'Lena walking through garden, plants reaching toward her light, ORION flickering with data overload',
          emotion: 'Tender connection across time',
          dialogue_audio: 'ORION: "The signal... it\'s the garden itself. Seventeen years of growth encoded in light."',
        },
        {
          shot_number: 3,
          shot_size: 'Close-Up to Wide pull',
          lens_feel: '35mm',
          movement: 'Pull back from Lena\'s tearful face to wide',
          action: 'Lena smiling through tears, reaching hand out, plants glowing brighter in response, camera pulls back to show her small figure in vast living garden',
          emotion: 'Bittersweet hope, connection found in isolation',
          dialogue_audio: 'Lena: "We\'re not alone. We never were." / Signal pulses warmly',
        },
      ],
      storyboard_prompt: 'Multi-panel production storyboard layout, 4 panels arranged in 2x2 grid on off-white paper. Panel borders with thin black lines. Panel 1 (Wide, 24mm): Massive bioluminescent garden filling space station interior, Lena small figure at entrance, green and amber glow from living plants. Panel 2 (Medium, 35mm): Lena walking through garden, ORION sphere flickering with data beside her, plant tendrils reaching toward light. Panel 3 (Close-Up, 85mm): Lena face showing bittersweet hope, tears welling, bioluminescent light casting green glow on features. Panel 4 (Medium, 50mm): ORION sphere pulsing gently among the plants, connection between technology and organic life. Thin directional arrows between panels. Production storyboard, panel grid layout, sketch aesthetic, panel borders, cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic. Aspect ratio: 16:9.',
    },
  ]);
}

export function getMockSeedancePerBoard(): string {
  return JSON.stringify([
    {
      board_number: 1,
      duration: 15,
      board_prompt: 'Interior Deep Space Vessel Horizon command module, amber panel lighting casting warm pools across brushed steel console, blue starlight filtering through viewport. Commander Lena Vasquez mid-40s Hispanic woman in dark navy flight suit leans toward signal receiver, ORION holographic sphere floating above console casting soft blue glow. Camera slowly pushes through corridor toward command module, transitions to static medium close-up, slight push-in on signal receiver waveform spike reflected in Lena\'s eyes. Subtle head tilt, hand reaching toward receiver, ORION gentle pulse, waveform oscillation. Cinematic drama, anamorphic lens, muted teal/orange palette, shallow depth of field. Style: cinematic.',
      negative_prompt: 'blurry, low quality, text watermark, deformed hands, wrong wardrobe, bright studio lighting, modern interior, outdoor scene, cartoon style',
    },
    {
      board_number: 2,
      duration: 15,
      board_prompt: 'Interior Deep Space Vessel Horizon, same amber and blue lighting. Lena stands at viewport, hand touches ring on silver chain, ORION sphere beside her projecting station schematics in soft blue. Camera slowly orbits around Lena at viewport, static over-shoulder framing, then intimate handheld close-up of hand gripping ring, family photo visible in soft background. Subtle movement: hand touches chain, ORION display rotates, gentle breathing. Cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic.',
      negative_prompt: 'blurry, low quality, text watermark, wrong lighting, bright environment, modern office, casual clothes, cartoon style, anime',
    },
    {
      board_number: 3,
      duration: 15,
      board_prompt: 'Interior Abandoned Station Omega-9, dark corridor lit by emergency strip lighting, zero-G central hub with green bioluminescent glow seeping from hydroponics. Lena floats through airlock with flashlight and keycard, debris drifting around her, ORION sphere bright cyan scanning mode. Camera pushes slowly through airlock, floating zero-G movement, steady tracking close-up on Lena\'s face lit by green glow, hand reaching toward bioluminescent plants. Zero-G floating, debris drift, flashlight beam sweep, bioluminescent pulse. Cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic.',
      negative_prompt: 'blurry, low quality, text watermark, gravity effects, wrong location, bright daylight, clean station, modern technology, wrong wardrobe, cartoon',
    },
    {
      board_number: 4,
      duration: 15,
      board_prompt: 'Interior Abandoned Station Omega-9 hydroponics bay, massive bioluminescent garden filling the space, green and amber glow from living plants, Lena small figure at entrance, ORION sphere flickering with data overload. Camera cranes up revealing scale of the garden, slow forward approach as Lena walks through, plants reaching toward her, then pulls back from close-up of her smiling through tears to wide shot of the entire garden. Plant tendrils slowly reaching, bioluminescent pulsing brighter, Lena walking with wonder, tears forming, ORION flickering. Cinematic drama, anamorphic lens, muted teal/orange palette. Style: cinematic.',
      negative_prompt: 'blurry, low quality, text watermark, harsh lighting, dead plants, horror atmosphere, wrong location, wrong wardrobe, modern interior, cartoon style',
    },
  ]);
}

export function getMockSeedanceContinuous(): string {
  return JSON.stringify({
    total_duration: 60,
    master_prompt: 'Deep Space Vessel Horizon interior, amber panel lighting and blue starlight through viewport, Commander Lena Vasquez mid-40s Hispanic woman in dark navy flight suit. Camera pushes through corridor toward command module where Lena detects a mysterious signal at console, ORION holographic blue sphere alerting. Slow orbit at viewport as Lena debates investigating, hand touching ring on silver chain, ORION displaying station schematics. Push through airlock into Abandoned Station Omega-9, dark corridor with emergency strip lighting, zero-G central hub with green bioluminescent glow from hydroponics, debris drifting, Lena floating with flashlight. Crane up revealing massive bioluminescent garden filling the station interior, green and amber glow, Lena walks through with wonder as plants reach toward her, ORION flickering with data, Lena smiling through tears. Continuous camera movement throughout, subtle character motion, bioluminescent pulsing, zero-G floating. Cinematic drama, anamorphic lens, muted teal/orange palette, shallow depth of field, film grain. Style: cinematic.',
    negative_prompt: 'blurry, low quality, text watermark, deformed hands, inconsistent wardrobe, wrong location, bright studio lighting, modern interior, outdoor scene, cartoon style, anime, camera equipment visible, scene reset, character identity change, lighting inconsistency, gravity in zero-G scenes',
  });
}

export function getMockConsistency(): string {
  return JSON.stringify({
    passed: true,
    issues: [],
  });
}