import React, { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { PlaceResult } from './SearchBar';

interface ConsumerFavoritesProps {
  userId?: string;
  onViewPlace?: (placeId: string, place?: PlaceResult) => void;
}

/**
 * Favoritos del consumidor. Siempre abierto (sin desplegable), con la estética
 * de la parte de empresa. Conserva la lógica de listar, eliminar y ver ficha.
 */
export const ConsumerFavorites: React.FC<ConsumerFavoritesProps> = ({
  userId,
  onViewPlace,
}) => {
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
    <section className="rounded-2xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
          <Bookmark className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Mis Establecimientos Favoritos
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              {favorites.length}
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Guarda lugares para recibir sugerencias personalizadas
          </p>
        </div>
      </div>

      {/* Content */}
      {!hasUserId ? (
        <p className="text-sm text-gray-400 italic py-3 text-center">
          Inicia sesión como consumidor para guardar tus favoritos.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          <span className="ml-2 text-sm">Cargando favoritos...</span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-800 mb-1">
            Aún no tienes establecimientos favoritos
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Añade establecimientos a tus favoritos para recibir sugerencias
            personalizadas relacionadas con ellos.
          </p>
          {onViewPlace && (
            <button
              type="button"
              onClick={() => onViewPlace('', undefined)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
              className="p-4 rounded-xl bg-white border border-gray-200 hover:border-teal-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-gray-900 truncate">
                    {fav.place_name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 inline-block mt-1">
                    {fav.place_category}
                  </span>
                </div>
                <Bookmark className="w-5 h-5 text-teal-600 shrink-0 fill-teal-100" />
              </div>

              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2 truncate">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                {fav.place_address || 'Sin dirección'}
              </p>

              {fav.place_rating !== null && fav.place_rating !== undefined && (
                <p className="text-sm text-gray-700 flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  {fav.place_rating}
                  {fav.place_user_rating_count != null && (
                    <span className="text-gray-400">
                      ({fav.place_user_rating_count.toLocaleString('es-ES')} reseñas)
                    </span>
                  )}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleViewPlace(fav)}
                  className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-medium text-sm cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Ver ficha
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(fav)}
                  disabled={removingId === fav.id}
                  className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm cursor-pointer disabled:opacity-50"
                  title="Quitar de favoritos"
                >
                  {removingId === fav.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
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
          className={`flex items-start gap-2 p-3 rounded-xl border text-sm mt-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
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
    </section>
  );
};
