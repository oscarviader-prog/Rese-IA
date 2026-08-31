import React, { useState, useEffect, useCallback } from 'react';
import { PastelCard } from './PastelCard';
import {
  Bell,
  Moon,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  CalendarDays,
  AtSign,
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
 * Sección "Alertas y notificaciones" del consumidor.
 *
 * Permite activar/desactivar cada alerta (guardado automático), elegir canal
 * (in_app/email/ambas) y frecuencia (immediate/daily/weekly), configurar el
 * modo "No molestar" con fechas, y restaurar los valores predeterminados.
 *
 * Nota honesta: el canal "email" queda configurado pero su envío real requiere
 * una integración de proveedor de email que hoy no existe en el cliente (no se
 * envían correos ficticios). El canal "in_app" es el funcional hoy.
 */
export const AlertSettingsSection: React.FC<AlertSettingsSectionProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <PastelCard variant="darker" className="border-2 border-cyan-500/40 p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Alertas y notificaciones
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] text-[11px] font-bold font-mono-code">
                {configs.length}
              </span>
            </h3>
            <p className="text-[11px] font-mono-code text-slate-600">
              Elige qué alertas recibir, por qué canal y con qué frecuencia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-code font-bold text-cyan-800 hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Configurar'}
          </span>
          <div className="p-1 rounded-lg bg-sky-200 text-slate-800">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-sky-300 bg-white/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {!hasUserId ? (
            <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
              Inicia sesión como consumidor para configurar tus alertas.
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <Loader2 className="w-5 h-5 text-cyan-800 animate-spin" />
              <span className="ml-2 text-xs font-mono-code">Cargando alertas...</span>
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
                        cfg.enabled ? 'bg-white border-sky-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-extrabold text-sm ${cfg.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                              {def.label}
                            </h4>
                            {!def.hasRealEventSource && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-code bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
                                Pendiente de integración
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono-code text-slate-500 mt-1">
                            {def.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {savingType === def.type && (
                            <Loader2 className="w-4 h-4 text-cyan-700 animate-spin" />
                          )}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={cfg.enabled}
                            aria-label={`${def.label}: ${cfg.enabled ? 'activa' : 'inactiva'}`}
                            onClick={() => handleToggle(def.type, !cfg.enabled)}
                            disabled={savingType === def.type}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 focus:outline-none ${
                              cfg.enabled ? 'bg-[#0F766E]' : 'bg-slate-300'
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

                      <p className="text-[11px] font-mono-code text-slate-600 flex items-center gap-1 mt-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${cfg.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {cfg.enabled ? 'Estado: activa' : 'Estado: inactiva'} · frecuencia {FREQUENCY_OPTIONS.find((f) => f.value === cfg.frequency)?.label.toLowerCase()}
                      </p>

                      {cfg.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                          <div>
                            <p className="text-[11px] font-mono-code font-bold text-slate-700 mb-1.5">
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
                                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono-code font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                                      active
                                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                    }`}
                                  >
                                    {opt.value === 'email' ? (
                                      <AtSign className="w-3.5 h-3.5" />
                                    ) : (
                                      <Bell className="w-3.5 h-3.5" />
                                    )}
                                    {opt.label}
                                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                );
                              })}
                            </div>
                            {cfg.channels.includes('email') && (
                              <p className="text-[10px] font-mono-code text-amber-700 mt-1.5">
                                El canal Email queda configurado, pero requiere la integración de un
                                proveedor de email para realizar envíos reales (pendiente en el proyecto).
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-mono-code font-bold text-slate-700 mb-1.5">
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
                                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono-code font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                      active
                                        ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
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
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-200 text-indigo-800">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">No molestar</h4>
                      <p className="text-xs font-mono-code text-slate-500">
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
                      dndEnabled ? 'bg-indigo-600' : 'bg-slate-300'
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
                  <p className="text-[11px] font-mono-code text-indigo-700 mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                    Activo hoy hasta {noMolestar?.end_date ?? ''}. Se desactivará automáticamente al terminar.
                  </p>
                )}

                {dndEnabled && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[11px] font-mono-code font-bold text-slate-700">Fecha de inicio</span>
                        <input
                          type="date"
                          value={dndStart}
                          min={minStart}
                          onChange={(e) => setDndStart(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono-code text-slate-800"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-mono-code font-bold text-slate-700">Fecha de fin</span>
                        <input
                          type="date"
                          value={dndEnd}
                          min={dndStart || minStart}
                          onChange={(e) => setDndEnd(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono-code text-slate-800"
                        />
                      </label>
                    </div>
                    {dndStart && dndEnd && validateNoMolestarDates(dndStart, dndEnd) && (
                      <p className="text-[11px] font-mono-code text-rose-700">
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
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingNoMolestar ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <CalendarDays className="w-3.5 h-3.5" /> {dndEnabled ? 'Guardar periodo' : 'Desactivar y guardar'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Restaurar valores predeterminados */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs font-mono-code text-slate-600 max-w-md">
                  Puedes volver a la configuración recomendada por ReseñIA.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting || confirmReset}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-70 ${
                    confirmReset
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-800 text-white'
                  }`}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Restaurando...
                    </>
                  ) : confirmReset ? (
                    '¿Confirmar restauración?'
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Restaurar valores predeterminados
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {message && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-sans-ui ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
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
        </div>
      )}
    </PastelCard>
  );
};
