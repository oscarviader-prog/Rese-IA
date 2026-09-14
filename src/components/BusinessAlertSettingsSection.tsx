import React, { useEffect, useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessAlertSettingsSectionProps {
  businessId: string;
}

interface AlertSettings {
  id: string;
  business_id: string;
  enable_new_review: boolean;
  enable_rating_change: boolean;
  enable_low_rating_review: boolean;
  enable_review_spike: boolean;
  enable_no_activity: boolean;
  rating_change_critical: number;
  rating_change_warning: number;
  low_rating_threshold: number;
  review_spike_count: number;
  review_spike_hours: number;
  no_activity_days: number;
}

type ThresholdField =
  | 'rating_change_critical'
  | 'rating_change_warning'
  | 'low_rating_threshold'
  | 'review_spike_count'
  | 'review_spike_hours'
  | 'no_activity_days';

const THRESHOLD_VALIDATION: Record<ThresholdField, { min: number; max: number; isInteger: boolean }> = {
  rating_change_critical: { min: 0.1, max: 2.0, isInteger: false },
  rating_change_warning: { min: 0.1, max: 2.0, isInteger: false },
  low_rating_threshold: { min: 1, max: 4, isInteger: true },
  review_spike_count: { min: 2, max: 50, isInteger: true },
  review_spike_hours: { min: 1, max: 168, isInteger: true },
  no_activity_days: { min: 7, max: 365, isInteger: true },
};

type ToggleField =
  | 'enable_new_review'
  | 'enable_rating_change'
  | 'enable_low_rating_review'
  | 'enable_review_spike'
  | 'enable_no_activity';

const TOGGLE_DEFINITIONS: { field: ToggleField; title: string; description: string }[] = [
  {
    field: 'enable_new_review',
    title: 'Nuevas reseñas',
    description: 'Recibe alerta cuando llegan reseñas nuevas a tu negocio.',
  },
  {
    field: 'enable_rating_change',
    title: 'Cambios en el rating',
    description: 'Alerta cuando la nota media sube o baja significativamente.',
  },
  {
    field: 'enable_low_rating_review',
    title: 'Reseñas de baja puntuación',
    description: 'Alerta específica cuando llega una reseña con 1 o 2 estrellas.',
  },
  {
    field: 'enable_review_spike',
    title: 'Aumento repentino de reseñas',
    description: 'Alerta si recibes muchas reseñas en poco tiempo.',
  },
  {
    field: 'enable_no_activity',
    title: 'Sin actividad reciente',
    description: 'Alerta si tu negocio pasa mucho tiempo sin reseñas nuevas.',
  },
];

export const BusinessAlertSettingsSection: React.FC<BusinessAlertSettingsSectionProps> = ({
  businessId,
}) => {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thresholdInputs, setThresholdInputs] = useState<Record<ThresholdField, string>>({
    rating_change_critical: '',
    rating_change_warning: '',
    low_rating_threshold: '',
    review_spike_count: '',
    review_spike_hours: '',
    no_activity_days: '',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchOrCreateSettings = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('business_alert_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (!isMounted) return;

      if (fetchError) {
        console.error('Error al obtener la configuración de alertas:', fetchError);
        setError('No se pudo cargar la configuración de alertas. Vuelve a intentarlo en un momento.');
        setIsLoading(false);
        return;
      }

      if (data) {
        setSettings(data as AlertSettings);
        setIsLoading(false);
        return;
      }

      const { data: created, error: insertError } = await supabase
        .from('business_alert_settings')
        .insert({ business_id: businessId })
        .select('*')
        .single();

      if (!isMounted) return;

      if (insertError) {
        console.error('Error al crear la configuración de alertas:', insertError);
        setError('No se pudo crear la configuración de alertas. Vuelve a intentarlo en un momento.');
        setIsLoading(false);
        return;
      }

      setSettings(created as AlertSettings);
      setIsLoading(false);
    };

    fetchOrCreateSettings();

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  useEffect(() => {
    if (!settings) return;
    setThresholdInputs({
      rating_change_critical: String(settings.rating_change_critical),
      rating_change_warning: String(settings.rating_change_warning),
      low_rating_threshold: String(settings.low_rating_threshold),
      review_spike_count: String(settings.review_spike_count),
      review_spike_hours: String(settings.review_spike_hours),
      no_activity_days: String(settings.no_activity_days),
    });
  }, [
    settings?.rating_change_critical,
    settings?.rating_change_warning,
    settings?.low_rating_threshold,
    settings?.review_spike_count,
    settings?.review_spike_hours,
    settings?.no_activity_days,
  ]);

  const handleToggle = async (field: ToggleField) => {
    if (!settings) return;

    const previousValue = settings[field];
    const nextValue = !previousValue;

    setSettings((prev) => (prev ? { ...prev, [field]: nextValue } : prev));

    const { error: updateError } = await supabase
      .from('business_alert_settings')
      .update({ [field]: nextValue })
      .eq('id', settings.id);

    if (updateError) {
      console.error('Error al actualizar la configuración de alertas:', updateError);
      setSettings((prev) => (prev ? { ...prev, [field]: previousValue } : prev));
    }
  };

  const handleUpdateThreshold = async (field: ThresholdField, value: number) => {
    if (!settings) return;

    const previousValue = settings[field];

    if (field === 'rating_change_critical' || field === 'rating_change_warning') {
      const nextCritical = field === 'rating_change_critical' ? value : settings.rating_change_critical;
      const nextWarning = field === 'rating_change_warning' ? value : settings.rating_change_warning;

      if (!(nextCritical > nextWarning)) {
        console.error('El umbral crítico debe ser mayor que el umbral de advertencia.');
        setThresholdInputs((prev) => ({ ...prev, [field]: String(previousValue) }));
        return;
      }
    }

    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));

    const { error: updateError } = await supabase
      .from('business_alert_settings')
      .update({ [field]: value })
      .eq('id', settings.id);

    if (updateError) {
      console.error('Error al actualizar el umbral de alertas:', updateError);
      setSettings((prev) => (prev ? { ...prev, [field]: previousValue } : prev));
      setThresholdInputs((prev) => ({ ...prev, [field]: String(previousValue) }));
    }
  };

  const handleThresholdChange = (field: ThresholdField, value: string) => {
    setThresholdInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleThresholdBlur = (field: ThresholdField, value: string) => {
    if (!settings) return;

    const { min, max, isInteger } = THRESHOLD_VALIDATION[field];
    const parsed = isInteger ? parseInt(value, 10) : parseFloat(value);

    if (Number.isNaN(parsed) || parsed < min || parsed > max) {
      console.error('Valor de umbral inválido:', value);
      setThresholdInputs((prev) => ({ ...prev, [field]: String(settings[field]) }));
      return;
    }

    handleUpdateThreshold(field, parsed);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-teal-600" />
        Configuración de alertas
      </h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-600 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Cargando configuración...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : settings ? (
        <div className="space-y-3">
          {TOGGLE_DEFINITIONS.map(({ field, title, description }) => (
            <div key={field} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(field)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    settings[field] ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[field] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {field === 'enable_rating_change' && settings.enable_rating_change && (
                <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="rating_change_critical"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Umbral crítico (bajada/subida ≥)
                    </label>
                    <input
                      id="rating_change_critical"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2.0"
                      value={thresholdInputs.rating_change_critical}
                      onChange={(e) =>
                        handleThresholdChange('rating_change_critical', e.target.value)
                      }
                      onBlur={(e) =>
                        handleThresholdBlur('rating_change_critical', e.target.value)
                      }
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cambios de esta magnitud generan alerta crítica.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="rating_change_warning"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Umbral de advertencia (bajada/subida ≥)
                    </label>
                    <input
                      id="rating_change_warning"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2.0"
                      value={thresholdInputs.rating_change_warning}
                      onChange={(e) =>
                        handleThresholdChange('rating_change_warning', e.target.value)
                      }
                      onBlur={(e) =>
                        handleThresholdBlur('rating_change_warning', e.target.value)
                      }
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cambios de esta magnitud generan alerta de advertencia.
                    </p>
                  </div>
                </div>
              )}

              {field === 'enable_low_rating_review' && settings.enable_low_rating_review && (
                <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="low_rating_threshold"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Umbral de estrellas
                    </label>
                    <input
                      id="low_rating_threshold"
                      type="number"
                      step="1"
                      min="1"
                      max="4"
                      value={thresholdInputs.low_rating_threshold}
                      onChange={(e) =>
                        handleThresholdChange('low_rating_threshold', e.target.value)
                      }
                      onBlur={(e) => handleThresholdBlur('low_rating_threshold', e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alerta si la reseña tiene esta puntuación o menos (1-4 estrellas).
                    </p>
                  </div>
                </div>
              )}

              {field === 'enable_review_spike' && settings.enable_review_spike && (
                <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="review_spike_count"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Número de reseñas
                      </label>
                      <input
                        id="review_spike_count"
                        type="number"
                        step="1"
                        min="2"
                        max="50"
                        value={thresholdInputs.review_spike_count}
                        onChange={(e) =>
                          handleThresholdChange('review_spike_count', e.target.value)
                        }
                        onBlur={(e) => handleThresholdBlur('review_spike_count', e.target.value)}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Reseñas necesarias para disparar la alerta.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="review_spike_hours"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        En las últimas (horas)
                      </label>
                      <input
                        id="review_spike_hours"
                        type="number"
                        step="1"
                        min="1"
                        max="168"
                        value={thresholdInputs.review_spike_hours}
                        onChange={(e) =>
                          handleThresholdChange('review_spike_hours', e.target.value)
                        }
                        onBlur={(e) => handleThresholdBlur('review_spike_hours', e.target.value)}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-1">Horas hacia atrás para contar.</p>
                    </div>
                  </div>
                </div>
              )}

              {field === 'enable_no_activity' && settings.enable_no_activity && (
                <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="no_activity_days"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Días sin actividad
                    </label>
                    <input
                      id="no_activity_days"
                      type="number"
                      step="1"
                      min="7"
                      max="365"
                      value={thresholdInputs.no_activity_days}
                      onChange={(e) => handleThresholdChange('no_activity_days', e.target.value)}
                      onBlur={(e) => handleThresholdBlur('no_activity_days', e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Días desde la última reseña para generar alerta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
