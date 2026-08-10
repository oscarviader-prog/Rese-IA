import React, { useState, useEffect } from 'react';
import { PastelCard } from './PastelCard';
import { NewReview, UserBooking } from '../types';
import { ReviewModal } from './ReviewModal';
import { ReservationEmailModal } from './ReservationEmailModal';
import { SearchBar, PlaceResult } from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { getStoredBookings, saveBooking, cancelBooking } from '../lib/bookings';
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  MapPin,
  Building2,
  MessageSquareText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Mail,
  Loader2,
  Eye,
  Send,
  XCircle,
  Clock,
  Users,
  BookmarkCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ConsumerViewProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onSelectPlace?: (placeId: string, place?: PlaceResult) => void;
  selectedPlace?: PlaceResult | null;
}

export const ConsumerView: React.FC<ConsumerViewProps> = ({
  searchQuery = '',
  setSearchQuery,
  onSelectPlace,
  selectedPlace
}) => {
  const { user } = useAuth();

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<NewReview[]>([]);

  // Reservation Accordion state
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveGuests, setReserveGuests] = useState('2 personas');
  const [reserveTime, setReserveTime] = useState('20:30');
  const [reserveDate, setReserveDate] = useState('Hoy');
  const [reserveEmail, setReserveEmail] = useState(user?.email || 'lucia.garcia@gmail.com');
  const [bookingCode, setBookingCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reserveConfirmed, setReserveConfirmed] = useState(false);
  
  // Active modal booking state
  const [activeBookingForEmail, setActiveBookingForEmail] = useState<UserBooking | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserBooking | null>(null);

  // Stored Bookings List
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [isBookingsSectionOpen, setIsBookingsSectionOpen] = useState(false);

  useEffect(() => {
    setUserBookings(getStoredBookings());
  }, []);

  // Update email if user changes or logs in
  useEffect(() => {
    if (user?.email) {
      setReserveEmail(user.email);
    }
  }, [user]);

  const handleAddReview = (newReview: NewReview) => {
    setUserReviews((prev) => [newReview, ...prev]);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    const generatedCode = `#RSV-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingCode(generatedCode);

    const currentPlaceName = selectedPlace?.displayName?.text || 'Establecimiento Seleccionado';
    const currentPlaceAddress = selectedPlace?.formattedAddress || 'Sin dirección';

    const newBookingData = saveBooking({
      id: generatedCode,
      userEmail: reserveEmail,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Cliente',
      placeName: currentPlaceName,
      placeAddress: currentPlaceAddress,
      guests: reserveGuests,
      date: reserveDate,
      time: reserveTime,
      status: 'confirmada'
    });

    // Simulate async email dispatch
    setTimeout(() => {
      setIsSendingEmail(false);
      setReserveConfirmed(true);
      setUserBookings(getStoredBookings());
      setActiveBookingForEmail(newBookingData);
      setIsEmailModalOpen(true);
    }, 1200);
  };

  const handleCancelBooking = (id: string) => {
    const updated = cancelBooking(id);
    setUserBookings(updated);

    const cancelledItem = updated.find(b => b.id === id);
    if (cancelledItem) {
      setActiveBookingForEmail(cancelledItem);
      setIsEmailModalOpen(true);
    }
  };

  const handleOpenEmailForBooking = (b: UserBooking) => {
    setActiveBookingForEmail(b);
    setIsEmailModalOpen(true);
  };

  const placeName = selectedPlace?.displayName?.text || 'Establecimiento Seleccionado';
  const placeAddress = selectedPlace?.formattedAddress || 'Sin dirección';
  const placeCategory = selectedPlace?.primaryTypeDisplayName?.text || 'Negocio';
  const googleRating = selectedPlace?.rating;
  const ratingCount = selectedPlace?.userRatingCount;

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      
      {/* 1. Interactive AI Search Card */}
      <PastelCard variant="accent" className="relative overflow-visible shadow-[0_0_25px_rgba(0,242,255,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-[10px] font-mono-code font-bold tracking-wider uppercase border border-cyan-400 shadow-sm">
              ✨ RESEÑIA BUSCADOR INTELIGENTE
            </span>
            <h3 className="text-lg font-display font-bold text-slate-900">
              ¿Qué negocio o lugar buscas hoy?
            </h3>
          </div>
          <span className="text-[11px] font-mono-code text-slate-600">
            Google Places API en tiempo real
          </span>
        </div>

        <p className="text-xs font-sans-ui text-slate-700 mb-3">
          Busca cualquier establecimiento real para consultar su puntuación y detalles.
        </p>

        <div className="mb-2">
          <SearchBar 
            onSelectPlace={(placeId, place) => {
              if (onSelectPlace) onSelectPlace(placeId, place);
            }}
            placeholder="Buscar en Google Places (ej: restaurante, farmacia, pizza, hotel...)"
          />
        </div>
      </PastelCard>

      {/* 1.5 Mis Reservas en Vivo Card (Desplegable) */}
      <PastelCard variant="darker" className="border-2 border-cyan-500/40 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsBookingsSectionOpen(!isBookingsSectionOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                Mis Reservas y Gestiones
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] text-[11px] font-bold font-mono-code">
                  {userBookings.length}
                </span>
              </h3>
              <p className="text-[11px] font-mono-code text-slate-600">
                {isBookingsSectionOpen ? 'Haz clic para plegar el panel' : 'Haz clic para desplegar y gestionar tus mesas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-code font-bold text-cyan-800 hidden sm:inline">
              {isBookingsSectionOpen ? 'Ocultar' : 'Ver Reservas'}
            </span>
            <div className="p-1 rounded-lg bg-sky-200 text-slate-800">
              {isBookingsSectionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>

        {isBookingsSectionOpen && (
          <div className="p-5 border-t border-sky-300 bg-white/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {userBookings.length === 0 ? (
              <p className="text-xs font-mono-code text-slate-500 italic py-4 text-center">
                No tienes reservas registradas. Selecciona un negocio abajo para reservar tu mesa.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {userBookings.map((b) => {
                  const isCancelled = b.status === 'cancelada';
                  return (
                    <div 
                      key={b.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        isCancelled 
                          ? 'bg-slate-100/80 border-slate-300 opacity-75' 
                          : 'bg-white border-sky-300 shadow-sm hover:border-cyan-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-mono-code font-bold text-slate-400 block uppercase">
                            Código: {b.id}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-cyan-700 shrink-0" />
                            {b.placeName}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase border ${
                          isCancelled 
                            ? 'bg-rose-100 text-rose-700 border-rose-300' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-400'
                        }`}>
                          {isCancelled ? 'CANCELADA' : 'CONFIRMADA'}
                        </span>
                      </div>

                      <p className="text-xs font-mono-code text-slate-600 flex items-center gap-1 mb-3 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {b.placeAddress}
                      </p>

                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs mb-3">
                        <div>
                          <span className="text-[9px] font-mono-code text-slate-400 block uppercase">Comensales</span>
                          <span className="font-bold text-slate-800 text-[11px]">{b.guests}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono-code text-slate-400 block uppercase">Fecha</span>
                          <span className="font-bold text-slate-800 text-[11px]">{b.date}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono-code text-slate-400 block uppercase">Hora</span>
                          <span className="font-bold text-slate-800 text-[11px]">{b.time} h</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEmailForBooking(b)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-slate-900 text-[#00f2ff] text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Ver Correo
                        </button>

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => setBookingToCancel(b)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Cancelar esta reserva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancelar Reserva
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </PastelCard>

      {/* 2. Main Detailed Card for Selected Place */}
      {selectedPlace ? (
        <>
          <PastelCard className="border-2 border-cyan-400/80">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                    {placeName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-800 text-cyan-100 border border-cyan-400 text-[11px] font-mono-code font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                    GOOGLE PLACES
                  </span>
                </div>
                <p className="text-xs font-mono-code text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  {placeAddress} · {placeCategory}
                </p>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="self-start px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                ✍️ Escribe tu reseña
              </button>
            </div>

            {/* Dos Cajas Comparativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              {/* Box 1: NOTA MOSTRADA */}
              <div className="p-4 rounded-xl bg-slate-200/90 border border-slate-300 text-slate-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono-code font-bold uppercase text-slate-600 tracking-wider mb-2">
                  NOTA MOSTRADA (Google Places)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-slate-800">
                    {googleRating !== undefined ? googleRating : 'N/A'}
                  </span>
                  <div className="flex items-center text-amber-500 text-lg">
                    ★ ★ ★ ★ ★
                  </div>
                </div>
                <span className="text-[11px] font-mono-code text-slate-500 mt-2">
                  {ratingCount !== undefined 
                    ? `${ratingCount.toLocaleString('es-ES')} reseñas registradas en Google`
                    : 'Sin opiniones registradas'}
                </span>
              </div>

              {/* Box 2: NOTA REAL PONDERADA */}
              <div className="p-4 rounded-xl bg-slate-900 text-white border-2 border-cyan-400/50 shadow-md flex flex-col justify-between">
                <div className="text-[11px] font-mono-code font-bold uppercase text-cyan-200 tracking-wider mb-2">
                  NOTA REAL PONDERADA (ReseñIA)
                </div>
                <div className="flex items-baseline gap-3 my-1">
                  <span className="text-xl font-display font-bold text-cyan-300">
                    Próximamente
                  </span>
                </div>
                <span className="text-[11px] font-mono-code text-cyan-200/70 mt-2">
                  El análisis ponderado anti-bot se calculará en la siguiente versión
                </span>
              </div>
            </div>
          </PastelCard>

          {/* 3. Community User Reviews */}
          <PastelCard variant="darker">
            <div className="flex items-center justify-between mb-3 border-b border-sky-300 pb-2">
              <h4 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-cyan-800" />
                Reseñas aportadas por la comunidad ({userReviews.length})
              </h4>
            </div>

            {userReviews.length === 0 ? (
              <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
                No hay reseñas locales registradas aún para este negocio. ¡Sé el primero en aportar una!
              </p>
            ) : (
              <div className="space-y-2.5">
                {userReviews.map((rev, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl border border-sky-300 bg-white/90 text-xs text-slate-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold font-mono-code text-slate-900">{rev.author}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                        <span className="text-[10px] text-slate-400 font-mono-code">{rev.date || 'Reciente'}</span>
                      </div>
                    </div>
                    <p className="font-sans-ui text-slate-800 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </PastelCard>

          {/* 4. Reservar Mesa Accordion */}
          <PastelCard variant="darker" className="p-0 overflow-hidden">
            <button
              onClick={() => setIsReserveOpen(!isReserveOpen)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-700 text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900">
                    Reservar en {placeName}
                  </h3>
                  <p className="text-xs font-mono-code text-slate-600">
                    Solicitud directa · sin comisión
                  </p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white/80 text-slate-700 border border-sky-300">
                {isReserveOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {isReserveOpen && (
              <div className="p-5 border-t border-sky-300 bg-white/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {reserveConfirmed ? (
                  <div className="p-4 rounded-xl bg-emerald-950 text-white border border-emerald-500/60 shadow-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-emerald-300">
                            ¡Reserva realizada con éxito!
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] border border-cyan-500/40 text-[10px] font-mono-code font-bold">
                            {bookingCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {reserveGuests} para {reserveDate} a las {reserveTime} h en <strong className="text-white">{placeName}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#00f2ff] shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono-code uppercase">Correo enviado a</span>
                          <span className="text-cyan-200 font-bold font-mono-code">{reserveEmail}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEmailModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-[#00f2ff] border border-cyan-500/50 text-xs font-mono-code font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver resguardo por email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReserveConfirmed(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-code transition-all cursor-pointer"
                        >
                          Nueva reserva
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                          Comensales
                        </label>
                        <select
                          value={reserveGuests}
                          onChange={(e) => setReserveGuests(e.target.value)}
                          className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        >
                          <option>1 persona</option>
                          <option>2 personas</option>
                          <option>4 personas</option>
                          <option>6 personas</option>
                          <option>8 personas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                          Fecha
                        </label>
                        <select
                          value={reserveDate}
                          onChange={(e) => setReserveDate(e.target.value)}
                          className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        >
                          <option>Hoy</option>
                          <option>Mañana</option>
                          <option>Este Viernes</option>
                          <option>Este Sábado</option>
                          <option>Próximo Domingo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                          Hora
                        </label>
                        <select
                          value={reserveTime}
                          onChange={(e) => setReserveTime(e.target.value)}
                          className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        >
                          <option>13:30</option>
                          <option>14:00</option>
                          <option>14:30</option>
                          <option>20:30</option>
                          <option>21:00</option>
                          <option>21:30</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-600" />
                        Correo para la confirmación de la reserva
                      </label>
                      <input
                        type="email"
                        required
                        value={reserveEmail}
                        onChange={(e) => setReserveEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-mono-code focus:ring-1 focus:ring-cyan-600 focus:outline-none placeholder-slate-400"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Se enviará un comprobante digital con el código de reserva a esta dirección.
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSendingEmail}
                        className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando correo de confirmación...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Confirmar Reserva y Enviar Correo
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </PastelCard>
        </>
      ) : (
        <PastelCard className="border border-slate-800/80 py-12 text-center bg-slate-950/60 shadow-lg">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 mb-1">
            Selecciona un negocio para ver detalles
          </h3>
          <p className="text-xs font-mono-code text-slate-400">
            Escribe en la barra de búsqueda para buscar cualquier lugar en Google Places.
          </p>
        </PastelCard>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onAddReview={handleAddReview}
      />

      {/* Confirmation Dialog for Cancellation */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.3)] text-slate-100 p-6 space-y-5 relative">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-white">
                  ¿Seguro que quieres cancelar la reserva?
                </h3>
                <p className="text-xs text-slate-400">
                  La mesa se liberará inmediatamente para otros clientes y te enviaremos una notificación de cancelación por correo.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono-code">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Establecimiento:</span>
                <span className="font-bold text-white text-right">{bookingToCancel.placeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Código de reserva:</span>
                <span className="font-bold text-[#00f2ff]">{bookingToCancel.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fecha y Hora:</span>
                <span className="font-bold text-amber-300">{bookingToCancel.date} a las {bookingToCancel.time} h</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-code font-bold transition-all cursor-pointer"
              >
                No, mantener reserva
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToCancel = bookingToCancel.id;
                  setBookingToCancel(null);
                  handleCancelBooking(idToCancel);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono-code font-bold transition-all shadow-md cursor-pointer"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Email Ticket Modal */}
      <ReservationEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        placeName={activeBookingForEmail?.placeName || placeName}
        placeAddress={activeBookingForEmail?.placeAddress || placeAddress}
        reserveGuests={activeBookingForEmail?.guests || reserveGuests}
        reserveDate={activeBookingForEmail?.date || reserveDate}
        reserveTime={activeBookingForEmail?.time || reserveTime}
        reserveEmail={activeBookingForEmail?.userEmail || reserveEmail}
        bookingCode={activeBookingForEmail?.id || bookingCode}
        status={activeBookingForEmail?.status || 'confirmada'}
      />
    </div>
  );
};
