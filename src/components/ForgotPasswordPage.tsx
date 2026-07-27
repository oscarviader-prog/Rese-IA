import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../context/AuthContext';
import { PastelCard } from './PastelCard';

interface ForgotPasswordPageProps {
  onNavigate: (view: ViewState) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduce un correo electrónico válido.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      setErrorMessage(res.error || 'Ocurrió un error al procesar tu solicitud.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <PastelCard variant="primary" className="p-6 sm:p-8 shadow-2xl border-[#00f2ff]/50 animate-fadeIn">
          
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-xs font-bold text-[#0a2533]/80 hover:text-[#0a2533] flex items-center gap-1.5 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio de sesión</span>
          </button>

          {!sent ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/30 flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-display font-extrabold text-[#0a2533] mb-2">
                ¿Has olvidado tu contraseña?
              </h2>
              <p className="text-xs text-[#0a2533]/80 mb-6 leading-relaxed">
                Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0a2533] mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0a2533]/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@ejemplo.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white text-[#0a2533] text-sm rounded-xl border border-[#00f2ff]/40 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all placeholder:text-[#0a2533]/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0d665f] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando solicitud...</span>
                    </>
                  ) : (
                    <span>Enviar enlace de recuperación</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-[#0F766E]/20 text-[#0F766E] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-display font-extrabold text-[#0a2533]">
                Correo enviado
              </h2>

              <p className="text-xs text-[#0a2533]/80 leading-relaxed font-sans-ui">
                Si existe una cuenta asociada a <span className="font-bold text-[#0F766E]">{email}</span>, recibirás un enlace para restablecer tu contraseña en unos momentos.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left text-xs space-y-2 text-amber-950">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>💡</span> ¿No recibes el correo?
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900/90 leading-snug">
                  <li><strong>Revisa Spam / Correo no deseado:</strong> Los correos enviados desde el remitente por defecto de Supabase a menudo caen en spam.</li>
                  <li><strong>Límite gratuito de Supabase:</strong> El servicio por defecto de Supabase limita estrictamente el envío (máx. 3-4 correos/hora).</li>
                  <li><strong>Solución definitiva:</strong> En tu panel de Supabase (<em>Authentication -&gt; Email Settings</em>), activa un proveedor SMTP propio (Resend, SendGrid, Brevo, etc.).</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 px-4 bg-[#0F766E] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer mt-4"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          )}

        </PastelCard>
      </div>
    </div>
  );
};
