import React, { useState } from 'react';
import { PastelCard } from './PastelCard';
import { NewsItem, NewReview } from '../types';
import { ReviewModal } from './ReviewModal';
import {
  Sparkles,
  Search,
  PlusCircle,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  MapPin,
  Quote,
} from 'lucide-react';

export const ConsumerView: React.FC = () => {
  // Natural language query state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestionResult, setAiSuggestionResult] = useState<string | null>(null);

  // News item descartables
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: '1',
      badge: 'Nuevo',
      badgeColor: 'bg-cyan-200 text-cyan-900 border border-cyan-400',
      title: 'Ceviche de corvina',
      subtitle: 'Hace 2 días',
    },
    {
      id: '2',
      badge: 'Oferta',
      badgeColor: 'bg-amber-200 text-amber-900 border border-amber-400',
      title: 'Menú de mediodía a 14 €',
      subtitle: 'Hasta 31 julio',
    },
    {
      id: '3',
      badge: 'Tendencia',
      badgeColor: 'bg-purple-200 text-purple-950 border border-purple-400',
      title: 'Pulpo a la brasa arrasa · +62% menciones positivas',
      subtitle: 'Tendencia del mes',
    },
    {
      id: '4',
      badge: 'Nuevo',
      badgeColor: 'bg-cyan-200 text-cyan-900 border border-cyan-400',
      title: 'Vinos canarios de autor',
      subtitle: 'Hace 5 días',
    },
  ]);

  // Reservation Accordion state
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveGuests, setReserveGuests] = useState('2 personas');
  const [reserveTime, setReserveTime] = useState('20:30');
  const [reserveDate, setReserveDate] = useState('Hoy');
  const [reserveConfirmed, setReserveConfirmed] = useState(false);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewsList, setReviewsList] = useState<NewReview[]>([]);

  const removeNewsItem = (id: string) => {
    setNews(news.filter((item) => item.id !== id));
  };

  const handleAiSearch = (text: string) => {
    setAiPrompt(text);
    setAiSuggestionResult(
      `Sugerencia de ReseñIA: "${text}" encaja perfecto con La Tasca de Marea por su pescado fresco y cocina canaria auténtica. Nota real ponderada: 4.1 ⭐.`
    );
  };

  const handleAddReview = (newReview: NewReview) => {
    setReviewsList([newReview, ...reviewsList]);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReserveConfirmed(true);
    setTimeout(() => {
      setReserveConfirmed(false);
      setIsReserveOpen(false);
    }, 3000);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Tarjeta "¿Qué te apetece hoy?" con badge "IA" */}
      <PastelCard variant="accent" className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-[10px] font-mono-code font-bold tracking-wider uppercase border border-cyan-400 shadow-sm">
              ✨ IA
            </span>
            <h3 className="text-lg font-display font-bold text-slate-900">
              ¿Qué te apetece hoy?
            </h3>
          </div>
          <span className="text-[11px] font-mono-code text-slate-600 hidden sm:inline-block">
            Sintetizador en lenguaje natural
          </span>
        </div>

        <p className="text-xs font-sans-ui text-slate-700 mb-3">
          Descríbelo con tus palabras y te sugerimos el mejor sitio.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (aiPrompt) handleAiSearch(aiPrompt);
          }}
          className="flex flex-col sm:flex-row items-center gap-2 mb-3"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: hoy quiero comer marisco fresco…"
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-sky-300 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-sans-ui"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Buscar
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono-code text-slate-600 mr-1">
            Sugerencias:
          </span>
          {[
            'hoy quiero comer marisco',
            'algo barato y canario',
            'menú del día cerca',
            'buen vino canario',
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => handleAiSearch(chip)}
              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-cyan-100 text-slate-800 text-[11px] font-sans-ui border border-sky-300 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Search Result Feedback */}
        {aiSuggestionResult && (
          <div className="mt-3 p-3 bg-cyan-100/90 rounded-xl border border-cyan-400 text-xs font-sans-ui text-cyan-950 flex items-start gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
            <span>{aiSuggestionResult}</span>
          </div>
        )}
      </PastelCard>

      {/* 2. Tarjeta de restaurante "La Tasca de Marea" */}
      <PastelCard className="border-2 border-cyan-400/80">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                La Tasca de Marea
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400 text-[11px] font-mono-code font-bold flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                ⚠ NOTA INFLADA
              </span>
            </div>
            <p className="text-xs font-mono-code text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              Las Palmas de Gran Canaria · Restaurante Canario
            </p>
          </div>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="self-start px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            ✍️ Escribe tu reseña
          </button>
        </div>

        {/* Dos Cajas Comparativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Box 1: NOTA MOSTRADA */}
          <div className="p-4 rounded-xl bg-slate-200/90 border border-slate-300 text-slate-800 flex flex-col justify-between">
            <div className="text-[11px] font-mono-code font-bold uppercase text-slate-600 tracking-wider mb-2">
              NOTA MOSTRADA 4.6 (Google / TripAdvisor)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-slate-800">
                4.6
              </span>
              <div className="flex items-center text-amber-500">
                ★ ★ ★ ★ ★
              </div>
            </div>
            <span className="text-[11px] font-mono-code text-slate-500 mt-1">
              Media bruta sin filtrar bots ni reseñas duplicadas
            </span>
          </div>

          {/* Box 2: NOTA REAL PONDERADA */}
          <div className="p-4 rounded-xl bg-cyan-900 text-white border-2 border-cyan-400 shadow-md flex flex-col justify-between">
            <div className="text-[11px] font-mono-code font-bold uppercase text-cyan-200 tracking-wider mb-2 flex items-center justify-between">
              <span>NOTA REAL PONDERADA (ReseñIA)</span>
              <span className="px-2 py-0.5 rounded bg-cyan-800 text-cyan-100 text-[10px]">
                1.284 reseñ. analizadas
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-display font-extrabold text-cyan-300">
                4.1
              </span>
              <div className="flex items-center text-amber-400 text-lg">
                ★ ★ ★ ★ <span className="text-slate-500">★</span>
              </div>
            </div>
            <span className="text-[11px] font-mono-code text-cyan-200 mt-1">
              Ajustada tras eliminar 12% de patrones sospechosos
            </span>
          </div>
        </div>

        {/* Blockquote sintetizado */}
        <div className="p-4 rounded-xl bg-white/90 border border-sky-300 text-slate-800 flex items-start gap-3 shadow-inner">
          <Quote className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" />
          <blockquote className="text-sm font-serif-title italic leading-relaxed text-slate-900">
            "Buena cocina canaria; el servicio en horas punta es su punto débil."
          </blockquote>
        </div>
      </PastelCard>

      {/* Dynamic list of added user reviews if any */}
      {reviewsList.length > 0 && (
        <PastelCard variant="darker">
          <h4 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Tus reseñas analizadas recientemente ({reviewsList.length})
          </h4>
          <div className="space-y-2">
            {reviewsList.map((rev, idx) => (
              <div key={idx} className="p-3 bg-white/90 rounded-xl border border-sky-300 text-xs text-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold font-mono-code">{rev.author}</span>
                  <span className="text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                </div>
                <p className="font-sans-ui text-slate-700">{rev.comment}</p>
              </div>
            ))}
          </div>
        </PastelCard>
      )}

      {/* 3. Tarjeta "Novedades del local" (badge "4", "Actualizado hoy") */}
      <PastelCard>
        <div className="flex items-center justify-between border-b border-sky-300 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              🔔 Novedades del local
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-xs font-mono-code font-bold">
              {news.length}
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-600">
            Actualizado hoy
          </span>
        </div>

        {news.length === 0 ? (
          <p className="text-xs font-mono-code text-slate-500 italic py-2">
            Sin nuevas alertas por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/80 border border-sky-300 flex items-start justify-between gap-2 shadow-sm"
              >
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase mb-1.5 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <h4 className="text-xs font-sans-ui font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <span className="text-[10px] font-mono-code text-slate-500">
                    {item.subtitle}
                  </span>
                </div>
                <button
                  onClick={() => removeNewsItem(item.id)}
                  title="Descartar"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PastelCard>

      {/* 4. Fila "Reservar mesa" · "Disponibilidad en tiempo real · sin comisión" con acordeón (▾) */}
      <PastelCard variant="darker" className="p-0 overflow-hidden">
        <button
          onClick={() => setIsReserveOpen(!isReserveOpen)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-700 text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Reservar mesa
              </h3>
              <p className="text-xs font-mono-code text-slate-600">
                Disponibilidad en tiempo real · sin comisión
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
                  ¡Mesa reservada con éxito!
                  <p className="text-[11px] font-sans-ui text-emerald-800 font-normal">
                    {reserveGuests} para {reserveDate} a las {reserveTime} h en La Tasca de Marea.
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
                    className="w-full py-2 px-4 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </PastelCard>

      {/* 5. Tarjeta "🛡️ Índice de Confianza" (badge "ANTI-BOTS") */}
      <PastelCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              🛡️ Índice de Confianza
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-900 text-cyan-100 text-xs font-mono-code font-bold border border-cyan-400">
            ANTI-BOTS
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* Ring Donut Chart simulation */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="#cbd5e1"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="#0f766e"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="326.72"
                strokeDashoffset={326.72 * (1 - 0.78)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-extrabold text-slate-900">
                78%
              </span>
              <span className="text-[10px] font-mono-code text-slate-600 uppercase">
                CONFIANZA
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left max-w-sm">
            <div className="px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-mono-code font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>⚠ 12% de reseñas con patrón de bot detectado</span>
            </div>
            <p className="text-xs font-sans-ui text-slate-700">
              Analizamos la velocidad de publicación, cuentas recién creadas y coincidencia sintáctica para filtrar anomalías.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px] font-mono-code text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-700"></span> Teal = alta confianza
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span> Brick = sospecha
              </span>
            </div>
          </div>
        </div>
      </PastelCard>

      {/* 6. Tarjeta doble columna: "Lo bueno" y "Lo malo" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lo bueno (verde) */}
        <PastelCard className="border-l-4 border-l-emerald-600">
          <h4 className="text-sm font-display font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Lo bueno
          </h4>
          <ul className="space-y-2 text-xs font-sans-ui text-slate-800">
            <li className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100/80 border border-emerald-200">
              <span className="text-emerald-700 font-bold">✓</span> Pescado fresco de calidad
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100/80 border border-emerald-200">
              <span className="text-emerald-700 font-bold">✓</span> Ambiente auténtico canario
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100/80 border border-emerald-200">
              <span className="text-emerald-700 font-bold">✓</span> Precio justo para la zona
            </li>
          </ul>
        </PastelCard>

        {/* Lo malo (brick/rojo) */}
        <PastelCard className="border-l-4 border-l-red-700">
          <h4 className="text-sm font-display font-bold text-red-950 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-700" />
            Lo malo
          </h4>
          <ul className="space-y-2 text-xs font-sans-ui text-slate-800">
            <li className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 border border-red-200">
              <span className="text-red-700 font-bold">✕</span> Esperas largas en hora punta
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 border border-red-200">
              <span className="text-red-700 font-bold">✕</span> Servicio irregular los fines de semana
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 border border-red-200">
              <span className="text-red-700 font-bold">✕</span> Problemas con las reservas
            </li>
          </ul>
        </PastelCard>
      </div>

      {/* 7. "Problemas más frecuentes" con barras de progreso */}
      <PastelCard>
        <h4 className="text-sm font-display font-bold text-slate-900 mb-4">
          Problemas más frecuentes expresados en reseñas
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-mono-code mb-1">
              <span className="text-slate-800 font-bold">Tiempo de espera</span>
              <span className="text-red-800 font-bold">34%</span>
            </div>
            <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden">
              <div className="bg-red-700 h-2.5 rounded-full" style={{ width: '34%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono-code mb-1">
              <span className="text-slate-800 font-bold">Trato del personal</span>
              <span className="text-amber-800 font-bold">19%</span>
            </div>
            <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '19%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono-code mb-1">
              <span className="text-slate-800 font-bold">Ruido</span>
              <span className="text-cyan-800 font-bold">11%</span>
            </div>
            <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-700 h-2.5 rounded-full" style={{ width: '11%' }}></div>
            </div>
          </div>
        </div>
      </PastelCard>

      {/* 8. "Platos destacados" & "Evolución de la nota" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platos destacados */}
        <PastelCard>
          <h4 className="text-sm font-display font-bold text-slate-900 mb-3">
            Platos destacados por los clientes
          </h4>
          <div className="space-y-2 text-xs font-sans-ui text-slate-800">
            <div className="p-2.5 rounded-xl bg-white/80 border border-sky-300 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <span className="text-amber-500">★</span> Pulpo a la brasa
              </span>
              <span className="text-[10px] font-mono-code bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                +62% menciones
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-sky-300 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <span className="text-amber-500">★</span> Vieja sancochada
              </span>
              <span className="text-[10px] font-mono-code bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded">
                Plato típico top
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-sky-300 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-slate-600">
                <span className="text-slate-400">☆</span> Postres de la casa
              </span>
              <span className="text-[10px] font-mono-code bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Menciones mixtas
              </span>
            </div>
          </div>
        </PastelCard>

        {/* Evolución de la nota */}
        <PastelCard>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-display font-bold text-slate-900">
              Evolución de la nota
            </h4>
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 text-[10px] font-mono-code font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-700" />
              ↗ +0.3 ÚLTIMOS 3 MESES
            </span>
          </div>

          {/* Line Chart Graphic */}
          <div className="pt-2 pb-1">
            <div className="h-28 w-full flex items-end justify-between gap-1 px-2 border-b border-sky-300 pb-2">
              {[
                { month: 'Feb', val: 3.8, h: '60%' },
                { month: 'Mar', val: 3.9, h: '68%' },
                { month: 'Abr', val: 3.7, h: '52%' },
                { month: 'May', val: 4.0, h: '78%' },
                { month: 'Jun', val: 4.1, h: '88%' },
                { month: 'Jul', val: 4.1, h: '88%' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] font-mono-code font-bold text-cyan-900">
                    {item.val}
                  </span>
                  <div
                    className="w-full max-w-[28px] bg-cyan-700 rounded-t-md hover:bg-cyan-600 transition-all"
                    style={{ height: item.h }}
                  ></div>
                  <span className="text-[10px] font-mono-code text-slate-600">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PastelCard>
      </div>

      {/* 9. Cierre sintetizado */}
      <div className="py-4 text-center border-t border-sky-900/50">
        <span className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-cyan-300 font-mono-code text-xs tracking-wider border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          RUIDO → SEÑAL &nbsp;|&nbsp; 4.1 &nbsp;|&nbsp; 1.284 reseñas sintetizadas
        </span>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onAddReview={handleAddReview}
      />
    </div>
  );
};
