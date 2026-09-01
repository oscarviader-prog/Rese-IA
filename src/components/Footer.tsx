import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 text-center border-t border-sky-950/80 bg-black/80 backdrop-blur-sm relative z-10">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
        <p className="text-[11px] font-sans-ui text-slate-500">
          ReseñIA © {new Date().getFullYear()} — Plataforma de síntesis e índice de confianza anti-bots
        </p>
      </div>
    </footer>
  );
};
