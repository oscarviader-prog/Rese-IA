import React, { useState, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabase';
import { Search, Star, MapPin, Loader2, Building2, X, Navigation } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Detect user location on mount
  useEffect(() => {
    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city) {
          setUserCity(data.city);
        } else {
          setUserCity('Madrid');
        }
      } catch {
        setUserCity('Madrid');
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });

          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision;
            if (city) {
              setUserCity(city);
            } else {
              fetchIpLocation();
            }
          } catch {
            fetchIpLocation();
          }
        },
        () => {
          fetchIpLocation();
        },
        { timeout: 5000 }
      );
    } else {
      fetchIpLocation();
    }
  }, []);

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

    if (!isCustomLocation && userCity) {
      finalSearchQuery = `${searchQuery} ${userCity}`;
    }

    console.log('Query original:', searchQuery, '| Ubicación aplicada:', isCustomLocation ? 'Especificada en texto' : userCity, '| Query enviada:', finalSearchQuery);

    try {
      const payload: { query: string; latitude?: number; longitude?: number } = { query: finalSearchQuery };
      if (userCoords && !isCustomLocation) {
        payload.latitude = userCoords.lat;
        payload.longitude = userCoords.lng;
      }

      const { data, error } = await supabase.functions.invoke('search-places', {
        body: payload,
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
        <Search className="w-4 h-4 absolute left-3.5 text-cyan-400 pointer-events-none" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={userCity ? `${placeholder} (Ubicación: ${userCity})` : placeholder}
          className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-sm rounded-xl pl-10 pr-10 py-3 border border-cyan-500/40 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none transition-all shadow-[0_0_15px_rgba(0,242,255,0.08)]"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#00f2ff] animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-3 z-[100] w-full bg-slate-950/98 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden animate-fadeIn">
          {results.length > 0 ? (
            <div className="p-3 sm:p-4">
              <div className="px-3 py-2 text-xs font-mono-code font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00f2ff]" />
                  <span>RESULTADOS DE GOOGLE PLACES</span>
                  {userCity && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-200 border border-slate-700 normal-case font-normal">
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      {hasExplicitLoc ? 'Ubicación en búsqueda' : `Ubicación: ${userCity}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-900/80 text-[#00f2ff] border border-cyan-400/50 text-xs font-bold">
                    {results.length} encontrados
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Cerrar resultados"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {results.map((place) => {
                  const name = place.displayName?.text || 'Negocio';
                  const address = place.formattedAddress || 'Sin dirección';
                  const rating = place.rating;
                  const userCount = place.userRatingCount;
                  const category = place.primaryTypeDisplayName?.text || 'Establecimiento';

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelect(place)}
                      className="w-full p-4 rounded-xl text-left bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-[#00f2ff] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#00f2ff] transition-colors leading-snug">
                            {name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono-code bg-cyan-950/90 text-cyan-200 border border-cyan-800/80 font-semibold shrink-0">
                            {category}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                          <MapPin className="w-4 h-4 text-[#00f2ff] shrink-0 mt-0.5" />
                          <span className="break-words">{address}</span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                        {rating !== undefined ? (
                          <div className="flex flex-col items-start sm:items-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-mono-code font-extrabold shadow-sm">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {rating}
                            </span>
                            {userCount !== undefined && (
                              <span className="text-[11px] font-mono-code text-slate-400 mt-1">
                                {userCount.toLocaleString('es-ES')} reseñas
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Sin valoración</span>
                        )}

                        <span className="text-xs font-mono-code text-[#00f2ff] opacity-0 group-hover:opacity-100 transition-opacity font-bold hidden sm:inline-block mt-2">
                          Seleccionar →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-mono-code text-slate-300">
                Sin resultados para "{query}".
              </p>
              <p className="text-xs text-slate-500">
                {userCity && !hasExplicitLoc
                  ? `Se buscó automáticamente en ${userCity}. Puedes añadir otra ciudad a la búsqueda (ej: "${query} Tenerife").`
                  : 'Prueba a escribir el nombre del local o tipo de negocio.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

