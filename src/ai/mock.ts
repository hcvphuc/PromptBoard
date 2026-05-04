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
      image_generation_prompt: 'Cinematic frame, Deep Space Vessel Horizon interior, Commander Lena Vasquez mid-40s Hispanic woman in dark navy flight suit leaning toward signal receiver device, amber panel lighting, blue starlight through viewport, holographic ORION sphere casting soft blue glow, intense curiosity on weathered face, hard sci-fi aesthetic, 16:9 aspect ratio, film grain, anamorphic lens flare',
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
      image_generation_prompt: 'Cinematic frame, Deep Space Vessel Horizon, Commander Lena Vasquez standing at viewport touching wedding ring on chain, ORION blue holographic sphere nearby displaying station schematics, family photo on console in background, amber and blue lighting, contemplative melancholic mood, hard sci-fi, 16:9, shallow depth of field',
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
      image_generation_prompt: 'Cinematic frame, Abandoned Station Omega-9 interior, Commander Lena Vasquez in navy flight suit floating in zero-G central hub, green bioluminescent plant glow illuminating the scene, floating debris, ORION sphere bright cyan alert state, derelict corridor with emergency strips, eerie beauty, hard sci-fi, 16:9, volumetric lighting',
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
      image_generation_prompt: 'Cinematic frame, Abandoned Station Omega-9 hydroponics bay, massive bioluminescent garden filling space station interior, Commander Lena Vasquez small figure at entrance, green and amber glow from living plants, ORION sphere flickering with data, tendrils reaching toward light, bitters hopeful atmosphere, hard sci-fi meets organic beauty, 16:9, volumetric bioluminescent lighting, film grain',
    },
  ]);
}

export function getMockSeedancePerBoard(): string {
  return JSON.stringify([
    {
      board_number: 1,
      duration: 15,
      scene_setup: 'Interior Deep Space Vessel Horizon command module. Amber panel lighting, blue starlight through viewport. Commander Lena Vasquez in navy flight suit at console. ORION holographic sphere floating above.',
      action_timeline: '0-3s: Camera slowly pushes through corridor toward command module. 3-8s: Lena tilts head, hand reaches toward signal receiver. 8-15s: Close on signal receiver waveform spike, Lena\'s eyes reflected in glass.',
      camera_movement: 'Slow dolly forward through corridor, transition to static medium close-up, slight push-in on close-up',
      motion: 'Subtle: head tilt, hand reach, waveform oscillation, ORION gentle pulse',
      negative_prompt: 'blurry, low quality, text watermark, deformed hands, wrong wardrobe, bright studio lighting, modern interior, outdoor scene, cartoon style',
    },
    {
      board_number: 2,
      duration: 15,
      scene_setup: 'Interior Deep Space Vessel Horizon, same amber and blue lighting. Lena at viewport. ORION sphere beside her showing station schematics. Family photo on console behind.',
      action_timeline: '0-5s: Lena standing at viewport, hand touches ring on chain. 5-10s: ORION displays station schematics, calm blue sphere. 10-15s: Close on Lena\'s hand gripping ring, family photo in soft background.',
      camera_movement: 'Slow orbit around Lena at viewport, static over-shoulder, handheld intimate close-up',
      motion: 'Subtle: hand touches chain, ORION display rotates, gentle breathing',
      negative_prompt: 'blurry, low quality, text watermark, wrong lighting, bright environment, modern office, casual clothes, cartoon style, anime',
    },
    {
      board_number: 3,
      duration: 15,
      scene_setup: 'Interior Abandoned Station Omega-9. Dark corridor, emergency strip lighting. Zero-G central hub. Green bioluminescent glow from hydroponics. Debris floating. ORION bright cyan.',
      action_timeline: '0-5s: Airlock opens, Lena floats through with flashlight and keycard. 5-10s: Drifting through zero-G hub, debris floating around, ORION scanning. 10-15s: Face lit by green glow, hand reaching toward plants.',
      camera_movement: 'Slow push through airlock, floating zero-G camera movement, steady tracking close-up',
      motion: 'Zero-G floating, debris drift, flashlight beam sweep, bioluminescent pulse, plant tendril movement',
      negative_prompt: 'blurry, low quality, text watermark, gravity effects, wrong location, bright daylight, clean station, modern technology, wrong wardrobe, cartoon',
    },
    {
      board_number: 4,
      duration: 15,
      scene_setup: 'Interior Abandoned Station Omega-9 hydroponics bay. Massive bioluminescent garden. Green and amber glow. Lena small at entrance. ORION flickering. Plants reaching toward light.',
      action_timeline: '0-5s: Wide reveal of massive garden, Lena at entrance. 5-10s: Walking through garden, plants reaching toward her, ORION data overload flicker. 10-15s: Lena smiling through tears, hand reaching out, camera pulls back to wide.',
      camera_movement: 'Crane up revealing scale, slow forward approach, pull back from close-up to wide shot',
      motion: 'Plant tendrils slowly reaching, bioluminescent pulsing brighter, Lena walking, tears, ORION flickering, gentle swaying of garden',
      negative_prompt: 'blurry, low quality, text watermark, harsh lighting, dead plants, horror atmosphere, wrong location, wrong wardrobe, modern interior, cartoon style',
    },
  ]);
}

export function getMockSeedanceContinuous(): string {
  return JSON.stringify({
    total_duration: 60,
    scene_description: 'A lone astronaut on the Deep Space Vessel Horizon receives a mysterious signal from an abandoned station. She debates the risk, travels to the derelict station, and discovers a living bioluminescent garden that has been sending the signal for seventeen years. Same characters, wardrobe, and environment throughout. Commander Lena Vasquez in dark navy flight suit with mission patches. ORION holographic blue sphere. Horizon interior with amber and blue lighting. Omega-9 station with green bioluminescent glow.',
    action_timeline: '0-15s: Horizon interior. Lena detects signal at console. ORION alerts. Close on signal receiver.\n15-30s: Horizon viewport. Lena debates with ORION. Touches ring on chain. Decides to investigate.\n30-45s: Omega-9 airlock and zero-G hub. Lena enters station. Discovers bioluminescent plants.\n45-60s: Omega-9 hydroponics bay. Massive garden reveal. Lena reaches toward plants. Bittersweet realization.',
    camera_movement: 'Dolly through corridor → orbit at viewport → push through airlock with floating camera → crane reveal of garden → pull back to wide',
    motion: 'Subtle character movement, zero-G floating, bioluminescent pulsing, plant tendril reaching, ORION sphere state changes, tears forming',
    negative_prompt: 'blurry, low quality, text watermark, deformed hands, inconsistent wardrobe, wrong location, bright studio lighting, modern interior, outdoor scene, cartoon style, anime, camera equipment visible, scene reset, character identity change, lighting inconsistency, gravity in zero-G scenes',
  });
}

export function getMockConsistency(): string {
  return JSON.stringify({
    passed: true,
    issues: [],
  });
}