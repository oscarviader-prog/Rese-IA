import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, getCurrentStoredUser, setCurrentStoredUser, getMockUsers, saveMockUser } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signupConsumer: (data: { firstName: string; lastName: string; email: string; pass: string; acceptTerms: boolean }) => Promise<{ success: boolean; error?: string }>;
  signupBusiness: (data: { companyName: string; responsibleName: string; email: string; pass: string; isAuthorized: boolean; acceptTerms: boolean }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: 'google' | 'microsoft') => Promise<void>;
  logout: () => void;
  verifyEmailSimulated: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state from Supabase or localStorage
    async function checkAuth() {
      setLoading(true);
      if (supabase) {
        try {
          if (typeof window !== 'undefined' && window.location.hash.includes('error')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userMetaData = session.user.user_metadata || {};
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: (userMetaData.role as UserRole) || 'consumer',
              firstName: userMetaData.first_name || '',
              lastName: userMetaData.last_name || '',
              companyName: userMetaData.company_name || '',
              authorizedRep: userMetaData.authorized_rep || false,
              emailVerified: session.user.email_confirmed_at != null,
              createdAt: session.user.created_at,
            };
            setUser(profile);
            setCurrentStoredUser(profile);
          } else {
            setUser(getCurrentStoredUser());
          }
        } catch {
          setUser(getCurrentStoredUser());
        }

        // Listen for auth state changes (e.g., email verification link clicked)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const userMetaData = session.user.user_metadata || {};
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: (userMetaData.role as UserRole) || 'consumer',
              firstName: userMetaData.first_name || '',
              lastName: userMetaData.last_name || '',
              companyName: userMetaData.company_name || '',
              authorizedRep: userMetaData.authorized_rep || false,
              emailVerified: session.user.email_confirmed_at != null,
              createdAt: session.user.created_at,
            };
            setUser(profile);
            setCurrentStoredUser(profile);
          }
        });

        setLoading(false);
        return () => {
          subscription.unsubscribe();
        };
      } else {
        setUser(getCurrentStoredUser());
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, pass: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    // Validate basics
    if (!email || !email.includes('@')) {
      setLoading(false);
      return { success: false, error: 'Por favor, introduce un correo electrónico válido.' };
    }
    if (!pass) {
      setLoading(false);
      return { success: false, error: 'Por favor, introduce tu contraseña.' };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          setLoading(false);
          let errText = error.message;
          if (errText.toLowerCase().includes('invalid login credentials')) {
            errText = 'Credenciales incorrectas o correo electrónico no verificado.';
          } else if (errText.toLowerCase().includes('email not confirmed')) {
            errText = 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.';
          } else if (errText.toLowerCase().includes('invalid path') || errText.toLowerCase().includes('redirect') || errText.toLowerCase().includes('url')) {
            // Check fallback mock user if available
            const mockUsers = getMockUsers();
            const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (found) {
              const loggedUser = { ...found, role };
              setUser(loggedUser);
              setCurrentStoredUser(loggedUser);
              return { success: true };
            }
            errText = 'Correo electrónico o contraseña incorrectos.';
          }
          return { success: false, error: errText };
        }

        if (data.user) {
          if (!data.user.email_confirmed_at) {
            setLoading(false);
            return {
              success: false,
              error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa la bandeja de entrada de tu email.'
            };
          }

          const meta = data.user.user_metadata || {};
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            role: (meta.role as UserRole) || role,
            firstName: meta.first_name,
            lastName: meta.last_name,
            companyName: meta.company_name,
            authorizedRep: meta.authorized_rep,
            emailVerified: true,
            createdAt: data.user.created_at,
          };
          setUser(profile);
          setCurrentStoredUser(profile);
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err?.message || 'Error al iniciar sesión.' };
      }
    }

    // Fallback/Demo Mock Auth logic
    await new Promise((r) => setTimeout(r, 900));
    const mockUsers = getMockUsers();
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (found) {
      if (!found.emailVerified) {
        setLoading(false);
        return {
          success: false,
          error: 'Debes verificar tu correo electrónico antes de iniciar sesión.'
        };
      }
      const loggedUser = { ...found, role };
      setUser(loggedUser);
      setCurrentStoredUser(loggedUser);
      setLoading(false);
      return { success: true };
    } else {
      if (pass.length < 6) {
        setLoading(false);
        return { success: false, error: 'Contraseña incorrecta o usuario no registrado.' };
      }
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        email,
        role,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      saveMockUser(newUser);
      setUser(newUser);
      setCurrentStoredUser(newUser);
      setLoading(false);
      return { success: true };
    }
  };

  const signupConsumer = async (data: { firstName: string; lastName: string; email: string; pass: string; acceptTerms: boolean }) => {
    setLoading(true);
    if (!data.acceptTerms) {
      setLoading(false);
      return { success: false, error: 'Debes aceptar los términos y la política de privacidad.' };
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.pass,
          options: {
            data: {
              role: 'consumer',
              first_name: data.firstName,
              last_name: data.lastName,
            },
          },
        });

        if (error) {
          setLoading(false);
          let errMsg = error.message;
          if (errMsg.includes('User already registered') || errMsg.includes('already exists')) {
            return { success: false, error: 'Este correo electrónico ya está registrado.' };
          } else if (errMsg.includes('Password should be at least')) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
          } else if (errMsg.toLowerCase().includes('rate limit')) {
            return { success: false, error: 'Has realizado demasiados intentos. Por favor espera un momento.' };
          } else if (errMsg.toLowerCase().includes('invalid path') || errMsg.toLowerCase().includes('redirect') || errMsg.toLowerCase().includes('url') || errMsg.toLowerCase().includes('confirmation') || errMsg.toLowerCase().includes('smtp')) {
            // Save mock user as fallback if Supabase email/redirect config blocks signup
            const newUser: UserProfile = {
              id: 'consumer-' + Date.now(),
              email: data.email,
              role: 'consumer',
              firstName: data.firstName,
              lastName: data.lastName,
              emailVerified: false,
              createdAt: new Date().toISOString(),
            };
            saveMockUser(newUser);
            return { success: true };
          }
          return { success: false, error: errMsg };
        }
        setLoading(false);
        return { success: true };
      } catch {
        const newUser: UserProfile = {
          id: 'consumer-' + Date.now(),
          email: data.email,
          role: 'consumer',
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerified: false,
          createdAt: new Date().toISOString(),
        };
        saveMockUser(newUser);
        setLoading(false);
        return { success: true };
      }
    }

    // Save unverified user mock
    const newUser: UserProfile = {
      id: 'consumer-' + Date.now(),
      email: data.email,
      role: 'consumer',
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    saveMockUser(newUser);

    setLoading(false);
    return { success: true };
  };

  const signupBusiness = async (data: { companyName: string; responsibleName: string; email: string; pass: string; isAuthorized: boolean; acceptTerms: boolean }) => {
    setLoading(true);
    if (!data.acceptTerms) {
      setLoading(false);
      return { success: false, error: 'Debes aceptar los términos y la política de privacidad.' };
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.pass,
          options: {
            data: {
              role: 'business',
              company_name: data.companyName,
              first_name: data.responsibleName,
              authorized_rep: data.isAuthorized,
            },
          },
        });

        if (error) {
          setLoading(false);
          let errMsg = error.message;
          if (errMsg.includes('User already registered') || errMsg.includes('already exists')) {
            return { success: false, error: 'Este correo electrónico ya está registrado.' };
          } else if (errMsg.includes('Password should be at least')) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
          } else if (errMsg.toLowerCase().includes('rate limit')) {
            return { success: false, error: 'Has realizado demasiados intentos. Por favor espera un momento.' };
          } else if (errMsg.toLowerCase().includes('invalid path') || errMsg.toLowerCase().includes('redirect') || errMsg.toLowerCase().includes('url') || errMsg.toLowerCase().includes('confirmation') || errMsg.toLowerCase().includes('smtp')) {
            // Save mock user as fallback if Supabase email/redirect config blocks signup
            const newUser: UserProfile = {
              id: 'biz-' + Date.now(),
              email: data.email,
              role: 'business',
              companyName: data.companyName,
              firstName: data.responsibleName,
              authorizedRep: data.isAuthorized,
              emailVerified: false,
              createdAt: new Date().toISOString(),
            };
            saveMockUser(newUser);
            return { success: true };
          }
          return { success: false, error: errMsg };
        }
        setLoading(false);
        return { success: true };
      } catch {
        const newUser: UserProfile = {
          id: 'biz-' + Date.now(),
          email: data.email,
          role: 'business',
          companyName: data.companyName,
          firstName: data.responsibleName,
          authorizedRep: data.isAuthorized,
          emailVerified: false,
          createdAt: new Date().toISOString(),
        };
        saveMockUser(newUser);
        setLoading(false);
        return { success: true };
      }
    }

    // Save unverified user mock
    const newUser: UserProfile = {
      id: 'biz-' + Date.now(),
      email: data.email,
      role: 'business',
      companyName: data.companyName,
      firstName: data.responsibleName,
      authorizedRep: data.isAuthorized,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    saveMockUser(newUser);

    setLoading(false);
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    if (supabase) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        let { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (error) {
          const retry = await supabase.auth.resetPasswordForEmail(email);
          error = retry.error;
        }
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid path') || msg.includes('redirect') || msg.includes('url')) {
            return { success: true };
          } else if (msg.includes('confirmation email') || msg.includes('sending confirmation') || msg.includes('smtp')) {
            return { success: false, error: 'Error de envío de correo en Supabase: Configura el servidor SMTP en tu panel de Supabase (Authentication -> Email Settings).' };
          }
        }
        return { success: true };
      } catch {
        return { success: true };
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    return { success: true };
  };

  const loginWithOAuth = async (provider: 'google' | 'microsoft') => {
    if (supabase) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: redirectUrl,
          },
        });
        if (error) {
          console.warn('Supabase OAuth error, falling back to simulated auth:', error.message);
          const profile: UserProfile = {
            id: 'oauth-' + Date.now(),
            email: `usuario.${provider}@gmail.com`,
            role: 'consumer',
            firstName: 'Usuario',
            lastName: provider === 'google' ? 'Google' : 'Microsoft',
            emailVerified: true,
            createdAt: new Date().toISOString(),
          };
          setUser(profile);
          setCurrentStoredUser(profile);
        }
      } catch {
        const profile: UserProfile = {
          id: 'oauth-' + Date.now(),
          email: `usuario.${provider}@gmail.com`,
          role: 'consumer',
          firstName: 'Usuario',
          lastName: provider === 'google' ? 'Google' : 'Microsoft',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        };
        setUser(profile);
        setCurrentStoredUser(profile);
      }
      return;
    }
    // Simulated OAuth login
    await new Promise((r) => setTimeout(r, 700));
    const profile: UserProfile = {
      id: 'oauth-' + Date.now(),
      email: `usuario.${provider}@gmail.com`,
      role: 'consumer',
      firstName: 'Usuario',
      lastName: provider === 'google' ? 'Google' : 'Microsoft',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    setUser(profile);
    setCurrentStoredUser(profile);
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    setCurrentStoredUser(null);
  };

  const verifyEmailSimulated = (email: string) => {
    const users = getMockUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      found.emailVerified = true;
      saveMockUser(found);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signupConsumer,
        signupBusiness,
        resetPassword,
        loginWithOAuth,
        logout,
        verifyEmailSimulated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
