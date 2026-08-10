import { UserBooking } from '../types';

const STORAGE_KEY = 'resenia_user_bookings';

const INITIAL_BOOKINGS: UserBooking[] = [
  {
    id: '#RSV-7492',
    userEmail: 'lucia.garcia@gmail.com',
    userName: 'Lucía García',
    placeName: 'Restaurante El Celler de Can Roca',
    placeAddress: 'Carrer de Can Sunyer, 48, Girona',
    guests: '2 personas',
    date: 'Mañana',
    time: '21:00',
    status: 'confirmada',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '#RSV-3105',
    userEmail: 'lucia.garcia@gmail.com',
    userName: 'Lucía García',
    placeName: 'La Tasca de Marea',
    placeAddress: 'Calle Mayor 12, Madrid',
    guests: '4 personas',
    date: 'Este Viernes',
    time: '14:30',
    status: 'confirmada',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  }
];

export const getStoredBookings = (): UserBooking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading bookings:', e);
    return INITIAL_BOOKINGS;
  }
};

export const saveBooking = (booking: Omit<UserBooking, 'createdAt'>): UserBooking => {
  const bookings = getStoredBookings();
  const newBooking: UserBooking = {
    ...booking,
    createdAt: new Date().toISOString()
  };
  const updated = [newBooking, ...bookings];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newBooking;
};

export const cancelBooking = (id: string): UserBooking[] => {
  const bookings = getStoredBookings();
  const updated = bookings.map(b => {
    if (b.id === id) {
      return { ...b, status: 'cancelada' as const };
    }
    return b;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
