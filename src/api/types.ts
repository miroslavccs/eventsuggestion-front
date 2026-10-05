export type SuggestionCategory = 'DAILY' | 'WEEKEND' | 'MONTHLY';
export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WISHLIST';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface Suggestion {
  id: number;
  category: SuggestionCategory;
  title: string;
  description: string | null;
  location: string | null;
  estimatedCost: string | null;
  /** ISO date, YYYY-MM-DD */
  suggestedDate: string | null;
  reasonForSuggestion: string | null;
  status: SuggestionStatus;
  feedbackComment: string | null;
  createdAt: string;
  respondedAt: string | null;
  notificationRead: boolean;
  rating: number | null;
  /** ISO date, YYYY-MM-DD */
  snoozedUntil: string | null;
}

export interface Address {
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
}

export interface CustomerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  age: number | null;
  address: Address | null;
  education: string | null;
  currentEmployment: string | null;
  sports: string[];
  hobbies: string[];
  interests: string[];
  likesTraveling: boolean;
  likesNightlife: boolean;
  additionalNotes: string | null;
  vacationMode: boolean;
  pausedCategories: SuggestionCategory[];
  /** Read-only, maintained by the backend. */
  learnedProfile?: string | null;
  /** Read-only: responses left until the learned profile refreshes. */
  responsesUntilRefresh?: number;
}

export interface LoginResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number | null;
  address?: Partial<Address> | null;
  sports?: string[];
  hobbies?: string[];
  interests?: string[];
  likesTraveling?: boolean;
  likesNightlife?: boolean;
}
