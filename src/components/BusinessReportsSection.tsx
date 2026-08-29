import React, { useEffect, useState } from 'react';
import {
  FileText,
  Star,
  MessageSquare,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { ReportPDFDocument, buildFileName } from './BusinessReportPDF';

type ReportFrequency = 'weekly' | 'biweekly' | 'monthly';
type ReportType = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

interface BusinessReportsSectionProps {
  businessId: string;
  initialFrequency: ReportFrequency;
}

interface ReviewSnippet {
  author_name: string | null;
  rating: number;
  text: string | null;
}

interface Report {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  metrics: {
    current_rating: number | null;
    rating_change: number | null;
    previous_rating: number | null;
    new_reviews_count: number;
    top_positive_review: ReviewSnippet | null;
    top_negative_review: ReviewSnippet | null;
    total_reviews_captured: number;
  };
  generated_at: string;
}

// ==========================================
// HELPERS
// ==========================================
const formatRelativeDate = (dateStr: string): string => {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 5) return 'hace unos minutos';
  if (diffMin < 60) return `hace ${diffMin} minutos`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays <= 30) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatPeriod = (start: string, end: string): string =>
  `${formatDate(start)} - ${formatDate(end)}`;

const getReportTypeLabel = (type: ReportType): string => {
  switch (type) {
    case 'weekly':
      return 'Semanal';
    case 'biweekly':
      return 'Quincenal';
    case 'monthly':
      return 'Mensual';
    case 'on_demand':
    default:
      return 'A demanda';
  }
};

const getFrequencyLabel = (frequency: ReportFrequency): string => {
  switch (frequency) {
    case 'weekly':
      return 'Semanal';
    case 'biweekly':
      return 'Quincenal';
    case 'monthly':
    default:
      return 'Mensual';
  }
};

interface ReportTypeStyles {
  bg: string;
  text: string;
  border: string;
}

const getReportTypeStyles = (type: ReportType): ReportTypeStyles => {
  switch (type) {
    case 'weekly':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    case 'biweekly':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'monthly':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'on_demand':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  }
};

const truncate = (text: string, max = 200): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rounded ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </span>
  );
};

const ReviewBlock: React.FC<{ title: string; review: ReviewSnippet | null; emptyText: string }> = ({
  title,
  review,
  emptyText,
}) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
    {review ? (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {review.author_name || 'Usuario anónimo'}
          </span>
          <StarRating rating={review.rating} />
        </div>
        <p className="mt-2 text-sm text-gray-700">
          {review.text ? truncate(review.text) : 'Reseña sin texto.'}
        </p>
      </div>
    ) : (
      <p className="text-sm text-gray-500">{emptyText}</p>
    )}
  </div>
);

const RatingChange: React.FC<{ change: number | null }> = ({ change }) => {
  if (change === null || change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500">
        <Minus className="w-3.5 h-3.5" />
        {change === null ? 'Sin datos' : '0,0'}
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <ArrowUp className="w-3.5 h-3.5" />
        {`+${change.toFixed(1)}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-600">
      <ArrowDown className="w-3.5 h-3.5" />
      {change.toFixed(1)}
    </span>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export const BusinessReportsSection: React.FC<BusinessReportsSectionProps> = ({
  businessId,
  initialFrequency,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<ReportFrequency>(initialFrequency);
  const [savingFrequency, setSavingFrequency] = useState(false);
  const [frequencyMessage, setFrequencyMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);

      const [reportsResult, businessResult] = await Promise.all([
        supabase
          .from('business_reports')
          .select('*')
          .eq('business_id', businessId)
          .order('generated_at', { ascending: false }),
        supabase.from('businesses').select('razon_social').eq('id', businessId).maybeSingle(),
      ]);

      if (!isMounted) return;

      const { data, error: fetchError } = reportsResult;

      if (fetchError) {
        console.error('Error al obtener los informes del negocio:', fetchError);
        setError('No se pudieron cargar tus informes. Vuelve a intentarlo en un momento.');
        setReports([]);
      } else {
        setReports((data as Report[] | null) ?? []);
      }

      if (businessResult.error) {
        console.error('Error al obtener el nombre del negocio:', businessResult.error);
      } else {
        setBusinessName(
          (businessResult.data as { razon_social: string } | null)?.razon_social ?? null
        );
      }

      setIsLoading(false);
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  const handleChangeFrequency = async (newFrequency: ReportFrequency) => {
    const previousFrequency = frequency;
    setFrequency(newFrequency);
    setSavingFrequency(true);
    setFrequencyMessage(null);

    const { error: updateError } = await supabase
      .from('businesses')
      .update({ report_frequency: newFrequency })
      .eq('id', businessId);

    setSavingFrequency(false);

    if (updateError) {
      console.error('Error al actualizar la frecuencia de informes:', updateError);
      setFrequency(previousFrequency);
      setFrequencyMessage('Error al actualizar la frecuencia');
      return;
    }

    setFrequencyMessage('Frecuencia actualizada');
    setTimeout(() => setFrequencyMessage(null), 3000);
  };

  const handleGenerateNow = async () => {
    setGenerating(true);
    setGeneratingError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('generate-report', {
      body: { businessId, reportType: 'on_demand' },
    });

    setGenerating(false);

    if (invokeError || !data?.success || !data?.report) {
      console.error('Error al generar el informe:', invokeError ?? data);
      setGeneratingError('No se pudo generar el informe. Inténtalo de nuevo.');
      return;
    }

    const newReport: Report = {
      ...data.report,
      generated_at: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
  };

  const handleToggleExpand = (reportId: string) => {
    setExpandedFor((prev) => (prev === reportId ? null : reportId));
  };

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Mis informes ({reports.length})</h3>
      <p className="text-sm text-gray-500 mb-4">
        Se generan automáticamente según la frecuencia elegida. También puedes generar uno ahora
        mismo.
      </p>

      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <label htmlFor="reportFrequency" className="text-sm font-medium text-gray-700">
              Frecuencia:
            </label>
            <select
              id="reportFrequency"
              value={frequency}
              onChange={(e) => handleChangeFrequency(e.target.value as ReportFrequency)}
              disabled={savingFrequency}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
            >
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
            {savingFrequency && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
          </div>
          {frequencyMessage && (
            <p
              className={`mt-1.5 text-xs ${
                frequencyMessage === 'Frecuencia actualizada' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {frequencyMessage}
            </p>
          )}
        </div>

        <div className="sm:text-right">
          <button
            type="button"
            onClick={handleGenerateNow}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar informe ahora'
            )}
          </button>
          {generatingError && <p className="mt-1.5 text-xs text-red-600">{generatingError}</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-600 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Cargando informes...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-12 text-center">
          <FileText className="w-12 h-12 text-gray-300" />
          <p className="text-sm max-w-sm">
            {`Aún no tienes informes generados. Se generarán automáticamente cada ${getFrequencyLabel(
              frequency
            )} o puedes pulsar 'Generar informe ahora'.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const styles = getReportTypeStyles(report.report_type);
            const isExpanded = expandedFor === report.id;
            const { metrics } = report;

            return (
              <li key={report.id} className="rounded-xl border border-gray-200 p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} ${styles.border}`}
                  >
                    {getReportTypeLabel(report.report_type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatRelativeDate(report.generated_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Período: {formatPeriod(report.period_start, report.period_end)}
                </p>

                {/* Resumen */}
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-700">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {metrics.current_rating !== null
                      ? metrics.current_rating.toFixed(1)
                      : 'Sin datos'}
                  </span>
                  <RatingChange change={metrics.rating_change} />
                  <span className="inline-flex items-center gap-1.5 text-gray-700">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    {metrics.new_reviews_count}{' '}
                    {metrics.new_reviews_count === 1 ? 'reseña nueva' : 'reseñas nuevas'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(report.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Ocultar detalles
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Ver detalles
                      </>
                    )}
                  </button>
                  <PDFDownloadLink
                    document={
                      <ReportPDFDocument
                        report={report}
                        businessName={businessName ?? 'Mi negocio'}
                      />
                    }
                    fileName={buildFileName(
                      report.report_type,
                      businessName ?? 'Mi negocio',
                      report.generated_at
                    )}
                  >
                    {({ loading }) => (
                      <span
                        className={`flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-1.5 px-3 rounded-lg transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generando PDF...
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            Descargar PDF
                          </>
                        )}
                      </span>
                    )}
                  </PDFDownloadLink>
                </div>

                {/* Detalles */}
                {isExpanded && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ReviewBlock
                        title="Mejor reseña del período"
                        review={metrics.top_positive_review}
                        emptyText="No hubo reseñas positivas en este período."
                      />
                      <ReviewBlock
                        title="Peor reseña del período"
                        review={metrics.top_negative_review}
                        emptyText="No hubo reseñas negativas en este período."
                      />
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      Total de reseñas capturadas hasta hoy: {metrics.total_reviews_captured}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
