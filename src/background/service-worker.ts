// PromptBoard AI — Background Service Worker (Manifest V3)
// Handles: side panel, API proxy (to bypass CORS), file downloads

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// API Proxy — side panel sends FETCH_API message, background does the fetch
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    if (_sender.tab?.id !== undefined) {
      chrome.sidePanel.open({ tabId: _sender.tab.id });
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'FETCH_API') {
    const { url, method, headers, body } = message.payload;

    fetch(url, { method, headers, body })
      .then(async (res) => {
        const text = await res.text();
        sendResponse({ ok: res.ok, status: res.status, body: text });
      })
      .catch((err) => {
        sendResponse({ ok: false, status: 0, body: err.message || 'Fetch failed' });
      });

    return true; // keep channel open for async response
  }

  if (message.type === 'DOWNLOAD_FILE') {
    const { dataUrl, filename } = message.payload;
    try {
      chrome.downloads.download({
        url: dataUrl,
        filename,
        saveAs: false,
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, downloadId });
        }
      });
    } catch (err: any) {
      sendResponse({ ok: false, error: String(err) });
    }
    return true; // async response
  }
});