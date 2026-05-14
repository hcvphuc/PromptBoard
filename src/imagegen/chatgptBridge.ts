// Bridge: Side panel ↔ ChatGPT content script communication
// Handles: opening ChatGPT tabs, injecting content script, sending messages

export interface ChatGPTMessageResult {
  success: boolean;
  error?: string;
  imageUrl?: string;      // Kept for backward compat — last image
  imageUrls?: string[];  // ALL new images from this generation (preferred)
  imageDataUrl?: string;
  conversationUrl?: string;
}

export interface ChatGPTLanguageResult {
  success: boolean;
  locale?: string;
  isVietnamese: boolean;
  error?: string;
}

export interface ChatGPTLanguageCheckOptions {
  refreshChatGpt?: boolean;
}

let chatgptTabId: number | null = null;
let lastConversationUrl: string | null = null;
let isNewChatSession: boolean = true; // Start fresh — new chat for first prompt of each batch

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Ensure a ChatGPT tab is open. If isNewChatSession, opens a new chat. Otherwise reuses existing conversation. */
async function ensureChatGPTTab(): Promise<number> {
  // If we need a fresh chat, reload/reuse a ChatGPT tab so the composer does
  // not stay stuck after a previous image generation.
  if (isNewChatSession) {
    const allTabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });
    const reusableTab = (chatgptTabId ? allTabs.find(t => t.id === chatgptTabId) : null) || allTabs[0];

    if (reusableTab?.id) {
      chatgptTabId = reusableTab.id;
      await chrome.tabs.update(chatgptTabId, { url: 'https://chatgpt.com/', active: true });
    } else {
      const newTab = await chrome.tabs.create({ url: 'https://chatgpt.com/', active: true });
      chatgptTabId = newTab.id!;
    }

    lastConversationUrl = null;
    isNewChatSession = false; // Next calls in this batch reuse the conversation
    await waitForTabLoad(chatgptTabId);
    await sleep(3000); // React hydration
    return chatgptTabId;
  }

  const allTabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });

  if (allTabs.length > 0) {
    // Priority 1: If we have a saved conversation URL, find or navigate to it
    if (lastConversationUrl) {
      const convTab = allTabs.find(t => t.url === lastConversationUrl);
      if (convTab) {
        chatgptTabId = convTab.id!;
        await chrome.tabs.update(chatgptTabId, { active: true });
        return chatgptTabId;
      }

      // Navigate the first available tab to our conversation
      chatgptTabId = allTabs[0].id!;
      await chrome.tabs.update(chatgptTabId, { active: true, url: lastConversationUrl });
      await waitForTabLoad(chatgptTabId);
      await sleep(3000); // React hydration
      return chatgptTabId;
    }

    // No conversation yet — use whichever tab is available (prefer active)
    const activeTab = allTabs.find(t => t.active);
    chatgptTabId = (activeTab || allTabs[0]).id!;
    await chrome.tabs.update(chatgptTabId, { active: true });
    return chatgptTabId;
  }

  // No ChatGPT tab at all — open new one
  const newTab = await chrome.tabs.create({ url: 'https://chatgpt.com/', active: true });
  chatgptTabId = newTab.id!;
  await waitForTabLoad(chatgptTabId);
  await sleep(3000); // React hydration
  return chatgptTabId;
}

/** Wait for tab to finish loading */
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    function listener(updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
    // Timeout fallback
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 15000);
  });
}

/** Inject content script if not already injected */
async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/chatgpt.js'],
    });
    await sleep(500);
  } catch (err) {
    console.warn('[PromptBoard] Content script inject failed:', err);
  }
}

/** Send message to ChatGPT content script with timeout */
function sendMessageToTab(tabId: number, message: any, timeoutMs = 600000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/** Save conversation URL from content script response */
function captureConversationUrl(result: any): void {
  if (result?.conversationUrl) {
    lastConversationUrl = result.conversationUrl;
  }
  // Also check current tab URL
  if (chatgptTabId) {
    chrome.tabs.get(chatgptTabId, (tab) => {
      if (tab.url?.includes('/c/')) {
        lastConversationUrl = tab.url;
      }
    });
  }
}

/** Reset content script state after timeout/error */
async function resetContentScriptState(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'RESET_STATE' }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  } catch {
    // Ignore — tab may be closed
  }
}

/** Generate a single image via ChatGPT "Create image" flow.
 *  Returns ALL new image URLs in `imageUrls` (ChatGPT may return multiple images per prompt).
 *  `imageUrl` is kept as the last image for backward compat.
 */
export async function generateImage(prompt: string): Promise<ChatGPTMessageResult> {
  try {
    const tabId = await ensureChatGPTTab();
    await injectContentScript(tabId);

    const response = await sendMessageToTab(tabId, {
      type: 'GENERATE_IMAGE',
      text: prompt,
    }, 900000); // 15 min timeout for slow ChatGPT image generation

    captureConversationUrl(response);

    const imageUrls: string[] = response?.imageUrls || (response?.imageUrl ? [response.imageUrl] : []);

    return {
      success: response?.success ?? false,
      error: response?.error,
      imageUrl: imageUrls.length > 0 ? imageUrls[imageUrls.length - 1] : undefined,
      imageUrls,
    };
  } catch (err: any) {
    if (String(err).includes('timeout')) {
      await resetContentScriptState(chatgptTabId!);
    }
    return { success: false, error: String(err) };
  }
}

/** Generate image with reference images dropped into chat.
 *  Returns ALL new image URLs in `imageUrls` (ChatGPT may return multiple images per prompt).
 *  `imageUrl` is kept as the last image for backward compat.
 */
export async function generateImageWithRefs(
  prompt: string,
  refImageDataUrls: string[]
): Promise<ChatGPTMessageResult> {
  try {
    const tabId = await ensureChatGPTTab();
    await injectContentScript(tabId);

    const response = await sendMessageToTab(tabId, {
      type: 'GENERATE_IMAGE_WITH_REFS',
      text: prompt,
      refImages: refImageDataUrls,
    }, 900000); // 15 min timeout for refs (slower)

    captureConversationUrl(response);

    const imageUrls: string[] = response?.imageUrls || (response?.imageUrl ? [response.imageUrl] : []);

    return {
      success: response?.success ?? false,
      error: response?.error,
      imageUrl: imageUrls.length > 0 ? imageUrls[imageUrls.length - 1] : undefined,
      imageUrls,
    };
  } catch (err: any) {
    if (String(err).includes('timeout')) {
      await resetContentScriptState(chatgptTabId!);
    }
    return { success: false, error: String(err) };
  }
}

/** Download an image from ChatGPT tab context (avoids CORS) */
export async function downloadImageAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const tabId = await ensureChatGPTTab();
    await injectContentScript(tabId);

    const response = await sendMessageToTab(tabId, {
      type: 'DOWNLOAD_IMAGE',
      imageUrl,
    });

    return response?.imageDataUrl ?? null;
  } catch {
    return null;
  }
}

/** Start a new ChatGPT conversation for the next batch of prompts.
 *  Call this before starting a new image generation batch. */
export function startNewChatSession(): void {
  isNewChatSession = true;
  lastConversationUrl = null;
}

async function refreshChatGPTAfterLanguageChange(tabId: number): Promise<void> {
  const targetUrl = lastConversationUrl || 'https://chatgpt.com/';
  await chrome.tabs.update(tabId, { active: true, url: targetUrl });
  await waitForTabLoad(tabId);
  await sleep(4000); // Let ChatGPT rehydrate after language setting changes.
}

export async function checkChatGPTLanguage(options: ChatGPTLanguageCheckOptions = {}): Promise<ChatGPTLanguageResult> {
  try {
    const tabId = await ensureChatGPTTab();
    if (options.refreshChatGpt) {
      await refreshChatGPTAfterLanguageChange(tabId);
    }
    await injectContentScript(tabId);

    const response = await sendMessageToTab(tabId, {
      type: 'CHECK_CHATGPT_LANGUAGE',
    }, 30000);

    return {
      success: response?.success ?? false,
      locale: response?.locale,
      isVietnamese: Boolean(response?.isVietnamese),
      error: response?.error,
    };
  } catch (err: any) {
    return {
      success: false,
      isVietnamese: false,
      error: String(err),
    };
  }
}

/** Extract shots from a multi-panel storyboard image via ChatGPT.
 *  Sends the storyboard image + an extract prompt, ChatGPT returns individual shot images.
 */
export async function extractShotsFromBoard(
  storyboardImageUrl: string,
  shotCount: number,
  boardNumber: number,
): Promise<ChatGPTMessageResult> {
  try {
    const tabId = await ensureChatGPTTab();
    await injectContentScript(tabId);

    const extractPrompt = `Extract this multi-panel storyboard into ${shotCount} individual shots in order from left to right, top to bottom. Each shot must be a separate, complete image preserving the exact character designs, wardrobe, and visual style from the original panels. Do not crop or merge panels.`;

    const response = await sendMessageToTab(tabId, {
      type: 'EXTRACT_SHOTS',
      text: extractPrompt,
      refImages: [storyboardImageUrl],
      expectedCount: shotCount,
    }, 300000); // 5 min timeout for extraction

    captureConversationUrl(response);

    return {
      success: response?.success ?? false,
      error: response?.error,
      imageUrls: response?.imageUrls,
    };
  } catch (err: any) {
    if (String(err).includes('timeout')) {
      await resetContentScriptState(chatgptTabId!);
    }
    return { success: false, error: String(err) };
  }
}
