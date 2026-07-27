import React, { useState } from 'react';
import { PastelCard } from './PastelCard';
import { LeadItem, CompetitorData } from '../types';
import {
  TrendingUp,
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Bot,
  UserCheck,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  MessageSquare,
  BarChart3,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export const BusinessView: React.FC = () => {
  // Activity report config state
  const [reportFrequency, setReportFrequency] = useState<'Semanal' | 'Quincenal' | 'Mensual'>('Semanal');
  const [reportEmail, setReportEmail] = useState('dueno@latascadelmarea.com');
  const [reportSaved, setReportSaved] = useState(false);
  const [showLastReport, setShowLastReport] = useState(false);

  // AI Response Agent state
  const [responseUsed, setResponseUsed] = useState(false);
  const [customResponseText, setCustomResponseText] = useState(
    'Hola Carlos, lamentamos profundamente el tiempo de espera de 45 min el pasado fin de semana. Estamos reforzando la cocina en horas punta para evitar que vuelva a suceder. Nos gustaría invitarte a regresar para ofrecerte la experiencia impecable que mereces. Atentamente, el equipo de La Tasca de Marea.'
  );

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>([
    {
      id: '1',
      contact: 'maria.garcia@gmail.com',
      type: 'Reserva',
      touchStep: 'Toque 2 de 3',
      currentStep: 2,
      totalSteps: 3,
    },
    {
      id: '2',
      contact: '+34 612 987 654',
      type: 'Oferta',
      touchStep: 'Toque 1 de 3',
      currentStep: 1,
      totalSteps: 3,
    },
    {
      id: '3',
      contact: 'carlos.m@hotmail.com',
      type: 'Consulta',
      touchStep: 'Toque 3 de 3',
      currentStep: 3,
      totalSteps: 3,
    },
  ]);

  // Competitor comparison table data
  const competitors: CompetitorData[] = [
    {
      name: 'El Rincón del Mar',
      isCurrent: false,
      rating: 4.5,
      reviewsCount: 980,
      trustScore: 85,
      trustColor: 'green',
    },
    {
      name: 'La Tasca de Marea [TÚ]',
      isCurrent: true,
      rating: 4.1,
      reviewsCount: 1284,
      trustScore: 78,
      trustColor: 'gold',
    },
    {
      name: 'Tasca Canaria',
      isCurrent: false,
      rating: 3.9,
      reviewsCount: 641,
      trustScore: 71,
      trustColor: 'brick',
    },
  ];

  const handleSaveReportConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSaved(true);
    setTimeout(() => setReportSaved(false), 3000);
  };

  const handleAdvanceLead = (id: string) => {
    setLeads(
      leads.map((lead) => {
        if (lead.id === id) {
          const nextStep = Math.min(lead.currentStep + 1, lead.totalSteps);
          return {
            ...lead,
            currentStep: nextStep,
            touchStep: `Toque ${nextStep} de ${lead.totalSteps}`,
          };
        }
        return lead;
      })
    );
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Tres KPIs mono */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <PastelCard variant="primary" className="border-cyan-400">
          <div className="text-[11px] font-mono-code font-bold uppercase text-slate-600 tracking-wider mb-1">
            NOTA MEDIA
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-slate-900">
              4.1
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 text-xs font-mono-code font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              ↑ tendencia al alza
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-slate-600 mt-2 block">
            Ponderada tras filtrado Anti-Bot
          </span>
        </PastelCard>

        {/* KPI 2 */}
        <PastelCard variant="primary" className="border-sky-300">
          <div className="text-[11px] font-mono-code font-bold uppercase text-slate-600 tracking-wider mb-1">
            NUEVAS ESTA SEMANA
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-slate-900">
              47
            </span>
            <span className="text-xs font-mono-code text-slate-600 font-bold">
              (reseñas)
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-slate-600 mt-2 block">
            Google (31) · TripAdvisor (16)
          </span>
        </PastelCard>

        {/* KPI 3 */}
        <PastelCard variant="accent" className="border-amber-400">
          <div className="text-[11px] font-mono-code font-bold uppercase text-slate-700 tracking-wider mb-1">
            SIN RESPONDER
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-amber-700">
              28%
            </span>
            <span className="text-xs font-mono-code font-bold text-slate-800 bg-amber-200 px-2 py-0.5 rounded">
              (13 reseñas)
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-amber-900 font-medium mt-2 block">
            Acción recomendada: usar Agente IA
          </span>
        </PastelCard>
      </div>

      {/* 2. Banner de alerta dorado */}
      <div className="p-4 rounded-xl bg-amber-100 border-2 border-amber-400 text-amber-950 shadow-md flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-mono-code font-bold text-amber-900 flex items-center gap-2">
            ⚠️ Alerta de tendencia: menciones de 'espera'
          </h4>
          <p className="text-xs font-sans-ui text-amber-900 mt-1 leading-relaxed">
            Las menciones sobre el tiempo de espera han aumentado <span className="font-bold">+40% este mes</span>. Se recomienda revisar la gestión de turnos y el flujo de atención.
          </p>
        </div>
      </div>

      {/* 3. Tarjeta "📊 Informe de actividad" */}
      <PastelCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-300 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              📊 Informe de actividad
            </h3>
            <span className="px-2.5 py-0.5 rounded bg-cyan-900 text-cyan-100 text-[10px] font-mono-code font-bold">
              SEMANAL
            </span>
          </div>
          <button
            onClick={() => setShowLastReport(!showLastReport)}
            className="text-xs font-mono-code text-cyan-800 hover:text-cyan-950 font-bold flex items-center gap-1"
          >
            Ver último {showLastReport ? '▲' : '▼'}
          </button>
        </div>

        {showLastReport && (
          <div className="mb-4 p-3 bg-white/90 rounded-xl border border-sky-300 text-xs font-mono-code text-slate-800 animate-in fade-in">
            <span className="font-bold block mb-1">Último informe (Semana 29):</span>
            • Puntuación media: 4.1 | 12 falsas detecciones aisladas | 89% tasa de respuesta recomendada.
          </div>
        )}

        <p className="text-xs font-sans-ui text-slate-700 mb-3">
          Programar envío automático del resumen ejecutivo a tu correo:
        </p>

        <form onSubmit={handleSaveReportConfig} className="flex flex-col sm:flex-row items-center gap-3">
          {/* Frequency Toggle */}
          <div className="flex rounded-xl bg-sky-200/90 p-1 border border-sky-300 w-full sm:w-auto">
            {(['Semanal', 'Quincenal', 'Mensual'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setReportFrequency(freq)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold transition-all ${
                  reportFrequency === freq
                    ? 'bg-cyan-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>

          {/* Email input */}
          <div className="relative w-full">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={reportEmail}
              onChange={(e) => setReportEmail(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2 border border-sky-300 focus:outline-none focus:border-cyan-600 font-mono-code"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-md flex-shrink-0"
          >
            Guardar
          </button>
        </form>

        {reportSaved && (
          <p className="text-xs font-mono-code text-emerald-800 font-bold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Configuración de informe guardada con éxito.
          </p>
        )}
      </PastelCard>

      {/* 4. Sentimiento — últimos 6 meses */}
      <PastelCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-display font-bold text-slate-900">
            Sentimiento — últimos 6 meses
          </h3>
          <div className="flex items-center gap-3 text-[11px] font-mono-code font-bold">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Positivo
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Neutro
            </span>
            <span className="flex items-center gap-1 text-red-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span> Negativo
            </span>
          </div>
        </div>

        {/* 3-Line / Bar Graph visualizer */}
        <div className="pt-2">
          <div className="h-32 w-full flex items-end justify-between gap-2 px-2 border-b border-sky-300 pb-2">
            {[
              { month: 'Feb', pos: 60, neu: 25, neg: 15 },
              { month: 'Mar', pos: 65, neu: 20, neg: 15 },
              { month: 'Abr', pos: 55, neu: 25, neg: 20 },
              { month: 'May', pos: 70, neu: 18, neg: 12 },
              { month: 'Jun', pos: 75, neu: 15, neg: 10 },
              { month: 'Jul', pos: 78, neu: 12, neg: 10 },
            ].map((m, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end gap-1">
                <div className="w-full max-w-[32px] h-full flex flex-col justify-end gap-0.5">
                  <div
                    className="bg-emerald-600 rounded-t-sm w-full transition-all"
                    style={{ height: `${m.pos * 0.9}%` }}
                    title={`Positivo: ${m.pos}%`}
                  ></div>
                  <div
                    className="bg-amber-500 w-full transition-all"
                    style={{ height: `${m.neu * 0.9}%` }}
                    title={`Neutro: ${m.neu}%`}
                  ></div>
                  <div
                    className="bg-red-700 rounded-b-sm w-full transition-all"
                    style={{ height: `${m.neg * 0.9}%` }}
                    title={`Negativo: ${m.neg}%`}
                  ></div>
                </div>
                <span className="text-[10px] font-mono-code text-slate-700 font-bold">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PastelCard>

      {/* 5. Badge "🛡️ Índice de Confianza · FILTRO ACTIVO · 78/100 · ⚠ 12% patrón bot detectado" */}
      <div className="p-3.5 rounded-xl bg-cyan-950 text-cyan-200 border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono-code font-bold">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>🛡️ ÍNDICE DE CONFIANZA · FILTRO ACTIVO</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-code">
          <span className="px-2.5 py-1 rounded bg-cyan-800 text-cyan-100 font-bold">
            78 / 100
          </span>
          <span className="text-amber-300 font-bold">
            ⚠ 12% patrón bot detectado
          </span>
        </div>
      </div>

      {/* 6. Tarjeta "Agente de respuesta" */}
      <PastelCard variant="accent" className="border-cyan-400">
        <div className="flex items-center justify-between border-b border-sky-300 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-800" />
            <h3 className="text-base font-display font-bold text-slate-900">
              Agente de respuesta IA
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-xs font-mono-code font-bold">
            1 reseña pendiente
          </span>
        </div>

        {/* Reseña pendiente */}
        <div className="p-3.5 rounded-xl bg-white/90 border border-sky-300 mb-4 text-xs font-sans-ui text-slate-900">
          <div className="flex items-center justify-between mb-1.5 font-mono-code text-[11px]">
            <span className="font-bold text-slate-800">Carlos M. · Hace 3 días</span>
            <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Google</span>
          </div>
          <p className="text-slate-800 italic">
            "Llegamos a las 14:30 y tardaron 45 minutos en tomar nota. La comida buena, pero la organización nefasta."
          </p>
        </div>

        {/* Bloque teal de respuesta autogenerada */}
        <div className="p-4 rounded-xl bg-cyan-900 text-white border border-cyan-500 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-800 text-cyan-200">
              Respuesta propia · GENERADA AUTOMÁTICAMENTE
            </span>
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </div>

          <textarea
            rows={3}
            value={customResponseText}
            onChange={(e) => setCustomResponseText(e.target.value)}
            className="w-full bg-cyan-950/80 text-cyan-100 border border-cyan-600 rounded-lg p-2.5 text-xs font-sans-ui focus:outline-none focus:border-cyan-300 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono-code text-cyan-300">
              Firmado: La Tasca de Marea
            </span>
            <button
              onClick={() => {
                setResponseUsed(true);
                setTimeout(() => setResponseUsed(false), 3000);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-mono-code text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              {responseUsed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" /> ¡Enviada / Copiada!
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Usar respuesta
                </>
              )}
            </button>
          </div>
        </div>
      </PastelCard>

      {/* 7. Tarjeta "🎯 Leads en preventa" */}
      <PastelCard>
        <div className="flex items-center justify-between border-b border-sky-300 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-display font-bold text-slate-900">
              🎯 Leads en preventa
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100 text-xs font-mono-code font-bold">
              3
            </span>
          </div>
          <span className="text-xs font-mono-code text-slate-600 uppercase font-bold">
            SECUENCIA DE CONTACTO
          </span>
        </div>

        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="p-3.5 rounded-xl bg-white/90 border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 text-cyan-800">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-code font-bold text-slate-900">
                      {lead.contact}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-200 text-cyan-900">
                      {lead.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-code text-slate-500">
                    {lead.touchStep}
                  </span>
                </div>
              </div>

              {/* Progress Dots & Action Button */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center gap-1">
                  {Array.from({ length: lead.totalSteps }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i < lead.currentStep ? 'bg-cyan-700' : 'bg-slate-300'
                      }`}
                    ></span>
                  ))}
                </div>

                <button
                  onClick={() => handleAdvanceLead(lead.id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-mono-code font-bold transition-all shadow-sm"
                >
                  Pasar a venta →
                </button>
              </div>
            </div>
          ))}
        </div>
      </PastelCard>

      {/* 8. Tarjeta "Comparativa de sector" */}
      <PastelCard>
        <h3 className="text-base font-display font-bold text-slate-900 mb-4">
          Comparativa de sector (Las Palmas)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sky-300 text-[11px] font-mono-code font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Negocio</th>
                <th className="py-2.5 px-3">Nota</th>
                <th className="py-2.5 px-3">Reseñas</th>
                <th className="py-2.5 px-3">Confianza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-200 text-xs font-sans-ui text-slate-800">
              {competitors.map((comp, idx) => (
                <tr
                  key={idx}
                  className={
                    comp.isCurrent
                      ? 'bg-amber-100/90 font-bold border-l-4 border-l-amber-500'
                      : 'hover:bg-white/60'
                  }
                >
                  <td className="py-3 px-3 font-mono-code text-slate-900">
                    {comp.name}
                  </td>
                  <td className="py-3 px-3 font-mono-code font-bold">
                    {comp.rating} ★
                  </td>
                  <td className="py-3 px-3 font-mono-code text-slate-700">
                    {comp.reviewsCount}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-mono-code font-bold text-[11px] ${
                        comp.trustColor === 'green'
                          ? 'bg-emerald-200 text-emerald-950'
                          : comp.trustColor === 'gold'
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-red-200 text-red-950'
                      }`}
                    >
                      {comp.trustScore} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PastelCard>
    </div>
  );
};
