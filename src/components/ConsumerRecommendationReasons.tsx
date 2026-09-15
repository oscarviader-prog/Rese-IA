import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Star,
  BookmarkCheck,
  Settings2,
  Building2,
  LucideIcon,
} from 'lucide-react';
import { BusinessCategory } from '../lib/categories';
import { PlaceResult } from './SearchBar';
import { GooglePlaceDetails } from './PlaceDetailModal';
import { isPlaceFavorite } from '../lib/favorites';
import { getConsumerPreferences } from '../lib/preferences';

/**
 * “¿Por qué ReseñIA me recomienda este establecimiento?”
 *
 * Sección informativa de la ficha del consumidor que explica, con datos reales
 * ya disponibles, por qué un establecimiento puede encajar con el usuario.
 *
 * REGLAS DE HONESTIDAD:
 * - Solo se muestran factores respaldados por datos reales (Google Places,
 *   favoritos y preferencias del perfil). Nunca porcentajes ni coincidencias
 *   cuantificadas inventadas.
 * - Si un factor no tiene datos disponibles para este establecimiento, no se
 *   renderiza (regla: "si algún dato no está disponible, no muestres ese factor").
 * - La "Nota Real" de análisis de reseñas NO se muestra: todavía es maqueta y
 *   no debe presentarse como una valoración real.
 * - Preferencias: se indica de forma literalmente cierta que ReseñIA las usa en
 *   sus recomendaciones (asistente de consumidor), SIN afirmar que este
 *   establecimiento concreto "coincide" con ellas.
 */

interface ConsumerRecommendationReasonsProps {
  place: PlaceResult;
  category: BusinessCategory;
  details: GooglePlaceDetails | null;
  isConsumerAuthed: boolean;
}

interface ReasonFactor {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}

export const ConsumerRecommendationReasons: React.FC<ConsumerRecommendationReasonsProps> = ({
  place,
  category,
  details,
  isConsumerAuthed,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);

  // Estado de favorito del establecimiento (solo con sesión de consumidor).
  useEffect(() => {
    let active = true;
    setIsFavorite(false);
    if (!isConsumerAuthed || !place?.id) return;
    (async () => {
      const { data, error } = await isPlaceFavorite(place.id);
      if (!active || error) return;
      setIsFavorite(data);
    })();
    return () => {
      active = false;
    };
  }, [isConsumerAuthed, place?.id]);

  // Preferencias del perfil (no dependen del establecimiento, se cargan una vez).
  useEffect(() => {
    let active = true;
    setHasPreferences(false);
    if (!isConsumerAuthed) return;
    (async () => {
      const { data, error } = await getConsumerPreferences();
      if (!active || error) return;
      setHasPreferences(!!data?.text?.trim());
    })();
    return () => {
      active = false;
    };
  }, [isConsumerAuthed]);

  const rating = details?.rating ?? place?.rating;
  const ratingCount = details?.userRatingCount ?? place?.userRatingCount;

  const factors: ReasonFactor[] = [];

  // Categoría real del establecimiento (tipos de Google Places). La categoría
  // genérica no aporta explicación, así que se omite para no añadir ruido.
  if (category.id !== 'generico') {
    factors.push({
      id: 'categoria',
      icon: Building2,
      title: 'Tipo de establecimiento',
      detail: `Es un establecimiento de tipo ${category.label}, reconocido a partir de los datos reales de Google Places.`,
    });
  }

  // Valoración y nº de reseñas reales de Google. Se etiqueta como dato de
  // Google para no confundirlo nunca con un cálculo propio de ReseñIA.
  if (typeof rating === 'number') {
    const countText =
      ratingCount == null
        ? ''
        : ratingCount === 0
        ? ' · sin reseñas todavía'
        : ` · ${ratingCount.toLocaleString('es-ES')} reseñas`;
    factors.push({
      id: 'rating',
      icon: Star,
      title: 'Valoración en Google',
      detail: `Tiene una valoración media de ${rating} sobre 5 en Google Places${countText}.`,
    });
  }

  // Está en los favoritos del consumidor (dato real del perfil).
  if (isConsumerAuthed && isFavorite) {
    factors.push({
      id: 'favorito',
      icon: BookmarkCheck,
      title: 'Ya estaba en tus favoritos',
      detail: 'Lo guardaste en tu lista de favoritos, así que ya era de tu interés.',
    });
  }

  // Preferencias guardadas: afirmación literalmente cierta (el asistente de
  // consumidor las inyecta en sus recomendaciones), sin inventar coincidencias.
  if (isConsumerAuthed && hasPreferences) {
    factors.push({
      id: 'preferencias',
      icon: Settings2,
      title: 'Tienes preferencias guardadas',
      detail: 'ReseñIA las aplica en sus recomendaciones personalizadas (asistente de consumidor) y las tiene en cuenta al valorar este perfil.',
    });
  }

  return (
    <div className="mt-5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-white border border-teal-100 p-5">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="p-2 rounded-lg bg-teal-600 text-white shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 leading-tight">
            ¿Por qué ReseñIA te recomienda este establecimiento?
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Encaje explicado con datos reales de Google Places y de tu perfil. Sin porcentajes inventados.
          </p>
        </div>
      </div>

      {factors.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Todavía no hay suficientes datos reales disponibles para explicar con precisión por qué encaja este establecimiento contigo.
        </p>
      ) : (
        <ul className="space-y-2">
          {factors.map((factor) => {
            const Icon = factor.icon;
            return (
              <li
                key={factor.id}
                className="flex items-start gap-2.5 rounded-xl bg-white/80 border border-teal-100 p-3"
              >
                <Icon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block">
                    {factor.title}
                  </span>
                  <span className="text-sm text-gray-600 leading-relaxed block">
                    {factor.detail}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-gray-400 mt-3">
        Fuentes: ficha real de Google Places (valoración, reseñas y tipo) y perfil del consumidor (favoritos y preferencias). ReseñIA no inventa puntuaciones.
      </p>
    </div>
  );
};