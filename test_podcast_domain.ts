import assert from 'node:assert/strict';
import { parsePodcast } from './src/domain/podcast/parser.ts';
import { applyTranscriptTiming, attachSlideTiming, estimateScriptOnlyDuration } from './src/domain/podcast/timing.ts';
import { buildMockPodcast } from './src/domain/podcast/mock.ts';
import { DEFAULT_PODCAST_SETTINGS } from './src/domain/podcast/model.ts';

const parsed = parsePodcast({
  title: 'Podcast',
  summary: 'Summary',
  sections: [
    {
      section_number: 1,
      title: 'Intro',
      duration_weight: 1,
    },
    {
      section_number: 2,
      title: 'Main',
      duration_weight: 2,
    },
  ],
  slide_prompts: [
    {
      slide_number: 1,
      section_title: 'Intro',
      display_text: ['A'],
      prompt: 'Prompt A',
      negative_prompt: 'None',
    },
    {
      slide_number: 2,
      section_title: 'Main',
      display_text: ['B'],
      prompt: 'Prompt B',
      negative_prompt: 'None',
    },
  ],
});

assert.equal(parsed.sections.length, 2);
assert.equal(parsed.slide_prompts.length, 2);

const transcriptSegments = [
  { index: 0, start: 0, end: 8, text: 'Intro' },
  { index: 1, start: 8, end: 20, text: 'Main' },
];

const timedSections = applyTranscriptTiming([
  { ...parsed.sections[0], transcript_start_segment: 0, transcript_end_segment: 0, start_time: 0, end_time: 0 },
  { ...parsed.sections[1], transcript_start_segment: 1, transcript_end_segment: 1, start_time: 0, end_time: 0 },
], transcriptSegments, 20);

assert.equal(timedSections[0].start_time, 0);
assert.equal(timedSections[0].end_time, 8);
assert.equal(timedSections[1].start_time, 8);
assert.equal(timedSections[1].end_time, 20);

const timedSlides = attachSlideTiming(parsed.slide_prompts, timedSections, 20);
assert.equal(timedSlides[1].timestamp_end, 20);

const estimatedDuration = estimateScriptOnlyDuration('Host A: Opening\nHost B: Main point\nHost A: Closing');
const scriptOnlySections = applyTranscriptTiming(parsed.sections, [], estimatedDuration);
const scriptOnlySlides = attachSlideTiming(parsed.slide_prompts, scriptOnlySections, estimatedDuration);
assert.ok(estimatedDuration >= 90);
assert.equal(scriptOnlySections[0].start_time, 0);
assert.ok(scriptOnlySections[0].end_time > 0);
assert.equal(scriptOnlySlides[1].timestamp_end, estimatedDuration);

const mock = buildMockPodcast({
  audioDuration: 60,
  settings: DEFAULT_PODCAST_SETTINGS,
  transcriptSegments,
});

assert.equal(mock.slide_prompts.length, 3);
assert.equal(mock.template, DEFAULT_PODCAST_SETTINGS.template);

console.log('podcast domain smoke tests passed');
