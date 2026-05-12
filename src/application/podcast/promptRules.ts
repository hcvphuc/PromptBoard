import type { AnalysisProvider } from '@/ai/provider';
import { extractJSON } from '@/ai/extractJSON';
import type { PodcastPromptRule, PromptRuleScope } from '@/domain/podcast/model';

export interface PromptRuleDraft {
  summary: string;
  scope: PromptRuleScope;
  promptOverride: string;
}

const VALID_SCOPES: PromptRuleScope[] = ['all', 'deck', 'opening_still', 'slides'];

function normalizeScope(value: unknown): PromptRuleScope {
  return VALID_SCOPES.includes(value as PromptRuleScope) ? value as PromptRuleScope : 'slides';
}

function parsePromptRuleDraft(raw: unknown): PromptRuleDraft {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const summary = String(data.summary || '').trim();
  const promptOverride = String(data.prompt_override || data.promptOverride || '').trim();
  if (!summary || !promptOverride) {
    throw new Error('Prompt assistant returned an incomplete rule.');
  }
  return {
    summary,
    scope: normalizeScope(data.scope),
    promptOverride,
  };
}

export async function createPromptRuleDraft(
  provider: AnalysisProvider,
  userRequest: string,
  context: {
    activeRules: PodcastPromptRule[];
    speakerNames: string[];
  },
): Promise<PromptRuleDraft> {
  if (provider.name.toLowerCase() === 'mock') {
    return {
      summary: userRequest.slice(0, 90) || 'Custom prompt rule',
      scope: 'slides',
      promptOverride: userRequest,
    };
  }

  const prompt = `Convert the user's natural-language request into one clean image prompt override rule for a podcast slide generation extension.

Return JSON only with this exact shape:
{
  "summary": "short user-facing summary",
  "scope": "all | deck | opening_still | slides",
  "prompt_override": "clear instruction to append to image-generation prompts"
}

Rules:
- Keep prompt_override specific, concise, and imperative.
- Preserve the user's intent and language preference.
- If the user talks about content slides, use scope "slides".
- If the user talks about the opening podcast photo/still frame, use scope "opening_still".
- If the user talks about deck template/style system, use scope "deck".
- If the user talks about every generated image, use scope "all".
- Do not include markdown.

Speaker names, if relevant: ${context.speakerNames.filter(Boolean).join(', ') || 'not provided'}
Existing active rules:
${context.activeRules.filter((rule) => rule.enabled).map((rule) => `- [${rule.scope}] ${rule.summary}: ${rule.promptOverride}`).join('\n') || 'None'}

User request:
${userRequest}`;

  const raw = await provider.generate(prompt, 'You turn user requests into safe, precise prompt override JSON. Return JSON only.');
  return parsePromptRuleDraft(extractJSON(raw));
}

export function buildPromptRule(id: string, draft: PromptRuleDraft): PodcastPromptRule {
  return {
    id,
    summary: draft.summary,
    scope: draft.scope,
    promptOverride: draft.promptOverride,
    enabled: true,
    createdAt: Date.now(),
  };
}

export function appendPromptRules(prompt: string, rules: PodcastPromptRule[], scope: PromptRuleScope): string {
  const activeRules = rules.filter((rule) => rule.enabled && (rule.scope === 'all' || rule.scope === scope));
  if (activeRules.length === 0) return prompt;

  return `${prompt}

CUSTOM USER PROMPT OVERRIDES:
${activeRules.map((rule, index) => `${index + 1}. ${rule.promptOverride}`).join('\n')}`;
}
