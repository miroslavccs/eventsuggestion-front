import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './endpoints';
import type { CustomerProfile, Suggestion, SuggestionCategory, SuggestionStatus } from './types';

export const keys = {
  profile: ['profile'] as const,
  suggestions: ['suggestions'] as const,
  notifications: ['notifications'] as const,
};

export const useProfile = () => useQuery({ queryKey: keys.profile, queryFn: api.getProfile });
export const useSuggestions = () => useQuery({ queryKey: keys.suggestions, queryFn: api.getSuggestions });
export const useNotifications = () => useQuery({ queryKey: keys.notifications, queryFn: api.getNotifications });

export function useSuggestion(id: number): Suggestion | undefined {
  return useSuggestions().data?.find((s) => s.id === id);
}

/** Replaces one suggestion in the cached list so the UI updates without a refetch. */
function useSuggestionMutation<V>(fn: (v: V) => Promise<Suggestion>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (updated) => {
      qc.setQueryData<Suggestion[]>(keys.suggestions, (old) =>
        old?.map((s) => (s.id === updated.id ? updated : s)),
      );
      qc.invalidateQueries({ queryKey: keys.notifications });
      // Feedback can trigger a learned-profile refresh on the backend.
      qc.invalidateQueries({ queryKey: keys.profile });
    },
  });
}

export const useFeedback = () =>
  useSuggestionMutation(
    (v: { id: number; status: Exclude<SuggestionStatus, 'PENDING'>; comment?: string }) =>
      api.feedback(v.id, v.status, v.comment),
  );
export const useSnooze = () => useSuggestionMutation((v: { id: number; until: string }) => api.snooze(v.id, v.until));
export const useRate = () => useSuggestionMutation((v: { id: number; rating: number }) => api.rate(v.id, v.rating));
export const usePlan = () =>
  useSuggestionMutation((v: { id: number; targetDate: string | null }) => api.plan(v.id, v.targetDate));

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

/** Generates new suggestions for the given categories (the default is all active ones). */
export function useGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categories: SuggestionCategory[]) => {
      // Sequential: each call hits the LLM, so avoid hammering it in parallel.
      let created = 0;
      for (const c of categories) created += (await api.generate(c)).length;
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.suggestions });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

/** Full-object PUT: merge the patch into the cached profile so no field is dropped. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<CustomerProfile>) => {
      const current = qc.getQueryData<CustomerProfile>(keys.profile) ?? (await api.getProfile());
      return api.updateProfile({ ...current, ...patch });
    },
    onSuccess: (profile) => qc.setQueryData(keys.profile, profile),
  });
}
