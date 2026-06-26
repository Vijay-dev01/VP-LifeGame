import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Brain,
  Briefcase,
  DollarSign,
  Moon,
  PlayCircle,
  Settings,
  Users,
} from 'lucide-react-native';

export interface LifeLogCategory {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
  examples: string[];
}

export const LIFE_LOG_CATEGORIES: LifeLogCategory[] = [
  {
    id: 'deep-work',
    label: 'Deep Work',
    color: '#3b82f6',
    icon: Brain,
    examples: ['coding', 'focused work', 'writing'],
  },
  {
    id: 'shallow-work',
    label: 'Shallow Work',
    color: '#60a5fa',
    icon: Briefcase,
    examples: ['meetings', 'job applications', 'emails'],
  },
  {
    id: 'learning',
    label: 'Learning',
    color: '#a855f7',
    icon: BookOpen,
    examples: ['reading', 'courses', 'tutorials'],
  },
  {
    id: 'health',
    label: 'Health',
    color: '#22c55e',
    icon: Activity,
    examples: ['gym', 'walking', 'eating', 'meditation'],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    color: '#15803d',
    icon: Moon,
    examples: ['sleep', 'nap', 'resting'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    color: '#f97316',
    icon: PlayCircle,
    examples: ['movies', 'gaming', 'music'],
  },
  {
    id: 'distraction',
    label: 'Distraction',
    color: '#ef4444',
    icon: AlertCircle,
    examples: ['random youtube', 'scrolling', 'wasting time'],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    color: '#ec4899',
    icon: Users,
    examples: ['family', 'friends', 'partner'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    color: '#eab308',
    icon: Settings,
    examples: ['cleaning', 'travel', 'shopping'],
  },
  {
    id: 'finance',
    label: 'Finance',
    color: '#ca8a04',
    icon: DollarSign,
    examples: ['investing', 'budgeting', 'salary planning'],
  },
];

export const PRODUCTIVE_CATEGORY_IDS = ['deep-work', 'shallow-work', 'learning'] as const;
export const DISTRACTION_CATEGORY_ID = 'distraction';
export const RECOVERY_CATEGORY_IDS = ['recovery'] as const;

export const QUICK_ADD_CATEGORY_IDS = ['deep-work', 'learning', 'health', 'distraction'] as const;

export function getCategoryById(id: string): LifeLogCategory | undefined {
  return LIFE_LOG_CATEGORIES.find((c) => c.id === id);
}

export function getDefaultTitleForCategory(categoryId: string): string {
  const cat = getCategoryById(categoryId);
  if (!cat) return 'Activity';
  return cat.examples[0] ?? cat.label;
}
