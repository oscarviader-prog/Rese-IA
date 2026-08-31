import React, { useState, useEffect, useCallback } from 'react';
import { PastelCard } from './PastelCard';
import {
  getConsumerImportantDates,
  addImportantDate,
  updateImportantDate,
  deleteImportantDate,
  isReminderDue,
  nextOccurrence,
  ImportantDate,
  ImportantDateInput,
  gustoLabels,
} from '../lib/importantDates';
import { ImportantDateForm, ImportantDateFormValues } from './ImportantDateForm';
import { OccasionRecommendations } from './OccasionRecommendations';
import {
  CalendarHeart,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { PlaceResult } from './SearchBar';

interface ImportantDatesSectionProps {
  userId?: string;
  zone?: string;
  onViewPlace?: (placeId: string, place?: PlaceResult) => void;
  /** Para que un banner externo pueda abrir las recomendaciones de una fecha concreta. */
  autoOpen?: { dateId: string; nonce: number } | null;
}

const formValuesToInput = (v: ImportantDateFormValues): ImportantDateInput => ({
  name: v.name.trim(),
  day: Number(v.day),
  month: Number(v.month),
  year: v.occurrenceType === 'unica' ? Number(v.year) : null,
  occurrence_type: v.occurrenceType,
  gustos: v.gustos,
});

const inputToFormValues = (d: ImportantDate): ImportantDateFormValues => ({
  name: d.name,
  day: d.day,
  month: d.month,
  year: d.occurrence_type === 'unica' && d.year != null ? d.year : '',
  occurrenceType: d.occurrence_type,
  gustos: d.gustos ?? [],
});

export const ImportantDatesSection: React.FC<ImportantDatesSectionProps> = ({
  userId,
  zone,
  onViewPlace,
  autoOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<ImportantDate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ImportantDate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeRecommendation, setActiveRecommendation] = useState<ImportantDate | null>(null);

  const hasUserId = !!userId;

  const loadDates = useCallback(async () => {
    if (!hasUserId) {
      setDates([]);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const { data, error } = await getConsumerImportantDates();
    if (error) {
      setMessage({ type: 'error', text: 'No se pudieron cargar tus fechas importantes.' });
    } else {
      setDates(data);
    }
    setIsLoading(false);
  }, [hasUserId]);

  useEffect(() => {
    loadDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permite que un banner externo abra las recomendaciones de una fecha.
  useEffect(() => {
    if (autoOpen && autoOpen.dateId) {
      const target = dates.find((d) => d.id === autoOpen.dateId);
      if (target) {
        setActiveRecommendation(target);
        setIsOpen(true);
        setMode('list');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen?.nonce]);

  // Fechas que cumplen el recordatorio de "a 7 días" hoy.
  const reminders = dates.filter((d) => isReminderDue(d, new Date()));

  const handleSubmit = async (values: ImportantDateFormValues) => {
    if (!hasUserId) return;
    setSubmitting(true);
    setMessage(null);
    const input = formValuesToInput(values);
    if (mode === 'edit' && editing) {
      const { error } = await updateImportantDate(editing.id, input);
      if (error) {
        setMessage({ type: 'error', text: 'No se pudieron guardar los cambios. Inténtalo de nuevo.' });
      } else {
        setMessage({ type: 'success', text: 'Fecha actualizada correctamente.' });
        setMode('list');
        setEditing(null);
        await loadDates();
      }
    } else {
      const { error } = await addImportantDate(input);
      if (error) {
        setMessage({ type: 'error', text: 'No se pudo guardar la fecha. Inténtalo de nuevo.' });
      } else {
        setMessage({ type: 'success', text: 'Fecha guardada correctamente.' });
        setMode('list');
        await loadDates();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (d: ImportantDate) => {
    if (!hasUserId) return;
    setDeletingId(d.id);
    setMessage(null);
    const { error } = await deleteImportantDate(d.id);
    if (error) {
      setMessage({ type: 'error', text: 'No se pudo eliminar la fecha. Inténtalo de nuevo.' });
    } else {
      setDates((prev) => prev.filter((x) => x.id !== d.id));
      setConfirmDelete(null);
      setMessage({ type: 'success', text: 'Fecha eliminada.' });
    }
    setDeletingId(null);
  };

  const startEdit = (d: ImportantDate) => {
    setEditing(d);
    setMode('edit');
    setMessage(null);
  };

  const closeForm = () => {
    setMode('list');
    setEditing(null);
    setMessage(null);
  };

  const formattedDate = (d: ImportantDate) => {
    const date = new Date(2000, d.month - 1, d.day);
    const monthName = date.toLocaleString('es-ES', { month: 'long' });
    return `${d.day} de ${monthName}${d.occurrence_type === 'unica' && d.year ? ` de ${d.year}` : ''}`;
  };

  return (
    <PastelCard variant="darker" className="border-2 border-cyan-500/40 p-0 overflow-hidden">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Mis Fechas Importantes
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[#00f2ff] text-[11px] font-bold font-mono-code">
                {dates.length}
              </span>
              {reminders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold font-mono-code border border-amber-300">
                  {reminders.length} muy pronto
                </span>
              )}
            </h3>
            <p className="text-[11px] font-mono-code text-slate-600">
              Guarda fechas señaladas y sus gustos para recibir recomendaciones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-code font-bold text-cyan-800 hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Gestionar'}
          </span>
          <div className="p-1 rounded-lg bg-sky-200 text-slate-800">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-5 border-t border-sky-300 bg-white/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {!hasUserId ? (
            <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
              Inicia sesión como consumidor para guardar tus fechas importantes.
            </p>
          ) : activeRecommendation ? (
            <OccasionRecommendations
              date={activeRecommendation}
              zone={zone}
              onBack={() => setActiveRecommendation(null)}
              onViewPlace={onViewPlace}
            />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <Loader2 className="w-5 h-5 text-cyan-800 animate-spin" />
              <span className="ml-2 text-xs font-mono-code">Cargando tus fechas...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reminder banner (a 7 días) */}
              {reminders.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-mono-code font-bold uppercase text-amber-800">
                      Recordatorio · ¡muy pronto!
                    </span>
                  </div>
                  <div className="space-y-2">
                    {reminders.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white border border-amber-200"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{d.name}</p>
                          <p className="text-xs font-mono-code text-slate-600">
                            Se celebra el {formattedDate(d)}{' '}
                            {nextOccurrence(d, new Date())
                              ? `(faltan 7 días)`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveRecommendation(d)}
                          className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shrink-0"
                        >
                          Ver recomendaciones para esta ocasión
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section header with Add button */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-800">
                  {mode === 'list' ? 'Tus fechas guardadas' : mode === 'add' ? 'Nueva fecha' : 'Editar fecha'}
                </h4>
                {mode === 'list' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('add');
                      setEditing(null);
                      setMessage(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0d665f] text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir fecha
                  </button>
                )}
              </div>

              {/* Add / Edit form */}
              {mode === 'add' && (
                <ImportantDateForm
                  key="add"
                  submitting={submitting}
                  error={message?.type === 'error' ? message.text : null}
                  onSubmit={handleSubmit}
                  onCancel={closeForm}
                />
              )}
              {mode === 'edit' && editing && (
                <ImportantDateForm
                  key={editing.id}
                  initial={inputToFormValues(editing)}
                  submitting={submitting}
                  error={message?.type === 'error' ? message.text : null}
                  onSubmit={handleSubmit}
                  onCancel={closeForm}
                />
              )}

              {/* List / empty state */}
              {mode === 'list' &&
                (dates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-sans-ui font-bold text-slate-800 mb-1">
                      No tienes fechas importantes guardadas todavía
                    </p>
                    <p className="text-xs font-mono-code text-slate-500 mb-3">
                      Añade una fecha (aniversario, cumpleaños, ocasiones especiales) con sus
                      gustos para recibir recomendaciones cuando se acerque.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('add');
                        setEditing(null);
                        setMessage(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0d665f] text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir fecha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {dates.map((d) => {
                      const labels = gustoLabels(d.gustos);
                      return (
                        <div
                          key={d.id}
                          className="p-4 rounded-xl bg-white border border-sky-300 shadow-sm hover:border-cyan-500 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-sm text-slate-900 truncate">{d.name}</h5>
                              <span className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-500 mt-0.5">
                                <CalendarHeart className="w-3.5 h-3.5 text-cyan-600" />
                                {formattedDate(d)}
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold uppercase border ${
                                    d.occurrence_type === 'anual'
                                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                      : 'bg-violet-50 text-violet-700 border-violet-200'
                                  }`}
                                >
                                  {d.occurrence_type === 'anual' ? 'Anual' : 'Única'}
                                </span>
                              </span>
                            </div>
                          </div>

                          {labels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3 mt-2">
                              {labels.map((l) => (
                                <span
                                  key={l}
                                  className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono-code font-bold text-slate-700 border border-slate-200"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            {isReminderDue(d, new Date()) && (
                              <button
                                type="button"
                                onClick={() => setActiveRecommendation(d)}
                                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Ver recomendaciones para esta ocasión"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Recomendaciones
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEdit(d)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-slate-900 text-[#00f2ff] text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Editar fecha"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(d)}
                              disabled={deletingId === d.id}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-mono-code font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Eliminar fecha"
                            >
                              {deletingId === d.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {/* Delete confirmation */}
              {confirmDelete && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-600 border border-rose-200">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-sm text-slate-900">
                        ¿Eliminar la fecha "{confirmDelete.name}"?
                      </h5>
                      <p className="text-xs font-mono-code text-slate-600 mt-0.5">
                        Se eliminará esta fecha y sus gustos asociados. Ya no generará
                        recordatorios ni recomendaciones. Esta acción no puede deshacerse.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleDelete.bind(null, confirmDelete)}
                          disabled={deletingId === confirmDelete.id}
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {deletingId === confirmDelete.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono-code font-bold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback message */}
              {message && mode === 'list' && (
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
        </div>
      )}
    </PastelCard>
  );
};
