import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Star,
  MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessCompetitiveAnalysisSectionProps {
  businessId: string;
}

type RankingStatus = 'top_25' | 'top_50' | 'bottom_50' | 'bottom_25';
type EmptyReason = 'no_business_snapshot' | 'no_competitors' | 'no_competitor_snapshots';

interface CompetitorEntry {
  id: string;
  place_id: string;
  name: string;
  primary_type: string | null;
  distance_meters: number | null;
  rating: number | null;
  user_ratings_total: number;
  snapshot_date: string | null;
}

interface CompetitiveAnalysis {
  success: boolean;
  has_data: boolean;
  reason?: EmptyReason;
  message?: string;
  business?: {
    rating: number;
    user_ratings_total: number;
    snapshot_date: string;
    position: number;
    total_negocios: number;
    percentile: number;
    ranking_status: RankingStatus;
    difference_vs_average: number;
  };
  competitors?: {
    count: number;
    average_rating: number;
    top: CompetitorEntry[];
  };
  generated_at?: string;
}

const RANKING_BADGES: Record<
  RankingStatus,
  { classes: string; label: string }
> = {
  top_25: {
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    label: '🏆 Top 25% de tu zona',
  },
  top_50: {
    classes: 'bg-teal-100 text-teal-800 border-teal-300',
    label: '✨ Top 50% de tu zona',
  },
  bottom_50: {
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    label: '⚠️ Por debajo de la media',
  },
  bottom_25: {
    classes: 'bg-red-100 text-red-800 border-red-300',
    label: '🔻 Bottom 25% de tu zona',
  },
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const BusinessCompetitiveAnalysisSection: React.FC<BusinessCompetitiveAnalysisSectionProps> = ({
  businessId,
}) => {
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('calculate-competitive-analysis', {
      body: { businessId },
    });

    if (invokeError) {
      console.error('Error al obtener el análisis competitivo:', invokeError);
      setError('No se pudo cargar el análisis competitivo.');
      setLoading(false);
      return;
    }

    setAnalysis(data as CompetitiveAnalysis);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    if (isExpanded) {
      fetchAnalysis();
    }
  }, [isExpanded, fetchAnalysis]);

  const handleRegenerateCompetitors = async () => {
    setRegenerating(true);

    const { error: detectError } = await supabase.functions.invoke('detect-competitors', {
      body: { businessId },
    });

    if (detectError) {
      console.error('Error al detectar competidores:', detectError);
    }

    await fetchAnalysis();
    setRegenerating(false);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md mt-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer transition-opacity hover:opacity-90"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-teal-100">
            <TrendingUp className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Análisis competitivo</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Cómo se sitúa tu negocio frente a los competidores directos de la zona.
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-600 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm">Analizando competencia...</p>
            </div>
          ) : error || !analysis ? (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 text-sm">
              <p>No se pudo cargar el análisis competitivo.</p>
              <button
                type="button"
                onClick={fetchAnalysis}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : !analysis.has_data ? (
            <div className="bg-gray-50 text-gray-700 border border-gray-200 rounded-lg p-4 text-sm">
              {analysis.reason === 'no_business_snapshot' && (
                <p>Tu negocio aún no tiene snapshots. Espera al próximo cron semanal.</p>
              )}
              {analysis.reason === 'no_competitors' && (
                <>
                  <p>No hay competidores registrados para este negocio.</p>
                  <button
                    type="button"
                    onClick={handleRegenerateCompetitors}
                    disabled={regenerating}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {regenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Detectar competidores ahora
                  </button>
                </>
              )}
              {analysis.reason === 'no_competitor_snapshots' && (
                <p>Los competidores aún no tienen snapshots. Espera al próximo cron.</p>
              )}
              {!analysis.reason && <p>{analysis.message || 'No hay datos disponibles todavía.'}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card superior: posición del negocio */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tu rating</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {analysis.business!.rating.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Media competidores</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {analysis.competitors!.average_rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {analysis.business!.difference_vs_average >= 0 ? (
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      <TrendingUp className="w-4 h-4" />
                      +{analysis.business!.difference_vs_average.toFixed(1)} vs media
                    </p>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
                      <TrendingDown className="w-4 h-4" />
                      {analysis.business!.difference_vs_average.toFixed(1)} vs media
                    </p>
                  )}
                </div>
              </div>

              {/* Badge de ranking */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${RANKING_BADGES[analysis.business!.ranking_status].classes}`}
                >
                  {RANKING_BADGES[analysis.business!.ranking_status].label}
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  Posición {analysis.business!.position} de {analysis.business!.total_negocios} negocios analizados en 2km.
                </p>
              </div>

              {/* Top competidores */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-3">Top competidores más valorados</h4>
                <div className="space-y-3">
                  {analysis.competitors!.top.map((competitor) => (
                    <div
                      key={competitor.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{competitor.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {competitor.primary_type || 'Sin categoría'}
                        </p>
                        {competitor.distance_meters !== null && (
                          <p className="text-xs text-gray-400 mt-0.5 inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            a {competitor.distance_meters} m
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          {competitor.rating?.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{competitor.user_ratings_total} reseñas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón inferior */}
              <div>
                <button
                  type="button"
                  onClick={handleRegenerateCompetitors}
                  disabled={regenerating}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Actualizar competidores
                </button>
                {analysis.generated_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Última actualización: {formatDate(analysis.generated_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
