import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

export const SUPABASE_URL = 'https://bkmsfroizfkiidvmwiqv.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_k-JCnISmKPXwkKJgqkvc8A_h3ptBf7H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// LocalStorage key for mock persistence
const MOCK_USERS_KEY = 'resenia_mock_users';
const CURRENT_USER_KEY = 'resenia_current_user';

export function getMockUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(MOCK_USERS_KEY);
    if (!data) {
      const defaultUsers: UserProfile[] = [
        {
          id: 'mock-1',
          email: 'consumidor@ejemplo.com',
          role: 'consumer',
          firstName: 'Lucía',
          lastName: 'García',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          password: '123456',
        },
        {
          id: 'mock-2',
          email: 'empresa@tasca.com',
          role: 'business',
          firstName: 'Manuel',
          companyName: 'La Tasca de Marea',
          authorizedRep: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          password: '123456',
        }
      ];
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveMockUser(user: UserProfile) {
  const users = getMockUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIdx >= 0) {
    users[existingIdx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

export function getCurrentStoredUser(): UserProfile | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentStoredUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
