import { useBuddyOptional } from '@/hooks/useBuddyAssistant';

type BuddyWithLockScreenLabel = {
  lockScreenStatusLabel: string | null;
};

export function useBuddyLockScreenStatusLabel(): string | null {
  const buddy = useBuddyOptional();
  if (!buddy) return null;
  return (buddy as BuddyWithLockScreenLabel).lockScreenStatusLabel;
}
