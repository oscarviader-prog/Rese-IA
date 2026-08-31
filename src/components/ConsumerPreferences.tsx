import React, { useState, useEffect, useCallback } from 'react';
import { PastelCard } from './PastelCard';
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

export const ConsumerPreferences: React.FC<ConsumerPreferencesProps> = ({
  userId,
  onPreferencesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <PastelCard variant="darker" className="border-2 border-cyan-500/40 p-0 overflow-hidden">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-200/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Mis Preferencias e Instrucciones
              {text ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono-code">
                  guardadas
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold font-mono-code">
                  sin preferencias
                </span>
              )}
            </h3>
            <p className="text-[11px] font-mono-code text-slate-600">
              Personaliza las recomendaciones del asistente de IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-code font-bold text-cyan-800 hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Gestionar'}
          </span>
          <div className="p-1 rounded-lg bg-sky-200 text-slate-800 text-xs font-bold">
            {isOpen ? '−' : '+'}
          </div>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-5 border-t border-sky-300 bg-white/90 animate-in slide-in-from-top-2 duration-200">
          {!hasUserId ? (
            <p className="text-xs font-mono-code text-slate-500 italic py-3 text-center">
              Inicia sesión como consumidor para guardar tus preferencias.
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <Loader2 className="w-5 h-5 text-cyan-800 animate-spin" />
              <span className="ml-2 text-xs font-mono-code">Cargando preferencias...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Empty state */}
              {!isEditing && !text && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Settings2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-sans-ui font-bold text-slate-800 mb-1">
                    Aún no has indicado preferencias
                  </p>
                  <p className="text-xs font-mono-code text-slate-500 mb-3">
                    Añade lo que te gusta y cómo prefieres tus experiencias para recibir
                    recomendaciones más ajustadas a ti.
                  </p>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Añadir preferencias
                  </button>
                </div>
              )}

              {/* Display view */}
              {!isEditing && text && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-mono-code font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Mis preferencias guardadas
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={startEdit}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
                        title="Editar preferencias"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!confirmDelete ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                          title="Eliminar preferencias"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono-code text-rose-600">¿Eliminar?</span>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono-code font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-mono-code transition-all cursor-pointer"
                          >
                            No
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-sans-ui text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {text}
                  </p>
                </div>
              )}

              {/* Edit view */}
              {isEditing && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                      Tus preferencias e instrucciones
                    </label>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Ej: Prefiero restaurantes tranquilos, no me gusta la comida picante, busco buena relación calidad-precio, suelo salir a cenar los fines de semana..."
                      rows={4}
                      maxLength={5000}
                      className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-3 text-sm font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !draft.trim()}
                      className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback message */}
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
        </div>
      )}
    </PastelCard>
  );
};
