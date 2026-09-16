import React from 'react';
import { ViewState } from '../types';
import { PastelCard } from './PastelCard';
import { ShieldCheck, Star, ArrowRight, UserCheck, Building2, Sparkles, CheckCircle2 } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: ViewState) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 text-[#00f2ff] border border-[#00f2ff]/50 mb-8 shadow-[0_0_20px_rgba(0,242,255,0.3)] animate-pulse">
        <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
        <span className="text-xs font-mono-code font-bold tracking-widest uppercase">
          ANÁLISIS IA DE RESEÑAS
        </span>
      </div>

      {/* Main Hero Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold text-white tracking-tight leading-[1.05] mb-6">
        MILES DE RESEÑAS.
        <br />
        <span className="title-minimalist text-[#00f2ff] drop-shadow-[0_0_25px_rgba(0,242,255,0.6)]">
          UNA RESPUESTA.
        </span>
      </h1>

      {/* Hero Paragraph */}
      <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-sans-ui leading-relaxed mb-10">
        Analizamos y sintetizamos las reseñas para darte un veredicto claro: lo bueno, lo malo y lo intermedio. Sin tener que leer opiniones contradictorias.
      </p>

      {/* Tarjeta Central "VEREDICTO" */}
      <div className="w-full max-w-md mb-12">
        <PastelCard variant="accent" className="transform hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between border-b border-sky-300 pb-3 mb-4">
            <span className="text-xs font-mono-code font-bold tracking-widest text-slate-700 bg-sky-200 px-2.5 py-1 rounded-md">
              VEREDICTO
            </span>
            <div className="flex items-center gap-1 text-cyan-800 text-xs font-mono-code font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
              IA SYNTHESIZED
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 my-2">
            <span className="text-5xl font-display font-extrabold text-slate-900 tracking-tight">
              4.1
            </span>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <Star className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-xs font-mono-code text-slate-600 font-medium mt-1">
                1.284 reseñas analizadas
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sky-300/80 flex items-center justify-center gap-2 text-xs font-sans-ui text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Patrón de manipulación filtrado · 78% Índice de Confianza</span>
          </div>
        </PastelCard>
      </div>

      {/* Two Profile Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
        {/* Consumidor Card */}
        <PastelCard
          onClick={() => onNavigate('consumer')}
          className="border-2 border-cyan-500/80 hover:border-cyan-400 relative overflow-hidden group text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-900/20 text-cyan-800 border border-cyan-400/50">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-1 bg-cyan-200 text-cyan-900 rounded-md">
              Para usuarios
            </span>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2 group-hover:text-cyan-900 transition-colors">
            Soy consumidor
            <ArrowRight className="w-5 h-5 text-cyan-700 transition-transform group-hover:translate-x-1" />
          </h3>
          <p className="text-sm font-sans-ui text-slate-700 leading-snug">
            Quiero saber si vale la pena antes de ir con un análisis IA claro.
          </p>
        </PastelCard>

        {/* Empresa Card */}
        <PastelCard
          onClick={() => onNavigate('business')}
          className="border-2 border-purple-500/80 hover:border-purple-400 relative overflow-hidden group text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-900/20 text-purple-900 border border-purple-400/50">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-1 bg-purple-200 text-purple-950 rounded-md">
              Para negocios
            </span>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2 group-hover:text-purple-900 transition-colors">
            Soy empresa
            <ArrowRight className="w-5 h-5 text-purple-700 transition-transform group-hover:translate-x-1" />
          </h3>
          <p className="text-sm font-sans-ui text-slate-700 leading-snug">
            Quiero gestionar mi reputación online, automatizar respuestas y recibir alertas.
          </p>
        </PastelCard>
      </div>

      {/* Auth Call to Action Banner */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 border border-[#00f2ff]/40 p-4 sm:p-5 rounded-2xl max-w-xl w-full shadow-[0_0_20px_rgba(0,242,255,0.15)]">
        <div className="text-left flex-1">
          <h4 className="text-sm font-bold text-white font-mono-code">
            ¿Listo para empezar en ReseñIA?
          </h4>
          <p className="text-xs text-sky-200/80">
            Crea tu cuenta gratuita o accede a tu panel de control.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('login')}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-[#00f2ff] text-xs font-bold font-mono-code rounded-xl border border-[#00f2ff]/40 transition-all cursor-pointer"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="py-2 px-3.5 bg-[#0F766E] hover:bg-[#0d665f] text-white text-xs font-bold font-mono-code rounded-xl shadow-md transition-all cursor-pointer"
          >
            Crear cuenta
          </button>
        </div>
      </div>

    </div>
  );
};
