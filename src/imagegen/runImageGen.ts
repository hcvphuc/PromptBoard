// Main orchestrator for image generation flow
// Sequential: Characters → Locations → Boards

import type { ProjectOutput } from '@/types/output';
import type { ReferenceImage, BoardImage, ImageGenState } from '@/types/pipeline';
import { generateImage, generateImageWithRefs, downloadImageAsDataUrl, startNewChat } from './chatgptBridge';

export type ImageGenProgressCallback = (state: ImageGenState) => void;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runImageGeneration(
  output: ProjectOutput,
  onProgress?: ImageGenProgressCallback,
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

  // ─── Phase 1: Generate Character Reference Images ───
  emit('generating-characters', '');
  for (const char of characters) {
    emit('generating-characters', char.character_name);

    try {
      // Start fresh chat for each image
      await startNewChat();
      await sleep(2000);

      const result = await generateImage(char.prompt);

      if (result.success && result.imageUrl) {
        // Download the image as data URL
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          refImages.push({
            name: char.character_name,
            type: 'character',
            imageDataUrl: dataUrl,
            prompt: char.prompt,
          });
        } else {
          // Fallback: try fetching directly
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
          }
        }
      } else {
        errors.push(`Character "${char.character_name}": ${result.error || 'generation failed'}`);
      }
    } catch (err: any) {
      errors.push(`Character "${char.character_name}": ${String(err)}`);
    }

    completedSteps++;
    emit('generating-characters', char.character_name);

    // Wait between requests to avoid rate limiting
    await sleep(3000);
  }

  // ─── Phase 2: Generate Location Reference Images ───
  emit('generating-locations', '');
  for (const loc of locations) {
    emit('generating-locations', loc.location_name);

    try {
      await startNewChat();
      await sleep(2000);

      const result = await generateImage(loc.prompt);

      if (result.success && result.imageUrl) {
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
          }
        }
      } else {
        errors.push(`Location "${loc.location_name}": ${result.error || 'generation failed'}`);
      }
    } catch (err: any) {
      errors.push(`Location "${loc.location_name}": ${String(err)}`);
    }

    completedSteps++;
    emit('generating-locations', loc.location_name);
    await sleep(3000);
  }

  // ─── Phase 3: Generate Board Images with Reference Images ───
  emit('generating-boards', '');
  for (const board of storyboards) {
    const label = `Board ${board.board_number}`;
    emit('generating-boards', label);

    try {
      await startNewChat();
      await sleep(2000);

      // Find matching reference images
      const charRefs = refImages.filter(
        (r) => r.type === 'character' && board.characters_used.some((c) => c.toLowerCase() === r.name.toLowerCase())
      );
      const locRefs = refImages.filter(
        (r) => r.type === 'location' && r.name.toLowerCase() === board.location_used.toLowerCase()
      );
      const allRefs = [...charRefs, ...locRefs];

      let result;

      if (allRefs.length > 0) {
        // Send with reference images
        const refDataUrls = allRefs.map((r) => r.imageDataUrl);
        // Enhance prompt with reference context
        const enhancedPrompt = buildBoardPrompt(board, allRefs);
        result = await generateImageWithRefs(enhancedPrompt, refDataUrls);
      } else {
        // Text-only generation
        result = await generateImage(board.image_generation_prompt);
      }

      if (result.success && result.imageUrl) {
        const dataUrl = await downloadImageAsDataUrl(result.imageUrl);
        if (dataUrl) {
          boardImages.push({
            boardNumber: board.board_number,
            imageDataUrl: dataUrl,
            prompt: board.image_generation_prompt,
          });
        } else {
          try {
            const resp = await fetch(result.imageUrl);
            const blob = await resp.blob();
            const base64 = await blobToDataUrl(blob);
            boardImages.push({
              boardNumber: board.board_number,
              imageDataUrl: base64,
              prompt: board.image_generation_prompt,
            });
          } catch {
            errors.push(`${label}: board image generated but download failed`);
          }
        }
      } else {
        errors.push(`${label}: ${result.error || 'generation failed'}`);
      }
    } catch (err: any) {
      errors.push(`${label}: ${String(err)}`);
    }

    completedSteps++;
    emit('generating-boards', label);
    await sleep(3000);
  }

  // ─── Phase 4: Done ───
  emit('done', '');
  return { refImages, boardImages };
}

/** Build enhanced board prompt with reference context */
function buildBoardPrompt(board: any, refs: ReferenceImage[]): string {
  const charNames = refs.filter((r) => r.type === 'character').map((r) => r.name);
  const locNames = refs.filter((r) => r.type === 'location').map((r) => r.name);

  let prompt = board.image_generation_prompt;

  if (charNames.length > 0) {
    prompt += `\n\nIMPORTANT: Maintain exact same appearance as the reference image(s) for character(s): ${charNames.join(', ')}. Do not change their facial features, hair, skin tone, wardrobe, or body type.`;
  }
  if (locNames.length > 0) {
    prompt += `\n\nMaintain exact same environment as the reference image(s) for location(s): ${locNames.join(', ')}. Keep the same architecture, lighting, color palette, and atmosphere.`;
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