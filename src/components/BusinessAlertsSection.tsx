import React, { useEffect, useState } from 'react';
import {
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Clipboard,
  Check,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessAlertsSectionProps {
  businessId: string;
}

interface Alert {
  id: string;
  alert_type: 'new_review' | 'rating_change';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string | null;
  related_review_id: string | null;
  is_read: boolean;
  triggered_at: string;
  metadata: Record<string, any> | null;
  suggested_reply: string | null;
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

const getAlertTypeLabel = (alertType: string): string => {
  if (alertType === 'new_review') return 'Nueva reseña';
  if (alertType === 'rating_change') return 'Cambio de rating';
  return alertType;
};

interface SeverityStyles {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
}

const getSeverityStyles = (severity: string): SeverityStyles => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        iconBg: 'bg-red-100 text-red-600',
      };
    case 'warning':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-500',
        iconBg: 'bg-orange-100 text-orange-600',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-500',
        iconBg: 'bg-blue-100 text-blue-600',
      };
  }
};

const SeverityIcon: React.FC<{ severity: string; className?: string }> = ({
  severity,
  className,
}) => {
  if (severity === 'critical') return <AlertCircle className={className} />;
  if (severity === 'warning') return <AlertTriangle className={className} />;
  return <Info className={className} />;
};

const truncate = (text: string, max = 200): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export const BusinessAlertsSection: React.FC<BusinessAlertsSectionProps> = ({ businessId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReplyFor, setGeneratingReplyFor] = useState<string | null>(null);
  const [replyErrorFor, setReplyErrorFor] = useState<Record<string, string>>({});
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [hiddenReplyFor, setHiddenReplyFor] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('business_alerts')
        .select('*')
        .eq('business_id', businessId)
        .order('is_read', { ascending: true })
        .order('triggered_at', { ascending: false });

      if (!isMounted) return;

      if (fetchError) {
        console.error('Error al obtener las alertas del negocio:', fetchError);
        setError('No se pudieron cargar tus alertas. Vuelve a intentarlo en un momento.');
        setAlerts([]);
      } else {
        setAlerts((data as Alert[] | null) ?? []);
      }

      setIsLoading(false);
    };

    fetchAlerts();

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  const handleMarkAsRead = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );

    const { error: updateError } = await supabase
      .from('business_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (updateError) {
      console.error('Error al marcar la alerta como leída:', updateError);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: false } : a))
      );
    }
  };

  const handleGenerateReply = async (alertId: string) => {
    setGeneratingReplyFor(alertId);
    setReplyErrorFor((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });

    const { data, error: invokeError } = await supabase.functions.invoke(
      'generate-review-reply',
      { body: { alertId } }
    );

    if (invokeError || !data?.success || !data?.suggested_reply) {
      console.error('Error al generar la respuesta sugerida:', invokeError ?? data);
      setReplyErrorFor((prev) => ({
        ...prev,
        [alertId]: 'No se pudo generar la respuesta sugerida. Inténtalo de nuevo.',
      }));
      setGeneratingReplyFor(null);
      return;
    }

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, suggested_reply: data.suggested_reply } : a
      )
    );
    setGeneratingReplyFor(null);
  };

  const handleDeleteAlert = async (alertId: string) => {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta alerta? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    const previousAlerts = alerts;
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    const { error: deleteError } = await supabase
      .from('business_alerts')
      .delete()
      .eq('id', alertId);

    if (deleteError) {
      console.error('Error al eliminar la alerta:', deleteError);
      setAlerts(previousAlerts);
    }
  };

  const handleCopyReply = async (alertId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFor(alertId);
      setTimeout(() => setCopiedFor(null), 2000);
    } catch (copyError) {
      console.error('Error al copiar la respuesta al portapapeles:', copyError);
    }
  };

  const handleToggleReplyVisibility = (alertId: string) => {
    setHiddenReplyFor((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const handleRegenerateReply = async (alertId: string) => {
    setGeneratingReplyFor(alertId);
    setReplyErrorFor((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });

    const { error: clearError } = await supabase
      .from('business_alerts')
      .update({ suggested_reply: null })
      .eq('id', alertId);

    if (clearError) {
      console.error('Error al borrar la respuesta sugerida anterior:', clearError);
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, suggested_reply: null } : a))
    );

    const { data, error: invokeError } = await supabase.functions.invoke(
      'generate-review-reply',
      { body: { alertId } }
    );

    if (invokeError || !data?.success || !data?.suggested_reply) {
      console.error('Error al regenerar la respuesta sugerida:', invokeError ?? data);
      setReplyErrorFor((prev) => ({
        ...prev,
        [alertId]: 'No se pudo regenerar la respuesta sugerida. Inténtalo de nuevo.',
      }));
      setGeneratingReplyFor(null);
      return;
    }

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, suggested_reply: data.suggested_reply } : a
      )
    );
    setGeneratingReplyFor(null);
  };

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-teal-600" />
        Mis alertas ({alerts.length})
      </h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-600 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Cargando alertas...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 p-8 flex flex-col items-center justify-center gap-4 text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
            <Bell className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">
              Todo tranquilo por aquí
            </h4>
            <p className="text-sm text-gray-600 max-w-md">
              No tienes alertas pendientes. Te avisaremos cuando haya novedades sobre tu negocio.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const cardBg = alert.is_read
              ? 'bg-gray-50 border-gray-200 opacity-70'
              : `${styles.bg} ${styles.border}`;
            const isGenerating = generatingReplyFor === alert.id;
            const replyError = replyErrorFor[alert.id];

            return (
              <li
                key={alert.id}
                className={`rounded-xl border p-4 transition-colors ${cardBg}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 rounded-lg p-2 ${
                      alert.is_read ? 'bg-gray-200 text-gray-500' : styles.iconBg
                    }`}
                  >
                    <SeverityIcon severity={alert.severity} className="w-4 h-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold text-gray-900">{alert.title}</p>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatRelativeDate(alert.triggered_at)}
                    </p>

                    {alert.message && (
                      <p className="mt-2 text-sm text-gray-700">
                        {truncate(alert.message)}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {!alert.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Marcar como leída
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>

                      {alert.alert_type === 'new_review' && !alert.suggested_reply && (
                        <button
                          type="button"
                          onClick={() => handleGenerateReply(alert.id)}
                          disabled={isGenerating}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {isGenerating ? 'Generando...' : 'Generar respuesta sugerida'}
                        </button>
                      )}
                    </div>

                    {replyError && (
                      <p className="mt-2 text-sm text-red-600">{replyError}</p>
                    )}

                    {alert.alert_type === 'new_review' &&
                      alert.suggested_reply &&
                      !hiddenReplyFor.has(alert.id) && (
                        <div className="mt-3 rounded-xl border border-teal-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                              Respuesta sugerida por IA
                            </p>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyReply(alert.id, alert.suggested_reply as string)
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                  copiedFor === alert.id
                                    ? 'text-green-700'
                                    : 'text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {copiedFor === alert.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Clipboard className="w-3.5 h-3.5" />
                                    Copiar
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleReplyVisibility(alert.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Ocultar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRegenerateReply(alert.id)}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                {isGenerating ? 'Regenerando...' : 'Regenerar'}
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                            {alert.suggested_reply}
                          </p>
                        </div>
                      )}

                    {alert.alert_type === 'new_review' &&
                      alert.suggested_reply &&
                      hiddenReplyFor.has(alert.id) && (
                        <button
                          type="button"
                          onClick={() => handleToggleReplyVisibility(alert.id)}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 border border-teal-200 rounded-lg px-3 py-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Mostrar respuesta sugerida
                        </button>
                      )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
