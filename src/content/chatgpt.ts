// Content script for chatgpt.com — injected via chrome.scripting.executeScript
// Handles: text prompt submission, image generation, image download, reference image paste

let isRunning = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SEND_PROMPT_TO_CHATGPT') {
    if (isRunning) {
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    fillAndSubmitChatGPT(message.text)
      .then(() => sendResponse({ success: true }))
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
    generateImageFlow(message.text)
      .then((result) => sendResponse(result))
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
    generateImageWithRefsFlow(message.text, message.refImages || [])
      .then((result) => sendResponse(result))
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
    // Fill and submit with "Create image" mode
    await fillAndSubmitChatGPT(prompt);

    // Wait for ChatGPT to generate and display image
    const imageUrl = await waitForGeneratedImage(120000);

    return { success: true, imageUrl };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Generate Image with Reference Images: paste images + prompt → send ───

async function generateImageWithRefsFlow(
  prompt: string,
  refImageDataUrls: string[]
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // STEP 1: Paste reference images into chat input
    const inputEl = await waitFor(findChatInput, 10000, 'chat input');
    inputEl.focus();
    await sleep(200);

    for (const dataUrl of refImageDataUrls) {
      // Convert data URL to Blob and paste via clipboard
      const blob = dataUrlToBlob(dataUrl);
      if (!blob) continue;

      try {
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);
      } catch {
        // Fallback: some browsers require user gesture
        // Try alternative: create a paste event
      }

      // Simulate Ctrl+V paste
      await sleep(100);
      document.execCommand('paste');
      await sleep(800);
    }

    // STEP 2: Type the prompt after pasting images
    inputEl.focus();
    await sleep(100);
    document.execCommand('insertText', false, prompt);
    await sleep(500);

    // STEP 3: Click Send (regular chat mode, not "Create image" mode)
    // When pasting reference images, ChatGPT understands context natively
    const sendBtn = await waitFor(
      () => {
        const b1 = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement | null;
        if (b1 && !b1.disabled) return b1;
        const b2 = document.querySelector('button[aria-label="Send prompt"]') as HTMLButtonElement | null;
        if (b2 && !b2.disabled) return b2;
        return null;
      },
      10000, 'Send button'
    );
    realClick(sendBtn);

    // STEP 4: Wait for generated image
    const imageUrl = await waitForGeneratedImage(120000);

    return { success: true, imageUrl };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

// ─── Wait for ChatGPT to generate an image in the response ───

async function waitForGeneratedImage(timeoutMs: number): Promise<string> {
  // Strategy: wait for new assistant message to appear with an image
  // ChatGPT shows images as <img> tags in the response

  const start = Date.now();
  let lastImageCount = 0;

  // First, wait for the "stop generating" button to appear and then disappear
  // This indicates generation is in progress

  // Wait a bit for response to start
  await sleep(5000);

  // Poll for images in the last assistant message
  while (Date.now() - start < timeoutMs) {
    const images = document.querySelectorAll('[data-message-author-role="assistant"] img, [class*="message"] img');

    if (images.length > lastImageCount) {
      // New image appeared — get the last one (most recent response)
      const lastImg = images[images.length - 1] as HTMLImageElement;
      const src = lastImg.src || lastImg.getAttribute('src');

      if (src) {
        // Wait a moment for image to fully load
        await sleep(2000);
        return src;
      }
    }

    lastImageCount = Math.max(lastImageCount, images.length);
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

// ─── Utility: data URL to Blob ───

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const b64 = atob(parts[1]);
    const arr = new Uint8Array(b64.length);
    for (let i = 0; i < b64.length; i++) {
      arr[i] = b64.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}