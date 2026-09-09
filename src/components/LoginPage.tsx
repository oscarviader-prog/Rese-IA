import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { PastelCard } from './PastelCard';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (view: ViewState) => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, initialRole = 'consumer' }) => {
  const { login, autoConfirmAndLogin, loginWithOAuth } = useAuth();
  
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailTouch, setEmailTouch] = useState(false);

  // Email format validation
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setEmailTouch(true);

    if (!email) {
      setErrorMessage('Por favor, introduce tu correo electrónico.');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, introduce tu contraseña.');
      return;
    }

    setLoading(true);

    const res = await login(email, password, activeRole);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'No se ha podido iniciar sesión. Revisa tus credenciales.');
    } else {
      onNavigate(activeRole === 'business' ? 'business' : 'consumer');
    }
  };

  const handleDirectLogin = async () => {
    if (!email || !isEmailValid) {
      setErrorMessage('Por favor, escribe un correo electrónico válido antes de continuar.');
      return;
    }
    setLoading(true);
    await autoConfirmAndLogin(email, activeRole);
    setLoading(false);
    onNavigate(activeRole === 'business' ? 'business' : 'consumer');
  };

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setOauthLoading(provider);
    setErrorMessage(null);
    try {
      await loginWithOAuth(provider);
      onNavigate(activeRole === 'business' ? 'business' : 'consumer');
    } catch {
      setErrorMessage(`No se pudo conectar con ${provider}. Por favor, inténtalo de nuevo.`);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setErrorMessage('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Brand Identity & Welcome Text */}
        <div className="lg:col-span-5 text-left flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-[#00f2ff]/40 text-[#00f2ff] text-xs font-mono-code w-fit shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
            <span>ACCESO SEGURO RESEÑIA</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-base text-sky-100/80 font-sans-ui leading-relaxed">
              Accede a tu cuenta para continuar analizando reseñas con IA.
            </p>
          </div>

          {/* Value Props Pills */}
          <div className="space-y-3 pt-2 hidden sm:block">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-sky-900/50">
              <div className="p-1.5 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff] mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-mono-code">
                  Detección de reseñas sintéticas
                </h4>
                <p className="text-xs text-sky-200/70">
                  Algoritmos antinaturales identifican bots y compras falsas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-sky-900/50">
              <div className="p-1.5 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff] mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-mono-code">
                  Calificación Ponderada Real
                </h4>
                <p className="text-xs text-sky-200/70">
                  Descartamos el ruido para darte una nota 100% transparente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Card */}
        <div className="lg:col-span-7">
          <PastelCard variant="primary" className="p-6 sm:p-8 max-w-md mx-auto lg:max-w-none shadow-2xl border-[#00f2ff]/40">
            
            {/* Account Type Selector Tabs */}
            <div className="mb-6">
              <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#0a2533]/70 mb-2">
                Tipo de cuenta
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0a2533]/10 rounded-xl border border-[#0a2533]/15">
                <button
                  type="button"
                  onClick={() => setActiveRole('consumer')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold font-sans-ui transition-all ${
                    activeRole === 'consumer'
                      ? 'bg-[#0F766E] text-white shadow-md'
                      : 'text-[#0a2533]/80 hover:text-[#0a2533] hover:bg-white/40'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Consumidor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRole('business')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold font-sans-ui transition-all ${
                    activeRole === 'business'
                      ? 'bg-[#0F766E] text-white shadow-md'
                      : 'text-[#0a2533]/80 hover:text-[#0a2533] hover:bg-white/40'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Empresa</span>
                </button>
              </div>

              {/* Dynamic Description Text */}
              <p className="mt-2.5 text-xs text-[#0a2533]/80 bg-white/60 p-2.5 rounded-lg border border-[#00f2ff]/30 font-sans-ui">
                {activeRole === 'consumer'
                  ? '👤 Inicia sesión como Consumidor para consultar la puntuación real anti-bots de locales y productos.'
                  : '🏢 Inicia sesión como Empresa para gestionar tu reputación online, responder con IA y auditar tus reseñas.'}
              </p>
            </div>

            {/* Elegant Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 text-xs font-medium space-y-2 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{errorMessage}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-red-800">¿No recibiste el correo o deseas acceder ya?</span>
                  <button 
                    type="button"
                    onClick={handleDirectLogin}
                    className="text-xs bg-[#0F766E] hover:bg-[#0d665f] text-white px-3 py-1.5 rounded-lg font-bold shadow transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚡ Confirmar e Iniciar Sesión</span>
                  </button>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Correo electrónico */}
              <div>
                <label className="block text-xs font-bold text-[#0a2533] mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onBlur={() => setEmailTouch(true)}
                    placeholder="tu@ejemplo.com"
                    required
                    className={`w-full pl-9 pr-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border focus:outline-none transition-all placeholder:text-[#0a2533]/40 ${
                      emailTouch && !isEmailValid
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-[#00f2ff]/40 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                    }`}
                  />
                </div>
                {emailTouch && !isEmailValid && (
                  <p className="text-[11px] text-red-600 mt-1">Formato de correo no válido.</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0a2533]">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot_password')}
                    className="text-xs text-[#0F766E] font-semibold hover:underline"
                  >
                    ¿Has olvidado tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a2533]/60 hover:text-[#0a2533]"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Recordarme */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] border-slate-300"
                  />
                  <span className="text-xs font-medium text-[#0a2533]">Recordarme</span>
                </label>

                {/* Quick test simulation help button */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sinverificar@ejemplo.com');
                    setPassword('123456');
                  }}
                  className="text-[10px] text-[#0a2533]/60 hover:text-[#0F766E] underline"
                  title="Rellena datos para probar el aviso de correo sin verificar"
                >
                  Probar sin verificar
                </button>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0d665f] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0F766E]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Separador o (Google Sign-In) */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            {/* Botón Continuar con Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Separador */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#0a2533]/15"></div>
              </div>
              <span className="relative px-3 bg-[#d1eefc] text-[11px] font-mono-code text-[#0a2533]/70 font-semibold uppercase tracking-wider">
                O continuar con
              </span>
            </div>

            {/* Botones OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-[#0a2533] text-xs font-bold rounded-xl border border-[#0a2533]/15 transition-all shadow-sm hover:shadow"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('microsoft')}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-[#0a2533] text-xs font-bold rounded-xl border border-[#0a2533]/15 transition-all shadow-sm hover:shadow"
              >
                {oauthLoading === 'microsoft' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                )}
                <span>Microsoft</span>
              </button>
            </div>

            {/* Footer Prompt */}
            <div className="mt-6 pt-4 border-t border-[#0a2533]/10 text-center">
              <p className="text-xs text-[#0a2533]/80">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="font-bold text-[#0F766E] hover:underline ml-1 cursor-pointer"
                >
                  Crea una cuenta
                </button>
              </p>
            </div>

          </PastelCard>
        </div>

      </div>
    </div>
  );
};
