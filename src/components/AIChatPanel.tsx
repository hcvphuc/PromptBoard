import React from 'react';
import type { ProjectOutput } from '@/types/output';
import type { AIProviderConfig } from '@/ai/provider';
import type { ReferenceImage, BoardImage } from '@/types/pipeline';
import type { PromptEditAction } from './OutputTabs';
import { proxyFetch } from '@/ai/proxyFetch';

interface AIChatPanelProps {
  visible: boolean;
  onClose: () => void;
  output: ProjectOutput;
  refImages: ReferenceImage[];
  boardImages: BoardImage[];
  onEditPrompt: (action: PromptEditAction) => void;
  onRegenerateImage: (type: 'character' | 'location' | 'board', identifier: string | number) => void;
  providerConfig: AIProviderConfig;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  action?: PromptEditAction | null;
}

/** Context item for the dropdown — represents a specific prompt that can be edited */
interface ContextItem {
  label: string;
  action: PromptEditAction;
  promptText: string;
}

function getContextItems(output: ProjectOutput): ContextItem[] {
  const items: ContextItem[] = [];

  output.characters.forEach((c, i) => {
    items.push({
      label: `👤 ${c.character_name} (character)`,
      action: { type: 'character-prompt', index: i, value: c.prompt },
      promptText: c.prompt,
    });
  });

  output.locations.forEach((l, i) => {
    items.push({
      label: `📍 ${l.location_name} (location)`,
      action: { type: 'location-prompt', index: i, value: l.prompt },
      promptText: l.prompt,
    });
  });

  output.storyboards.forEach((b) => {
    items.push({
      label: `📊 Board ${b.board_number} (storyboard)`,
      action: { type: 'storyboard-prompt', boardNumber: b.board_number, value: b.storyboard_prompt },
      promptText: b.storyboard_prompt,
    });

    b.shots.forEach((s) => {
      if (s.master_prompt) {
        items.push({
          label: `🎬 Board ${b.board_number} Shot ${s.shot_number}`,
          action: { type: 'shot-master-prompt', boardNumber: b.board_number, shotNumber: s.shot_number, value: s.master_prompt },
          promptText: s.master_prompt,
        });
      }
    });
  });

  // Seedance prompts
  if (Array.isArray(output.seedance)) {
    (output.seedance as any[]).forEach((s: any) => {
      items.push({
        label: `🎞 Board ${s.board_number} (video prompt)`,
        action: { type: 'seedance-board-prompt', boardNumber: s.board_number, value: s.board_prompt },
        promptText: s.board_prompt,
      });
    });
  } else if (output.seedance) {
    const s = output.seedance as any;
    items.push({
      label: `🎞 Continuous (video prompt)`,
      action: { type: 'seedance-continuous-prompt', value: s.master_prompt },
      promptText: s.master_prompt,
    });
  }

  return items;
}

const SYSTEM_PROMPT = `You are a prompt engineering assistant for AI image generation. Your job is to help the user improve, fix, or refine image generation prompts for a film/TVC production pipeline.

Rules:
- When suggesting an improved prompt, output ONLY the improved prompt text, no explanation needed unless the user asks why
- Keep the same visual style, character consistency, and production quality
- If the user asks for a specific change (e.g., "more cinematic", "warmer tones"), incorporate that into the prompt
- Maintain all existing character descriptions, wardrobe details, and location specifics
- Use professional cinematic terminology (shot sizes, lens choices, lighting setups)
- Keep prompts under 500 words unless the user wants longer
- If the user asks to fix a specific issue (e.g., "wrong location", "character looks different"), focus on that fix`;

export function AIChatPanel({ visible, onClose, output, refImages, boardImages, onEditPrompt, onRegenerateImage, providerConfig }: AIChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [selectedContextIdx, setSelectedContextIdx] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const contextItems = React.useMemo(() => getContextItems(output), [output]);
  const selectedContext = contextItems[selectedContextIdx] || null;

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!visible) return null;

  const handleSend = async () => {
    const userMsg = inputText.trim();
    if (!userMsg || generating) return;

    const currentPrompt = selectedContext?.promptText || '';
    const contextLabel = selectedContext?.label || 'None';

    // Add user message
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: `[Context: ${contextLabel}]\nCurrent prompt: "${currentPrompt.slice(0, 300)}${currentPrompt.length > 300 ? '...' : ''}"\n\n${userMsg}` },
    ];
    setMessages(newMessages);
    setInputText('');
    setGenerating(true);

    try {
      const aiResponse = await callAI(newMessages, providerConfig);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
      };

      // Check if the response looks like a prompt (not explanation) — heuristics
      // If it's longer than 30 chars and doesn't start with common explanation words, treat as prompt suggestion
      const looksLikePrompt = aiResponse.length > 30 &&
        !aiResponse.toLowerCase().startsWith('i ') &&
        !aiResponse.toLowerCase().startsWith('here ') &&
        !aiResponse.toLowerCase().startsWith('sure') &&
        !aiResponse.toLowerCase().startsWith('to ') &&
        !aiResponse.toLowerCase().startsWith('the ');

      if (looksLikePrompt && selectedContext) {
        const newAction = { ...selectedContext.action, value: aiResponse };
        assistantMsg.action = newAction;
      }

      setMessages([...newMessages, assistantMsg]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${String(err)}` }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = (msg: ChatMessage) => {
    if (msg.action) {
      onEditPrompt(msg.action);
    }
  };

  const handleRegenerate = (msg: ChatMessage) => {
    if (!msg.action) return;
    // First apply the prompt
    onEditPrompt(msg.action);
    // Then regenerate image
    const action = msg.action;
    if (action.type === 'character-prompt') {
      // Find character name from output
      const char = output.characters[action.index];
      if (char) onRegenerateImage('character', char.character_name);
    } else if (action.type === 'location-prompt') {
      const loc = output.locations[action.index];
      if (loc) onRegenerateImage('location', loc.location_name);
    } else if (action.type === 'storyboard-prompt' || action.type === 'shot-master-prompt' || action.type === 'seedance-board-prompt') {
      const boardNum = 'boardNumber' in action ? action.boardNumber : 0;
      onRegenerateImage('board', boardNum);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-panel flex flex-col" style={{ maxHeight: '50vh', minHeight: '200px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-accent">💬 AI Chat</span>
          {generating && <span className="text-[10px] text-secondary animate-pulse">thinking...</span>}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-border text-secondary hover:text-primary transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Context selector */}
      <div className="px-3 py-1.5 border-b border-border/50">
        <select
          value={selectedContextIdx}
          onChange={(e) => setSelectedContextIdx(Number(e.target.value))}
          className="w-full bg-card border border-border rounded-btn px-2 py-1 text-[10px] text-primary"
        >
          {contextItems.map((item, i) => (
            <option key={i} value={i}>{item.label}</option>
          ))}
          {contextItems.length === 0 && <option value={0}>No items available</option>}
        </select>
        {selectedContext && (
          <p className="text-[9px] text-secondary mt-1 truncate" title={selectedContext.promptText}>
            Current: {selectedContext.promptText.slice(0, 120)}{selectedContext.promptText.length > 120 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ maxHeight: '250px' }}>
        {messages.length === 0 && (
          <p className="text-[10px] text-secondary text-center py-4">
            Select a context item above, then ask AI to improve the prompt.
            <br />
            Try: "Make it more cinematic" or "Fix the lighting"
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent/20 text-primary'
                : 'bg-card border border-border text-secondary'
            }`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.action && msg.role === 'assistant' && (
                <div className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-border/50">
                  <button
                    onClick={() => handleApply(msg)}
                    className="px-2 py-0.5 text-[9px] rounded bg-accent text-white hover:bg-accent/90 font-medium"
                  >
                    ✅ Apply
                  </button>
                  <button
                    onClick={() => handleRegenerate(msg)}
                    className="px-2 py-0.5 text-[9px] rounded border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
                  >
                    🔄 Apply + Re-generate
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={providerConfig.provider === 'mock' ? 'Set API key in settings first...' : 'Ask AI to improve this prompt...'}
            disabled={generating || providerConfig.provider === 'mock'}
            className="flex-1 bg-card border border-border rounded-btn px-2 py-1 text-[10px] text-primary focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={generating || !inputText.trim() || providerConfig.provider === 'mock'}
            className="px-2.5 py-1 text-[10px] rounded-btn bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call AI provider to generate response */
async function callAI(messages: ChatMessage[], config: AIProviderConfig): Promise<string> {
  if (config.provider === 'mock') throw new Error('Mock provider — set API key first');

  const apiMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  if (config.provider === 'openrouter') {
    const res = await proxyFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey || ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'chrome-extension://promptboard-ai',
        'X-Title': 'PromptBoard AI',
      },
      body: JSON.stringify({
        model: config.model || 'anthropic/claude-sonnet-4',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.body.slice(0, 200)}`);
    const data = JSON.parse(res.body);
    return data.choices?.[0]?.message?.content || '';
  }

  if (config.provider === 'openai') {
    const baseUrl = config.baseUrl || 'https://api.openai.com';
    const res = await proxyFetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.body.slice(0, 200)}`);
    const data = JSON.parse(res.body);
    return data.choices?.[0]?.message?.content || '';
  }

  if (config.provider === 'ollama') {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    const res = await proxyFetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model || 'gemini-3-flash-preview',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.body.slice(0, 200)}`);
    const data = JSON.parse(res.body);
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}