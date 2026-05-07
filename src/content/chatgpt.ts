// Content script for chatgpt.com — injected via chrome.scripting.executeScript
// Handles: text prompt submission, image generation, image download, reference image paste

let isRunning = false;
let runningSince = 0;

// Auto-recovery: clear isRunning after 5 minutes regardless
setInterval(() => {
  if (isRunning && Date.now() - runningSince > 300000) {
    console.warn('[PromptBoard] Auto-recovery: clearing isRunning after 5min timeout');
    isRunning = false;
  }
}, 60000);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RESET_STATE') {
    isRunning = false;
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'SEND_PROMPT_TO_CHATGPT') {
    if (isRunning) {
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    runningSince = Date.now();
    fillAndSubmitChatGPT(message.text)
      .then(() => sendResponse({ success: true, conversationUrl: window.location.href }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
      .finally(() => { isRunning = false; });
    return true;
  }

  if (message.type === 'GENERATE_IMAGE') {
    if (isRunning) {
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    runningSince = Date.now();
    generateImageFlow(message.text)
      .then((result) => sendResponse({ ...result, conversationUrl: window.location.href }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
      .finally(() => { isRunning = false; });
    return true;
  }

  if (message.type === 'GENERATE_IMAGE_WITH_REFS') {
    if (isRunning) {
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    runningSince = Date.now();
    generateImageWithRefsFlow(message.text, message.refImages || [])
      .then((result) => sendResponse({ ...result, conversationUrl: window.location.href }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
      .finally(() => { isRunning = false; });
    return true;
  }

  if (message.type === 'DOWNLOAD_IMAGE') {
    downloadImageAsDataUrl(message.imageUrl)
      .then((dataUrl) => sendResponse({ success: true, imageDataUrl: dataUrl }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'EXTRACT_SHOTS') {
    if (isRunning) {
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    runningSince = Date.now();
    extractShotsFlow(message.text, message.refImages || [], message.expectedCount || 4)
      .then((result) => sendResponse({ ...result, conversationUrl: window.location.href }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
      .finally(() => { isRunning = false; });
    return true;
  }

  return false;
});

// ─── Helpers ───

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function realClick(el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
  el.dispatchEvent(new MouseEvent('pointerdown', opts));
  el.dispatchEvent(new MouseEvent('mousedown', opts));
  el.dispatchEvent(new MouseEvent('pointerup', opts));
  el.dispatchEvent(new MouseEvent('mouseup', opts));
  el.dispatchEvent(new MouseEvent('click', opts));
}

async function waitFor<T>(finder: () => T | null, timeoutMs: number, label: string): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = finder();
    if (el) return el;
    await sleep(300);
  }
  const last = finder();
  if (last) return last;
  throw new Error(`Timeout: ${label} (${timeoutMs}ms)`);
}

function findChatInput(): HTMLElement | null {
  for (const sel of [
    '#prompt-textarea',
    'div[contenteditable="true"][data-id]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"][data-placeholder]',
    'div[role="textbox"][contenteditable="true"]',
  ]) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el && el.offsetParent !== null) return el;
  }
  for (const el of document.querySelectorAll('div[contenteditable="true"]')) {
    const h = el as HTMLElement;
    if (h.offsetParent !== null && h.getBoundingClientRect().top > window.innerHeight * 0.4) return h;
  }
  return null;
}

// ─── Image Detection: Per-Message Approach ───
// 
// KEY INSIGHT: Instead of comparing DOM-wide image snapshots (which picks up
// images from ALL assistant messages, including previous character/location
// generations), we count assistant messages BEFORE sending, then wait for a
// NEW assistant message to appear, and only capture images from THAT message.
//
// This completely eliminates cross-contamination between generation phases.

/** Get all assistant message elements in the conversation */
function getAssistantMessages(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
}

/** Count assistant messages currently in the DOM */
function countAssistantMessages(): number {
  return getAssistantMessages().length;
}

/** Get images from a specific assistant message element.
 *  Filters out tiny icons, emojis, and UI chrome images.
 *  Only returns "real" content images (likely generated images). */
function getImagesFromMessage(msgEl: HTMLElement): HTMLImageElement[] {
  const imgs = Array.from(msgEl.querySelectorAll('img'));
  return imgs.filter(img => {
    const src = img.src || img.getAttribute('src') || '';
    // Skip data URIs that are tiny (likely icons/emoji)
    if (src.startsWith('data:') && src.length < 1000) return false;
    // Skip SVG icons
    if (src.includes('svg') || src.endsWith('.svg')) return false;
    // Skip very small images (likely UI elements)
    const w = img.naturalWidth || img.width || img.clientWidth;
    const h = img.naturalHeight || img.height || img.clientHeight;
    if (w > 0 && h > 0 && w < 30 && h < 30) return false;
    // Skip known UI image patterns
    if (src.includes('favicon') || src.includes('avatar') || src.includes('logo')) return false;
    return true;
  });
}

/** Wait for a NEW assistant message to appear (count > beforeCount).
 *  Returns the new message element. */
async function waitForNewAssistantMessage(
  timeoutMs: number,
  beforeCount: number,
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const messages = getAssistantMessages();
    if (messages.length > beforeCount) {
      // Return the LAST message (newest)
      return messages[messages.length - 1];
    }
    await sleep(1000);
  }
  throw new Error('Timeout waiting for new assistant message');
}

/** Wait for images to appear in a specific message and stabilize.
 *  Returns the image src URLs once they've been stable for `stableMs`.
 *  If no images appear after the message finishes, returns empty array. */
async function waitForImagesInMessage(
  msgEl: HTMLElement,
  timeoutMs: number,
  stableMs: number = 2000,
  minImages: number = 1,
): Promise<string[]> {
  const start = Date.now();
  let lastSrcs: string[] = [];
  let lastChangeTime = Date.now();

  // Wait a bit for initial rendering
  await sleep(2000);

  while (Date.now() - start < timeoutMs) {
    const imgs = getImagesFromMessage(msgEl);
    const currentSrcs = imgs
      .map(img => img.src || img.getAttribute('src') || '')
      .filter(src => src.length > 0);

    if (currentSrcs.length >= minImages) {
      if (currentSrcs.length !== lastSrcs.length || JSON.stringify(currentSrcs) !== JSON.stringify(lastSrcs)) {
        // List changed — reset stability timer
        lastSrcs = currentSrcs;
        lastChangeTime = Date.now();
      } else if (Date.now() - lastChangeTime >= stableMs) {
        // Images have been stable — these are the final images
        console.log(`[PromptBoard] Detected ${lastSrcs.length} stable image(s) in message`);
        await sleep(500); // Extra settle
        return lastSrcs;
      }
    }

    // Check if message is "finished" (no streaming indicator)
    // ChatGPT shows a "Stop generating" button while streaming
    const stopBtn = document.querySelector('button[aria-label="Stop generating"]');
    if (!stopBtn && currentSrcs.length > 0 && Date.now() - lastChangeTime >= stableMs) {
      // Message finished and images are stable
      console.log(`[PromptBoard] Message finished with ${currentSrcs.length} image(s)`);
      return currentSrcs;
    }

    // Message finished with NO images at all (text-only response or failed generation)
    if (!stopBtn && Date.now() - start > 15000) {
      // Re-check the message — maybe images haven't loaded yet
      const recheckImgs = getImagesFromMessage(msgEl);
      if (recheckImgs.length === 0) {
        // Check if there's a "regenerate" button — that means generation completed
        const regenBtn = msgEl.querySelector('button[aria-label*="egenerate"], button[data-testid*="regenerate"]');
        if (regenBtn || !stopBtn) {
          // Wait a bit more — sometimes images load after text
          if (Date.now() - start > 30000 && currentSrcs.length === 0) {
            console.warn('[PromptBoard] No images found in message after 30s — generation may have failed');
            return [];
          }
        }
      }
    }

    await sleep(1500);
  }

  // Timeout — return whatever we found
  if (lastSrcs.length > 0) {
    console.warn(`[PromptBoard] Timeout but returning ${lastSrcs.length} image(s) from message`);
    return lastSrcs;
  }

  return [];
}

// ─── Original flow: text prompt only ───

async function fillAndSubmitChatGPT(text: string): Promise<void> {
  // STEP 1: Fill prompt
  const inputEl = await waitFor(findChatInput, 10000, 'chat input');
  inputEl.focus();
  await sleep(100);
  document.execCommand('selectAll', false);
  document.execCommand('delete', false);
  await sleep(50);
  inputEl.focus();
  document.execCommand('insertText', false, text);
  await sleep(500);

  // Verify
  if (!(inputEl.textContent || '').trim()) {
    await navigator.clipboard.writeText(text);
    inputEl.focus();
    document.execCommand('selectAll', false);
    document.execCommand('paste', false);
    await sleep(500);
  }

  // STEP 2: Click Plus button
  const plusBtn = await waitFor(
    () => document.querySelector('button[data-testid="composer-plus-btn"]') as HTMLButtonElement | null,
    5000, 'Plus button'
  );
  realClick(plusBtn);
  await sleep(1500);

  // STEP 3: Click "Create image"
  const createImageBtn = await waitFor(
    () => {
      const items = document.querySelectorAll('div[role="menuitemradio"]');
      for (const item of items) {
        const t = item.querySelector('div.truncate');
        if (t && t.textContent?.trim() === 'Create image') return item as HTMLElement;
      }
      const all = document.querySelectorAll('div.truncate');
      for (const t of all) {
        if (t.textContent?.trim() === 'Create image') {
          return (t.closest('[role="menuitemradio"]') || t.closest('[role="menuitem"]') || t) as HTMLElement;
        }
      }
      return null;
    },
    8000, 'Create image'
  );
  realClick(createImageBtn);
  await sleep(1500);

  // STEP 4: Click Aspect ratio dropdown
  const aspectBtn = await waitFor(
    () => document.querySelector('button[aria-label="Choose image aspect ratio"]') as HTMLButtonElement | null,
    5000, 'Aspect ratio button'
  );
  realClick(aspectBtn);
  await sleep(500);

  // STEP 5: Select Widescreen 16:9
  const widescreen = await waitFor(
    () => {
      for (const btn of document.querySelectorAll('button, [role="menuitemradio"], [role="menuitem"], [role="option"]')) {
        if (btn.textContent?.includes('Widescreen')) return btn as HTMLElement;
      }
      return null;
    },
    5000, 'Widescreen option'
  );
  realClick(widescreen);
  await sleep(500);

  // STEP 6: Click Send — with Enter key fallback
  let sent = false;

  try {
    const sendBtn = await waitFor(
      () => {
        const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
        if (b1 && !b1.disabled) return b1;
        const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
        if (b2 && !b2.disabled) return b2;
        return null;
      },
      120000, 'Send button'
    );
    realClick(sendBtn);
    sent = true;
  } catch {
    console.warn('[PromptBoard] Send button not found, trying Enter fallback');
  }

  if (!sent) {
    const inputEl = findChatInput();
    if (inputEl) {
      inputEl.focus();
      await sleep(200);
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      await sleep(100);
      inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }
  }
}

// ─── Generate Image flow: fill + Create image + send + wait for result ───
// FIXED: Uses per-message image detection to avoid cross-contamination

async function generateImageFlow(prompt: string): Promise<{ success: boolean; imageUrl?: string; imageUrls?: string[]; error?: string }> {
  try {
    // Count assistant messages BEFORE sending
    const msgCountBefore = countAssistantMessages();
    console.log(`[PromptBoard] generateImageFlow: ${msgCountBefore} assistant messages before`);

    // Fill and submit with "Create image" mode
    await fillAndSubmitChatGPT(prompt);

    // Wait for a NEW assistant message to appear
    const newMsg = await waitForNewAssistantMessage(240000, msgCountBefore);
    console.log('[PromptBoard] New assistant message detected');

    // Wait for images in THAT specific message only
    const imageUrls = await waitForImagesInMessage(newMsg, 240000, 2000, 1);

    if (imageUrls.length === 0) {
      return { success: false, error: 'No image generated in response' };
    }

    return {
      success: true,
      imageUrl: imageUrls[imageUrls.length - 1],
      imageUrls,
    };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Generate Image with Reference Images: multiple attachment methods ───
// FIXED: Uses per-message image detection to avoid cross-contamination

async function generateImageWithRefsFlow(
  prompt: string,
  refImageDataUrls: string[]
): Promise<{ success: boolean; imageUrl?: string; imageUrls?: string[]; error?: string }> {
  try {
    // Count assistant messages BEFORE sending
    const msgCountBefore = countAssistantMessages();
    console.log(`[PromptBoard] generateImageWithRefsFlow: ${msgCountBefore} assistant messages before`);

    // STEP 1: Focus chat input area
    const inputEl = await waitFor(findChatInput, 10000, 'chat input');
    inputEl.focus();
    await sleep(300);

    // STEP 2: Attach reference images — try multiple methods
    let attached = false;

    // Method 1: Clipboard paste (most reliable with React apps)
    if (!attached) {
      attached = await attachViaClipboard(inputEl, refImageDataUrls);
    }

    // Method 2: File input trigger via Plus/Attach button
    if (!attached) {
      attached = await attachViaFileInput(inputEl, refImageDataUrls);
    }

    // Method 3: Synthetic DragEvent drop (fallback)
    if (!attached) {
      const dropZone = findDropZone();
      if (dropZone) {
        attached = await attachViaDrop(dropZone, refImageDataUrls);
      }
    }

    if (!attached) {
      console.warn('[PromptBoard] All attachment methods failed — generating without refs');
    }

    // Wait for attachments to be processed
    await sleep(3000);

    // Verify attachments appeared in DOM
    await waitForAttachmentIndicator(5000);

    // STEP 3: Type the prompt after attaching images
    inputEl.focus();
    await sleep(200);
    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
    await sleep(50);
    inputEl.focus();
    document.execCommand('insertText', false, prompt);
    await sleep(500);

    // Verify text was inserted
    if (!(inputEl.textContent || '').trim()) {
      await navigator.clipboard.writeText(prompt);
      inputEl.focus();
      document.execCommand('selectAll', false);
      document.execCommand('paste', false);
      await sleep(500);
    }

    let sent = false;

    // Try 1: Find Send button (120s timeout — ChatGPT can be slow with refs)
    try {
      const sendBtn = await waitFor(
        () => {
          const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
          if (b1 && !b1.disabled) return b1;
          const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
          if (b2 && !b2.disabled) return b2;
          const b3 = document.querySelector('button[aria-label="Stop generating"]') as HTMLButtonElement | null;
          if (b3) return b3;
          const b4 = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
          if (b4 && !b4.disabled) return b4;
          return null;
        },
        120000, 'Send button (with refs)'
      );

      const isStopBtn = sendBtn.getAttribute('aria-label')?.includes('Stop');
      if (!isStopBtn) {
        realClick(sendBtn);
        console.log('[PromptBoard] Clicked Send button');
      } else {
        console.log('[PromptBoard] ChatGPT already generating, waiting for result');
      }
      sent = true;
    } catch (sendErr) {
      console.warn('[PromptBoard] Send button not found after 120s, trying Enter key fallback');
    }

    // Try 2: Enter key fallback
    if (!sent) {
      try {
        inputEl.focus();
        await sleep(200);
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(100);
        inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(100);
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        console.log('[PromptBoard] Sent via Enter key fallback');
        sent = true;
      } catch (enterErr) {
        console.warn('[PromptBoard] Enter key fallback failed:', enterErr);
      }
    }

    // Try 3: Re-focus input and retry Send button (short wait)
    if (!sent) {
      try {
        inputEl.focus();
        await sleep(3000);
        const retryBtn = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null
          || document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
        if (retryBtn && !retryBtn.disabled) {
          realClick(retryBtn);
          console.log('[PromptBoard] Retry Send button succeeded');
          sent = true;
        }
      } catch {
        // Give up
      }
    }

    if (!sent) {
      return { success: false, error: 'Failed to find Send button or send via Enter after all retries' };
    }

    // STEP 5: Wait for NEW assistant message, then get images from THAT message only
    const newMsg = await waitForNewAssistantMessage(300000, msgCountBefore);
    console.log('[PromptBoard] New assistant message detected (with refs)');

    const imageUrls = await waitForImagesInMessage(newMsg, 300000, 2000, 1);

    if (imageUrls.length === 0) {
      return { success: false, error: 'No image generated in response' };
    }

    return {
      success: true,
      imageUrl: imageUrls[imageUrls.length - 1],
      imageUrls,
    };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Attachment Method 1: Clipboard paste ───

async function attachViaClipboard(inputEl: HTMLElement, refImageDataUrls: string[]): Promise<boolean> {
  try {
    let anySuccess = false;

    for (const dataUrl of refImageDataUrls) {
      const file = dataUrlToFile(dataUrl);
      if (!file) continue;

      try {
        const clipboardItem = new ClipboardItem({ [file.type]: file });
        await navigator.clipboard.write([clipboardItem]);
      } catch {
        try {
          const blob = new Blob([file], { type: file.type });
          const clipboardItem = new ClipboardItem({ [file.type]: blob });
          await navigator.clipboard.write([clipboardItem]);
        } catch {
          continue;
        }
      }

      inputEl.focus();
      await sleep(200);
      document.execCommand('paste');
      await sleep(2000);

      anySuccess = true;
    }

    return anySuccess;
  } catch (err) {
    console.warn('[PromptBoard] Clipboard paste failed:', err);
    return false;
  }
}

// ─── Attachment Method 2: File input trigger ───

async function attachViaFileInput(inputEl: HTMLElement, refImageDataUrls: string[]): Promise<boolean> {
  try {
    const attachBtn = document.querySelector('button[data-testid="composer-plus-btn"]')
      || document.querySelector('button[aria-label="Attach files"]')
      || document.querySelector('button[aria-label="Attach"]');

    if (!attachBtn) return false;

    realClick(attachBtn as HTMLElement);
    await sleep(1000);

    const uploadOption = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button'))
      .find(el => el.textContent?.includes('Upload') || el.textContent?.includes('Computer'));

    if (uploadOption) {
      realClick(uploadOption as HTMLElement);
      await sleep(1000);
    }

    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length === 0) return false;

    const fileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement;

    const dt = new DataTransfer();
    for (const dataUrl of refImageDataUrls) {
      const file = dataUrlToFile(dataUrl);
      if (file) dt.items.add(file);
    }

    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(2000);

    return dt.items.length > 0;
  } catch (err) {
    console.warn('[PromptBoard] File input trigger failed:', err);
    return false;
  }
}

// ─── Attachment Method 3: DragEvent drop ───

async function attachViaDrop(zone: HTMLElement, refImageDataUrls: string[]): Promise<boolean> {
  try {
    let anySuccess = false;

    for (const dataUrl of refImageDataUrls) {
      const file = dataUrlToFile(dataUrl);
      if (!file) continue;

      const dropped = await dropFileIntoZone(zone, file);
      if (dropped) anySuccess = true;
      await sleep(1500);
    }

    return anySuccess;
  } catch (err) {
    console.warn('[PromptBoard] Drop failed:', err);
    return false;
  }
}

/** Find the drop zone element in ChatGPT's composer */
function findDropZone(): HTMLElement | null {
  const candidates = [
    'form[data-type="unified-composer"]',
    'form[class*="composer"]',
    'div[class*="composer"]',
    '#prompt-textarea',
    'div.ProseMirror[contenteditable="true"]',
  ];

  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return el;
  }

  const inputEl = findChatInput();
  if (inputEl) {
    let parent = inputEl.parentElement;
    while (parent) {
      if (
        parent.tagName === 'FORM' ||
        parent.getAttribute('data-type')?.includes('composer') ||
        parent.classList.toString().includes('composer')
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return inputEl;
  }

  return null;
}

/** Drop a File into a zone using synthetic DragEvent sequence */
async function dropFileIntoZone(zone: HTMLElement, file: File): Promise<boolean> {
  try {
    const rect = zone.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const dragEnter = new DragEvent('dragenter', {
      bubbles: true, cancelable: true, dataTransfer, clientX: x, clientY: y,
    });
    zone.dispatchEvent(dragEnter);

    const dragOver = new DragEvent('dragover', {
      bubbles: true, cancelable: true, dataTransfer, clientX: x, clientY: y,
    });
    zone.dispatchEvent(dragOver);

    await sleep(100);

    const drop = new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer, clientX: x, clientY: y,
    });
    zone.dispatchEvent(drop);

    await sleep(100);
    return true;
  } catch (err) {
    console.warn('[PromptBoard] Drop failed:', err);
    return false;
  }
}

/** Wait for attachment indicator in DOM */
async function waitForAttachmentIndicator(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const has = document.querySelector(
      '[class*="attachment"], [class*="file-preview"], [class*="uploaded"], [data-testid*="attachment"], [class*="Attachment"], [class*="FilePreview"]'
    );
    if (has) return true;
    await sleep(500);
  }
  return false;
}

/** Convert data URL to File object */
function dataUrlToFile(dataUrl: string): File | null {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const b64 = atob(parts[1]);
    const arr = new Uint8Array(b64.length);
    for (let i = 0; i < b64.length; i++) {
      arr[i] = b64.charCodeAt(i);
    }
    const blob = new Blob([arr], { type: mime });
    const ext = mime.split('/')[1] || 'png';
    const name = `reference_${Date.now()}.${ext}`;
    return new File([blob], name, { type: mime });
  } catch {
    return null;
  }
}

// ─── DEPRECATED: snapshotImageSrcs / waitForNewImages ───
// These used DOM-wide snapshot comparison which caused cross-contamination.
// Kept as fallback but NOT used by the main flows anymore.

function snapshotImageSrcs(): Set<string> {
  const images = document.querySelectorAll('[data-message-author-role="assistant"] img');
  const srcs = new Set<string>();
  images.forEach((img) => {
    const el = img as HTMLImageElement;
    const src = el.src || el.getAttribute('src') || el.getAttribute('data-src');
    if (src) srcs.add(src);
  });
  return srcs;
}

async function waitForNewImages(
  timeoutMs: number,
  beforeSnapshot: Set<string>,
  stableMs: number = 2000,
  minNewImages: number = 1,
): Promise<string[]> {
  const start = Date.now();
  let lastChangeTime = Date.now();
  let lastNewSrcs: string[] = [];

  await sleep(3000);

  while (Date.now() - start < timeoutMs) {
    const currentSrcs = snapshotImageSrcs();

    const newSrcs: string[] = [];
    for (const src of currentSrcs) {
      if (!beforeSnapshot.has(src)) {
        newSrcs.push(src);
      }
    }

    if (newSrcs.length >= minNewImages) {
      if (newSrcs.length !== lastNewSrcs.length || JSON.stringify(newSrcs) !== JSON.stringify(lastNewSrcs)) {
        lastNewSrcs = newSrcs;
        lastChangeTime = Date.now();
      } else if (Date.now() - lastChangeTime >= stableMs) {
        console.log(`[PromptBoard] (legacy) Detected ${newSrcs.length} new stable image(s)`);
        await sleep(1000);
        return newSrcs;
      }
    }

    await sleep(1500);
  }

  if (lastNewSrcs.length > 0) {
    console.warn(`[PromptBoard] (legacy) Timeout but returning ${lastNewSrcs.length} image(s)`);
    return lastNewSrcs;
  }

  throw new Error('Timeout waiting for generated image');
}

// ─── Extract shots flow: per-message approach ───

async function extractShotsFlow(
  prompt: string,
  refImageDataUrls: string[],
  expectedCount: number,
): Promise<{ success: boolean; imageUrls?: string[]; error?: string }> {
  try {
    // Count assistant messages BEFORE sending
    const msgCountBefore = countAssistantMessages();
    console.log(`[PromptBoard] extractShotsFlow: ${msgCountBefore} assistant messages before`);

    // STEP 1: Focus chat input area
    const inputEl = await waitFor(findChatInput, 10000, 'chat input');
    inputEl.focus();
    await sleep(300);

    // STEP 2: Attach reference images (storyboard image)
    let attached = false;

    if (!attached) {
      attached = await attachViaClipboard(inputEl, refImageDataUrls);
    }
    if (!attached) {
      attached = await attachViaFileInput(inputEl, refImageDataUrls);
    }
    if (!attached) {
      const dropZone = findDropZone();
      if (dropZone) {
        attached = await attachViaDrop(dropZone, refImageDataUrls);
      }
    }

    if (!attached) {
      console.warn('[PromptBoard] All attachment methods failed — extracting without storyboard image');
    }

    await sleep(3000);

    // STEP 3: Type the extract prompt
    inputEl.focus();
    await sleep(200);
    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
    await sleep(50);
    inputEl.focus();
    document.execCommand('insertText', false, prompt);
    await sleep(500);

    if (!(inputEl.textContent || '').trim()) {
      await navigator.clipboard.writeText(prompt);
      inputEl.focus();
      document.execCommand('selectAll', false);
      document.execCommand('paste', false);
      await sleep(500);
    }

    let sent = false;

    try {
      const sendBtn = await waitFor(
        () => {
          const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
          if (b1 && !b1.disabled) return b1;
          const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
          if (b2 && !b2.disabled) return b2;
          return null;
        },
        120000, 'Send button (extract shots)'
      );
      realClick(sendBtn);
      sent = true;
    } catch {
      console.warn('[PromptBoard] Extract shots Send button not found, trying Enter fallback');
    }

    if (!sent) {
      inputEl.focus();
      await sleep(200);
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      await sleep(100);
      inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }

    // STEP 5: Wait for new assistant message, then get images from THAT message only
    const newMsg = await waitForNewAssistantMessage(300000, msgCountBefore);
    console.log('[PromptBoard] New assistant message detected (extract shots)');

    const imageUrls = await waitForImagesInMessage(newMsg, 300000, 2000, expectedCount);

    if (imageUrls.length === 0) {
      return { success: false, error: 'No images extracted from storyboard' };
    }

    return { success: true, imageUrls };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Download image as data URL (runs in ChatGPT tab context to avoid CORS) ───

async function downloadImageAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[PromptBoard] Download image failed:', err);
    return null;
  }
}