import { useMemo } from 'react';
import {
  mergeCategories,
  resolveCategory,
  type LifeLogCategory,
} from '@/constants/lifeLogCategories';
import { useStore } from '@/store';

export function useResolvedCategories(): LifeLogCategory[] {
  const customs = useStore((s) => s.customLifeLogCategories);
  return useMemo(() => mergeCategories(customs), [customs]);
}

export function useResolvedCategory(id: string): LifeLogCategory | undefined {
  const customs = useStore((s) => s.customLifeLogCategories);
  return useMemo(() => resolveCategory(id, customs), [id, customs]);
}
