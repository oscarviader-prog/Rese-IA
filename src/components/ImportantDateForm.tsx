import React, { useState } from 'react';
import {
  X,
  Check,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  OCCASION_GUSTOS,
  isValidDayMonth,
  isValidYear,
} from '../lib/importantDates';

export interface ImportantDateFormValues {
  name: string;
  day: number | '';
  month: number | '';
  year: number | '';
  occurrenceType: 'anual' | 'unica';
  gustos: string[];
}

interface ImportantDateFormProps {
  initial?: ImportantDateFormValues | null;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: ImportantDateFormValues) => void;
  onCancel: () => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const defaultValues: ImportantDateFormValues = {
  name: '',
  day: '',
  month: '',
  year: '',
  occurrenceType: 'anual',
  gustos: [],
};

export const ImportantDateForm: React.FC<ImportantDateFormProps> = ({
  initial,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<ImportantDateFormValues>(initial ?? defaultValues);
  const [detailError, setDetailError] = useState<string | null>(null);

  const toggleGusto = (id: string) => {
    setValues((v) => ({
      ...v,
      gustos: v.gustos.includes(id) ? v.gustos.filter((g) => g !== id) : [...v.gustos, id],
    }));
  };

  const validateDetails = (): string | null => {
    const name = values.name.trim();
    if (!name) return 'Introduce un nombre para la fecha.';
    if (values.day === '' || values.month === '') {
      return 'Selecciona un día y un mes.';
    }
    if (!isValidDayMonth(Number(values.day), Number(values.month))) {
      return 'La fecha introducida no es válida (comprueba día y mes).';
    }
    if (values.occurrenceType === 'unica') {
      if (values.year === '' || !isValidYear(Number(values.year), 'unica')) {
        return 'Para una fecha única introduce un año válido.';
      }
    } else if (values.year !== '') {
      if (!isValidYear(Number(values.year), 'anual')) {
        return 'Para una fecha que se repite cada año no debe fijarse un año.';
      }
    }
    return null;
  };

  const goToGustos = () => {
    const err = validateDetails();
    if (err) {
      setDetailError(err);
      return;
    }
    setDetailError(null);
    setStep(2);
  };

  const submit = () => {
    onSubmit(values);
  };

  return (
    <div className="bg-white rounded-xl border border-sky-300 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-[#00f2ff]">
            <CalendarPlus className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-800">
            {initial ? 'Editar fecha' : 'Añadir fecha'}
          </h4>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-white">
        {[1, 2].map((s) => (
          <span
            key={s}
            className={`flex items-center gap-1.5 text-[11px] font-mono-code font-bold ${
              step >= s ? 'text-cyan-800' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                step > s
                  ? 'bg-cyan-700 text-white border-cyan-700'
                  : step === s
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-400'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {step > s ? <Check className="w-3 h-3" /> : s}
            </span>
            Paso {s}: {s === 1 ? 'Detalles' : 'Gustos'}
          </span>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                Nombre de la fecha *
              </label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                placeholder="Ej: Aniversario con Ana"
                className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-sm font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                  Día *
                </label>
                <select
                  value={values.day}
                  onChange={(e) => setValues((v) => ({ ...v, day: Number(e.target.value) as any }))}
                  className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                >
                  <option value="">—</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                  Mes *
                </label>
                <select
                  value={values.month}
                  onChange={(e) => setValues((v) => ({ ...v, month: Number(e.target.value) as any }))}
                  className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-xs font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                >
                  <option value="">—</option>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                Tipo de fecha
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-sky-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="occ"
                    checked={values.occurrenceType === 'anual'}
                    onChange={() => setValues((v) => ({ ...v, occurrenceType: 'anual' as const, year: '' }))}
                    className="accent-cyan-700"
                  />
                  <span className="text-xs font-sans-ui text-slate-800">
                    Se repite anualmente <span className="text-slate-400">(cada año en esta fecha)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-sky-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="occ"
                    checked={values.occurrenceType === 'unica'}
                    onChange={() => setValues((v) => ({ ...v, occurrenceType: 'unica' as const }))}
                    className="accent-cyan-700"
                  />
                  <span className="text-xs font-sans-ui text-slate-800">
                    Fecha única <span className="text-slate-400">(solo este año)</span>
                  </span>
                </label>
              </div>
            </div>

            {values.occurrenceType === 'unica' && (
              <div>
                <label className="block text-[10px] font-mono-code font-bold text-slate-600 uppercase mb-1">
                  Año *
                </label>
                <input
                  type="number"
                  min={1900}
                  max={2200}
                  value={values.year}
                  onChange={(e) => setValues((v) => ({ ...v, year: Number(e.target.value) as any }))}
                  placeholder="Ej: 2026"
                  className="w-full bg-slate-100 text-slate-900 border border-sky-300 rounded-lg p-2.5 text-sm font-sans-ui focus:ring-1 focus:ring-cyan-600 focus:outline-none placeholder-slate-400"
                />
              </div>
            )}

            {detailError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border text-xs font-sans-ui bg-rose-50 border-rose-200 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{detailError}</span>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={goToGustos}
                className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                Siguiente: seleccionar gustos
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-mono-code text-slate-600">
              ¿Qué gustos o ambiente se asocian a esta ocasión? (puedes elegir varios)
            </p>

            <div className="flex flex-wrap gap-2">
              {OCCASION_GUSTOS.map((g) => {
                const selected = values.gustos.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGusto(g.id)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-mono-code font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selected
                        ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {g.label}
                  </button>
                );
              })}
            </div>

            {values.gustos.length > 0 && (
              <p className="text-[11px] font-mono-code text-slate-500">
                {values.gustos.length} gusto{values.gustos.length === 1 ? '' : 's'} seleccionado
                {values.gustos.length === 1 ? '' : 's'}.
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl border text-xs font-sans-ui bg-rose-50 border-rose-200 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0d665f] disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {initial ? 'Guardar cambios' : 'Guardar fecha'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
