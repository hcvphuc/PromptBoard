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
        let savedUrl = false;

        // Try ChatGPT context download first
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          refImages.push({
            name: char.character_name,
            type: 'character',
            imageDataUrl: dataUrl,
            prompt: char.prompt,
          });
          savedUrl = true;
        }

        // Fallback: fetch directly
        if (!savedUrl) {
          try {
            const resp = await fetch(result.imageUrl);
            const blob = await resp.blob();
            const base64 = await blobToDataUrl(blob);
            refImages.push({
              name: char.character_name,
              type: 'character',
              imageDataUrl: base64,
              prompt: char.prompt,
            });
            savedUrl = true;
          } catch {
            // Last resort: save URL directly
            logger.warn('ImageGen', `All download methods failed for ${char.character_name}, saving URL directly`);
            refImages.push({
              name: char.character_name,
              type: 'character',
              imageDataUrl: result.imageUrl,
              prompt: char.prompt,
            });
            savedUrl = true;
          }
        }

        if (!savedUrl) {
          errors.push(`Character "${char.character_name}": image generated but all download methods failed`);
          logger.warn('ImageGen', `All download methods failed: ${char.character_name}`);
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
        let savedUrl = false;

        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          refImages.push({
            name: loc.location_name,
            type: 'location',
            imageDataUrl: dataUrl,
            prompt: loc.prompt,
          });
          savedUrl = true;
        }

        if (!savedUrl) {
          try {
            const resp = await fetch(result.imageUrl);
            const blob = await resp.blob();
            const base64 = await blobToDataUrl(blob);
            refImages.push({
              name: loc.location_name,
              type: 'location',
              imageDataUrl: base64,
              prompt: loc.prompt,
            });
            savedUrl = true;
          } catch {
            logger.warn('ImageGen', `All download methods failed for ${loc.location_name}, saving URL directly`);
            refImages.push({
              name: loc.location_name,
              type: 'location',
              imageDataUrl: result.imageUrl,
              prompt: loc.prompt,
            });
            savedUrl = true;
          }
        }

        if (!savedUrl) {
          errors.push(`Location "${loc.location_name}": image generated but all download methods failed`);
          logger.warn('ImageGen', `All download methods failed: ${loc.location_name}`);
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
        let savedUrl = false;

        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          boardImages.push({
            boardNumber: board.board_number,
            imageDataUrl: dataUrl,
            prompt: board.storyboard_prompt,
          });
          savedUrl = true;
        }

        if (!savedUrl) {
          try {
            const resp = await fetch(result.imageUrl);
            const blob = await resp.blob();
            const base64 = await blobToDataUrl(blob);
            boardImages.push({
              boardNumber: board.board_number,
              imageDataUrl: base64,
              prompt: board.storyboard_prompt,
            });
            savedUrl = true;
          } catch {
            logger.warn('ImageGen', `All download methods failed for ${label}, saving URL directly`);
            boardImages.push({
              boardNumber: board.board_number,
              imageDataUrl: result.imageUrl,
              prompt: board.storyboard_prompt,
            });
            savedUrl = true;
          }
        }

        if (!savedUrl) {
          errors.push(`${label}: board image generated but all download methods failed`);
          logger.warn('ImageGen', `All download methods failed: ${label}`);
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

/** Build enhanced board prompt with reference context */
function buildBoardPrompt(board: any, refs: ReferenceImage[]): string {
  const charRefs = refs.filter((r) => r.type === 'character');
  const locRefs = refs.filter((r) => r.type === 'location');

  let prompt = board.storyboard_prompt;

  if (charRefs.length > 0 || locRefs.length > 0) {
    prompt += '\n\n--- REFERENCE IMAGES ATTACHED ---';

    if (charRefs.length > 0) {
      const charDetails = charRefs.map((r) => {
        const boardChar = board.characters_used?.find((c: string) => c.toLowerCase() === r.name.toLowerCase());
        return boardChar ? `${r.name} (see attached reference)` : r.name;
      }).join(', ');
      prompt += `\nCHARACTERS: ${charDetails}. These reference images define the EXACT appearance. Replicate their face, body type, wardrobe, and distinctive features with zero deviation. Do not reinterpret or redesign.`;
    }

    if (locRefs.length > 0) {
      const locNames = locRefs.map((r) => `${r.name} (see attached reference)`).join(', ');
      prompt += `\nLOCATIONS: ${locNames}. These reference images define the EXACT environment. Replicate the architecture, lighting, color palette, atmosphere, and props with zero deviation. Do not reinterpret or redesign.`;
    }
  }

  return prompt;
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

    // Find the board image
    const boardImg = boardImages.find(b => b.boardNumber === board.board_number);
    if (!boardImg) {
      errors.push(`${label}: no storyboard image found — run Image Gen first`);
      logger.warn('ShotExtract', `No board image for ${label}`);
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
          let savedUrl = false;

          // Try download as data URL
          const dataUrl = await downloadImageAsDataUrl(url);
          if (dataUrl) {
            shotImages.push({
              boardNumber: board.board_number,
              shotNumber: shot.shot_number,
              imageDataUrl: dataUrl,
              prompt: shot.master_prompt || '',
            });
            savedUrl = true;
          }

          // Fallback: fetch directly
          if (!savedUrl) {
            try {
              const resp = await fetch(url);
              const blob = await resp.blob();
              const base64 = await blobToDataUrl(blob);
              shotImages.push({
                boardNumber: board.board_number,
                shotNumber: shot.shot_number,
                imageDataUrl: base64,
                prompt: shot.master_prompt || '',
              });
              savedUrl = true;
            } catch {
              logger.warn('ShotExtract', `All download methods failed for shot ${shot.shot_number}, saving URL directly`);
              shotImages.push({
                boardNumber: board.board_number,
                shotNumber: shot.shot_number,
                imageDataUrl: url,
                prompt: shot.master_prompt || '',
              });
              savedUrl = true;
            }
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
