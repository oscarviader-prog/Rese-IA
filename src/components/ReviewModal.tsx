import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, Bot, Send } from 'lucide-react';
import { NewReview } from '../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReview: (review: NewReview) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onAddReview,
}) => {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [botScore, setBotScore] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAnalyzeAndSubmit = () => {
    if (!comment.trim()) return;

    setIsAnalyzing(true);
    setBotScore(null);

    // Simulate AI Anti-Bot detection logic
    setTimeout(() => {
      // If repetitive keywords like "excelente producto mil estrellas" or ultra repetitive phrasing -> higher bot risk
      const isSuspect = comment.length < 15 || /excelente|maravilloso 100%|compre ya/i.test(comment);
      const calculatedBotRisk = isSuspect ? Math.floor(Math.random() * 40 + 55) : Math.floor(Math.random() * 8 + 2);
      
      setBotScore(calculatedBotRisk);
      setIsAnalyzing(false);

      setTimeout(() => {
        onAddReview({
          author: author.trim() || 'Usuario Anónimo',
          rating,
          comment: comment.trim(),
          date: 'Hace un momento',
        });
        setAuthor('');
        setComment('');
        setBotScore(null);
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#e2f1fc] text-slate-900 w-full max-w-lg rounded-2xl border-2 border-cyan-400 p-6 shadow-[0_0_30px_rgba(56,189,248,0.4)] relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-200 text-slate-700 hover:bg-sky-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-cyan-900/20 text-cyan-800 border border-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">
              Añadir nueva reseña
            </h3>
            <p className="text-xs font-mono-code text-slate-600">
              Análisis Anti-Bot en tiempo real por ReseñIA
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono-code font-bold text-slate-700 uppercase mb-1">
              Tu nombre o seudónimo
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ej: Lucía G."
              className="w-full bg-white text-slate-900 border border-sky-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code font-bold text-slate-700 uppercase mb-1">
              Puntuación
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-amber-500' : 'text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-xs font-mono-code font-bold text-slate-700">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-code font-bold text-slate-700 uppercase mb-1">
              Tu experiencia en La Tasca de Marea
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: El pulpo estaba muy sabroso y la vieja sancochada deliciosa. Sin embargo, tardaron 30 min en atender la mesa..."
              className="w-full bg-white text-slate-900 border border-sky-300 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* AI Analysis Feedback */}
          {isAnalyzing && (
            <div className="p-3 bg-cyan-900/10 rounded-xl border border-cyan-400 flex items-center gap-3 animate-pulse">
              <Bot className="w-5 h-5 text-cyan-700 animate-spin" />
              <span className="text-xs font-mono-code text-cyan-900 font-bold">
                Analizando sintaxis, patrones de lenguaje y vectores anti-bot...
              </span>
            </div>
          )}

          {botScore !== null && (
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              botScore > 30 ? 'bg-red-100 border-red-300 text-red-900' : 'bg-emerald-100 border-emerald-300 text-emerald-900'
            }`}>
              {botScore > 30 ? (
                <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              )}
              <div className="text-xs font-mono-code">
                <span className="font-bold">
                  Riesgo de Bot: {botScore}% — {botScore > 30 ? 'Riesgo moderado' : 'Legítimo (Alta confianza)'}
                </span>
                <p className="text-[11px] opacity-80">
                  Reseña procesada y ponderada en la nota real.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-sky-200 text-slate-700 hover:bg-sky-300 text-xs font-mono-code font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAnalyzeAndSubmit}
              disabled={isAnalyzing || !comment.trim()}
              className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Publicar y Analizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
