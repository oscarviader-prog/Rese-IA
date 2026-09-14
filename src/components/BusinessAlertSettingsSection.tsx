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
}

type ThresholdField = 'rating_change_critical' | 'rating_change_warning';

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
    });
  }, [settings?.rating_change_critical, settings?.rating_change_warning]);

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
    const nextCritical = field === 'rating_change_critical' ? value : settings.rating_change_critical;
    const nextWarning = field === 'rating_change_warning' ? value : settings.rating_change_warning;

    if (!(nextCritical > nextWarning)) {
      console.error('El umbral crítico debe ser mayor que el umbral de advertencia.');
      setThresholdInputs((prev) => ({ ...prev, [field]: String(previousValue) }));
      return;
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

    const parsed = parseFloat(value);

    if (Number.isNaN(parsed) || parsed < 0.1 || parsed > 2.0) {
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
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
