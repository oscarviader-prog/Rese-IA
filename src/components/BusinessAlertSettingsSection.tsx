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
}

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
            <div
              key={field}
              className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
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
          ))}
        </div>
      ) : null}
    </section>
  );
};
