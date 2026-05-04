import React from 'react';

interface SendToChatGPTButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function SendToChatGPTButton({ text, label = '→ ChatGPT', className = '' }: SendToChatGPTButtonProps) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSend = async () => {
    setStatus('sending');
    try {
      // Find or create a ChatGPT tab
      const tabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });

      let targetTabId: number;

      if (tabs.length === 0) {
        // No ChatGPT tab open — open one
        const newTab = await chrome.tabs.create({ url: 'https://chatgpt.com/', active: true });
        targetTabId = newTab.id!;

        // Wait for tab to finish loading
        await new Promise<void>((resolve) => {
          function listener(tabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
            if (tabId === targetTabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          }
          chrome.tabs.onUpdated.addListener(listener);
        });

        // Wait for React to hydrate
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        targetTabId = tabs[0].id!;
        await chrome.tabs.update(targetTabId, { active: true });
      }

      // Ensure content script is injected
      await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        files: ['content/chatgpt.js'],
      });

      // Small delay for content script to register listener
      await new Promise((r) => setTimeout(r, 500));

      // Send message to content script
      const response = await chrome.tabs.sendMessage(targetTabId, {
        type: 'SEND_PROMPT_TO_CHATGPT',
        text,
      });

      if (response?.success) {
        setStatus('sent');
      } else {
        console.error('[PromptBoard] Content script error:', response?.error);
        setStatus('error');
      }

      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('[PromptBoard] Send to ChatGPT failed:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={status === 'sending'}
      className={`px-2.5 py-1 text-xs rounded-btn border transition-colors ${
        status === 'sent'
          ? 'text-green-400 border-green-500/50 bg-green-500/10'
          : status === 'error'
          ? 'text-red-400 border-red-500/50 bg-red-500/10'
          : status === 'sending'
          ? 'text-secondary border-border bg-card opacity-60'
          : 'border-border bg-card text-secondary hover:text-primary hover:bg-border'
      } ${className}`}
    >
      {status === 'sending' ? 'Sending...' : status === 'sent' ? '✓ Sent' : status === 'error' ? '✗ Error' : label}
    </button>
  );
}