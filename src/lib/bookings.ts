import { UserBooking } from '../types';

const STORAGE_PREFIX = 'resenia_user_bookings_';
// Clave legacy (pre-aislamiento por usuario): almacenaba reservas demo
// compartidas por todos los usuarios del navegador. Se limpia para que
// ningún usuario nuevo pueda heredar esas reservas de prueba.
const LEGACY_STORAGE_KEY = 'resenia_user_bookings';

const storageKeyFor = (userId: string): string => `${STORAGE_PREFIX}${userId}`;

export const getStoredBookings = (userId?: string | null): UserBooking[] => {
  if (typeof window !== 'undefined' && window.localStorage.getItem(LEGACY_STORAGE_KEY)) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  if (!userId) return [];

  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (!raw) return [];
    const parsed: UserBooking[] = JSON.parse(raw);
    return parsed.filter((b) => b.userId === userId);
  } catch (e) {
    console.error('Error reading bookings:', e);
    return [];
  }
};

export const saveBooking = (
  userId: string,
  booking: Omit<UserBooking, 'createdAt' | 'userId'>
): UserBooking => {
  const bookings = getStoredBookings(userId);
  const newBooking: UserBooking = {
    ...booking,
    userId,
    createdAt: new Date().toISOString()
  };
  const updated = [newBooking, ...bookings];
  localStorage.setItem(storageKeyFor(userId), JSON.stringify(updated));
  return newBooking;
};

export const cancelBooking = (userId: string, id: string): UserBooking[] => {
  const bookings = getStoredBookings(userId);
  const updated = bookings.map(b => {
    if (b.id === id) {
      return { ...b, status: 'cancelada' as const };
    }
    return b;
  });
  localStorage.setItem(storageKeyFor(userId), JSON.stringify(updated));
  return updated;
};
