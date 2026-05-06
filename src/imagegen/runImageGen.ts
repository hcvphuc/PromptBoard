// Main orchestrator for image generation flow
// Sequential: Characters → Locations → Boards

import type { ProjectOutput } from '@/types/output';
import type { ReferenceImage, BoardImage, ShotImage, ImageGenState } from '@/types/pipeline';
import type { PipelineSettings } from '@/types/project';
import { generateImage, generateImageWithRefs, downloadImageAsDataUrl, startNewChatSession, extractShotsFromBoard } from './chatgptBridge';
import { logger } from '@/logger/logger';

export type ImageGenProgressCallback = (state: ImageGenState) => void;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(minSec: number, maxSec: number): Promise<void> {
  const sec = minSec + Math.random() * (maxSec - minSec);
  const ms = Math.round(sec * 1000);
  logger.info('ImageGen', `Anti-spam delay: ${(ms / 1000).toFixed(1)}s`);
  return sleep(ms);
}

/** Download image from ChatGPT tab as data URL — NEVER saves raw URL.
 *  Tries downloadImageAsDataUrl (content script context) with 1 retry.
 *  If all attempts fail, returns null (caller should skip the image).
 */
async function ensureDataUrl(imageUrl: string, label: string): Promise<string | null> {
  // Attempt 1: download via content script (ChatGPT tab context, has cookies)
  let dataUrl = await downloadImageAsDataUrl(imageUrl);
  if (dataUrl) return dataUrl;

  logger.warn('ImageGen', `First download failed for ${label}, retrying via content script...`);
  await sleep(2000);

  // Attempt 2: retry via content script
  dataUrl = await downloadImageAsDataUrl(imageUrl);
  if (dataUrl) return dataUrl;

  // Attempt 3: try fetch + blob (may work for non-auth URLs)
  try {
    const resp = await fetch(imageUrl);
    if (resp.ok) {
      const blob = await resp.blob();
      const base64 = await blobToDataUrl(blob);
      if (base64.startsWith('data:')) return base64;
    }
  } catch {
    // fetch failed too
  }

  // All methods failed — DO NOT save raw URL (it won't display outside ChatGPT tab)
  logger.error('ImageGen', `All download methods failed for ${label} — image skipped`);
  return null;
}

export async function runImageGeneration(
  output: ProjectOutput,
  onProgress?: ImageGenProgressCallback,
  settings?: PipelineSettings,
): Promise<{ refImages: ReferenceImage[]; boardImages: BoardImage[] }> {
  const characters = output.characters || [];
  const locations = output.locations || [];
  const storyboards = output.storyboards || [];

  const totalSteps = characters.length + locations.length + storyboards.length;
  let completedSteps = 0;

  const refImages: ReferenceImage[] = [];
  const boardImages: BoardImage[] = [];
  const errors: string[] = [];

  const emit = (phase: ImageGenState['phase'], currentItem: string) => {
    onProgress?.({
      phase,
      currentItem,
      progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      totalSteps,
      completedSteps,
      refImages: [...refImages],
      boardImages: [...boardImages],
      shotImages: [],
      errors: [...errors],
    });
  };

  // Anti-spam delay settings
  const delayMin = settings?.sendDelayMin ?? 5;
  const delayMax = settings?.sendDelayMax ?? 30;

  // ─── Phase 0: Start new ChatGPT session ───
  startNewChatSession();
  logger.info('ImageGen', 'Starting new ChatGPT session for this batch');

  // ─── Phase 1: Generate Character Reference Images ───
  emit('generating-characters', '');
  logger.info('ImageGen', 'Phase 1: Starting character image generation', `${characters.length} characters`);
  for (const char of characters) {
    emit('generating-characters', char.character_name);

    try {
      logger.info('ImageGen', `Generating character: ${char.character_name}`);

      const result = await generateImage(char.prompt);

      if (result.success && result.imageUrl) {
        logger.info('ImageGen', `Generated character: ${char.character_name}`, `URL: ${result.imageUrl.slice(0, 80)}...`);

        const dataUrl = await ensureDataUrl(result.imageUrl, `character ${char.character_name}`);
        if (dataUrl) {
          refImages.push({
            name: char.character_name,
            type: 'character',
            imageDataUrl: dataUrl,
            prompt: char.prompt,
          });
        } else {
          errors.push(`Character "${char.character_name}": image generated but download failed`);
        }
      } else {
        errors.push(`Character "${char.character_name}": ${result.error || 'generation failed'}`);
        logger.error('ImageGen', `Failed: ${char.character_name}`, result.error || 'generation failed');
      }
    } catch (err: any) {
      errors.push(`Character "${char.character_name}": ${String(err)}`);
      logger.error('ImageGen', `Error: ${char.character_name}`, String(err));
    }

    completedSteps++;
    emit('generating-characters', char.character_name);
    await randomDelay(delayMin, delayMax);
  }

  // ─── Phase 2: Generate Location Reference Images ───
  emit('generating-locations', '');
  logger.info('ImageGen', 'Phase 2: Starting location image generation', `${locations.length} locations`);
  for (const loc of locations) {
    emit('generating-locations', loc.location_name);

    try {
      logger.info('ImageGen', `Generating location: ${loc.location_name}`);

      const result = await generateImage(loc.prompt);

      if (result.success && result.imageUrl) {
        logger.info('ImageGen', `Generated location: ${loc.location_name}`, `URL: ${result.imageUrl.slice(0, 80)}...`);

        const dataUrl = await ensureDataUrl(result.imageUrl, `location ${loc.location_name}`);
        if (dataUrl) {
          refImages.push({
            name: loc.location_name,
            type: 'location',
            imageDataUrl: dataUrl,
            prompt: loc.prompt,
          });
        } else {
          errors.push(`Location "${loc.location_name}": image generated but download failed`);
        }
      } else {
        errors.push(`Location "${loc.location_name}": ${result.error || 'generation failed'}`);
        logger.error('ImageGen', `Failed: ${loc.location_name}`, result.error || 'generation failed');
      }
    } catch (err: any) {
      errors.push(`Location "${loc.location_name}": ${String(err)}`);
      logger.error('ImageGen', `Error: ${loc.location_name}`, String(err));
    }

    completedSteps++;
    emit('generating-locations', loc.location_name);
    await randomDelay(delayMin, delayMax);
  }

  // ─── Phase 3: Generate Board Images with Reference Images ───
  emit('generating-boards', '');
  logger.info('ImageGen', 'Phase 3: Starting board image generation', `${storyboards.length} boards`);
  for (const board of storyboards) {
    const label = `Board ${board.board_number}`;
    emit('generating-boards', label);

    try {
      // Find matching reference images (dedup by name)
      const seenNames = new Set<string>();
      const charRefs = refImages.filter(
        (r) => r.type === 'character' && board.characters_used.some((c) => c.toLowerCase() === r.name.toLowerCase())
      ).filter(r => {
        if (seenNames.has(r.name.toLowerCase())) return false;
        seenNames.add(r.name.toLowerCase());
        return true;
      });
      const locRefs = refImages.filter(
        (r) => r.type === 'location' && r.name.toLowerCase() === board.location_used.toLowerCase()
      ).filter(r => {
        if (seenNames.has(r.name.toLowerCase())) return false;
        seenNames.add(r.name.toLowerCase());
        return true;
      });
      const allRefs = [...charRefs, ...locRefs];

      logger.info('ImageGen', `Generating: ${label}`, allRefs.length > 0 ? `${allRefs.length} ref images attached` : 'No refs');

      let result;
      let retries = 0;
      const maxRetries = 2;

      if (allRefs.length > 0) {
        const refDataUrls = allRefs.map((r) => r.imageDataUrl);
        const enhancedPrompt = buildBoardPrompt(board, allRefs);
        result = await generateImageWithRefs(enhancedPrompt, refDataUrls);

        // Retry on "Already running" — wait for content script to finish
        while (result.error === 'Already running' && retries < maxRetries) {
          logger.info('ImageGen', `Retry ${retries + 1}: ${label} (Already running — waiting 30s)`);
          await sleep(30000);
          result = await generateImageWithRefs(enhancedPrompt, refDataUrls);
          retries++;
        }
      } else {
        result = await generateImage(board.storyboard_prompt);

        while (result.error === 'Already running' && retries < maxRetries) {
          logger.info('ImageGen', `Retry ${retries + 1}: ${label} (Already running — waiting 30s)`);
          await sleep(30000);
          result = await generateImage(board.storyboard_prompt);
          retries++;
        }
      }

      if (result.success && result.imageUrl) {
        logger.info('ImageGen', `Generated board: ${label}`, `URL: ${result.imageUrl.slice(0, 80)}...`);

        const dataUrl = await ensureDataUrl(result.imageUrl, `board ${label}`);
        if (dataUrl) {
          boardImages.push({
            boardNumber: board.board_number,
            imageDataUrl: dataUrl,
            prompt: board.storyboard_prompt,
          });
        } else {
          errors.push(`${label}: board image generated but download failed`);
        }
      } else {
        errors.push(`${label}: ${result.error || 'generation failed'}`);
        logger.error('ImageGen', `Failed: ${label}`, result.error || 'generation failed');
      }
    } catch (err: any) {
      errors.push(`${label}: ${String(err)}`);
      logger.error('ImageGen', `Error: ${label}`, String(err));
    }

    completedSteps++;
    emit('generating-boards', label);
    await randomDelay(delayMin, delayMax);
  }

  // ─── Phase 4: Done ───
  emit('done', '');
  logger.info('ImageGen', 'Image generation complete!', `${refImages.length} ref images, ${boardImages.length} board images, ${errors.length} errors`);
  return { refImages, boardImages };
}

/** Build enhanced board prompt with reference context - NO text appended, refs are sent as image attachments only */
function buildBoardPrompt(board: any, refs: ReferenceImage[]): string {
  // Just return the storyboard_prompt as-is
  // Reference images are sent as separate image attachments in the ChatGPT message
  return board.storyboard_prompt;
}

/** Convert Blob to data URL */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Extract shots from storyboard multi-panel images via ChatGPT.
 *  Sends each board image + extract prompt → ChatGPT returns individual shot images.
 */
export async function extractShotsFromBoards(
  output: ProjectOutput,
  boardImages: BoardImage[],
  onProgress?: (state: ImageGenState) => void,
): Promise<{ shotImages: ShotImage[]; errors: string[] }> {
  const storyboards = output.storyboards || [];
  const shotImages: ShotImage[] = [];
  const errors: string[] = [];

  const totalSteps = storyboards.length;
  let completedSteps = 0;

  const emit = (currentItem: string) => {
    onProgress?.({
      phase: 'extracting-shots',
      currentItem,
      progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      totalSteps,
      completedSteps,
      refImages: [],
      boardImages: [],
      shotImages: [...shotImages],
      errors: [...errors],
    });
  };

  for (const board of storyboards) {
    const label = `Board ${board.board_number}`;
    emit(label);

    // Find the board image — validate it's a real data URL, not a raw ChatGPT URL
    const boardImg = boardImages.find(b => b.boardNumber === board.board_number);
    if (!boardImg) {
      errors.push(`${label}: no storyboard image found — run Image Gen first`);
      logger.warn('ShotExtract', `No board image for ${label}`);
      completedSteps++;
      continue;
    }

    // Validate: board image must be a data URL (raw ChatGPT URLs won't display)
    if (!boardImg.imageDataUrl || !boardImg.imageDataUrl.startsWith('data:')) {
      errors.push(`${label}: storyboard image URL is invalid (not a data URL) — regenerate board image`);
      logger.error('ShotExtract', `Board image for ${label} is not a data URL: ${(boardImg.imageDataUrl || '').slice(0, 60)}`);
      completedSteps++;
      continue;
    }

    const shotCount = board.shots.length;
    if (shotCount === 0) {
      errors.push(`${label}: no shots defined — run Breakdown first`);
      logger.warn('ShotExtract', `No shots for ${label}`);
      completedSteps++;
      continue;
    }

    try {
      logger.info('ShotExtract', `Extracting ${shotCount} shots from ${label}`);

      const result = await extractShotsFromBoard(boardImg.imageDataUrl, shotCount, board.board_number);

      if (result.success && result.imageUrls && result.imageUrls.length > 0) {
        // Download each shot image
        for (let i = 0; i < result.imageUrls.length; i++) {
          const shot = board.shots[i];
          if (!shot) break;

          const url = result.imageUrls[i];
          const dataUrl = await ensureDataUrl(url, `shot ${shot.shot_number} (board ${board.board_number})`);
          if (dataUrl) {
            shotImages.push({
              boardNumber: board.board_number,
              shotNumber: shot.shot_number,
              imageDataUrl: dataUrl,
              prompt: shot.master_prompt || '',
            });
          } else {
            errors.push(`${label}: shot ${shot.shot_number} generated but download failed`);
          }
        }
        logger.info('ShotExtract', `Extracted ${result.imageUrls.length} shots from ${label}`);
      } else {
        errors.push(`${label}: ${result.error || 'shot extraction failed'}`);
        logger.error('ShotExtract', `Failed: ${label}`, result.error || 'extraction failed');
      }
    } catch (err: any) {
      errors.push(`${label}: ${String(err)}`);
      logger.error('ShotExtract', `Error: ${label}`, String(err));
    }

    completedSteps++;
    emit(label);
    await randomDelay(5, 15);
  }

  logger.info('ShotExtract', 'Shot extraction complete', `${shotImages.length} shots, ${errors.length} errors`);
  return { shotImages, errors };
}
