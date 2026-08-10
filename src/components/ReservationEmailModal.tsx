import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle, Calendar, Clock, Users, MapPin, X, Send, Copy, Check, Building2, AlertTriangle } from 'lucide-react';

interface ReservationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  placeAddress: string;
  reserveGuests: string;
  reserveDate: string;
  reserveTime: string;
  reserveEmail: string;
  bookingCode: string;
  status?: 'confirmada' | 'cancelada';
}

export const ReservationEmailModal: React.FC<ReservationEmailModalProps> = ({
  isOpen,
  onClose,
  placeName,
  placeAddress,
  reserveGuests,
  reserveDate,
  reserveTime,
  reserveEmail,
  bookingCode,
  status = 'confirmada'
}) => {
  const [copied, setCopied] = useState(false);
  const [resent, setResent] = useState(false);

  if (!isOpen) return null;

  const isCancelled = status === 'cancelada';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className={`bg-slate-900 border-2 ${isCancelled ? 'border-rose-500/50' : 'border-cyan-500/50'} rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.25)] text-slate-100 relative`}>
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isCancelled ? 'bg-rose-950 border-rose-500/40 text-rose-400' : 'bg-cyan-950 border-cyan-500/40 text-[#00f2ff]'}`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {isCancelled ? 'Notificación de Cancelación' : 'Correo de Confirmación'}
                <span className={`px-2 py-0.5 rounded-full ${isCancelled ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'} text-[10px] font-mono-code`}>
                  {isCancelled ? 'CANCELADA' : 'CONFIRMADA'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono-code">
                Bandeja de entrada: <span className="text-cyan-300">{reserveEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Header Metadata */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 text-xs font-mono-code space-y-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase w-14">De:</span>
            <span className="text-cyan-300 font-bold">reservas@resenia.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase w-14">Para:</span>
            <span className="text-white font-semibold">{reserveEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase w-14">Asunto:</span>
            <span className={isCancelled ? "text-rose-300 font-bold" : "text-amber-300 font-bold"}>
              {isCancelled 
                ? `Confirmación de CANCELACIÓN en ${placeName} [${bookingCode}]` 
                : `¡Reserva confirmada en ${placeName}! [${bookingCode}]`}
            </span>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-slate-900 to-slate-950">
          
          {/* Banner */}
          {isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-3.5 shadow-inner">
              <div className="p-2 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-rose-200">
                  Reserva cancelada correctamente
                </h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Te confirmamos que la reserva <strong>{bookingCode}</strong> ha sido anulada. El restaurante ha sido notificado y la mesa liberada.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3.5 shadow-inner">
              <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-200">
                  ¡Tu mesa está reservada!
                </h4>
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  Hemos enviado este comprobante oficial a tu correo electrónico. Muestra este código o email al llegar al local.
                </p>
              </div>
            </div>
          )}

          {/* Booking Ticket Card */}
          <div className={`p-5 rounded-xl bg-slate-950 border ${isCancelled ? 'border-rose-500/30 line-through opacity-85' : 'border-cyan-500/40'} space-y-4 shadow-lg relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 tracking-wider">
                  Establecimiento
                </span>
                <h5 className="font-extrabold text-base text-white flex items-center gap-2 mt-0.5">
                  <Building2 className="w-4 h-4 text-[#00f2ff]" />
                  {placeName}
                </h5>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{placeAddress}</span>
                </p>
              </div>

              {/* Code */}
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 tracking-wider">
                  Código Reserva
                </span>
                <div 
                  onClick={handleCopyCode}
                  className={`mt-0.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isCancelled ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' : 'bg-cyan-950 border-cyan-400/50 text-[#00f2ff]'} font-mono-code text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors`}
                  title="Haz clic para copiar"
                >
                  <span>{bookingCode}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </div>
            </div>

            {/* Grid stats */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="block text-[10px] font-mono-code text-slate-400 uppercase">Comensales</span>
                <span className="font-bold text-xs text-white">{reserveGuests}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <Calendar className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="block text-[10px] font-mono-code text-slate-400 uppercase">Fecha</span>
                <span className="font-bold text-xs text-white">{reserveDate}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="block text-[10px] font-mono-code text-slate-400 uppercase">Hora</span>
                <span className="font-bold text-xs text-white">{reserveTime} h</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResend}
              disabled={resent}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono-code font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              {resent ? '¡Correo reenviado!' : 'Reenviar notificación'}
            </button>

            <button
              onClick={onClose}
              className={`w-full sm:w-auto px-6 py-2 rounded-xl ${isCancelled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950'} font-bold text-xs font-mono-code transition-all shadow-md cursor-pointer`}
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

