import type { DistractionType } from '@/store';
import { computeReflectionInsights } from './reflectionInsights';

export type AiInsightResult = {
  text: string | null;
  error: string | null;
};

function formatApiError(status: number): string {
  if (status === 401) return 'Invalid API key — check your OpenAI key in Settings.';
  if (status === 429) return 'OpenAI rate limit reached — try again later.';
  return `OpenAI request failed (${status}).`;
}

export async function testApiKey(
  apiKey: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> {
  if (!apiKey.trim()) {
    return { ok: false, error: 'Add your OpenAI API key first.' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: formatApiError(res.status) };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'Could not reach OpenAI — check your connection.' };
  }
}

export async function fetchAiDistractionInsight(
  apiKey: string,
  reflections: { distraction: DistractionType; date: string }[],
  signal?: AbortSignal
): Promise<AiInsightResult> {
  if (!apiKey.trim()) {
    return { text: null, error: null };
  }

  if (reflections.length === 0) {
    return { text: null, error: null };
  }

  const insight = computeReflectionInsights(reflections);
  const counts = reflections.reduce(
    (acc, r) => {
      acc[r.distraction] = (acc[r.distraction] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a productivity coach. Give one short, actionable sentence about distraction patterns based on the data. Be direct and encouraging.',
          },
          {
            role: 'user',
            content: `Monthly distraction counts: ${JSON.stringify(counts)}. Top distraction: ${insight.topLabel} (${insight.count} days). Total reflection days: ${insight.totalDays}.`,
          },
        ],
        max_tokens: 80,
      }),
    });

    if (!res.ok) {
      return { text: null, error: formatApiError(res.status) };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? null;
    if (!text) {
      return { text: null, error: 'OpenAI returned an empty response.' };
    }
    return { text, error: null };
  } catch {
    return { text: null, error: 'Could not reach OpenAI — check your connection.' };
  }
}
