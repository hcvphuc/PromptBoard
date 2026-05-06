// Main orchestrator for image generation flow
// Sequential: Characters → Locations → Boards

import type { ProjectOutput } from '@/types/output';
import type { ReferenceImage, BoardImage, ImageGenState } from '@/types/pipeline';
import type { PipelineSettings } from '@/types/project';
import { generateImage, generateImageWithRefs, downloadImageAsDataUrl, startNewChatSession } from './chatgptBridge';
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
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          refImages.push({
            name: char.character_name,
            type: 'character',
            imageDataUrl: dataUrl,
            prompt: char.prompt,
          });
        } else {
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
          } catch {
            errors.push(`Character "${char.character_name}": image generated but download failed`);
            logger.warn('ImageGen', `Download failed: ${char.character_name}`, 'Data URL conversion failed');
          }
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
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          refImages.push({
            name: loc.location_name,
            type: 'location',
            imageDataUrl: dataUrl,
            prompt: loc.prompt,
          });
        } else {
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
          } catch {
            errors.push(`Location "${loc.location_name}": image generated but download failed`);
            logger.warn('ImageGen', `Download failed: ${loc.location_name}`, 'Data URL conversion failed');
          }
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
      // Find matching reference images
      const charRefs = refImages.filter(
        (r) => r.type === 'character' && board.characters_used.some((c) => c.toLowerCase() === r.name.toLowerCase())
      );
      const locRefs = refImages.filter(
        (r) => r.type === 'location' && r.name.toLowerCase() === board.location_used.toLowerCase()
      );
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
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          boardImages.push({
            boardNumber: board.board_number,
            imageDataUrl: dataUrl,
            prompt: board.storyboard_prompt,
          });
        } else {
          try {
            const resp = await fetch(result.imageUrl);
            const blob = await resp.blob();
            const base64 = await blobToDataUrl(blob);
            boardImages.push({
              boardNumber: board.board_number,
              imageDataUrl: base64,
              prompt: board.storyboard_prompt,
            });
          } catch {
            errors.push(`${label}: board image generated but download failed`);
            logger.warn('ImageGen', `Download failed: ${label}`, 'Data URL conversion failed');
          }
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
