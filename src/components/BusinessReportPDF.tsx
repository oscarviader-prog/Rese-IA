import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type ReportType = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

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

// ==========================================
// DOCUMENTO PRINCIPAL
// ==========================================
export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({ report, businessName }) => {
  const { metrics } = report;
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

        <Text style={styles.footer} fixed>
          Generado por ReseñIA - Sistema de análisis de reseñas verificadas
        </Text>
      </Page>
    </Document>
  );
};
