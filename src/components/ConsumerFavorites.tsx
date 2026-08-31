import React, { useState, useEffect, useCallback } from 'react';
import { PastelCard } from './PastelCard';
import {
  getConsumerFavorites,
  removeConsumerFavorite,
  ConsumerFavorite,
} from '../lib/favorites';
import {
  Star,
  MapPin,
  Loader2,
  Bookmark,
  Trash2,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { PlaceResult } from './SearchBar';

interface ConsumerFavoritesProps {
  userId?: string;
  onViewPlace?: (placeId: string, place?: PlaceResult) => void;
}

/**
 * Apartado de Favoritos del consumidor: lista sus establecimientos
 * guardados, permite eliminarlos, y ofrece acceso a la ficha del
 * establecimiento. Muestra un estado vacío claro cuando no hay
 * favoritos (criterio de aceptación 5).
 */
export const ConsumerFavorites: React.FC<ConsumerFavoritesProps> = ({
  userId,
  onViewPlace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<ConsumerFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasUserId = !!userId;

  const loadFavorites = useCallback(async () => {
    if (!hasUserId) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const { data, error } = await getConsumerFavorites();
    if (error) {
      setMessage({ type: 'error', text: 'No se pudieron cargar tus favoritos.' });
    } else {
      setFavorites(data);
    }
    setIsLoading(false);
  }, [hasUserId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (fav: ConsumerFavorite) => {
    setRemovingId(fav.id);
    setMessage(null);
    const { error } = await removeConsumerFavorite(fav.place_id);
    if (error) {
      setMessage({ type: 'error', text: 'No se pudo eliminar el favorito. Inténtalo de nuevo.' });
    } else {
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
      setMessage({ type: 'success', text: 'Establecimiento eliminado de favoritos.' });
    }
    setRemovingId(null);
  };

  const handleViewPlace = (fav: ConsumerFavorite) => {
    const place: PlaceResult = {
      id: fav.place_id,
      displayName: { text: fav.place_name },
      formattedAddress: fav.place_address,
      rating: fav.place_rating ?? undefined,
      userRatingCount: fav.place_user_rating_count ?? undefined,
      primaryTypeDisplayName: { text: fav.place_category },
    };
    onViewPlace?.(fav.place_id, place);
  };

  return (
    <PastelCard variant="darker" className="border-2 border-cyan-500/40 p-0 overflow-hidden">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Mis Establecimientos Favoritos
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] text-[11px] font-bold font-mono-code">
                {favorites.length}
              </span>
            </h3>
            <p className="text-[11px] font-mono-code text-slate-600">
              Guarda lugares para recibir sugerencias personalizadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-code font-bold text-cyan-800 hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Ver Favoritos'}
          </span>
          <div className="p-1 rounded-lg bg-sky-200 text-slate-800">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-5 border-t border-sky-300 bg-white/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {!hasUserId ? (
            <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
              Inicia sesión como consumidor para guardar tus favoritos.
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <Loader2 className="w-5 h-5 text-cyan-800 animate-spin" />
              <span className="ml-2 text-xs font-mono-code">Cargando favoritos...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-sans-ui font-bold text-slate-800 mb-1">
                Aún no tienes establecimientos favoritos
              </p>
              <p className="text-xs font-mono-code text-slate-500 mb-3">
                Añade establecimientos a tus favoritos para recibir sugerencias
                personalizadas relacionadas con ellos.
              </p>
              {onViewPlace && (
                <button
                  type="button"
                  onClick={() => onViewPlace('', undefined)}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm"
                >
                  Explorar establecimientos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="p-4 rounded-xl bg-white border border-sky-300 shadow-sm hover:border-cyan-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {fav.place_name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-code bg-cyan-950 text-cyan-200 border border-cyan-800/80 font-semibold inline-block mt-1">
                        {fav.place_category}
                      </span>
                    </div>
                    <Bookmark className="w-5 h-5 text-cyan-700 shrink-0 fill-cyan-200" />
                  </div>

                  <p className="text-xs font-mono-code text-slate-600 flex items-center gap-1 mb-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {fav.place_address || 'Sin dirección'}
                  </p>

                  {fav.place_rating !== null && fav.place_rating !== undefined && (
                    <p className="text-xs font-mono-code text-slate-700 flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      {fav.place_rating}
                      {fav.place_user_rating_count != null && (
                        <span className="text-slate-400">
                          ({fav.place_user_rating_count.toLocaleString('es-ES')} reseñas)
                        </span>
                      )}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleViewPlace(fav)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-slate-900 text-[#00f2ff] text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(fav)}
                      disabled={removingId === fav.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Quitar de favoritos"
                    >
                      {removingId === fav.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-sans-ui ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      )}
    </PastelCard>
  );
};
