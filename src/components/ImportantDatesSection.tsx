import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Bell,
  Calendar,
} from 'lucide-react';
import { PlaceResult } from './SearchBar';

interface ImportantDatesSectionProps {
  userId?: string;
  zone?: string;
  onViewPlace?: (placeId: string, place?: PlaceResult) => void;
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

/**
 * Fechas importantes del consumidor. Siempre abierto (sin desplegable), con la
 * estética de la parte de empresa. Conserva la lógica de listar, añadir, editar,
 * eliminar, recordatorios y recomendaciones por ocasión.
 */
export const ImportantDatesSection: React.FC<ImportantDatesSectionProps> = ({
  userId,
  zone,
  onViewPlace,
  autoOpen,
}) => {
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
    <section className="rounded-2xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
          <CalendarHeart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Mis Fechas Importantes
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              {dates.length}
            </span>
            {reminders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                {reminders.length} muy pronto
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            Guarda fechas señaladas y sus gustos para recibir recomendaciones
          </p>
        </div>
      </div>

      {!hasUserId ? (
        <p className="text-sm text-gray-400 italic py-3 text-center">
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
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          <span className="ml-2 text-sm">Cargando tus fechas...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Reminder banner (a 7 días) */}
          {reminders.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-semibold text-amber-800">
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
                      <p className="text-sm font-bold text-gray-900">{d.name}</p>
                      <p className="text-sm text-gray-600">
                        Se celebra el {formattedDate(d)}{' '}
                        {nextOccurrence(d, new Date()) ? '(faltan 7 días)' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRecommendation(d)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer shrink-0"
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
            <h4 className="text-sm font-semibold text-gray-800">
              {mode === 'list'
                ? 'Tus fechas guardadas'
                : mode === 'add'
                ? 'Nueva fecha'
                : 'Editar fecha'}
            </h4>
            {mode === 'list' && (
              <button
                type="button"
                onClick={() => {
                  setMode('add');
                  setEditing(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-800 mb-1">
                  No tienes fechas importantes guardadas todavía
                </p>
                <p className="text-sm text-gray-500 mb-3">
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
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer mx-auto"
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
                      className="p-4 rounded-xl bg-white border border-gray-200 hover:border-teal-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-sm text-gray-900 truncate">{d.name}</h5>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                            <CalendarHeart className="w-3.5 h-3.5 text-teal-600" />
                            {formattedDate(d)}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                d.occurrence_type === 'anual'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
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
                              className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100">
                        {isReminderDue(d, new Date()) && (
                          <button
                            type="button"
                            onClick={() => setActiveRecommendation(d)}
                            className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-medium text-sm cursor-pointer"
                            title="Ver recomendaciones para esta ocasión"
                          >
                            <Bell className="w-4 h-4" />
                            Recomendaciones
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(d)}
                          className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-medium text-sm cursor-pointer"
                          title="Editar fecha"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(d)}
                          disabled={deletingId === d.id}
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm cursor-pointer disabled:opacity-50"
                          title="Eliminar fecha"
                        >
                          {deletingId === d.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600 border border-red-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-gray-900">
                    ¿Eliminar la fecha "{confirmDelete.name}"?
                  </h5>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Se eliminará esta fecha y sus gustos asociados. Esta acción no puede deshacerse.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleDelete.bind(null, confirmDelete)}
                      disabled={deletingId === confirmDelete.id}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {deletingId === confirmDelete.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
              className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
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
        </div>
      )}
    </section>
  );
};
