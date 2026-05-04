// Content script for chatgpt.com — injected via chrome.scripting.executeScript
// Flow: Paste prompt → Click Plus → Create image → Aspect ratio 16:9 → Send

let isRunning = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SEND_PROMPT_TO_CHATGPT') {
    if (isRunning) {
      console.log('[PromptBoard] Already running, skipping');
      sendResponse({ success: false, error: 'Already running' });
      return false;
    }
    isRunning = true;
    fillAndSubmitChatGPT(message.text)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('[PromptBoard] Flow failed:', err);
        sendResponse({ success: false, error: String(err) });
      })
      .finally(() => { isRunning = false; });
    return true;
  }
});

// Simulate a real mouse click (React/Radix need trusted events)
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor<T>(finder: () => T | null, timeoutMs: number, label: string): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = finder();
    if (el) return el;
    await sleep(200);
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

async function fillAndSubmitChatGPT(text: string): Promise<void> {

  // STEP 1: Fill prompt
  console.log('[PromptBoard] Step 1: Fill prompt');
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
  console.log('[PromptBoard] ✅ Step 1 done');

  // STEP 2: Click Plus button
  console.log('[PromptBoard] Step 2: Click Plus');
  const plusBtn = await waitFor(
    () => document.querySelector('button[data-testid="composer-plus-btn"]') as HTMLButtonElement | null,
    5000, 'Plus button'
  );
  realClick(plusBtn);
  await sleep(1500);

  // STEP 3: Click "Create image"
  console.log('[PromptBoard] Step 3: Click Create image');
  const createImageBtn = await waitFor(
    () => {
      // ChatGPT uses Radix: div[role="menuitemradio"] > div.truncate "Create image"
      const items = document.querySelectorAll('div[role="menuitemradio"]');
      for (const item of items) {
        const t = item.querySelector('div.truncate');
        if (t && t.textContent?.trim() === 'Create image') return item as HTMLElement;
      }
      // Broader fallback
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
  realClick(createImageBtn as HTMLElement);
  await sleep(1500);

  // STEP 4: Click Aspect ratio dropdown
  console.log('[PromptBoard] Step 4: Click Aspect ratio');
  const aspectBtn = await waitFor(
    () => document.querySelector('button[aria-label="Choose image aspect ratio"]') as HTMLButtonElement | null,
    5000, 'Aspect ratio button'
  );
  realClick(aspectBtn);
  await sleep(500);

  // STEP 5: Select Widescreen 16:9
  console.log('[PromptBoard] Step 5: Select Widescreen 16:9');
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
  console.log('[PromptBoard] Step 6: Click Send');
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
  console.log('[PromptBoard] ✅ Done! Prompt submitted with Create image + 16:9');
}