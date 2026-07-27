import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

const DEFAULT_SUPABASE_URL = 'https://bkmsfroizfkiidvmwiqv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXNmcm9pemZraWlkdm13aXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzMzNDIsImV4cCI6MjEwMDMwOTM0Mn0.Tqq_mSz18fuS4uDkCUHYkm88PzR-pXsEuc_NnPn1leM';

function cleanEnvValue(val?: string, defaultVal = ''): string {
  if (!val) return defaultVal;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || defaultVal;
}

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};
let rawUrl = cleanEnvValue(env.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL);

if (rawUrl.includes('VITE_')) {
  rawUrl = rawUrl.split('VITE_')[0].trim();
}
rawUrl = rawUrl.replace(/\/+$/, '');

try {
  const u = new URL(rawUrl);
  rawUrl = u.origin;
} catch {
  rawUrl = DEFAULT_SUPABASE_URL;
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = cleanEnvValue(env.VITE_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : null;


// LocalStorage key for mock persistence
const MOCK_USERS_KEY = 'resenia_mock_users';
const CURRENT_USER_KEY = 'resenia_current_user';

export function getMockUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(MOCK_USERS_KEY);
    if (!data) {
      // Default demo accounts
      const defaultUsers: UserProfile[] = [
        {
          id: 'mock-1',
          email: 'consumidor@ejemplo.com',
          role: 'consumer',
          firstName: 'Lucía',
          lastName: 'García',
          emailVerified: true,
          createdAt: new Date().toISOString(),
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
        },
        {
          id: 'mock-3',
          email: 'sinverificar@ejemplo.com',
          role: 'consumer',
          firstName: 'Usuario',
          lastName: 'Pendiente',
          emailVerified: false,
          createdAt: new Date().toISOString(),
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
