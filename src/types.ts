export type ViewState = 'landing' | 'consumer' | 'business' | 'login' | 'register' | 'forgot_password';

export type UserRole = 'consumer' | 'business';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  authorizedRep?: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  badge: 'Nuevo' | 'Oferta' | 'Tendencia';
  badgeColor: string;
  title: string;
  subtitle: string;
}

export interface LeadItem {
  id: string;
  contact: string;
  type: 'Reserva' | 'Oferta' | 'Consulta';
  touchStep: string;
  currentStep: number;
  totalSteps: number;
}

export interface CompetitorData {
  name: string;
  isCurrent?: boolean;
  rating: number;
  reviewsCount: number;
  trustScore: number;
  trustColor: 'green' | 'gold' | 'brick';
}

export interface NewReview {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

