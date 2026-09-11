import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Star, MapPin, Loader2, Building2, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FavoriteButton } from './FavoriteButton';

export interface PlaceResult {
  id: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: {
    text?: string;
  };
  /**
   * Tipo principal del establecimiento (identificador de la Google Places API).
   * No se solicita actualmente por `search-places`; se deja preparado para que
   * la capa de categorización lo consuma cuando se exponga en el backend.
   */
  primaryType?: string;
  /**
   * Lista de tipos del establecimiento devueltos por Google Places. Igual que
   * `primaryType`, no se solicita todavía por `search-places`.
   */
  types?: string[];
}

interface SearchBarProps {
  onSelectPlace: (placeId: string, place?: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

const SPANISH_CITIES_REGIONS = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'málaga', 'malaga', 
  'murcia', 'palma', 'las palmas', 'gran canaria', 'bilbao', 'alicante', 'córdoba', 'cordoba', 
  'valladolid', 'vigo', 'gijón', 'gijon', 'hospitalet', 'vitoria', 'donostia', 'san sebastián', 
  'san sebastian', 'coruña', 'a coruña', 'elche', 'granada', 'tarragona', 'badalona', 'cartagena', 
  'sabadell', 'oviedo', 'jerez', 'móstoles', 'mostoles', 'pamplona', 'almería', 'almeria', 
  'alcalá', 'alcala', 'fuenlabrada', 'leganés', 'leganes', 'castellón', 'castellon', 
  'burgos', 'santander', 'albacete', 'getafe', 'salamanca', 'logroño', 'logrono', 
  'huelva', 'badajoz', 'león', 'leon', 'cádiz', 'cadiz', 'lleida', 'marbella', 
  'jaén', 'jaen', 'ourense', 'lugo', 'girona', 'gerona', 'toledo', 'cáceres', 'caceres', 
  'segovia', 'soria', 'teruel', 'cuenca', 'guadalajara', 'huesca', 'zamora', 'palencia', 
  'ávila', 'avila', 'tenerife', 'ibiza', 'mallorca', 'menorca', 'lanzarote', 'fuerteventura', 
  'la palma', 'la gomera', 'el hierro', 'canarias', 'baleares', 'españa', 'spain'
];

export const queryHasLocation = (queryStr: string): boolean => {
  const lower = queryStr.toLowerCase().trim();
  
  if (/\b(en|de|cerca de|por|en la|en el|de la|de el|in|near|around)\s+[a-záéíóúñ]+/i.test(lower)) {
    return true;
  }

  for (const place of SPANISH_CITIES_REGIONS) {
    if (lower.includes(place)) {
      return true;
    }
  }

  return false;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectPlace,
  placeholder = 'Buscar en Google Places...',
  className = '',
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Profile location (defaults to Madrid if no city is set in user profile)
  const profileCity = user?.city?.trim() || 'Madrid';

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const isCustomLocation = queryHasLocation(searchQuery);
    let finalSearchQuery = searchQuery;

    if (!isCustomLocation && profileCity) {
      finalSearchQuery = `${searchQuery} ${profileCity}`;
    }

    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query: finalSearchQuery },
      });

      if (error) {
        setResults([]);
      } else if (data && data.places) {
        setResults(data.places);
      } else if (data && Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error invocando search-places:', err);
      setResults([]);
    } finally {
      setLoading(false);
      setIsOpen(true);
    }
  };

  // Debounce search input (400ms)
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(trimmed);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: PlaceResult) => {
    setIsOpen(false);
    onSelectPlace(place.id, place);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const hasExplicitLoc = queryHasLocation(query);

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={profileCity ? `${placeholder} (${profileCity})` : placeholder}
          className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm rounded-lg pl-10 pr-10 py-2.5 border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-3 z-[100] w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {results.length > 0 ? (
            <div className="p-3 sm:p-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Resultados de Google Places</span>
                  {profileCity && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 normal-case font-normal">
                      <User className="w-3 h-3 text-teal-500" />
                      {hasExplicitLoc ? 'Ubicación en búsqueda' : `${profileCity}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                    {results.length} encontrados
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Cerrar resultados"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
                {results.map((place) => {
                  const name = place.displayName?.text || 'Negocio';
                  const address = place.formattedAddress || 'Sin dirección';
                  const rating = place.rating;
                  const userCount = place.userRatingCount;
                  const category = place.primaryTypeDisplayName?.text || 'Establecimiento';

                  return (
                    <div
                      key={place.id}
                      className="w-full p-4 rounded-xl text-left bg-white hover:bg-teal-50/40 border border-gray-200 hover:border-teal-300 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(place)}
                        className="flex-1 min-w-0 text-left space-y-1.5 cursor-pointer"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-base sm:text-lg text-gray-900 group-hover:text-teal-700 transition-colors leading-snug">
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
                          <span className="text-xs text-gray-400 italic">Sin valoración</span>
                        )}

                        <FavoriteButton place={place} />

                        <span className="text-xs font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block mt-2">
                          Seleccionar →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-700">
                Sin resultados para "{query}".
              </p>
              <p className="text-sm text-gray-500">
                {profileCity && !hasExplicitLoc
                  ? `Se buscó con ${profileCity}. Puedes especificar otra ubicación (ej: "${query} Tenerife").`
                  : 'Prueba a escribir el nombre del local o tipo de negocio.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
