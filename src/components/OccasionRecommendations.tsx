import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MapPin,
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  getOccasionRecommendations,
  OccasionRecommendation,
  ImportantDate,
  gustoLabels,
} from '../lib/importantDates';
import { PlaceResult } from './SearchBar';

interface OccasionRecommendationsProps {
  date: ImportantDate;
  zone?: string;
  onBack: () => void;
  onViewPlace?: (placeId: string, place?: PlaceResult) => void;
}

/**
 * Vista de recomendaciones para una ocasión concreta.
 *
 * Busca establecimientos REALES en la zona (vía Edge Function `search-places`)
 * y los ordena por afinidad con los gustos de la ocasión y su rating de Google.
 * No inventa establecimientos ni puntuaciones. Muestra los resultados reales
 * disponibles y, si hay menos de 3 coincidencias, lo indica honestamente.
 */
export const OccasionRecommendations: React.FC<OccasionRecommendationsProps> = ({
  date,
  zone,
  onBack,
  onViewPlace,
}) => {
  const [results, setResults] = useState<OccasionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err, searched: srch } = await getOccasionRecommendations({
      gustoIds: date.gustos,
      zone,
    });
    setResults(data);
    setError(err);
    setSearched(srch);
    setLoading(false);
  }, [date.gustos, zone]);

  useEffect(() => {
    load();
  }, [load]);

  const gustosLabels = gustoLabels(date.gustos);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a mis fechas
        </button>
        <div className="text-right">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] text-[10px] font-mono-code font-bold border border-cyan-500/40">
            Ocasión
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
        <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-700" />
          Recomendaciones para "{date.name}"
        </h4>
        <p className="text-xs font-mono-code text-slate-600 mt-1">
          {date.day} de {new Date(2000, date.month - 1, 1).toLocaleString('es-ES', { month: 'long' })}
          {date.occurrence_type === 'unica' && date.year ? ` de ${date.year}` : ''}
          {date.occurrence_type === 'anual' ? ' · se repite cada año' : ' · fecha única'}
        </p>
        {gustosLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {gustosLabels.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded-full bg-white text-[10px] font-mono-code font-bold text-cyan-800 border border-cyan-300">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-5 h-5 text-cyan-800 animate-spin" />
          <span className="ml-2 text-xs font-mono-code">Buscando establecimientos en tu zona...</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 p-4 rounded-xl border text-xs font-sans-ui bg-rose-50 border-rose-200 text-rose-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : results.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-sans-ui font-bold text-slate-800 mb-1">
            No se han encontrado establecimientos que coincidan con tus criterios
          </p>
          <p className="text-xs font-mono-code text-slate-500">
            {searched
              ? 'No se encontraron suficientes establecimientos reales que coincidan con los gustos de esta ocasión. Ajusta los gustos o prueba de nuevo.'
              : 'Selecciona algún gusto para esta ocasión para poder recomendarte establecimientos.'}
          </p>
        </div>
      ) : (
        <>
          {results.length < 3 && (
            <div className="flex items-start gap-2 p-3 rounded-xl border text-xs font-sans-ui bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Solo hemos encontrado {results.length} establecimiento
                {results.length === 1 ? '' : 's'} que coincida
                {results.length === 1 ? '' : 'n'} con tus criterios. No añadimos inventados para rellenar.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {results.map((r) => (
              <div
                key={r.placeId}
                className="p-4 rounded-xl bg-white border border-sky-300 shadow-sm hover:border-cyan-500 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h5 className="font-extrabold text-sm text-slate-900 truncate">{r.name}</h5>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-mono-code font-bold border border-amber-300 shrink-0">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {r.rating != null ? r.rating : '—'}
                  </span>
                </div>

                {r.category && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-code bg-cyan-950 text-cyan-200 border border-cyan-800/80 font-semibold inline-block">
                    {r.category}
                  </span>
                )}

                {r.address && (
                  <p className="text-xs font-mono-code text-slate-600 flex items-center gap-1 mt-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {r.address}
                  </p>
                )}

                {r.reason && (
                  <p className="text-[11px] font-sans-ui text-slate-700 mt-2 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-2">
                    {r.reason}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-mono-code text-slate-400">
                    {r.affinity} de {r.totalGustos} gustos coincidentes · Rating: Google
                  </span>
                  {onViewPlace && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewPlace(r.placeId, {
                          id: r.placeId,
                          displayName: { text: r.name },
                          formattedAddress: r.address,
                          rating: r.rating ?? undefined,
                          userRatingCount: r.userRatingCount ?? undefined,
                          primaryTypeDisplayName: r.category ? { text: r.category } : undefined,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-slate-900 text-[#00f2ff] text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      Ver ficha
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-mono-code text-slate-400">
            Afinidad estimada por coincidencia de los gustos de la ocasión con la categoría y
            datos reales de Google Places. La Nota Real ponderada de ReseñIA aún no está
            calculada en esta versión; se muestra el rating público de Google.
          </p>
        </>
      )}
    </div>
  );
};
