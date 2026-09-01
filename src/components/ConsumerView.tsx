import React, { useState, useEffect } from 'react';
import { NewReview, UserBooking } from '../types';
import { ReviewModal } from './ReviewModal';
import { ReservationEmailModal } from './ReservationEmailModal';
import { SearchBar, PlaceResult } from './SearchBar';
import { ConsumerPreferences } from './ConsumerPreferences';
import { ConsumerFavorites } from './ConsumerFavorites';
import { ImportantDatesSection } from './ImportantDatesSection';
import { AlertSettingsSection } from './AlertSettingsSection';
import { FavoriteButton } from './FavoriteButton';
import { ConsumerChatFloating } from './ConsumerChatFloating';
import { GooglePlaceDetails, GooglePlaceReview } from './PlaceDetailModal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getStoredBookings, saveBooking, cancelBooking } from '../lib/bookings';
import { getConsumerImportantDates, isReminderDue, nextOccurrence, ImportantDate } from '../lib/importantDates';
import { shouldNotify } from '../lib/consumerAlerts';
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Globe,
  MessageSquareText,
  Calendar,
  Mail,
  Loader2,
  Eye,
  Send,
  Trash2,
  AlertTriangle,
  LogIn,
  Building2,
  Star,
  HelpCircle,
} from 'lucide-react';

interface ConsumerViewProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onSelectPlace?: (placeId: string, place?: PlaceResult) => void;
  selectedPlace?: PlaceResult | null;
  onOpenChat?: () => void;
}

export const ConsumerView: React.FC<ConsumerViewProps> = ({
  searchQuery = '',
  setSearchQuery,
  onSelectPlace,
  selectedPlace,
  onOpenChat,
}) => {
  const { user } = useAuth();

  // Regla de acceso: cualquier usuario autenticado (consumidor o empresa) tiene
  // acceso a las funciones privadas de consumidor. Usuario no registrado, no.
  const isConsumerAuthed = !!user;

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<NewReview[]>([]);

  // Reservation state
  const [reserveGuests, setReserveGuests] = useState('2 personas');
  const [reserveTime, setReserveTime] = useState('20:30');
  const [reserveDate, setReserveDate] = useState('Hoy');
  const [reserveEmail, setReserveEmail] = useState(user?.email || '');
  const [bookingCode, setBookingCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reserveConfirmed, setReserveConfirmed] = useState(false);

  // Active modal booking state
  const [activeBookingForEmail, setActiveBookingForEmail] = useState<UserBooking | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserBooking | null>(null);

  // Stored Bookings List
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);

  // Fechas importantes: recordatorios a 7 días
  const [upcomingReminders, setUpcomingReminders] = useState<ImportantDate[]>([]);
  const [remindersAllowed, setRemindersAllowed] = useState(true);
  const [autoOpen, setAutoOpen] = useState<{ dateId: string; nonce: number } | null>(null);

  // Detalles enriquecidos del establecimiento seleccionado (teléfono, web, reseñas...)
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);

  useEffect(() => {
    setUserBookings(getStoredBookings());
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setUpcomingReminders([]);
      return;
    }
    let active = true;
    (async () => {
      const { decision } = await shouldNotify('important_date_reminder');
      if (!active) return;
      const allowed = decision.shouldNotify && decision.channels.includes('in_app');
      setRemindersAllowed(allowed);
      if (!allowed) {
        setUpcomingReminders([]);
        return;
      }
      const { data, error } = await getConsumerImportantDates();
      if (!active) return;
      if (error) {
        setUpcomingReminders([]);
        return;
      }
      setUpcomingReminders(data.filter((d) => isReminderDue(d, new Date())));
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Update email if user changes or logs in
  useEffect(() => {
    if (user?.email) {
      setReserveEmail(user.email);
    }
  }, [user]);

  // Carga los detalles reales del establecimiento al seleccionarlo para mostrar
  // la información principal integrada (incluido el teléfono) debajo del buscador.
  useEffect(() => {
    let active = true;
    if (!selectedPlace?.id) {
      setPlaceDetails(null);
      setDetailsError(false);
      return;
    }
    setDetailsLoading(true);
    setDetailsError(false);
    (async () => {
      try {
        const res = await supabase.functions.invoke('get-place-details', {
          body: { placeId: selectedPlace.id },
        });
        if (!active) return;
        if (res.error || !res.data) {
          setDetailsError(true);
          setPlaceDetails(null);
        } else {
          setPlaceDetails(res.data as GooglePlaceDetails);
        }
      } catch (err) {
        console.error('Error cargando detalles del establecimiento:', err);
        if (!active) return;
        setDetailsError(true);
        setPlaceDetails(null);
      } finally {
        if (active) setDetailsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedPlace?.id]);

  const handleAddReview = (newReview: NewReview) => {
    setUserReviews((prev) => [newReview, ...prev]);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    const generatedCode = `#RSV-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingCode(generatedCode);

    const currentPlaceName = placeName;
    const currentPlaceAddress = placeAddress;

    const newBookingData = saveBooking({
      id: generatedCode,
      userEmail: reserveEmail,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Cliente',
      placeName: currentPlaceName,
      placeAddress: currentPlaceAddress,
      guests: reserveGuests,
      date: reserveDate,
      time: reserveTime,
      status: 'confirmada',
    });

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

    const cancelledItem = updated.find((b) => b.id === id);
    if (cancelledItem) {
      setActiveBookingForEmail(cancelledItem);
      setIsEmailModalOpen(true);
    }
  };

  const handleOpenEmailForBooking = (b: UserBooking) => {
    setActiveBookingForEmail(b);
    setIsEmailModalOpen(true);
  };

  const placeName = placeDetails?.displayName?.text || selectedPlace?.displayName?.text || 'Establecimiento Seleccionado';
  const placeAddress = placeDetails?.formattedAddress || selectedPlace?.formattedAddress || 'Sin dirección';
  const placeCategory = placeDetails?.primaryTypeDisplayName?.text || selectedPlace?.primaryTypeDisplayName?.text || 'Negocio';
  const googleRating = placeDetails?.rating ?? selectedPlace?.rating;
  const ratingCount = placeDetails?.userRatingCount ?? selectedPlace?.userRatingCount;
  // Teléfono: se toma del campo correcto de Google Places. Si no existe, se
  // muestra honestamente "Teléfono no disponible". Nunca se muestra el Place ID.
  const phoneNumber = placeDetails?.internationalPhoneNumber;
  const hasPhone = !!phoneNumber && phoneNumber.trim().length > 0;
  const website = placeDetails?.websiteUri;
  const reviews = (placeDetails?.reviews || []) as GooglePlaceReview[];

  const businessCard =
    'bg-white rounded-2xl shadow-md';
  const sectionHeader = 'text-sm font-semibold text-gray-900';
  const mutedText = 'text-sm text-gray-500';
  const bodyText = 'text-sm text-gray-900';
  const primaryBtn =
    'inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="w-full min-h-screen bg-[#F5F6F8]">
      <div className="py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">

        {/* 1. Búsqueda */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              ReseñIA Buscador
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Qué negocio o lugar buscas?
            </h3>
          </div>
          <p className={mutedText}>
            Busca cualquier establecimiento real para consultar su puntuación y detalles.
          </p>
          <div className="mt-3">
            <SearchBar
              onSelectPlace={(placeId, place) => {
                if (onSelectPlace) onSelectPlace(placeId, place);
              }}
              placeholder="Buscar negocio, restaurante, farmacia, pizza, hotel..."
            />
          </div>
        </section>

        {/* 2. Ficha integrada del establecimiento seleccionado (debajo del buscador) */}
        {selectedPlace ? (
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {placeName}
                  </h2>
                  {placeCategory && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {placeCategory}
                    </span>
                  )}
                </div>
                <p className={mutedText + ' flex items-center gap-1'}>
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  {placeAddress}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <FavoriteButton
                  place={{
                    id: selectedPlace.id,
                    displayName: placeDetails?.displayName || selectedPlace.displayName,
                    formattedAddress: placeDetails?.formattedAddress || selectedPlace.formattedAddress,
                    rating: googleRating,
                    userRatingCount: ratingCount,
                    primaryTypeDisplayName: placeDetails?.primaryTypeDisplayName || selectedPlace.primaryTypeDisplayName,
                  }}
                />
                {isConsumerAuthed ? (
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Escribe tu reseña
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-400 text-sm py-2 px-4 rounded-lg">
                    <LogIn className="w-4 h-4" />
                    Inicia sesión para reseñar
                  </span>
                )}
              </div>
            </div>

            {/* Valoración + contacto */}
            {detailsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                Cargando detalles del establecimiento...
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm py-2 border-y border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="font-bold text-gray-900">
                    {googleRating !== undefined ? googleRating : 'Sin valoración'}
                  </span>
                  {ratingCount !== undefined && (
                    <span className="text-gray-400">
                      ({ratingCount.toLocaleString('es-ES')} reseñas)
                    </span>
                  )}
                </div>

                {hasPhone ? (
                  <a
                    href={`tel:${phoneNumber}`}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-teal-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                    {phoneNumber}
                  </a>
                ) : (
                  !detailsError && (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Phone className="w-4 h-4 text-gray-300 shrink-0" />
                      Teléfono no disponible
                    </span>
                  )
                )}

                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-teal-700 hover:underline"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    Sitio web
                  </a>
                )}

                {detailsError && (
                  <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <HelpCircle className="w-4 h-4 text-gray-300 shrink-0" />
                    No se pudieron completar los detalles del establecimiento.
                  </span>
                )}
              </div>
            )}

            {/* Reseñas de Google */}
            <div className="mt-5">
              <h4 className={sectionHeader + ' flex items-center gap-2 mb-3'}>
                <MessageSquareText className="w-4 h-4 text-teal-600" />
                Reseñas ({reviews.length + userReviews.length})
              </h4>
              {reviews.length === 0 && userReviews.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No hay reseñas disponibles para este establecimiento. ¡Sé el primero en aportar una!
                </p>
              ) : (
                <div className="space-y-3">
                  {userReviews.map((rev, idx) => (
                    <div key={`local-${idx}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{rev.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                          <span className="text-xs text-gray-400">{rev.date || 'Reciente'}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                  {reviews.map((rev, idx) => (
                    <div key={`google-${idx}`} className="p-4 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {rev.authorAttribution?.displayName || 'Usuario de Google'}
                        </span>
                        <span className="text-amber-500 font-bold">{"★".repeat(rev.rating || 1)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {rev.text?.text || 'Sin comentario de texto.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reservar */}
            {isConsumerAuthed ? (
              <div className="mt-6">
                <h3 className={sectionHeader + ' flex items-center gap-2 mb-3'}>
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Reservar en {placeName}
                </h3>
                {reserveConfirmed ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-green-900">¡Reserva realizada con éxito!</h4>
                          <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-semibold">
                            {bookingCode}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {reserveGuests} para {reserveDate} a las {reserveTime} h en <strong>{placeName}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm border-t border-green-100 pt-3">
                      <span className="text-gray-600">
                        Correo enviado a <strong className="text-teal-700">{reserveEmail}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEmailModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Ver resguardo por email
                        </button>
                        <button
                          type="button"
                          onClick={() => setReserveConfirmed(false)}
                          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comensales</label>
                        <select
                          value={reserveGuests}
                          onChange={(e) => setReserveGuests(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                        >
                          <option>1 persona</option>
                          <option>2 personas</option>
                          <option>4 personas</option>
                          <option>6 personas</option>
                          <option>8 personas</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                        <select
                          value={reserveDate}
                          onChange={(e) => setReserveDate(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                        >
                          <option>Hoy</option>
                          <option>Mañana</option>
                          <option>Este Viernes</option>
                          <option>Este Sábado</option>
                          <option>Próximo Domingo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                        <select
                          value={reserveTime}
                          onChange={(e) => setReserveTime(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo para la confirmación de la reserva
                      </label>
                      <input
                        type="email"
                        required
                        value={reserveEmail}
                        onChange={(e) => setReserveEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSendingEmail}
                        className={primaryBtn}
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
            ) : (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={sectionHeader}>Reservar en {placeName}</h3>
                  <p className={mutedText}>Inicia sesión para reservar mesa en este establecimiento.</p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-2xl bg-white py-12 text-center shadow-md">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Selecciona un negocio para ver detalles
            </h3>
            <p className="text-sm text-gray-500">
              Escribe en la barra de búsqueda para buscar cualquier lugar en Google Places.
            </p>
          </section>
        )}

        {/* 3. Herramientas exclusivas del consumidor autenticado */}
        {isConsumerAuthed ? (
          <>
            {/* Recordatorio global: fechas importantes a 7 días */}
            {remindersAllowed && upcomingReminders.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-amber-900">
                    Recordatorio · tus fechas importantes están muy cerca
                  </h3>
                </div>
                <div className="space-y-2">
                  {upcomingReminders.map((d) => {
                    const next = nextOccurrence(d, new Date());
                    return (
                      <div
                        key={d.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-amber-200"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{d.name}</p>
                          <p className="text-sm text-gray-600">
                            Falta 1 semana para {d.day}/{String(d.month).padStart(2, '0')}
                            {d.occurrence_type === 'unica' && d.year ? `/${d.year}` : ''} ·{' '}
                            {next
                              ? `se celebra el ${next.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoOpen({ dateId: d.id, nonce: Date.now() })}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Ver recomendaciones para esta ocasión
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cuadrícula de herramientas: 2 columnas en escritorio, 1 en móvil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConsumerPreferences userId={user?.id} />
              <ConsumerFavorites
                userId={user?.id}
                onViewPlace={(placeId, place) => {
                  if (onSelectPlace) onSelectPlace(placeId, place);
                }}
              />
              <ImportantDatesSection
                userId={user?.id}
                zone={user?.city}
                autoOpen={autoOpen}
                onViewPlace={(placeId, place) => {
                  if (onSelectPlace) onSelectPlace(placeId, place);
                }}
              />
              <AlertSettingsSection userId={user?.id} />

              {/* Mis Reservas y Gestiones (siempre visible, sin desplegable) */}
              <section className="rounded-2xl bg-white p-6 shadow-md md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={sectionHeader + ' flex items-center gap-2'}>
                      Mis Reservas y Gestiones
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
                        {userBookings.length}
                      </span>
                    </h3>
                    <p className={mutedText}>Gestiona tus mesas reservadas.</p>
                  </div>
                </div>

                {userBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-4 text-center">
                    No tienes reservas registradas. Selecciona un negocio arriba para reservar tu mesa.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userBookings.map((b) => {
                      const isCancelled = b.status === 'cancelada';
                      return (
                        <div
                          key={b.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCancelled
                              ? 'bg-gray-50 border-gray-200 opacity-75'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-xs text-gray-400 block uppercase">
                                Código: {b.id}
                              </span>
                              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                                {b.placeName}
                              </h4>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                                isCancelled
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                              }`}
                            >
                              {isCancelled ? 'Cancelada' : 'Confirmada'}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-3 truncate">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            {b.placeAddress}
                          </p>

                          <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 text-center text-sm mb-3">
                            <div>
                              <span className="text-xs text-gray-400 block uppercase">Comensales</span>
                              <span className="font-bold text-gray-800">{b.guests}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block uppercase">Fecha</span>
                              <span className="font-bold text-gray-800">{b.date}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block uppercase">Hora</span>
                              <span className="font-bold text-gray-800">{b.time} h</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end pt-1 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => handleOpenEmailForBooking(b)}
                              className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-medium text-sm"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Ver Correo
                            </button>
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => setBookingToCancel(b)}
                                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm"
                                title="Cancelar esta reserva"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-md border-2 border-teal-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Herramientas exclusivas para consumidores
                </h3>
                <p className="text-sm text-gray-600">
                  Inicia sesión para acceder a tus preferencias, favoritos, fechas importantes, alertas y reservas.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Chatbot flotante (solo usuarios autenticados) */}
      <ConsumerChatFloating />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onAddReview={handleAddReview}
      />

      {/* Confirmation Dialog for Cancellation */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden p-6 space-y-5 relative">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-red-50 text-red-500 shrink-0 border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-gray-900">
                  ¿Seguro que quieres cancelar la reserva?
                </h3>
                <p className="text-sm text-gray-500">
                  La mesa se liberará inmediatamente y te enviaremos una notificación de cancelación por correo.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Establecimiento:</span>
                <span className="font-bold text-gray-900 text-right">{bookingToCancel.placeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Código de reserva:</span>
                <span className="font-bold text-teal-700">{bookingToCancel.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Fecha y Hora:</span>
                <span className="font-bold text-gray-900">{bookingToCancel.date} a las {bookingToCancel.time} h</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
