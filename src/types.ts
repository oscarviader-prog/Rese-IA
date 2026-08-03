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
  avatarUrl?: string;
  phone?: string;
  city?: string;
  bio?: string;
}

export interface NewsItem {
  id: string;
  badge: 'Nuevo' | 'Oferta' | 'Tendencia' | 'Especial';
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
export interface Reservation {
  id: string;
  user_id: string;
  business_name: string;
  reservation_date: string;
  reservation_time: string;
  people: number;
  notes: string;
  status: string;
  created_at: string;
}
