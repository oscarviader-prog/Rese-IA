import React, { useState, useEffect, useCallback } from 'react';
import {
  getConsumerPreferences,
  saveConsumerPreferences,
  deleteConsumerPreferences,
} from '../lib/preferences';
import {
  Save,
  Loader2,
  CheckCircle2,
  Trash2,
  Pencil,
  Settings2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface ConsumerPreferencesProps {
  userId?: string;
  onPreferencesChange?: (text: string | null) => void;
}

/**
 * Preferencias e instrucciones del consumidor. Siembre abierto (sin desplegable),
 * con la estética de la parte de empresa (tarjeta blanca, títulos gris oscuro,
 * acentos teal). Conserva toda la lógica de guardar/editar/eliminar.
 */
export const ConsumerPreferences: React.FC<ConsumerPreferencesProps> = ({
  userId,
  onPreferencesChange,
}) => {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasUserId = !!userId;

  const loadPreferences = useCallback(async () => {
    if (!hasUserId) {
      setText('');
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const { data, error } = await getConsumerPreferences();
    if (error) {
      setMessage({ type: 'error', text: 'No se pudieron cargar tus preferencias.' });
    } else {
      setText(data?.text ?? '');
      setDraft(data?.text ?? '');
      onPreferencesChange?.(data?.text ?? null);
    }
    setIsLoading(false);
  }, [hasUserId, onPreferencesChange]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    if (!hasUserId) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Escribe alguna preferencia antes de guardar.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    const { error } = await saveConsumerPreferences(trimmed);
    if (error) {
      setMessage({ type: 'error', text: 'No se pudieron guardar las preferencias. Inténtalo de nuevo.' });
    } else {
      setText(trimmed);
      setDraft(trimmed);
      setIsEditing(false);
      onPreferencesChange?.(trimmed);
      setMessage({ type: 'success', text: 'Preferencias guardadas correctamente.' });
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!hasUserId) return;
    setIsDeleting(true);
    setMessage(null);
    const { error } = await deleteConsumerPreferences();
    if (error) {
      setMessage({ type: 'error', text: 'No se pudieron eliminar las preferencias. Inténtalo de nuevo.' });
    } else {
      setText('');
      setDraft('');
      setIsEditing(false);
      setConfirmDelete(false);
      onPreferencesChange?.(null);
      setMessage({ type: 'success', text: 'Preferencias eliminadas.' });
    }
    setIsDeleting(false);
  };

  const startEdit = () => {
    setDraft(text);
    setIsEditing(true);
    setMessage(null);
  };

  const cancelEdit = () => {
    setDraft(text);
    setIsEditing(false);
    setMessage(null);
    setConfirmDelete(false);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Mis Preferencias e Instrucciones
            {text ? (
              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold">
                guardadas
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                sin preferencias
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            Personaliza las recomendaciones del asistente de IA
          </p>
        </div>
      </div>

      {/* Content */}
      {!hasUserId ? (
        <p className="text-sm text-gray-400 italic py-3 text-center">
          Inicia sesión como consumidor para guardar tus preferencias.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          <span className="ml-2 text-sm">Cargando preferencias...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Empty state */}
          {!isEditing && !text && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800 mb-1">
                Aún no has indicado preferencias
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Añade lo que te gusta y cómo prefieres tus experiencias para recibir
                recomendaciones más ajustadas a ti.
              </p>
              <button
                type="button"
                onClick={startEdit}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Añadir preferencias
              </button>
            </div>
          )}

          {/* Display view */}
          {!isEditing && text && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Mis preferencias guardadas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startEdit}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-white transition-all cursor-pointer"
                    title="Editar preferencias"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 transition-all cursor-pointer"
                      title="Eliminar preferencias"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-red-600">¿Eliminar?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium transition-all cursor-pointer"
                      >
                        No
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {text}
              </p>
            </div>
          )}

          {/* Edit view */}
          {isEditing && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tus preferencias e instrucciones
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ej: Prefiero restaurantes tranquilos, no me gusta la comida picante, busco buena relación calidad-precio, suelo salir a cenar los fines de semana..."
                  rows={4}
                  maxLength={5000}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !draft.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Feedback message */}
          {message && (
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
