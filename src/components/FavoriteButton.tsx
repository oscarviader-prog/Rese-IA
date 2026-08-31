import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PlaceResult } from './SearchBar';
import { addConsumerFavorite, removeConsumerFavorite, isPlaceFavorite } from '../lib/favorites';

interface FavoriteButtonProps {
  place: PlaceResult;
  className?: string;
}

/**
 * Botón para añadir/eliminar un establecimiento de los favoritos del
 * consumidor actual. Muestra una marca rellena u outline según el estado.
 * Si no hay sesión autenticada o falla RLS, muestra un aviso ligero en
 * lugar de romper la interfaz.
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ place, className = '' }) => {
  const { user } = useAuth();
  const placeId = place.id;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const hasUserId = !!user?.id;

  const loadStatus = useCallback(async () => {
    if (!hasUserId || !placeId) return;
    const { data, error } = await isPlaceFavorite(placeId);
    if (!error) {
      setIsFavorite(data);
    }
  }, [hasUserId, placeId]);

  useEffect(() => {
    setIsFavorite(false);
    setWarning(null);
    loadStatus();
  }, [loadStatus, placeId]);

  const handleToggle = async () => {
    if (!hasUserId) {
      setWarning('Inicia sesión como consumidor para guardar favoritos.');
      return;
    }
    setIsLoading(true);
    setWarning(null);

    if (isFavorite) {
      const { error } = await removeConsumerFavorite(placeId);
      if (error) {
        setWarning('No se pudo actualizar tus favoritos. Inténtalo de nuevo.');
      } else {
        setIsFavorite(false);
      }
    } else {
      const { error } = await addConsumerFavorite(place);
      if (error) {
        setWarning('No se pudo guardar el favorito. Inténtalo de nuevo.');
      } else {
        setIsFavorite(true);
      }
    }
    setIsLoading(false);
  };

  return (
    <span className={`inline-flex flex-col items-end gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        aria-pressed={isFavorite}
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono-code font-bold disabled:opacity-50 ${
          isFavorite
            ? 'bg-cyan-950 text-[#00f2ff] border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,255,0.2)]'
            : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-[#00f2ff] hover:text-[#00f2ff]'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFavorite ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{isFavorite ? 'Favorito' : 'Favorito'}</span>
      </button>
      {warning && (
        <span className="text-[10px] font-mono-code text-amber-400 max-w-[160px] text-right">
          {warning}
        </span>
      )}
    </span>
  );
};
