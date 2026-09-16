import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type ReportType = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

interface ReviewSnippet {
  author_name: string | null;
  rating: number;
  text: string | null;
}

interface AiAnalysis {
  resumen_general: string;
  fortalezas: string[];
  debilidades: string[];
  recomendaciones: Array<{
    titulo: string;
    descripcion: string;
    prioridad: 'alta' | 'media' | 'baja';
  }>;
  tendencia: 'positiva' | 'estable' | 'negativa';
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
    ai_analysis?: AiAnalysis | null;
  };
  generated_at: string;
}

interface ReportPDFDocumentProps {
  report: Report;
  businessName: string;
}

const TEAL = '#0d9488';

// ==========================================
// HELPERS
// ==========================================
export const getReportTypeLabel = (type: ReportType): string => {
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

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatRatingChange = (change: number | null): string => {
  if (change === null) return 'Sin datos';
  if (change === 0) return '0.0';
  if (change > 0) return `+${change.toFixed(1)}`;
  return `-${Math.abs(change).toFixed(1)}`;
};

export const stars = (rating: number): string => {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

export const truncate = (text: string, max = 300): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export const buildFileName = (
  reportType: ReportType,
  businessName: string,
  generatedAt: string
): string => {
  const typeLabel = getReportTypeLabel(reportType);
  const cleanName = businessName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '');
  const date = new Date(generatedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `Informe_${typeLabel}_${cleanName}_${year}-${month}-${day}.pdf`;
};

// ==========================================
// ESTILOS
// ==========================================
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#374151',
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TEAL,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  metaLine: {
    fontSize: 10,
    color: '#6b7280',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 14,
    marginBottom: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 12,
  },
  reviewAuthor: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  reviewStars: {
    color: '#d97706',
    marginBottom: 6,
  },
  reviewText: {
    color: '#4b5563',
  },
  emptyText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
  analysisSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '2px solid #0d9488',
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 10,
  },
  analysisResumen: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  analysisSubTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  analysisBulletList: {
    marginLeft: 10,
  },
  analysisBullet: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  recomendacionCard: {
    backgroundColor: '#f9fafb',
    padding: 8,
    marginBottom: 6,
    borderLeft: '3px solid #0d9488',
    borderRadius: 3,
  },
  recomendacionTitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  recomendacionDescripcion: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  prioridadBadge: {
    fontSize: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 2,
    marginRight: 4,
    alignSelf: 'flex-start',
  },
  prioridadAlta: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  prioridadMedia: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  prioridadBaja: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  tendenciaBadge: {
    fontSize: 10,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 3,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  tendenciaPositiva: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  tendenciaEstable: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  tendenciaNegativa: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

// ==========================================
// SUBCOMPONENTES
// ==========================================
const ReviewSection: React.FC<{ title: string; review: ReviewSnippet | null; emptyText: string }> = ({
  title,
  review,
  emptyText,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {review ? (
      <View style={styles.reviewCard}>
        <Text style={styles.reviewAuthor}>{review.author_name || 'Usuario anónimo'}</Text>
        <Text style={styles.reviewStars}>{stars(review.rating)}</Text>
        <Text style={styles.reviewText}>
          {review.text ? truncate(review.text, 300) : 'Reseña sin texto.'}
        </Text>
      </View>
    ) : (
      <Text style={styles.emptyText}>{emptyText}</Text>
    )}
  </View>
);

const AnalysisSection: React.FC<{ analysis: AiAnalysis }> = ({ analysis }) => {
  const tendenciaLabel = {
    positiva: 'Tendencia positiva',
    estable: 'Tendencia estable',
    negativa: 'Tendencia negativa',
  }[analysis.tendencia] || 'Tendencia estable';

  const tendenciaStyle = {
    positiva: styles.tendenciaPositiva,
    estable: styles.tendenciaEstable,
    negativa: styles.tendenciaNegativa,
  }[analysis.tendencia] || styles.tendenciaEstable;

  const prioridadStyle = (prioridad: string) => {
    if (prioridad === 'alta') return styles.prioridadAlta;
    if (prioridad === 'media') return styles.prioridadMedia;
    return styles.prioridadBaja;
  };

  return (
    <View style={styles.analysisSection}>
      <Text style={styles.analysisSectionTitle}>Análisis y recomendaciones</Text>

      <View style={[styles.tendenciaBadge, tendenciaStyle]}>
        <Text>{tendenciaLabel}</Text>
      </View>

      {analysis.resumen_general && (
        <Text style={styles.analysisResumen}>{analysis.resumen_general}</Text>
      )}

      {analysis.fortalezas.length > 0 && (
        <>
          <Text style={styles.analysisSubTitle}>Fortalezas</Text>
          <View style={styles.analysisBulletList}>
            {analysis.fortalezas.map((f, i) => (
              <Text key={`fortaleza-${i}`} style={styles.analysisBullet}>• {f}</Text>
            ))}
          </View>
        </>
      )}

      {analysis.debilidades.length > 0 && (
        <>
          <Text style={styles.analysisSubTitle}>Debilidades</Text>
          <View style={styles.analysisBulletList}>
            {analysis.debilidades.map((d, i) => (
              <Text key={`debilidad-${i}`} style={styles.analysisBullet}>• {d}</Text>
            ))}
          </View>
        </>
      )}

      {analysis.recomendaciones.length > 0 && (
        <>
          <Text style={styles.analysisSubTitle}>Recomendaciones accionables</Text>
          {analysis.recomendaciones.map((r, i) => (
            <View key={`rec-${i}`} style={styles.recomendacionCard}>
              <View style={[styles.prioridadBadge, prioridadStyle(r.prioridad)]}>
                <Text>Prioridad {r.prioridad}</Text>
              </View>
              <Text style={styles.recomendacionTitulo}>{r.titulo}</Text>
              <Text style={styles.recomendacionDescripcion}>{r.descripcion}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// ==========================================
// DOCUMENTO PRINCIPAL
// ==========================================
export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({ report, businessName }) => {
  const { metrics } = report;
  const aiAnalysis = metrics.ai_analysis;
  const ratingText =
    metrics.current_rating !== null
      ? `${metrics.current_rating.toFixed(1)} ${stars(metrics.current_rating)}`
      : 'Sin datos';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View>
          <Text style={styles.title}>Informe {getReportTypeLabel(report.report_type)}</Text>
          <Text style={styles.subtitle}>{businessName}</Text>
          <Text style={styles.metaLine}>Generado el {formatDate(report.generated_at)}</Text>
          <Text style={styles.metaLine}>
            Del {formatDate(report.period_start)} al {formatDate(report.period_end)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* RESUMEN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Rating actual: </Text>
            {ratingText}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Cambio vs período anterior: </Text>
            {formatRatingChange(metrics.rating_change)}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Nuevas reseñas: </Text>
            {metrics.new_reviews_count}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Total de reseñas capturadas hasta hoy: </Text>
            {metrics.total_reviews_captured}
          </Text>
        </View>

        {/* MEJOR RESEÑA */}
        <ReviewSection
          title="Mejor reseña del período"
          review={metrics.top_positive_review}
          emptyText="No hubo reseñas positivas en este período."
        />

        {/* PEOR RESEÑA */}
        <ReviewSection
          title="Peor reseña del período"
          review={metrics.top_negative_review}
          emptyText="No hubo reseñas negativas en este período."
        />

        {/* ANÁLISIS Y RECOMENDACIONES (IA) */}
        {aiAnalysis && <AnalysisSection analysis={aiAnalysis} />}

        <Text style={styles.footer} fixed>
          Generado por ReseñIA - Análisis IA de reseñas
        </Text>
      </Page>
    </Document>
  );
};
