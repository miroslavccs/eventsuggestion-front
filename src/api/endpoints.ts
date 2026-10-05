import { request } from './client';
import type {
  CustomerProfile,
  LoginResponse,
  RegisterRequest,
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from './types';

export const api = {
  login: (email: string, password: string) => request<LoginResponse>('POST', '/auth/login', { email, password }),
  register: (body: RegisterRequest) => request<LoginResponse>('POST', '/auth/register', body),

  getProfile: () => request<CustomerProfile>('GET', '/customers/me'),
  updateProfile: (profile: CustomerProfile) => request<CustomerProfile>('PUT', '/customers/me', profile),

  getSuggestions: () => request<Suggestion[]>('GET', '/suggestions'),
  getNotifications: () => request<Suggestion[]>('GET', '/suggestions/notifications'),
  generate: (category: SuggestionCategory) =>
    request<Suggestion[]>('POST', `/suggestions/generate?category=${category}`),
  feedback: (id: number, status: Exclude<SuggestionStatus, 'PENDING'>, comment?: string) =>
    request<Suggestion>('PUT', `/suggestions/${id}/feedback`, { status, comment: comment || null }),
  markRead: (id: number) => request<void>('PUT', `/suggestions/${id}/read`),
  snooze: (id: number, until: string) => request<Suggestion>('PUT', `/suggestions/${id}/snooze`, { until }),
  rate: (id: number, rating: number) => request<Suggestion>('PUT', `/suggestions/${id}/rating`, { rating }),
  plan: (id: number, targetDate: string | null) =>
    request<Suggestion>('PUT', `/suggestions/${id}/plan`, { targetDate }),
};
