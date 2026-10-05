import { useGenerate, useProfile } from '@/api/hooks';
import type { SuggestionCategory } from '@/api/types';

const ALL: SuggestionCategory[] = ['DAILY', 'WEEKEND', 'MONTHLY'];

/** "Generate now": asks the backend for new ideas in every category that isn't paused. */
export function useGenerateNow() {
  const { data: profile } = useProfile();
  const generate = useGenerate();
  const active = ALL.filter((c) => !profile?.pausedCategories.includes(c));
  return {
    run: () => generate.mutate(active),
    pending: generate.isPending,
    error: generate.error?.message ?? null,
    lastCount: generate.data,
    reset: generate.reset,
    disabled: !profile || active.length === 0,
  };
}
