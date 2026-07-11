export interface ContextSuggestion {
  label: string;
  category: string;
  title: string;
}

const DEEP_WORK_SUGGESTIONS: ContextSuggestion[] = [
  { label: 'Take Break', category: 'recovery', title: 'break' },
  { label: 'Drink Water', category: 'health', title: 'water' },
  { label: 'Stretch', category: 'health', title: 'stretch' },
  { label: 'Walk', category: 'health', title: 'walking' },
];

const GYM_SUGGESTIONS: ContextSuggestion[] = [
  { label: 'Protein', category: 'health', title: 'protein' },
  { label: 'Bath', category: 'maintenance', title: 'shower' },
  { label: 'Sleep', category: 'recovery', title: 'sleep' },
];

const HEALTH_SUGGESTIONS: ContextSuggestion[] = [
  { label: 'Drink Water', category: 'health', title: 'water' },
  { label: 'Stretch', category: 'health', title: 'stretch' },
  { label: 'Rest', category: 'recovery', title: 'rest' },
];

const LEARNING_SUGGESTIONS: ContextSuggestion[] = [
  { label: 'Take Notes', category: 'deep-work', title: 'notes' },
  { label: 'Take Break', category: 'recovery', title: 'break' },
  { label: 'Walk', category: 'health', title: 'walking' },
];

const DEFAULT_SUGGESTIONS: ContextSuggestion[] = [
  { label: 'Take Break', category: 'recovery', title: 'break' },
  { label: 'Walk', category: 'health', title: 'walking' },
];

const GYM_KEYWORDS = ['gym', 'workout', 'exercise', 'lifting', 'run', 'jog'];

export function getPostStopSuggestions(category: string, title: string): ContextSuggestion[] {
  const lower = title.toLowerCase();
  if (GYM_KEYWORDS.some((k) => lower.includes(k))) return GYM_SUGGESTIONS;
  if (category === 'deep-work' || lower.includes('coding')) return DEEP_WORK_SUGGESTIONS;
  if (category === 'learning' || lower.includes('reading')) return LEARNING_SUGGESTIONS;
  if (category === 'health') return HEALTH_SUGGESTIONS;
  return DEFAULT_SUGGESTIONS;
}
