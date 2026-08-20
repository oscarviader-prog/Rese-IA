import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Star, MessageSquare, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessMetricsDashboardProps {
  businessId: string;
}

interface BusinessSnapshot {
  rating: number;
  user_ratings_total: number;
  snapshot_date: string;
}

const formatMonthYear = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { payload: { date: string; rating: number; reviews: number } }[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm text-gray-700">
      {`Fecha: ${point.date}, Rating: ${point.rating.toFixed(1)}, Reseñas: ${point.reviews}`}
    </div>
  );
};

export const BusinessMetricsDashboard: React.FC<BusinessMetricsDashboardProps> = ({
  businessId,
}) => {
  const [snapshots, setSnapshots] = useState<BusinessSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshots = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('business_snapshots')
        .select('rating, user_ratings_total, snapshot_date')
        .eq('business_id', businessId)
        .order('snapshot_date', { ascending: true });

      if (error) {
        console.error('Error al obtener el histórico de métricas del negocio:', error);
      }

      if (isMounted) {
        setSnapshots((data as BusinessSnapshot[] | null) ?? []);
        setIsLoading(false);
      }
    };

    fetchSnapshots();

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  const latest = snapshots[snapshots.length - 1];

  let ratingChange: number | null = null;
  if (latest) {
    const latestDate = new Date(latest.snapshot_date);
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - 30);

    const candidatos = snapshots.slice(0, -1);
    const previous = candidatos.reduce<BusinessSnapshot | null>((closest, s) => {
      const diff = Math.abs(new Date(s.snapshot_date).getTime() - targetDate.getTime());
      const closestDiff = closest
        ? Math.abs(new Date(closest.snapshot_date).getTime() - targetDate.getTime())
        : Infinity;
      return diff < closestDiff ? s : closest;
    }, null);

    if (previous) {
      ratingChange = latest.rating - previous.rating;
    }
  }

  const chartData = snapshots.map((s) => ({
    date: formatMonthYear(s.snapshot_date),
    rating: s.rating,
    reviews: s.user_ratings_total,
  }));

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de tu negocio</h3>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-6 shadow-md flex flex-col items-center justify-center gap-3 text-gray-600 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Cargando métricas...</p>
        </div>
      ) : snapshots.length < 2 ? (
        <div className="rounded-2xl bg-gray-100 p-6">
          <p className="text-sm text-gray-600">
            Estamos recopilando datos de tu negocio. En las próximas semanas verás la evolución
            completa.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Rating actual</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{latest.rating.toFixed(1)}</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                {ratingChange !== null && ratingChange > 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : ratingChange !== null && ratingChange < 0 ? (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Cambio vs mes anterior</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  ratingChange !== null && ratingChange > 0
                    ? 'text-green-600'
                    : ratingChange !== null && ratingChange < 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {ratingChange !== null
                  ? `${ratingChange > 0 ? '+' : ''}${ratingChange.toFixed(1)}`
                  : '—'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Total reseñas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{latest.user_ratings_total}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};