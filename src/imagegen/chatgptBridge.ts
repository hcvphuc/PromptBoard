// Bridge: Side panel ↔ ChatGPT content script communication
// Handles: opening ChatGPT tabs, injecting content script, sending messages

export interface ChatGPTMessageResult {
  success: boolean;
  error?: string;
  imageUrl?: string;
  imageDataUrl?: string;
}

let chatgptTabId: number | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Ensure a ChatGPT tab is open and content script is injected */
async function ensureChatGPTTab(): Promise<number> {
  // Try to find existing tab
  const tabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });

  if (tabs.length > 0) {
    chatgptTabId = tabs[0].id!;
    await chrome.tabs.update(chatgptTabId, { active: true });
    return chatgptTabId;
  }

  // Open new tab
  const newTab = await chrome.tabs.create({ url: 'https://chatgpt.com/', active: true });
  chatgptTabId = newTab.id!;

  // Wait for page load
  await new Promise<void>((resolve) => {
    function listener(tabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (tabId === chatgptTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });

  // Wait for React hydration
  await sleep(3000);
  return chatgptTabId;
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
function sendMessageToTab(tabId: number, message: any, timeoutMs = 180000): Promise<any> {
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

/** Generate a single image via ChatGPT "Create image" flow */
export async function generateImage(prompt: string): Promise<ChatGPTMessageResult> {
  try {
    const tabId = await ensureChatGPTTab();
    await injectContentScript(tabId);

    const response = await sendMessageToTab(tabId, {
      type: 'GENERATE_IMAGE',
      text: prompt,
    });

    return {
      success: response?.success ?? false,
      error: response?.error,
      imageUrl: response?.imageUrl,
    };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

/** Generate image with reference images pasted into chat */
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
    });

    return {
      success: response?.success ?? false,
      error: response?.error,
      imageUrl: response?.imageUrl,
    };
  } catch (err: any) {
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

/** Start a new chat in ChatGPT (navigate to fresh conversation) */
export async function startNewChat(): Promise<void> {
  try {
    const tabId = await ensureChatGPTTab();
    // Navigate to new chat
    await chrome.tabs.update(tabId, { url: 'https://chatgpt.com/' });
    await new Promise<void>((resolve) => {
      function listener(tabId_: number, changeInfo: chrome.tabs.TabChangeInfo) {
        if (tabId_ === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });
    await sleep(3000); // React hydration
  } catch (err) {
    console.warn('[PromptBoard] Start new chat failed:', err);
  }
}