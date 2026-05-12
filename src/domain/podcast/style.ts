import type { PodcastOutput, PodcastSettings } from './model.ts';

export const TEMPLATE_STYLE: Record<PodcastSettings['template'], string> = {
  'business-premium': 'business premium podcast deck, dark polished editorial UI, confident typography, subtle data visualization, executive presentation quality',
  'youtube-explainer': 'YouTube explainer presentation, bold clear hierarchy, approachable educational visuals, strong contrast, simple infographic shapes',
  'apple-keynote': 'Apple Keynote style, minimal premium presentation, spacious composition, black and white with one refined accent, elegant typography',
  'news-documentary': 'news documentary presentation, editorial grid, credible visual evidence, restrained lower-third style, data-forward infographics',
  'sticker-social-kit': 'bright sticker-based social carousel kit with collage cards, photo cutouts, emoji stickers, thick outlines, and playful creator content layouts',
  'notebook-scrapbook': 'notebook scrapbook portfolio style with grid paper, taped photos, sticky notes, polaroid frames, hand-drawn arrows, and scanned paper texture',
  'neo-brutalist-deck': 'neo-brutalist presentation deck with oversized typography, thick borders, raw geometric blocks, loud contrast, and intentionally imperfect compositions',
  'editorial-collage': 'futurist editorial collage with magazine spacing, grayscale photo cutouts, symbolic objects, bold headline, and clean off-white composition',
  'paper-cutout-psychology': 'paper cutout psychology carousel with navy and cream torn paper, serif headlines, black-and-white cutout photos, tape, and gentle doodles',
  'vintage-academic-archive': 'vintage academic archive deck with aged paper, muted blue-gray and cream palette, archival photos, scientific diagrams, serif/calligraphic type, and printed grain',
  'cyber-marketing-brutalism': 'cyber marketing brutalist social posts with black and purple neon palette, grayscale cutouts, 3D rings, starbursts, abstract code texture, and high-energy ad layouts',
  'custom-reference': 'follow the uploaded reference/template closely for layout, color, typography mood, spacing, and overall visual language',
};

export const TEMPLATE_STYLE_LOCK: Record<PodcastSettings['template'], string> = {
  'business-premium': [
    'BRAND STYLE LOCK: business premium podcast slide system.',
    'Palette: near-black #050505 background, charcoal #141416 panels, warm yellow #F8C741 accent, off-white #F7F7F2 text, muted gray #A2A2A8 secondary text.',
    'Typography: modern Apple/SF/Inter-like sans-serif, bold compact title, medium-weight keyword labels, no decorative fonts.',
    'Layout: 16px safe margin, strong 8pt grid, one dominant headline area, one clean infographic/image zone, generous negative space, aligned edges.',
    'Image/icon style: premium editorial 3D or photographic illustration, subtle glow, thin-line icons, consistent stroke weight, no cartoon mismatch.',
    'Spacing: airy but compact, clear hierarchy, no crowded dashboard, no random cards.',
  ].join(' '),
  'youtube-explainer': [
    'BRAND STYLE LOCK: YouTube explainer slide system.',
    'Palette: deep navy/black base, bright yellow accent, white primary text, cyan or green secondary accents used sparingly.',
    'Typography: bold readable sans-serif headline, short keyword chips, large enough for mobile viewing.',
    'Layout: strong center-left headline, one simple infographic, one vivid illustration, high contrast, thumbnail-readable composition.',
    'Image/icon style: clean semi-3D educational illustration, simple vector icons, rounded shapes, consistent icon stroke.',
    'Spacing: punchy but uncluttered, maximum 3-5 visible text elements.',
  ].join(' '),
  'apple-keynote': [
    'BRAND STYLE LOCK: Apple Keynote inspired slide system.',
    'Palette: pure black or soft graphite background, white typography, one refined warm yellow accent, no gradients except subtle depth.',
    'Typography: SF Pro-like sans-serif, elegant large title, light body labels, precise hierarchy.',
    'Layout: minimal composition, large negative space, one hero visual, one small infographic or note, strict alignment.',
    'Image/icon style: photoreal or premium minimal 3D, soft shadows, no busy collage, no decorative clipart.',
    'Spacing: spacious, calm, presentation-grade, avoid dense information.',
  ].join(' '),
  'news-documentary': [
    'BRAND STYLE LOCK: news documentary slide system.',
    'Palette: dark newsroom charcoal, off-white text, restrained red or yellow alert accent, muted blue-gray data elements.',
    'Typography: editorial sans-serif, strong headline, small lower-third labels, credible data captions.',
    'Layout: documentary grid, image evidence area, compact chart/infographic area, clean editorial structure without timestamp bars.',
    'Image/icon style: realistic documentary imagery, map/data overlays, thin editorial icons, consistent line weight.',
    'Spacing: structured and factual, no sensational clutter, no fake logos.',
  ].join(' '),
  'sticker-social-kit': [
    'BRAND STYLE LOCK: Sticker Social Kit slide system.',
    'Palette: loud creator colors such as purple, mint, yellow, orange, teal, and off-white with high contrast.',
    'Typography: bold chunky sans-serif, playful all-caps headlines, compact sticker labels, thick white or black outlines.',
    'Layout: social carousel card composition with overlapping photo cutouts, sticker badges, emoji icons, speech bubbles, arrows, and tilted paper panels.',
    'Image/icon style: cutout photos with white sticker stroke, flat emoji-like icons, simple doodle symbols, playful creator toolkit feel.',
    'Slide variants: quote card, checklist card, big question card, photo cutout card, tip list card, CTA card.',
  ].join(' '),
  'notebook-scrapbook': [
    'BRAND STYLE LOCK: Notebook Scrapbook slide system.',
    'Palette: cream notebook paper, blue ink, graphite gray, muted yellow sticky notes, soft red margin line, occasional photo color.',
    'Typography: typewriter serif mixed with handwritten annotations and clean small sans labels.',
    'Layout: grid notebook background, taped polaroids, sticky notes, paper scraps, hand-drawn arrows, circles, underlines, and portfolio mapping structure.',
    'Image/icon style: scanned photos, polaroid frames, stamp marks, pen sketches, QR/card-like notes, tactile paper texture.',
    'Slide variants: research board, timeline note, evidence collage, concept map, annotated photo spread.',
  ].join(' '),
  'neo-brutalist-deck': [
    'BRAND STYLE LOCK: Neo-Brutalist Deck slide system.',
    'Palette: cream, black, cobalt/purple, hot pink, yellow, and occasional orange with hard contrast.',
    'Typography: oversized heavy grotesk, compressed headline blocks, intentionally awkward scale shifts.',
    'Layout: thick borders, raw geometric blocks, loud starbursts, zigzags, rough stage/timeline blocks, asymmetrical split panels.',
    'Image/icon style: cutout portraits, flat shapes, scribbles, sticker symbols, no smooth corporate polish.',
    'Slide variants: proposal cover, team grid, project stages, timeline, progress chart, quote poster, stage detail.',
  ].join(' '),
  'editorial-collage': [
    'BRAND STYLE LOCK: Futurist Editorial Collage slide system.',
    'Palette: off-white/gray editorial base, black typography, orange/red accent halos, muted gray photo cutouts.',
    'Typography: modern editorial sans, strong headline, small label chips, restrained branding.',
    'Layout: large symbolic central collage, circular halo behind subject, floating UI chips, object cutouts, generous negative space.',
    'Image/icon style: grayscale photo cutouts, AI chip/phone/card/object symbols, magazine-like composition, subtle grain.',
    'Slide variants: hero concept, contrast diagram, ecosystem map, quote collage, object metaphor slide.',
  ].join(' '),
  'paper-cutout-psychology': [
    'BRAND STYLE LOCK: Paper Cutout Psychology Carousel slide system.',
    'Palette: deep navy, cream, pale mint, soft beige, muted pink accents, black line doodles.',
    'Typography: expressive serif headlines mixed with small italic labels and understated sans captions.',
    'Layout: torn-paper layers, paper strips behind text, tape pieces, notebook edges, black-and-white cutout photos, large simple message blocks.',
    'Image/icon style: grayscale people cutouts, hand-drawn flowers/hearts/stars, paper texture, therapy/wellness carousel mood.',
    'Slide variants: statement poster, quote card, micro-steps list, reading recommendation, reminder card, myth-busting slide.',
  ].join(' '),
  'vintage-academic-archive': [
    'BRAND STYLE LOCK: Vintage Academic Archive slide system.',
    'Palette: aged cream, dusty blue-gray, sepia, faded ink, muted anatomical red/blue details.',
    'Typography: elegant serif display titles, condensed academic labels, occasional script/calligraphy accent.',
    'Layout: archival education poster, museum board, historical timeline, scientific plates, large portrait/image plus small explanatory text blocks.',
    'Image/icon style: old photos, engraved diagrams, anatomy/science illustrations, faded paper grain, library archive mood.',
    'Slide variants: historical cover, biography timeline, discovery diagram, quote plate, artifact board, thank-you title.',
  ].join(' '),
  'cyber-marketing-brutalism': [
    'BRAND STYLE LOCK: Cyber Marketing Brutalism slide system.',
    'Palette: black, deep purple, neon violet, white, grayscale photography, occasional electric blue highlight.',
    'Typography: bold condensed sans, all-caps marketing headlines, large numbers, aggressive spacing.',
    'Layout: high-energy square/social post layout, grayscale cutout subjects, glowing 3D rings, starbursts, tape strips, abstract code patterns, diagonal blocks.',
    'Image/icon style: cyber ad graphics, 3D metallic loops, neon glow, meme-like grayscale portraits, dramatic contrast.',
    'Slide variants: big-number reason slide, mistake warning, trend card, persona card, top tips card, CTA poster.',
  ].join(' '),
  'custom-reference': [
    'BRAND STYLE LOCK: custom template reference system.',
    'Use the uploaded template/reference as the source of truth for palette, typography mood, icon style, image treatment, spacing, border radius, layout grid, and visual hierarchy.',
    'Every slide must look like it belongs to the same deck as the reference image.',
    'Do not invent a different style, random colors, mismatched fonts, or unrelated icon families.',
  ].join(' '),
};

export const GLOBAL_SLIDE_RULES = [
  'CONSISTENCY RULES: All slides must look like one coherent deck from the same brand system.',
  'Keep the same typography family, title size relationship, accent color, border radius, icon stroke, image treatment, spacing scale, and grid across every slide.',
  'Use only short on-slide text: keywords, labels, and one brief note. Avoid paragraphs.',
  'Render a finished presentation slide image, not a web dashboard screenshot.',
  'No timestamps, no episode labels, no page numbers, no deck/desk labels, no metadata bars, no visible header/footer boilerplate.',
  'When showing speaker names, use only the standalone names; never append Podcast, show, episode, channel, or brand text after the names.',
  'No watermarks, no random logos, no inconsistent color palettes, no mixed illustration styles, no tiny unreadable text, no misspelled text.',
].join(' ');

export function withStyleLock(prompt: string, settings: PodcastSettings): string {
  const styleLock = `${TEMPLATE_STYLE_LOCK[settings.template]} ${GLOBAL_SLIDE_RULES} Aspect ratio: ${settings.aspectRatio}.`;
  if (prompt.includes('BRAND STYLE LOCK')) return prompt;
  return `${prompt}\n\n${styleLock}`;
}

export function buildDeckTemplatePrompt(output: PodcastOutput, settings: PodcastSettings): string {
  const sectionTitles = output.sections.map((section) => section.title).join(', ');
  return `Create ONE master visual style template slide for a podcast presentation deck.

This is not a content slide. It is a clean style reference / master template for the whole deck.

Podcast sections: ${sectionTitles}
Aspect ratio: ${settings.aspectRatio}
Template mode: ${settings.template}

The slide must define a reusable design system:
- consistent typography hierarchy for title, keyword chips, short note, chart labels
- consistent color palette and accent color usage
- consistent spacing grid, margins, alignment, border radius, and card/panel treatment
- consistent infographic/icon style and stroke weight
- consistent image/illustration treatment
- 2-3 empty placeholder content zones that demonstrate where future slide title, key note, infographic, and hero image should go

Use only generic placeholder text such as "Section title", "Keyword", "Key note", "Infographic", not real podcast content.
Make it polished and usable as a visual reference for all following slides.
Do not include header/footer boilerplate, episode labels, deck labels, page numbers, timestamps, metadata strips, or any text like "deck" or "desk".
No logos, no watermarks, no dense paragraphs, no random style changes, no tiny unreadable text.`;
}
