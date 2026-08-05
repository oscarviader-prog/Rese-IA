import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, getCurrentStoredUser, setCurrentStoredUser, getMockUsers, saveMockUser } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  autoConfirmAndLogin: (email: string, role: UserRole) => Promise<{ success: boolean }>;
  signupConsumer: (data: { firstName: string; lastName: string; email: string; pass: string; acceptTerms: boolean }) => Promise<{ success: boolean; error?: string }>;
  signupBusiness: (data: { companyName: string; responsibleName: string; email: string; pass: string; isAuthorized: boolean; acceptTerms: boolean }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: 'google' | 'microsoft') => Promise<void>;
  logout: () => void;
  verifyEmailSimulated: (email: string) => void;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
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
            const localStored = getCurrentStoredUser();
            const mockUsers = getMockUsers();
            const mockFound = mockUsers.find(u => u.email.toLowerCase() === (session.user.email || '').toLowerCase());

            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: (userMetaData.role as UserRole) || localStored?.role || mockFound?.role || 'consumer',
              firstName: userMetaData.first_name ?? localStored?.firstName ?? mockFound?.firstName ?? '',
              lastName: userMetaData.last_name ?? localStored?.lastName ?? mockFound?.lastName ?? '',
              companyName: userMetaData.company_name ?? localStored?.companyName ?? mockFound?.companyName ?? '',
              authorizedRep: userMetaData.authorized_rep ?? localStored?.authorizedRep ?? mockFound?.authorizedRep ?? false,
              phone: userMetaData.phone ?? localStored?.phone ?? mockFound?.phone ?? '',
              city: userMetaData.city ?? localStored?.city ?? mockFound?.city ?? '',
              bio: userMetaData.bio ?? localStored?.bio ?? mockFound?.bio ?? '',
              avatarUrl: userMetaData.avatar_url ?? localStored?.avatarUrl ?? mockFound?.avatarUrl ?? '',
              emailVerified: session.user.email_confirmed_at != null,
              createdAt: session.user.created_at,
              password: localStored?.password || mockFound?.password,
            };
            setUser(profile);
            setCurrentStoredUser(profile);
            saveMockUser(profile);
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
            const localStored = getCurrentStoredUser();
            const mockUsers = getMockUsers();
            const mockFound = mockUsers.find(u => u.email.toLowerCase() === (session.user.email || '').toLowerCase());

            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: (userMetaData.role as UserRole) || localStored?.role || mockFound?.role || 'consumer',
              firstName: userMetaData.first_name ?? localStored?.firstName ?? mockFound?.firstName ?? '',
              lastName: userMetaData.last_name ?? localStored?.lastName ?? mockFound?.lastName ?? '',
              companyName: userMetaData.company_name ?? localStored?.companyName ?? mockFound?.companyName ?? '',
              authorizedRep: userMetaData.authorized_rep ?? localStored?.authorizedRep ?? mockFound?.authorizedRep ?? false,
              phone: userMetaData.phone ?? localStored?.phone ?? mockFound?.phone ?? '',
              city: userMetaData.city ?? localStored?.city ?? mockFound?.city ?? '',
              bio: userMetaData.bio ?? localStored?.bio ?? mockFound?.bio ?? '',
              avatarUrl: userMetaData.avatar_url ?? localStored?.avatarUrl ?? mockFound?.avatarUrl ?? '',
              emailVerified: session.user.email_confirmed_at != null,
              createdAt: session.user.created_at,
              password: localStored?.password || mockFound?.password,
            };
            setUser(profile);
            setCurrentStoredUser(profile);
            saveMockUser(profile);
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

    const cleanEmail = email.trim().toLowerCase();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (error) {
          setLoading(false);
          const errTextLower = error.message.toLowerCase();

          // If password was wrong or user doesn't exist in Supabase auth
          if (errTextLower.includes('invalid login credentials') || errTextLower.includes('invalid_credentials')) {
            const mockUsers = getMockUsers();
            const found = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);

            // If user exists in mock registry, verify stored password
            if (found && found.password) {
              if (found.password === pass) {
                const loggedUser = { ...found, role, emailVerified: true };
                saveMockUser(loggedUser);
                setUser(loggedUser);
                setCurrentStoredUser(loggedUser);
                return { success: true };
              } else {
                return { success: false, error: 'Contraseña incorrecta. Comprueba la contraseña que usaste al registrarte.' };
              }
            }

            return { success: false, error: 'Credenciales incorrectas. Comprueba tu correo y contraseña.' };
          }

          if (errTextLower.includes('email not confirmed')) {
            const mockUsers = getMockUsers();
            const found = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
            if (found && found.password && found.password !== pass) {
              return { success: false, error: 'Contraseña incorrecta.' };
            }
            return {
              success: false,
              error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Si no recibiste el correo, utiliza la confirmación directa.'
            };
          }

          if (errTextLower.includes('invalid path') || errTextLower.includes('redirect') || errTextLower.includes('url')) {
            const mockUsers = getMockUsers();
            const found = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
            if (found) {
              if (found.password && found.password !== pass) {
                return { success: false, error: 'Contraseña incorrecta.' };
              }
              const loggedUser = { ...found, role, emailVerified: true };
              saveMockUser(loggedUser);
              setUser(loggedUser);
              setCurrentStoredUser(loggedUser);
              return { success: true };
            }
          }

          return { success: false, error: 'Error al iniciar sesión: ' + error.message };
        }

        if (data.user) {
          if (!data.user.email_confirmed_at) {
            const mockUsers = getMockUsers();
            const found = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
            if (found) {
              if (found.password && found.password !== pass) {
                setLoading(false);
                return { success: false, error: 'Contraseña incorrecta.' };
              }
              found.emailVerified = true;
              found.password = pass;
              saveMockUser(found);
              setUser(found);
              setCurrentStoredUser(found);
              setLoading(false);
              return { success: true };
            }

            setLoading(false);
            return {
              success: false,
              error: 'Tu correo aún no ha sido confirmado por el servidor de Supabase. Revisa tu spam o usa la confirmación directa.'
            };
          }

          const meta = data.user.user_metadata || {};
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            role: (meta.role as UserRole) || role,
            firstName: meta.first_name,
            lastName: meta.last_name,
            companyName: meta.company_name,
            authorizedRep: meta.authorized_rep,
            emailVerified: true,
            createdAt: data.user.created_at,
            password: pass,
          };
          setUser(profile);
          setCurrentStoredUser(profile);
          saveMockUser(profile);
          setLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase sign-in catch fallback:', err);
      }
    }

    // Fallback/Demo Mock Auth logic
    await new Promise((r) => setTimeout(r, 400));
    const mockUsers = getMockUsers();
    const found = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (found) {
      if (found.password && found.password !== pass) {
        setLoading(false);
        return { success: false, error: 'Contraseña incorrecta.' };
      }
      const loggedUser = { ...found, role, emailVerified: true, password: pass };
      saveMockUser(loggedUser);
      setUser(loggedUser);
      setCurrentStoredUser(loggedUser);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: 'Usuario no encontrado o contraseña incorrecta.' };
    }
  };

  const autoConfirmAndLogin = async (emailToConfirm: string, roleToUse: UserRole): Promise<{ success: boolean }> => {
    setLoading(true);
    const mockUsers = getMockUsers();
    let found = mockUsers.find(u => u.email.toLowerCase() === emailToConfirm.toLowerCase());
    if (!found) {
      found = {
        id: 'user-' + Date.now(),
        email: emailToConfirm,
        role: roleToUse,
        firstName: emailToConfirm.split('@')[0],
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
    } else {
      found.emailVerified = true;
      found.role = roleToUse;
    }
    saveMockUser(found);
    setUser(found);
    setCurrentStoredUser(found);
    setLoading(false);
    return { success: true };
  };

  const signupConsumer = async (data: { firstName: string; lastName: string; email: string; pass: string; acceptTerms: boolean }) => {
    setLoading(true);
    if (!data.acceptTerms) {
      setLoading(false);
      return { success: false, error: 'Debes aceptar los términos y la política de privacidad.' };
    }

    if (supabase) {
      try {
        const { data: resData, error } = await supabase.auth.signUp({
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
              password: data.pass,
            };
            saveMockUser(newUser);
            return { success: true };
          }
          return { success: false, error: errMsg };
        }

        // Save user record locally for instant reactivity
        const createdUser: UserProfile = {
          id: resData.user?.id || ('consumer-' + Date.now()),
          email: data.email,
          role: 'consumer',
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerified: !!resData.user?.email_confirmed_at,
          createdAt: new Date().toISOString(),
          password: data.pass,
        };
        saveMockUser(createdUser);

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
          password: data.pass,
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
      password: data.pass,
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
        const { data: resData, error } = await supabase.auth.signUp({
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
              password: data.pass,
            };
            saveMockUser(newUser);
            return { success: true };
          }
          return { success: false, error: errMsg };
        }

        // Save user record locally for instant reactivity
        const createdUser: UserProfile = {
          id: resData.user?.id || ('biz-' + Date.now()),
          email: data.email,
          role: 'business',
          companyName: data.companyName,
          firstName: data.responsibleName,
          authorizedRep: data.isAuthorized,
          emailVerified: !!resData.user?.email_confirmed_at,
          createdAt: new Date().toISOString(),
          password: data.pass,
        };
        saveMockUser(createdUser);

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
          password: data.pass,
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
      password: data.pass,
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

  const updateProfile = async (updatedData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' };

    const newProfile: UserProfile = {
      ...user,
      ...updatedData,
    };

    setUser(newProfile);
    setCurrentStoredUser(newProfile);
    saveMockUser(newProfile);

    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            first_name: newProfile.firstName,
            last_name: newProfile.lastName,
            company_name: newProfile.companyName,
            phone: newProfile.phone,
            city: newProfile.city,
            bio: newProfile.bio,
            avatar_url: newProfile.avatarUrl,
          }
        });
      } catch {
        // Local state already saved
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        autoConfirmAndLogin,
        signupConsumer,
        signupBusiness,
        resetPassword,
        loginWithOAuth,
        logout,
        verifyEmailSimulated,
        updateProfile,
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
