import React, { useState, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabase';
import { Search, Star, MapPin, Loader2, Building2, X } from 'lucide-react';

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
  onSelectPlace: (placeId: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectPlace,
  placeholder = 'Buscar en Google Places...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
    console.log('Supabase URL cargada:', SUPABASE_URL);
    console.log('Publishable key cargada (primeros 25 chars):', SUPABASE_PUBLISHABLE_KEY.substring(0, 25));
    console.log('Buscando:', searchQuery);

    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query: searchQuery },
      });

      console.log('Respuesta cruda:', data);
      console.log('Error:', error);

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
    onSelectPlace(place.id);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

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
          placeholder={placeholder}
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
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden divide-y divide-white/5 animate-fadeIn">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono-code font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                <span>Resultados de Google Places</span>
                <span>{results.length} encontrados</span>
              </div>

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
                    className="w-full p-3 rounded-xl text-left hover:bg-slate-900 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-[#00f2ff] transition-colors truncate">
                          {name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                          {category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{address}</span>
                      </p>
                    </div>

                    {rating !== undefined && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono-code font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {rating}
                        </span>
                        {userCount !== undefined && (
                          <span className="text-[10px] font-mono-code text-slate-500 mt-0.5">
                            ({userCount} reseñ.)
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono-code text-slate-400">
                Sin resultados para "{query}".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
