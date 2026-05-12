import type {
  PodcastExportRow,
  PodcastProject,
  PodcastSlideImage,
  PodcastTranscriptSegment,
} from '@/domain/podcast/model';

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds || 0));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function formatSrtTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function transcriptSegmentsToSrt(segments: PodcastTranscriptSegment[]): string {
  return segments.map((segment, index) => {
    const end = segment.end > segment.start ? segment.end : segment.start + 1;
    return `${index + 1}\n${formatSrtTime(segment.start)} --> ${formatSrtTime(end)}\n${segment.text.trim()}`;
  }).join('\n\n');
}

export function buildTimestampRows(project: PodcastProject): PodcastExportRow[] {
  if (!project.analysis) return [];

  return project.analysis.slide_prompts.map((slide) => ({
    slide: slide.slide_number,
    title: slide.section_title,
    start: formatTime(slide.timestamp_start),
    end: formatTime(slide.timestamp_end),
    start_seconds: slide.timestamp_start,
    end_seconds: slide.timestamp_end,
    display_text: slide.display_text,
  }));
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const [, base64 = ''] = dataUrl.split(',');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function crc32(bytes: Uint8Array): number {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function uint16(value: number): number[] {
  return [value & 255, (value >>> 8) & 255];
}

function uint32(value: number): number[] {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

function createZip(files: { name: string; bytes: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const local = new Uint8Array([
      ...uint32(0x04034b50), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(file.bytes.length), ...uint32(file.bytes.length), ...uint16(name.length), ...uint16(0),
    ]);
    chunks.push(local, name, file.bytes);

    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50), ...uint16(20), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(file.bytes.length), ...uint32(file.bytes.length), ...uint16(name.length), ...uint16(0),
      ...uint16(0), ...uint16(0), ...uint16(0), ...uint32(0), ...uint32(offset),
    ]);
    central.push(centralHeader, name);
    offset += local.length + name.length + file.bytes.length;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array([
    ...uint32(0x06054b50), ...uint16(0), ...uint16(0), ...uint16(files.length), ...uint16(files.length),
    ...uint32(centralSize), ...uint32(offset), ...uint16(0),
  ]);

  const parts = [...chunks, ...central, end].map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy.buffer;
  });
  return new Blob(parts, { type: 'application/zip' });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportTimestampsJson(project: PodcastProject): void {
  const rows = buildTimestampRows(project);
  downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), 'podcast-slide-timestamps.json');
}

export function exportTranscriptSrt(project: PodcastProject): void {
  const srt = project.exports.transcriptSrt || '';
  downloadBlob(new Blob([srt], { type: 'text/plain;charset=utf-8' }), 'podcast-whisper-transcript.srt');
}

export function exportPodcastZip(project: PodcastProject): void {
  const timestampBytes = new TextEncoder().encode(JSON.stringify(buildTimestampRows(project), null, 2));
  const files = [
    ...(project.assets.deckTemplate ? [{ name: 'deck-template.png', bytes: dataUrlToBytes(project.assets.deckTemplate.imageDataUrl) }] : []),
    ...(project.assets.openingStill ? [{ name: 'opening-still.png', bytes: dataUrlToBytes(project.assets.openingStill.imageDataUrl) }] : []),
    ...project.assets.slides.map((image: PodcastSlideImage) => ({
      name: `slide-${String(image.slideNumber).padStart(2, '0')}.png`,
      bytes: dataUrlToBytes(image.imageDataUrl),
    })),
    { name: 'timestamps.json', bytes: timestampBytes },
    ...(project.exports.transcriptSrt ? [{ name: 'transcript.srt', bytes: new TextEncoder().encode(project.exports.transcriptSrt) }] : []),
  ];
  downloadBlob(createZip(files), 'podcast-slides.zip');
}
