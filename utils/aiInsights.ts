import type { DistractionType } from '@/store';
import { computeReflectionInsights } from './reflectionInsights';

export async function fetchAiDistractionInsight(
  apiKey: string,
  reflections: { distraction: DistractionType; date: string }[]
): Promise<string | null> {
  if (!apiKey.trim()) return null;

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

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
