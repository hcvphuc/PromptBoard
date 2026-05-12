import type { ImageProvider } from '@/ai/provider';
import type { PodcastDeckTemplateAsset, PodcastSlideImage } from '@/domain/podcast/model';
import {
  downloadImageAsDataUrl,
  generateImage,
  generateImageWithRefs,
  startNewChatSession,
} from '@/imagegen/chatgptBridge';

export class ChatGPTImageProvider implements ImageProvider {
  name = 'ChatGPT';

  startBatch(): void {
    startNewChatSession();
  }

  async downloadImageAsDataUrl(imageUrl: string): Promise<string | null> {
    return downloadImageAsDataUrl(imageUrl);
  }

  async generateDeckTemplateImageUrl(prompt: string, referenceImages: string[] = []): Promise<{ prompt: string; imageUrl: string }> {
    const result = referenceImages.length > 0
      ? await generateImageWithRefs(prompt, referenceImages)
      : await generateImage(prompt);
    const templateUrl = result.imageUrls?.[result.imageUrls.length - 1] || result.imageUrl;
    if (!result.success || !templateUrl) {
      throw new Error(result.error || 'Deck template generation failed');
    }

    return {
      prompt,
      imageUrl: templateUrl,
    };
  }

  async generateDeckTemplate(prompt: string, referenceImages: string[] = []): Promise<PodcastDeckTemplateAsset> {
    const generated = await this.generateDeckTemplateImageUrl(prompt, referenceImages);

    const imageDataUrl = await this.downloadImageAsDataUrl(generated.imageUrl);
    if (!imageDataUrl) {
      throw new Error('Could not save generated deck template');
    }

    return {
      prompt,
      imageDataUrl,
    };
  }

  async generateSlide(
    slide: { slideNumber: number; sectionTitle: string; timestampStart: number; timestampEnd: number; prompt: string },
    options: { deckTemplateImageDataUrl?: string; referenceImages?: string[] },
  ): Promise<PodcastSlideImage> {
    const refImages = [
      ...(options.referenceImages || []),
      ...(options.deckTemplateImageDataUrl ? [options.deckTemplateImageDataUrl] : []),
    ];

    const prompt = options.deckTemplateImageDataUrl
      ? `${slide.prompt}

STYLE ANCHOR INSTRUCTION: One attached image is the generated master template for this same deck. Use it ONLY as a visual style reference for typography, color palette, spacing, layout grid, border radius, infographic/icon style, image treatment, and overall brand consistency. Do not copy placeholder text, placeholder chart values, or the template composition literally. Create the new slide content for "${slide.sectionTitle}" while matching the same deck design system.

CLEAN SLIDE RULE: Do not render timestamps, episode labels, page numbers, deck/desk labels, metadata bars, header/footer boilerplate, UI chrome, logos, or watermarks. Keep only the actual slide content requested in the prompt.`
      : slide.prompt;

    const result = refImages.length > 0
      ? await generateImageWithRefs(prompt, refImages)
      : await generateImage(prompt);
    const url = result.imageUrls?.[result.imageUrls.length - 1] || result.imageUrl;
    if (!result.success || !url) {
      throw new Error(result.error || `Slide ${slide.slideNumber} image generation failed`);
    }

    const imageDataUrl = await this.downloadImageAsDataUrl(url);
    if (!imageDataUrl) {
      throw new Error(`Could not save slide ${slide.slideNumber}`);
    }

    return {
      slideNumber: slide.slideNumber,
      sectionTitle: slide.sectionTitle,
      timestampStart: slide.timestampStart,
      timestampEnd: slide.timestampEnd,
      prompt: slide.prompt,
      imageDataUrl,
    };
  }

  async generateOpeningStill(
    slide: { prompt: string },
    options: { deckTemplateImageDataUrl?: string; referenceImages: string[] },
  ): Promise<PodcastSlideImage> {
    const refImages = options.referenceImages;
    const prompt = options.deckTemplateImageDataUrl
      ? `${slide.prompt}

STYLE ANCHOR INSTRUCTION: Match the deck's color palette, typography mood, lighting polish, and production quality, but make this a realistic opening podcast still frame, not a slide layout.`
      : slide.prompt;
    const result = await generateImageWithRefs(prompt, refImages);
    const url = result.imageUrls?.[result.imageUrls.length - 1] || result.imageUrl;
    if (!result.success || !url) {
      throw new Error(result.error || 'Opening still frame generation failed');
    }

    const imageDataUrl = await this.downloadImageAsDataUrl(url);
    if (!imageDataUrl) {
      throw new Error('Could not save opening still frame');
    }

    return {
      slideNumber: 0,
      sectionTitle: 'Opening Still Frame',
      timestampStart: 0,
      timestampEnd: 0,
      prompt: slide.prompt,
      imageDataUrl,
    };
  }
}
