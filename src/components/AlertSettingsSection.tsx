import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Moon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  CalendarDays,
  AtSign,
  ShieldCheck,
} from 'lucide-react';
import {
  CONSUMER_ALERTS,
  ConsumerAlertType,
  AlertChannel,
  AlertFrequency,
  ConsumerAlertConfigRow,
  NoMolestarRow,
  getConsumerAlertConfig,
  saveAlertConfig,
  getNoMolestar,
  saveNoMolestar,
  isNoMolestarActive,
  resetConsumerAlerts,
  validateNoMolestarDates,
} from '../lib/consumerAlerts';

interface AlertSettingsSectionProps {
  userId?: string;
}

const CHANNEL_OPTIONS: { value: AlertChannel; label: string }[] = [
  { value: 'in_app', label: 'Dentro de la app' },
  { value: 'email', label: 'Email' },
];

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string }[] = [
  { value: 'immediate', label: 'Inmediata' },
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
];

/**
 * Sección "Alertas y notificaciones" del consumidor. Siempre abierta (sin
 * desplegable), con la estética de la parte de empresa. Conserva toda la
 * lógica de activar/desactivar alertas, canales, frecuencia y no molestar.
 */
export const AlertSettingsSection: React.FC<AlertSettingsSectionProps> = ({ userId }) => {
  const [configs, setConfigs] = useState<ConsumerAlertConfigRow[]>([]);
  const [noMolestar, setNoMolestar] = useState<NoMolestarRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingType, setSavingType] = useState<ConsumerAlertType | null>(null);
  const [savingNoMolestar, setSavingNoMolestar] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasUserId = !!userId;

  // No molestar form
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('');
  const [dndEnd, setDndEnd] = useState('');

  const today = new Date();
  const minStart = today.toISOString().slice(0, 10);

  const loadAll = useCallback(async () => {
    if (!hasUserId) {
      setConfigs([]);
      setNoMolestar(null);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const [cfgRes, nmRes] = await Promise.all([getConsumerAlertConfig(), getNoMolestar()]);
    if (cfgRes.error && nmRes.error) {
      setMessage({ type: 'error', text: 'No se pudieron cargar tus alertas.' });
    } else {
      setConfigs(cfgRes.data);
      const nm = nmRes.data;
      setNoMolestar(nm);
      setDndEnabled(nm?.enabled ?? false);
      setDndStart(nm?.start_date ?? '');
      setDndEnd(nm?.end_date ?? '');
    }
    setIsLoading(false);
  }, [hasUserId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resolveType = (type: ConsumerAlertType) => {
    const row = configs.find((c) => c.alert_type === type);
    return {
      enabled: row?.enabled ?? true,
      channels: (row?.channels ?? ['in_app']) as AlertChannel[],
      frequency: (row?.frequency ?? 'immediate') as AlertFrequency,
    };
  };

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage((m) => (m?.text === text ? null : m)), 4000);
  };

  const handleToggle = async (type: ConsumerAlertType, enabled: boolean) => {
    setSavingType(type);
    setMessage(null);
    const { error } = await saveAlertConfig(type, { enabled });
    if (error) {
      flash('error', 'No se pudo actualizar la alerta. Inténtalo de nuevo.');
    } else {
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.alert_type === type);
        if (idx === -1) {
          return [...prev, {
            alert_type: type, enabled, channels: (['in_app'] as AlertChannel[]), frequency: 'immediate',
          } as ConsumerAlertConfigRow];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], enabled };
        return next;
      });
      flash('success', enabled ? 'Alerta activada y guardada.' : 'Alerta desactivada y guardada.');
    }
    setSavingType(null);
  };

  const handleChannelToggle = async (type: ConsumerAlertType, channel: AlertChannel) => {
    setSavingType(type);
    setMessage(null);
    const cur = resolveType(type);
    const channels = cur.channels.includes(channel)
      ? cur.channels.filter((c) => c !== channel)
      : [...cur.channels, channel];
    const final = channels.length === 0 ? ['in_app'] as AlertChannel[] : channels;
    const { error } = await saveAlertConfig(type, { channels: final });
    if (error) {
      flash('error', 'No se pudieron guardar los canales.');
    } else {
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.alert_type === type);
        const updated: ConsumerAlertConfigRow = {
          alert_type: type,
          enabled: cur.enabled,
          channels: final,
          frequency: cur.frequency,
        };
        const next = [...prev];
        if (idx === -1) next.push(updated as ConsumerAlertConfigRow);
        else next[idx] = { ...next[idx], ...updated };
        return next;
      });
      flash('success', 'Canales actualizados.');
    }
    setSavingType(null);
  };

  const handleFrequency = async (type: ConsumerAlertType, frequency: AlertFrequency) => {
    setSavingType(type);
    setMessage(null);
    const { error } = await saveAlertConfig(type, { frequency });
    if (error) {
      flash('error', 'No se pudo guardar la frecuencia.');
    } else {
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.alert_type === type);
        const cur = prev[idx] ?? resolveType(type);
        const updated = { ...cur, frequency };
        const next = [...prev];
        if (idx === -1) next.push(updated as ConsumerAlertConfigRow);
        else next[idx] = updated;
        return next;
      });
      flash('success', 'Frecuencia actualizada.');
    }
    setSavingType(null);
  };

  const handleSaveNoMolestar = async () => {
    setSavingNoMolestar(true);
    setMessage(null);
    let { error } = await saveNoMolestar(dndEnabled, dndStart || null, dndEnd || null);
    if (error) {
      flash('error', error);
      setSavingNoMolestar(false);
      return;
    }
    const nmRes = await getNoMolestar();
    setNoMolestar(nmRes.data);
    if (dndEnabled) setDndEnabled(true);
    flash('success', dndEnabled ? 'Modo "No molestar" activado.' : 'Modo "No molestar" desactivado.');
    setSavingNoMolestar(false);
  };

  const dndActiveToday = isNoMolestarActive(noMolestar);

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setMessage(null);
      return;
    }
    setResetting(true);
    setMessage(null);
    const { error } = await resetConsumerAlerts();
    if (error) {
      flash('error', 'No se pudieron restaurar los valores predeterminados.');
    } else {
      await loadAll();
      setConfirmReset(false);
      flash('success', 'Se han restaurado los valores predeterminados.');
    }
    setResetting(false);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Alertas y notificaciones
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              {configs.length}
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Elige qué alertas recibir, por qué canal y con qué frecuencia
          </p>
        </div>
      </div>

      {!hasUserId ? (
        <p className="text-sm text-gray-400 italic py-3 text-center">
          Inicia sesión como consumidor para configurar tus alertas.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          <span className="ml-2 text-sm">Cargando alertas...</span>
        </div>
      ) : (
        <>
          {/* Lista de alertas */}
          <div className="space-y-3">
            {CONSUMER_ALERTS.map((def) => {
              const cfg = resolveType(def.type);
              return (
                <div
                  key={def.type}
                  className={`p-4 rounded-xl border transition-all ${
                    cfg.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-extrabold text-sm ${cfg.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                          {def.label}
                        </h4>
                        {!def.hasRealEventSource && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Pendiente de integración
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {def.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {savingType === def.type && (
                        <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      )}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={cfg.enabled}
                        aria-label={`${def.label}: ${cfg.enabled ? 'activa' : 'inactiva'}`}
                        onClick={() => handleToggle(def.type, !cfg.enabled)}
                        disabled={savingType === def.type}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 focus:outline-none ${
                          cfg.enabled ? 'bg-teal-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            cfg.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${cfg.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {cfg.enabled ? 'Estado: activa' : 'Estado: inactiva'} · frecuencia{' '}
                    {FREQUENCY_OPTIONS.find((f) => f.value === cfg.frequency)?.label.toLowerCase()}
                  </p>

                  {cfg.enabled && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1.5">
                          Canales
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {CHANNEL_OPTIONS.map((opt) => {
                            const active = cfg.channels.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleChannelToggle(def.type, opt.value)}
                                disabled={savingType === def.type}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                                  active
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {opt.value === 'email' ? (
                                  <AtSign className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                                {opt.label}
                                {active && <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            );
                          })}
                        </div>
                        {cfg.channels.includes('email') && (
                          <p className="text-xs text-amber-700 mt-1.5">
                            El canal Email queda configurado, pero requiere la integración de un
                            proveedor de email para realizar envíos reales.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1.5">
                          Frecuencia
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {FREQUENCY_OPTIONS.map((opt) => {
                            const active = cfg.frequency === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleFrequency(def.type, opt.value)}
                                disabled={savingType === def.type}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
                                  active
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* No molestar */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 mt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">No molestar</h4>
                  <p className="text-sm text-gray-500">
                    Pausa todas tus alertas durante un periodo y reanúdalas automáticamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dndEnabled}
                aria-label="No molestar"
                onClick={() => setDndEnabled(!dndEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  dndEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    dndEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {dndActiveToday && !dndEnabled && (
              <p className="text-sm text-indigo-700 mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                Activo hoy hasta {noMolestar?.end_date ?? ''}. Se desactivará automáticamente al terminar.
              </p>
            )}

            {dndEnabled && (
              <div className="mt-3 pt-3 border-t border-indigo-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Fecha de inicio</span>
                    <input
                      type="date"
                      value={dndStart}
                      min={minStart}
                      onChange={(e) => setDndStart(e.target.value)}
                      className="mt-1 w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Fecha de fin</span>
                    <input
                      type="date"
                      value={dndEnd}
                      min={dndStart || minStart}
                      onChange={(e) => setDndEnd(e.target.value)}
                      className="mt-1 w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                    />
                  </label>
                </div>
                {dndStart && dndEnd && validateNoMolestarDates(dndStart, dndEnd) && (
                  <p className="text-sm text-red-700">
                    {validateNoMolestarDates(dndStart, dndEnd)}
                  </p>
                )}
              </div>
            )}

            {(dndEnabled || (noMolestar?.enabled ?? false)) && (
              <div className="mt-3 pt-3 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={handleSaveNoMolestar}
                  disabled={savingNoMolestar}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingNoMolestar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" /> {dndEnabled ? 'Guardar periodo' : 'Desactivar y guardar'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Restaurar valores predeterminados */}
          <div className="flex items-center justify-between gap-3 pt-1 mt-3">
            <p className="text-sm text-gray-600 max-w-md">
              Puedes volver a la configuración recomendada por ReseñIA.
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || confirmReset}
              className={`inline-flex items-center gap-1.5 font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-70 ${
                confirmReset
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-800 text-white'
              }`}
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Restaurando...
                </>
              ) : confirmReset ? (
                '¿Confirmar restauración?'
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Restaurar valores predeterminados
                </>
              )}
            </button>
          </div>
        </>
      )}

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl border text-sm mt-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <p className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        La configuración se guarda automáticamente en tu cuenta de ReseñIA.
      </p>
    </section>
  );
};
