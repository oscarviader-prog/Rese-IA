import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  MailCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { PastelCard } from './PastelCard';

interface RegisterPageProps {
  onNavigate: (view: ViewState) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { signupConsumer, signupBusiness, autoConfirmAndLogin } = useAuth();

  // Step 1: 'select_role', Step 2: 'fill_form', Step 3: 'email_sent'
  const [step, setStep] = useState<'select_role' | 'fill_form' | 'email_sent'>('select_role');
  const [role, setRole] = useState<UserRole>('consumer');

  // Consumer Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Business Fields
  const [companyName, setCompanyName] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage(null);
    setStep('fill_form');
  };

  const handleConsumerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Por favor, completa tu nombre y apellidos.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduce un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos y la política de privacidad.');
      return;
    }

    setLoading(true);
    const res = await signupConsumer({
      firstName,
      lastName,
      email,
      pass: password,
      acceptTerms,
    });
    setLoading(false);

    if (res.success) {
      setStep('email_sent');
    } else {
      setErrorMessage(res.error || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Por favor, indica el nombre de la empresa.');
      return;
    }
    if (!responsibleName.trim()) {
      setErrorMessage('Por favor, indica el nombre del responsable.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduce un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos y la política de privacidad.');
      return;
    }

    setLoading(true);
    const res = await signupBusiness({
      companyName,
      responsibleName,
      email,
      pass: password,
      isAuthorized,
      acceptTerms,
    });
    setLoading(false);

    if (res.success) {
      setStep('email_sent');
    } else {
      setErrorMessage(res.error || 'No se pudo registrar la empresa. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* STEP 1: Account Type Selection Cards */}
        {step === 'select_role' && (
          <div className="space-y-6 text-center animate-fadeIn">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-[#00f2ff]/40 text-[#00f2ff] text-xs font-mono-code mb-2 shadow-[0_0_12px_rgba(0,242,255,0.2)]">
                <ShieldCheck className="w-4 h-4" />
                <span>NUEVA CUENTA EN RESEÑIA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                ¿Cómo quieres usar ReseñIA?
              </h1>
              <p className="text-sm text-sky-100/80 max-w-md mx-auto font-sans-ui">
                Elige el perfil que mejor se adapte a tus necesidades para personalizar tu experiencia.
              </p>
            </div>

            {/* Account Type Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
              
              {/* Consumidor Card */}
              <div 
                onClick={() => handleSelectRole('consumer')}
                className="group cursor-pointer p-6 rounded-2xl bg-[#d1eefc] border-2 border-[#00f2ff]/40 hover:border-[#0F766E] shadow-xl hover:shadow-2xl transition-all text-left flex flex-col justify-between space-y-5 transform hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#0a2533] mb-2 flex items-center gap-2">
                    <span>Consumidor</span>
                  </h3>
                  <p className="text-xs text-[#0a2533]/80 leading-relaxed font-sans-ui">
                    Analiza productos, empresas y guarda tus favoritos. Consulta valoraciones reales filtradas con IA anti-bots.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRole('consumer');
                  }}
                  className="w-full py-2.5 px-4 bg-[#0F766E] group-hover:bg-[#0d665f] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Continuar como consumidor</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Empresa Card */}
              <div 
                onClick={() => handleSelectRole('business')}
                className="group cursor-pointer p-6 rounded-2xl bg-[#d1eefc] border-2 border-[#00f2ff]/40 hover:border-[#0F766E] shadow-xl hover:shadow-2xl transition-all text-left flex flex-col justify-between space-y-5 transform hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-700 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#0a2533] mb-2 flex items-center gap-2">
                    <span>Empresa</span>
                  </h3>
                  <p className="text-xs text-[#0a2533]/80 leading-relaxed font-sans-ui">
                    Gestiona tu reputación online, analiza reseñas y responde automáticamente con IA. Audita tu impacto real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRole('business');
                  }}
                  className="w-full py-2.5 px-4 bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Continuar como empresa</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-sky-200/80">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  className="font-bold text-[#00f2ff] hover:underline ml-1 cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>

          </div>
        )}

        {/* STEP 2: Registration Forms */}
        {step === 'fill_form' && (
          <PastelCard variant="primary" className="p-6 sm:p-8 max-w-lg mx-auto shadow-2xl border-[#00f2ff]/50 animate-fadeIn">
            
            {/* Top Navigation & Role Badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0a2533]/15">
              <button
                type="button"
                onClick={() => setStep('select_role')}
                className="text-xs font-bold text-[#0a2533]/80 hover:text-[#0a2533] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cambiar tipo de cuenta</span>
              </button>

              <span className={`px-3 py-1 rounded-full text-[11px] font-mono-code font-bold uppercase tracking-wider ${
                role === 'consumer' 
                  ? 'bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/30' 
                  : 'bg-purple-700/15 text-purple-900 border border-purple-700/30'
              }`}>
                {role === 'consumer' ? '👤 CONSUMIDOR' : '🏢 EMPRESA'}
              </span>
            </div>

            <h2 className="text-2xl font-display font-extrabold text-[#0a2533] mb-1">
              {role === 'consumer' ? 'Crear cuenta de Consumidor' : 'Crear cuenta de Empresa'}
            </h2>
            <p className="text-xs text-[#0a2533]/80 mb-6">
              Rellena tus datos para comenzar a utilizar ReseñIA.
            </p>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CONSUMER FORM */}
            {role === 'consumer' && (
              <form onSubmit={handleConsumerSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0a2533] mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Laura"
                      required
                      className="w-full px-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0a2533] mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Fernández"
                      required
                      className="w-full px-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="laura@ejemplo.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a2533]/60 hover:text-[#0a2533]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a2533]/60 hover:text-[#0a2533]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Mandatory Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#0F766E] focus:ring-[#0F766E] border-slate-300"
                    />
                    <span className="text-xs text-[#0a2533]/90 leading-tight">
                      Acepto los <a href="#terminos" className="underline font-bold hover:text-[#0F766E]">términos y condiciones</a> y la <a href="#privacidad" className="underline font-bold hover:text-[#0F766E]">política de privacidad</a>.
                    </span>
                  </label>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0d665f] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando tu cuenta...</span>
                    </>
                  ) : (
                    <span>Crear cuenta</span>
                  )}
                </button>

                {/* Footer Switch */}
                <div className="pt-4 border-t border-[#0a2533]/10 text-center">
                  <p className="text-xs text-[#0a2533]/80">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="font-bold text-[#0F766E] hover:underline ml-1 cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>

              </form>
            )}

            {/* EMPRESA FORM */}
            {role === 'business' && (
              <form onSubmit={handleBusinessSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. La Tasca de Marea S.L."
                    required
                    className="w-full px-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Nombre del responsable
                  </label>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    required
                    className="w-full px-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@latascademarea.es"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a2533]/60 hover:text-[#0a2533]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a2533]/60 hover:text-[#0a2533]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Company Authorization Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAuthorized}
                      onChange={(e) => setIsAuthorized(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-purple-700 focus:ring-purple-700 border-slate-300"
                    />
                    <span className="text-xs text-[#0a2533]/90 leading-tight">
                      Confirmo que soy representante autorizado de esta empresa.
                    </span>
                  </label>
                </div>

                {/* Terms Checkbox */}
                <div>
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#0F766E] focus:ring-[#0F766E] border-slate-300"
                    />
                    <span className="text-xs text-[#0a2533]/90 leading-tight">
                      Acepto los <a href="#terminos" className="underline font-bold hover:text-[#0F766E]">términos y condiciones</a> y la <a href="#privacidad" className="underline font-bold hover:text-[#0F766E]">política de privacidad</a>.
                    </span>
                  </label>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-purple-800 hover:bg-purple-900 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando empresa...</span>
                    </>
                  ) : (
                    <span>Crear cuenta</span>
                  )}
                </button>

                {/* Footer Switch */}
                <div className="pt-4 border-t border-[#0a2533]/10 text-center">
                  <p className="text-xs text-[#0a2533]/80">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="font-bold text-[#0F766E] hover:underline ml-1 cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>

              </form>
            )}

          </PastelCard>
        )}

        {/* STEP 3: Email Verification Confirmation Screen */}
        {step === 'email_sent' && (
          <PastelCard variant="primary" className="p-8 sm:p-10 max-w-md mx-auto text-center shadow-2xl border-[#00f2ff]/60 animate-fadeIn space-y-6">
            
            {/* Animated Email Verification Illustration */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00f2ff]/20 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xl border-2 border-[#00f2ff]/40">
                <MailCheck className="w-10 h-10 text-[#00f2ff]" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0a2533]">
                Revisa tu correo
              </h2>
              <p className="text-xs sm:text-sm text-[#0a2533]/80 leading-relaxed font-sans-ui">
                Hemos enviado un enlace de verificación a <span className="font-bold text-[#0F766E]">{email}</span>. Debes confirmar tu cuenta antes de iniciar sesión.
              </p>
            </div>

            <div className="bg-white/70 p-3.5 rounded-xl border border-[#00f2ff]/30 text-left text-xs text-[#0a2533]/90 space-y-1.5">
              <p className="font-bold text-[#0F766E] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¿No encuentras el correo?</span>
              </p>
              <ul className="list-disc pl-4 text-[11px] text-[#0a2533]/80 space-y-1">
                <li><strong>Carpeta Spam/No deseado:</strong> Revisa tu bandeja de spam.</li>
                <li><strong>Límite de Supabase:</strong> El servicio gratuito por defecto de Supabase limita el envío de correos.</li>
                <li><strong>Acceso inmediato:</strong> En tu panel de Supabase (<em>Authentication -&gt; Email Settings</em>), puedes desactivar "Confirm Email" si prefieres que los usuarios accedan inmediatamente sin esperar enlace.</li>
              </ul>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  await autoConfirmAndLogin(email, role);
                  onNavigate(role === 'business' ? 'business' : 'consumer');
                }}
                className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0d665f] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Confirmar e Iniciar Sesión Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-[#0a2533] text-xs font-bold rounded-xl border border-[#0a2533]/15 transition-all cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </div>

          </PastelCard>
        )}

      </div>
    </div>
  );
};
