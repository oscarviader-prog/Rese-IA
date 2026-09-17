import React from 'react';
import { Star, MapPin, Building2 } from 'lucide-react';
import { PlaceResult } from './SearchBar';
import { FavoriteButton } from './FavoriteButton';

interface PlaceResultCardProps {
  place: PlaceResult;
  onSelect: (place: PlaceResult) => void;
  /** Variante más compacta, pensada para el panel del chatbot. */
  compact?: boolean;
}

/**
 * Tarjeta de establecimiento real (Google Places). Extraída de `SearchBar`
 * para reutilizarse también en las recomendaciones del chatbot, de forma que
 * ambas superficies muestren los mismos datos reales con la misma UI.
 */
export const PlaceResultCard: React.FC<PlaceResultCardProps> = ({ place, onSelect, compact = false }) => {
  const name = place.displayName?.text || 'Negocio';
  const address = place.formattedAddress || 'Sin dirección';
  const rating = place.rating;
  const userCount = place.userRatingCount;
  const category = place.primaryTypeDisplayName?.text || 'Establecimiento';

  return (
    <div
      className={`w-full rounded-xl text-left bg-white hover:bg-teal-50/40 border border-gray-200 hover:border-teal-300 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        compact ? 'p-3' : 'p-4 sm:gap-4'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(place)}
        className="flex-1 min-w-0 text-left space-y-1.5 cursor-pointer"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors leading-snug ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
              {name}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
              {category}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 flex items-start gap-2 leading-relaxed">
            <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            <span className="break-words">{address}</span>
          </p>
        </div>
      </button>

      <div className="flex flex-row items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        {rating !== undefined ? (
          <div className="flex flex-col items-start sm:items-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {rating}
            </span>
            {userCount !== undefined && (
              <span className="text-[11px] font-medium text-gray-400 mt-1">
                {userCount.toLocaleString('es-ES')} reseñas
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            Sin valoración
          </span>
        )}

        <FavoriteButton place={place} />

        {!compact && (
          <span className="text-xs font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block mt-2">
            Seleccionar →
          </span>
        )}
      </div>
    </div>
  );
};
