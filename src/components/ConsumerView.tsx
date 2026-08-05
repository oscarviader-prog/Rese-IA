import React, { useState } from 'react';
import { PastelCard } from './PastelCard';
import { NewReview } from '../types';
import { ReviewModal } from './ReviewModal';
import { SearchBar, PlaceResult } from './SearchBar';
import { createReservation } from "../lib/reservations";
import { supabase } from "../lib/supabase";
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  MapPin,
  Building2,
  MessageSquareText,
  Calendar,
  ChevronDown,
  ChevronUp
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
  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<NewReview[]>([]);

  // Reservation Accordion state
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveGuests, setReserveGuests] = useState('2 personas');
  const [reserveTime, setReserveTime] = useState('20:30');
  const [reserveDate, setReserveDate] = useState('Hoy');
  const [reserveConfirmed, setReserveConfirmed] = useState(false);

  const handleAddReview = (newReview: NewReview) => {
    setUserReviews((prev) => [newReview, ...prev]);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReserveConfirmed(true);
    setTimeout(() => {
      setReserveConfirmed(false);
      setIsReserveOpen(false);
    }, 3000);
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
                  <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-mono-code font-bold flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      ¡Reserva realizada con éxito!
                      <p className="text-[11px] font-sans-ui text-emerald-800 font-normal">
                        {reserveGuests} para {reserveDate} a las {reserveTime} h en {placeName}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                        Comensales
                      </label>
                      <select
                        value={reserveGuests}
                        onChange={(e) => setReserveGuests(e.target.value)}
                        className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2 text-xs font-sans-ui"
                      >
                        <option>1 persona</option>
                        <option>2 personas</option>
                        <option>4 personas</option>
                        <option>6 personas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                        Fecha
                      </label>
                      <select
                        value={reserveDate}
                        onChange={(e) => setReserveDate(e.target.value)}
                        className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2 text-xs font-sans-ui"
                      >
                        <option>Hoy</option>
                        <option>Mañana</option>
                        <option>Este Viernes</option>
                        <option>Este Sábado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                        Hora
                      </label>
                      <select
                        value={reserveTime}
                        onChange={(e) => setReserveTime(e.target.value)}
                        className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2 text-xs font-sans-ui"
                      >
                        <option>13:30</option>
                        <option>14:00</option>
                        <option>20:30</option>
                        <option>21:00</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 px-4 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md cursor-pointer"
                      >
                        Confirmar Reserva
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
    </div>
  );
};
