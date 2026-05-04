// Proxy fetch calls through background service worker to bypass CORS
// Side panel cannot make cross-origin requests to external APIs directly

export async function proxyFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ ok: boolean; status: number; body: string }> {
  // Try direct fetch first (works in dev mode / localhost)
  try {
    const res = await fetch(url, {
      method: options.method || 'POST',
      headers: options.headers || {},
      body: options.body,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch {
    // Direct fetch failed (likely CORS) — proxy through background
  }

  return new Promise((resolve) => {
    const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime?.sendMessage;
    if (!hasChromeRuntime) {
      resolve({ ok: false, status: 0, body: 'No chrome.runtime available and direct fetch failed' });
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'FETCH_API',
        payload: {
          url,
          method: options.method || 'POST',
          headers: options.headers || {},
          body: options.body,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, status: 0, body: chrome.runtime.lastError.message || 'Runtime error' });
          return;
        }
        resolve(response || { ok: false, status: 0, body: 'No response from background' });
      }
    );
  });
}