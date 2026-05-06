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

  // STEP 6: Click Send
  const sendBtn = await waitFor(
    () => {
      const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
      if (b1 && !b1.disabled) return b1;
      const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
      if (b2 && !b2.disabled) return b2;
      return null;
    },
    5000, 'Send button'
  );
  realClick(sendBtn);
}

// ─── Generate Image flow: fill + Create image + send + wait for result ───

async function generateImageFlow(prompt: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Count existing images BEFORE sending — so we only detect new ones
    const baseline = document.querySelectorAll('[data-message-author-role="assistant"] img, [class*="message"] img').length;

    // Fill and submit with "Create image" mode
    await fillAndSubmitChatGPT(prompt);

    // Wait for ChatGPT to generate and display a NEW image
    const imageUrl = await waitForGeneratedImage(120000, baseline);

    return { success: true, imageUrl };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Generate Image with Reference Images: multiple attachment methods ───

async function generateImageWithRefsFlow(
  prompt: string,
  refImageDataUrls: string[]
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
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
    const hasAttachment = await waitForAttachmentIndicator(5000);

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

    // STEP 4: Click Send
    const sendBtn = await waitFor(
      () => {
        const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
        if (b1 && !b1.disabled) return b1;
        const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
        if (b2 && !b2.disabled) return b2;
        return null;
      },
      15000, 'Send button (with refs)'
    );
    // STEP 5: Wait for generated image — count baseline before sending
    const baseline = document.querySelectorAll('[data-message-author-role="assistant"] img, [class*="message"] img').length;
    realClick(sendBtn);
    const imageUrl = await waitForGeneratedImage(180000, baseline);

    return { success: true, imageUrl };
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

      // Use Clipboard API to write the image
      try {
        const clipboardItem = new ClipboardItem({ [file.type]: file });
        await navigator.clipboard.write([clipboardItem]);
      } catch {
        // Clipboard API may fail — try blob approach
        try {
          const blob = new Blob([file], { type: file.type });
          const clipboardItem = new ClipboardItem({ [file.type]: blob });
          await navigator.clipboard.write([clipboardItem]);
        } catch {
          continue;
        }
      }

      // Now paste into the input
      inputEl.focus();
      await sleep(200);
      document.execCommand('paste');
      await sleep(2000); // Wait for ChatGPT to process attachment

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
    // Look for Plus/Attach button to open file picker
    const attachBtn = document.querySelector('button[data-testid="composer-plus-btn"]')
      || document.querySelector('button[aria-label="Attach files"]')
      || document.querySelector('button[aria-label="Attach"]');

    if (!attachBtn) return false;

    realClick(attachBtn as HTMLElement);
    await sleep(1000);

    // Now look for file input (ChatGPT may show one after clicking)
    // Or look for "Upload from computer" option
    const uploadOption = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button'))
      .find(el => el.textContent?.includes('Upload') || el.textContent?.includes('Computer'));

    if (uploadOption) {
      realClick(uploadOption as HTMLElement);
      await sleep(1000);
    }

    // Find file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length === 0) return false;

    const fileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement;

    // Add all files at once
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

// ─── Wait for ChatGPT to generate an image in the response ───

async function waitForGeneratedImage(timeoutMs: number, baselineCount?: number): Promise<string> {
  // Count existing images BEFORE waiting — so we only detect NEW ones
  const baseline = baselineCount ?? document.querySelectorAll('[data-message-author-role="assistant"] img, [class*="message"] img').length;
  const start = Date.now();

  await sleep(5000);

  while (Date.now() - start < timeoutMs) {
    const images = document.querySelectorAll('[data-message-author-role="assistant"] img, [class*="message"] img');

    if (images.length > baseline) {
      // New image appeared — take the LAST one (most recent)
      const lastImg = images[images.length - 1] as HTMLImageElement;
      const src = lastImg.src || lastImg.getAttribute('src');

      if (src) {
        await sleep(2000);
        return src;
      }
    }

    await sleep(2000);
  }

  throw new Error('Timeout waiting for generated image');
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