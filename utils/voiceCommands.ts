import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';

export interface VoiceCommandResult {
  action: 'start' | 'stop';
  category: string;
  title: string;
}

const START_PATTERN = /\b(started?|begin|beginning|start)\b\s+(.+)/i;
const STOP_PATTERN = /\b(stopped?|stop|ended?|end|finish(?:ed)?)\b\s+(.+)/i;

function resolveActivity(phrase: string): { category: string; title: string } {
  const lower = phrase.toLowerCase().trim().replace(/\.$/, '');

  for (const cat of LIFE_LOG_CATEGORIES) {
    for (const example of cat.examples) {
      if (lower.includes(example.toLowerCase()) || lower === example.toLowerCase()) {
        return { category: cat.id, title: example };
      }
    }
    if (lower.includes(cat.label.toLowerCase())) {
      return { category: cat.id, title: cat.examples[0] ?? cat.label };
    }
  }

  const words = lower.split(/\s+/);
  const title = words.join(' ') || 'activity';
  if (lower.includes('code') || lower.includes('coding')) {
    return { category: 'deep-work', title: 'coding' };
  }
  if (lower.includes('read')) return { category: 'learning', title: 'reading' };
  if (lower.includes('gym') || lower.includes('workout')) {
    return { category: 'health', title: 'gym' };
  }
  if (lower.includes('meet')) return { category: 'shallow-work', title: 'meetings' };

  return { category: 'deep-work', title };
}

export function parseVoiceCommand(transcript: string): VoiceCommandResult | null {
  const text = transcript.trim();
  if (!text) return null;

  const startMatch = START_PATTERN.exec(text);
  if (startMatch) {
    const activity = resolveActivity(startMatch[2]);
    return { action: 'start', ...activity };
  }

  const stopMatch = STOP_PATTERN.exec(text);
  if (stopMatch) {
    const activity = resolveActivity(stopMatch[2]);
    return { action: 'stop', ...activity };
  }

  if (/^stop\.?$/i.test(text)) {
    return { action: 'stop', category: 'deep-work', title: 'activity' };
  }

  return null;
}

export const VOICE_CONTEXTUAL_STRINGS = LIFE_LOG_CATEGORIES.flatMap((c) => c.examples);
