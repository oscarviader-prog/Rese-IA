import React, { useState, useMemo } from 'react';
import { PastelCard } from './PastelCard';
import { NewsItem, NewReview } from '../types';
import { ReviewModal } from './ReviewModal';
import ReservationModal from './ReservationModal';
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
  MapPin,
  Quote,
  Building2,
  Filter,
  MessageSquareText,
  Check
} from 'lucide-react';

export interface Establishment {
  id: string;
  name: string;
  category: string;
  location: string;
  displayRating: number;
  realRating: number;
  analyzedReviewsCount: number;
  botPercentage: number;
  isNoteInflated: boolean;
  quote: string;
  goods: string[];
  bads: string[];
  featuredDishes: { name: string; tag: string; isTop?: boolean }[];
  reviews: NewReview[];
  news: NewsItem[];
}

interface ConsumerViewProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

const INITIAL_ESTABLISHMENTS: Establishment[] = [
  {
    id: 'tasca-marea',
    name: 'La Tasca de Marea',
    category: 'Restaurante Canario & Marisquería',
    location: 'Las Palmas de Gran Canaria',
    displayRating: 4.6,
    realRating: 4.1,
    analyzedReviewsCount: 1284,
    botPercentage: 12,
    isNoteInflated: true,
    quote: '"Buena cocina canaria; el servicio en horas punta es su punto débil."',
    goods: [
      'Pescado fresco de calidad recién traído',
      'Ambiente auténtico canario y vistas al mar',
      'Precio justo para la calidad de la materia prima'
    ],
    bads: [
      'Esperas largas en horas punta de fin de semana',
      'Servicio de camareros desbordado con el local lleno',
      'Problemas en la gestión puntual de reservas'
    ],
    featuredDishes: [
      { name: 'Pulpo a la brasa', tag: '+62% menciones', isTop: true },
      { name: 'Vieja sancochada', tag: 'Plato típico top', isTop: true },
      { name: 'Postres caseros canarios', tag: 'Menciones mixtas', isTop: false },
    ],
    news: [
      {
        id: '1',
        badge: 'Nuevo',
        badgeColor: 'bg-cyan-200 text-cyan-900 border border-cyan-400',
        title: 'Ceviche de corvina fresco',
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
    ],
    reviews: [
      {
        author: 'Carlos Ruiz',
        rating: 5,
        comment: 'El pulpo a la brasa estaba exquisito y súper tierno. Muy buena atención aunque tuvimos que esperar 15 minutos por la mesa.',
        date: 'Ayer'
      },
      {
        author: 'Elena Gómez',
        rating: 4,
        comment: 'Excelente ceviche de corvina y vino canario de la casa. El precio del menú de mediodía está genial.',
        date: 'Hace 3 días'
      },
      {
        author: 'Mateo Fernández',
        rating: 3,
        comment: 'La comida riquísima pero el servicio fue lento en la hora punta del sábado.',
        date: 'Hace 1 semana'
      }
    ]
  },
  {
    id: 'marisqueria-ancla',
    name: 'Marisquería El Ancla',
    category: 'Pescados y Mariscos Premium',
    location: 'Las Canteras · Las Palmas',
    displayRating: 4.8,
    realRating: 4.5,
    analyzedReviewsCount: 940,
    botPercentage: 4,
    isNoteInflated: false,
    quote: '"Marisco fresco impecable frente al mar, precio elevado pero lo vale."',
    goods: [
      'Marisco vivo y pescado del día de máxima calidad',
      'Ubicación inmejorable en primera línea de playa',
      'Atención rápida y profesional'
    ],
    bads: [
      'Precios por encima de la media de la zona',
      'Dificultad para aparcar cerca'
    ],
    featuredDishes: [
      { name: 'Arroz caldoso de bogavante', tag: 'Imperdible', isTop: true },
      { name: 'Parillada de marisco', tag: 'Top ventas', isTop: true },
      { name: 'Gambas al ajillo', tag: 'Sabor auténtico', isTop: false },
    ],
    news: [
      {
        id: 'ancla-1',
        badge: 'Especial',
        badgeColor: 'bg-emerald-200 text-emerald-900 border border-emerald-400',
        title: 'Llegada de Bogavante del Atlántico',
        subtitle: 'Hoy mismo',
      }
    ],
    reviews: [
      {
        author: 'Marta Alonso',
        rating: 5,
        comment: 'Servicio de 10 y el arroz con bogavante increíble. Totalmente recomendado si buscas marisco de verdad.',
        date: 'Hace 2 días'
      },
      {
        author: 'Javier Vega',
        rating: 4,
        comment: 'Gambas al ajillo muy buenas y camareros atentos. La paella tardó un poquito pero mereció la pena.',
        date: 'Hace 5 días'
      }
    ]
  },
  {
    id: 'restaurante-guanche',
    name: 'Restaurante El Guanche',
    category: 'Tapas Tradicionales Canarios',
    location: 'Vegueta · Las Palmas',
    displayRating: 4.5,
    realRating: 4.3,
    analyzedReviewsCount: 650,
    botPercentage: 6,
    isNoteInflated: false,
    quote: '"Las mejores papas arrugadas con mojo de Vegueta en ambiente tradicional."',
    goods: [
      'Mojo picón casero y papas arrugadas de calidad',
      'Ambiente histórico y raciones generosas',
      'Relación calidad-precio excepcional'
    ],
    bads: [
      'Comedor interior algo caluroso en verano',
      'Poca variedad en opciones vegetarianas'
    ],
    featuredDishes: [
      { name: 'Papas con mojo picón', tag: 'Receta secreta', isTop: true },
      { name: 'Queso asado con mermelada', tag: 'Muy popular', isTop: true },
      { name: 'Carne de fiesta', tag: 'Sabor tradicional', isTop: false },
    ],
    news: [],
    reviews: [
      {
        author: 'Lucía Santos',
        rating: 5,
        comment: 'Las papas arrugadas con mojo picón son las mejores que he probado en Las Palmas. El queso asado espectacular.',
        date: 'Hace 4 días'
      }
    ]
  }
];

export const ConsumerView: React.FC<ConsumerViewProps> = ({ searchQuery = '', setSearchQuery }) => {
  const [establishments, setEstablishments] = useState<Establishment[]>(INITIAL_ESTABLISHMENTS);
  const [selectedEstId, setSelectedEstId] = useState<string>('tasca-marea');

  // AI Prompt internal state synced with query
  const [aiPrompt, setAiPrompt] = useState(searchQuery);

  // Reservation Accordion state
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveGuests, setReserveGuests] = useState('2 personas');
  const [reserveTime, setReserveTime] = useState('20:30');
  const [reserveDate, setReserveDate] = useState('Hoy');
  const [reserveConfirmed, setReserveConfirmed] = useState(false);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [targetEstForReview, setTargetEstForReview] = useState<Establishment | null>(null);

  // Filter establishments & reviews based on search query
  const queryLower = searchQuery.trim().toLowerCase();

  const filteredData = useMemo(() => {
    if (!queryLower) {
      return {
        matchedEsts: establishments,
        matchingReviewCount: 0,
      };
    }

    let matchingReviewsCount = 0;

    const matchedEsts = establishments.filter((est) => {
      const nameMatch = est.name.toLowerCase().includes(queryLower);
      const catMatch = est.category.toLowerCase().includes(queryLower);
      const locMatch = est.location.toLowerCase().includes(queryLower);
      const quoteMatch = est.quote.toLowerCase().includes(queryLower);
      const dishesMatch = est.featuredDishes.some(d => d.name.toLowerCase().includes(queryLower) || d.tag.toLowerCase().includes(queryLower));
      const goodsMatch = est.goods.some(g => g.toLowerCase().includes(queryLower));
      const badsMatch = est.bads.some(b => b.toLowerCase().includes(queryLower));

      const matchingRevInEst = est.reviews.filter((r) =>
        r.comment.toLowerCase().includes(queryLower) ||
        r.author.toLowerCase().includes(queryLower)
      );

      matchingReviewsCount += matchingRevInEst.length;

      return nameMatch || catMatch || locMatch || quoteMatch || dishesMatch || goodsMatch || badsMatch || matchingRevInEst.length > 0;
    });

    return {
      matchedEsts,
      matchingReviewCount: matchingReviewsCount,
    };
  }, [establishments, queryLower]);

  // Current selected active establishment
  const currentEst = establishments.find((e) => e.id === selectedEstId) || establishments[0];

  const handleApplySearch = (text: string) => {
    setAiPrompt(text);
    if (setSearchQuery) {
      setSearchQuery(text);
    }
  };

  const handleAddReview = (newReview: NewReview) => {
    if (!targetEstForReview) return;
    setEstablishments(prev => prev.map(est => {
      if (est.id === targetEstForReview.id) {
        return {
          ...est,
          reviews: [newReview, ...est.reviews],
          analyzedReviewsCount: est.analyzedReviewsCount + 1,
        };
      }
      return est;
    }));
  };

  const removeNewsItem = (estId: string, newsId: string) => {
    setEstablishments(prev => prev.map(est => {
      if (est.id === estId) {
        return {
          ...est,
          news: est.news.filter(n => n.id !== newsId)
        };
      }
      return est;
    }));
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
      
      {/* 1. Interactive AI Search & Synthesis Card */}
      <PastelCard variant="accent" className="relative overflow-hidden shadow-[0_0_25px_rgba(0,242,255,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-[10px] font-mono-code font-bold tracking-wider uppercase border border-cyan-400 shadow-sm">
              ✨ RESEÑIA BUSCADOR INTELIGENTE
            </span>
            <h3 className="text-lg font-display font-bold text-slate-900">
              ¿Qué buscas o te apetece hoy?
            </h3>
          </div>
          <span className="text-[11px] font-mono-code text-slate-600">
            Filtra restaurantes, especialidades y opiniones reales
          </span>
        </div>

        <p className="text-xs font-sans-ui text-slate-700 mb-3">
          Busca por nombre de plato (ej: <i>"pulpo"</i>, <i>"marisco"</i>), zona (<i>"Las Palmas"</i>, <i>"Vegueta"</i>) o palabras de reseña (<i>"espera"</i>, <i>"precio"</i>, <i>"ceviche"</i>).
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplySearch(aiPrompt);
          }}
          className="flex flex-col sm:flex-row items-center gap-2 mb-3"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-700" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => {
                setAiPrompt(e.target.value);
                if (setSearchQuery) setSearchQuery(e.target.value);
              }}
              placeholder="Ej: pulpo a la brasa, marisco, Vegueta, terraza..."
              className="w-full bg-white text-slate-900 placeholder-slate-500 text-xs rounded-xl pl-9 pr-8 py-2.5 border border-sky-300 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-sans-ui"
            />
            {aiPrompt && (
              <button
                type="button"
                onClick={() => handleApplySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Buscar
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono-code text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-700" /> Filtros rápidos:
          </span>
          {[
            'marisco',
            'pulpo',
            'ceviche',
            'canario',
            'Vegueta',
            'papas mojo',
            'espera',
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleApplySearch(chip)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans-ui border transition-all cursor-pointer ${
                searchQuery.toLowerCase().includes(chip)
                  ? 'bg-cyan-700 text-white border-cyan-800 font-bold shadow-sm'
                  : 'bg-white/80 hover:bg-cyan-100 text-slate-800 border-sky-300'
              }`}
            >
              {chip}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleApplySearch('')}
              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-mono-code font-bold border border-red-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {/* AI Synthesis Summary Feedback Banner */}
        {searchQuery.trim() && (
          <div className="mt-3 p-3 bg-cyan-900/10 rounded-xl border border-cyan-400 text-xs font-sans-ui text-cyan-950 flex items-start gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono-code font-bold text-cyan-900 block">
                Resultados para "{searchQuery}": {filteredData.matchedEsts.length} establecimientos encontrados ({filteredData.matchingReviewCount} menciones en reseñas)
              </span>
              <p className="text-slate-800 text-[11px]">
                {filteredData.matchedEsts.length > 0 
                  ? `ReseñIA ha filtrado las notas y opiniones ponderadas que coinciden con tu criterio.`
                  : `No hemos encontrado coincidencias exactas para "${searchQuery}". Prueba seleccionando otro término de búsqueda.`}
              </p>
            </div>
          </div>
        )}
      </PastelCard>

      {/* 2. Establishments Selector / Search Results List */}
      {filteredData.matchedEsts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#00f2ff]" /> 
              Establecimientos analizados por ReseñIA ({filteredData.matchedEsts.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono-code">
              Haz clic para ver el detalle y análisis anti-bot
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredData.matchedEsts.map((est) => {
              const isSelected = est.id === currentEst.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setSelectedEstId(est.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.25)] text-white'
                      : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50 text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00f2ff]/10 rounded-bl-full pointer-events-none" />
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="font-bold text-sm text-white line-clamp-1">{est.name}</h4>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono-code font-bold text-[10px] shrink-0">
                        {est.realRating} ★
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 font-mono-code">{est.category}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> {est.location}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-code">
                    <span className="text-slate-400">{est.reviews.length} reseñas registradas</span>
                    {est.isNoteInflated && (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Nota inflada
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Detailed Card for Selected Establishment */}
      <PastelCard className="border-2 border-cyan-400/80">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                {currentEst.name}
              </h2>
              {currentEst.isNoteInflated ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400 text-[11px] font-mono-code font-bold flex items-center gap-1 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  ⚠ NOTA INFLADA
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border border-emerald-400 text-[11px] font-mono-code font-bold flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  VERIFICADO LEGÍTIMO
                </span>
              )}
            </div>
            <p className="text-xs font-mono-code text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              {currentEst.location} · {currentEst.category}
            </p>
          </div>

          <button
            onClick={() => {
              setTargetEstForReview(currentEst);
              setIsReviewModalOpen(true);
            }}
            className="self-start px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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
              NOTA MOSTRADA {currentEst.displayRating} (Google / TripAdvisor)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-slate-800">
                {currentEst.displayRating}
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
                {currentEst.analyzedReviewsCount.toLocaleString('es-ES')} reseñ. analizadas
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-display font-extrabold text-cyan-300">
                {currentEst.realRating}
              </span>
              <div className="flex items-center text-amber-400 text-lg">
                ★ ★ ★ ★ <span className="text-slate-500">★</span>
              </div>
            </div>
            <span className="text-[11px] font-mono-code text-cyan-200 mt-1">
              Ajustada tras eliminar {currentEst.botPercentage}% de patrones sospechosos
            </span>
          </div>
        </div>

        {/* Blockquote sintetizado */}
        <div className="p-4 rounded-xl bg-white/90 border border-sky-300 text-slate-800 flex items-start gap-3 shadow-inner">
          <Quote className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" />
          <blockquote className="text-sm font-serif-title italic leading-relaxed text-slate-900">
            {currentEst.quote}
          </blockquote>
        </div>
      </PastelCard>

      {/* 4. Filtered or All User Reviews Section */}
      <PastelCard variant="darker">
        <div className="flex items-center justify-between mb-3 border-b border-sky-300 pb-2">
          <h4 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-cyan-800" />
            Reseñas del establecimiento ({currentEst.reviews.length})
          </h4>
          {searchQuery && (
            <span className="text-[11px] font-mono-code text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded">
              Filtrando por: "{searchQuery}"
            </span>
          )}
        </div>

        {currentEst.reviews.length === 0 ? (
          <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
            No hay reseñas registradas aún para este local. ¡Sé el primero en aportar una!
          </p>
        ) : (
          <div className="space-y-2.5">
            {currentEst.reviews.map((rev, idx) => {
              const isMatch = searchQuery && (
                rev.comment.toLowerCase().includes(queryLower) ||
                rev.author.toLowerCase().includes(queryLower)
              );

              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border text-xs text-slate-800 transition-all ${
                    isMatch
                      ? 'bg-cyan-100/90 border-cyan-500 ring-1 ring-cyan-500 shadow-sm'
                      : 'bg-white/90 border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono-code text-slate-900">{rev.author}</span>
                      {isMatch && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-700 text-white text-[10px] font-mono-code">
                          Coincidencia
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                      <span className="text-[10px] text-slate-400 font-mono-code">{rev.date || 'Reciente'}</span>
                    </div>
                  </div>
                  <p className="font-sans-ui text-slate-800 leading-relaxed">{rev.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </PastelCard>

      {/* 5. Tarjeta "Novedades del local" */}
      <PastelCard>
        <div className="flex items-center justify-between border-b border-sky-300 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              🔔 Novedades de {currentEst.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-xs font-mono-code font-bold">
              {currentEst.news.length}
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-600">
            Actualizado hoy
          </span>
        </div>

        {currentEst.news.length === 0 ? (
          <p className="text-xs font-mono-code text-slate-500 italic py-2">
            Sin nuevas alertas por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentEst.news.map((item) => (
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
                  onClick={() => removeNewsItem(currentEst.id, item.id)}
                  title="Descartar"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PastelCard>

      {/* 6. Fila "Reservar mesa" */}
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
                Reservar mesa en {currentEst.name}
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
                    {reserveGuests} para {reserveDate} a las {reserveTime} h en {currentEst.name}.
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

      {/* 7. Tarjeta "🛡️ Índice de Confianza" */}
      <PastelCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              🛡️ Índice de Confianza (Anti-Bots)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-900 text-cyan-100 text-xs font-mono-code font-bold border border-cyan-400">
            Filtro Algorítmico
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
                strokeDashoffset={326.72 * (1 - (100 - currentEst.botPercentage) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-extrabold text-slate-900">
                {100 - currentEst.botPercentage}%
              </span>
              <span className="text-[10px] font-mono-code text-slate-600 uppercase">
                CONFIANZA
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left max-w-sm">
            <div className="px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-mono-code font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>⚠ {currentEst.botPercentage}% de reseñas con patrón de bot detectado</span>
            </div>
            <p className="text-xs font-sans-ui text-slate-700">
              Analizamos la velocidad de publicación, cuentas recién creadas y coincidencia sintáctica para filtrar anomalías.
            </p>
          </div>
        </div>
      </PastelCard>

      {/* 8. Tarjeta doble columna: "Lo bueno" y "Lo malo" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lo bueno */}
        <PastelCard className="border-l-4 border-l-emerald-600">
          <h4 className="text-sm font-display font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Lo bueno
          </h4>
          <ul className="space-y-2 text-xs font-sans-ui text-slate-800">
            {currentEst.goods.map((good, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100/80 border border-emerald-200">
                <span className="text-emerald-700 font-bold">✓</span> {good}
              </li>
            ))}
          </ul>
        </PastelCard>

        {/* Lo malo */}
        <PastelCard className="border-l-4 border-l-red-700">
          <h4 className="text-sm font-display font-bold text-red-950 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-700" />
            Lo malo
          </h4>
          <ul className="space-y-2 text-xs font-sans-ui text-slate-800">
            {currentEst.bads.map((bad, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 border border-red-200">
                <span className="text-red-700 font-bold">✕</span> {bad}
              </li>
            ))}
          </ul>
        </PastelCard>
      </div>

      {/* 9. "Platos destacados" */}
      <PastelCard>
        <h4 className="text-sm font-display font-bold text-slate-900 mb-3">
          Platos destacados por los clientes en {currentEst.name}
        </h4>
        <div className="space-y-2 text-xs font-sans-ui text-slate-800">
          {currentEst.featuredDishes.map((dish, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-white/80 border border-sky-300 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <span className={dish.isTop ? "text-amber-500" : "text-slate-400"}>★</span> {dish.name}
              </span>
              <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded ${
                dish.isTop ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {dish.tag}
              </span>
            </div>
          ))}
        </div>
      </PastelCard>

      {/* 10. Cierre sintetizado */}
      <div className="py-4 text-center border-t border-sky-900/50">
        <span className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-cyan-300 font-mono-code text-xs tracking-wider border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          RUIDO → SEÑAL &nbsp;|&nbsp; {currentEst.realRating} &nbsp;|&nbsp; {currentEst.analyzedReviewsCount} reseñas sintetizadas
        </span>
      </div>

      {/* Review Modal */}
      {targetEstForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onAddReview={handleAddReview}
        />
      )}
    </div>
  );
};
<ReservationModal />
