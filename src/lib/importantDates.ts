import { supabase } from './supabase';

/**
 * Fecha importante del consumidor.
 *
 * - `occurrence_type: 'anual'` -> se repite cada año (año/mes/día sin año). `year` queda null.
 * - `occurrence_type: 'unica'` -> una sola vez en un año concreto (`year` obligatorio).
 *
 * `gustos` es un array de identificadores de la lista controlada `OCCASION_GUSTOS`.
 */
export interface ImportantDate {
  id: string;
  user_id: string;
  name: string;
  day: number;
  month: number;
  year: number | null;
  occurrence_type: 'anual' | 'unica';
  gustos: string[];
  created_at?: string;
  updated_at?: string;
}

export type ImportantDateInput = Omit<ImportantDate, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Categoría / gusto asociable a una ocasión.
 *
 * `keywords` se usan para buscar establecimientos reales y para ponderar la
 * afinidad contra los datos reales disponibles (nombre / categoría de Google).
 * NO son atributos inventados: solo sirven como términos de búsqueda y de
 * coincidencia sobre datos reales devueltos por la API de Google Places.
 */
export interface OccasionGusto {
  id: string;
  label: string;
  keywords: string[];
}

/**
 * Lista controlada de categorías/gustos para una ocasión.
 *
 * No existe en el proyecto un sistema reutilizable de categorías de gustos del
 * consumidor (las categorías actuales son los `primaryTypeDisplayName` de
 * Google Places, por establecimiento). Se define aquí una lista controlada y
 * documentada apropiada para esta funcionalidad.
 */
export const OCCASION_GUSTOS: OccasionGusto[] = [
  { id: 'italiana', label: 'Cocina italiana', keywords: ['italiano', 'italiana', 'pizza', 'trattoria', 'pasta'] },
  { id: 'espanola', label: 'Cocina española', keywords: ['español', 'española', 'tapas', 'paella'] },
  { id: 'japonesa', label: 'Cocina japonesa / sushi', keywords: ['japonés', 'japonesa', 'sushi', 'ramen'] },
  { id: 'mariscos', label: 'Mariscos', keywords: ['marisco', 'mariscos', 'pesca', 'pescado'] },
  { id: 'hamburguesas', label: 'Hamburguesas', keywords: ['hamburguesa', 'hamburguesería', 'burger'] },
  { id: 'pizza', label: 'Pizza', keywords: ['pizza', 'pizzería'] },
  { id: 'romantico', label: 'Ambiente romántico', keywords: ['romántico', 'romantico', 'elegante', 'vinos', 'candela'] },
  { id: 'terraza', label: 'Terraza', keywords: ['terraza', 'azotea'] },
  { id: 'precio-alto', label: 'Precio medio-alto', keywords: ['gourmet', 'alta cocina', 'fusión'] },
  { id: 'cafeteria', label: 'Cafetería / postres', keywords: ['cafetería', 'cafeteria', 'pastelería', 'dulces'] },
  { id: 'vegano', label: 'Opciones veganas', keywords: ['vegano', 'vegana', 'vegetariano', 'vegetariana'] },
  { id: 'brunch', label: 'Brunch', keywords: ['brunch', 'desayuno', 'toast'] },
];

export const gustoById = (id: string): OccasionGusto | undefined =>
  OCCASION_GUSTOS.find((g) => g.id === id);

export const gustoLabels = (ids: string[]): string[] =>
  ids.map((id) => gustoById(id)?.label).filter((x): x is string => Boolean(x));

export const isValidGustoId = (id: string): boolean => OCCASION_GUSTOS.some((g) => g.id === id);

// ---- Validación de fechas ----

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Valida que el par (día, mes) exista en el calendario. */
export function isValidDayMonth(day: number, month: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= DAYS_IN_MONTH[month - 1];
}

/** Valida un año razonable (>= 1900 y <= 2200). */
export function isValidYear(year: number | null, occurrenceType: 'anual' | 'unica'): boolean {
  if (occurrenceType === 'anual') return year == null || year === 0;
  return typeof year === 'number' && Number.isInteger(year) && year >= 1900 && year <= 2200;
}

/**
 * Devuelve la próxima fecha de celebración de una fecha importante a partir
 * de "hoy", teniendo en cuenta:
 *  - anual: se repite cada año (incluye salto de año y meses de distinta duración);
 *  - única: el año está fijado (si ya pasó, no hay próxima).
 */
export function nextOccurrence(d: Pick<ImportantDate, 'day' | 'month' | 'year' | 'occurrence_type'>, today: Date): Date | null {
  const day = d.day;
  const month = d.month;
  if (d.occurrence_type === 'unica') {
    if (d.year == null) return null;
    const dt = new Date(d.year, month - 1, day);
    if (isNaN(dt.getTime())) return null;
    return dt >= todayStart(today) ? dt : null;
  }
  // anual
  const thisYear = today.getFullYear();
  let candidate = new Date(thisYear, month - 1, day);
  // 29 de febrero en año no bisiesto -> se considera 28 de febrero
  if (candidate.getMonth() !== month - 1) {
    candidate = new Date(thisYear, month - 1, 28);
  }
  if (candidate < todayStart(today)) {
    const nextYear = thisYear + 1;
    candidate = new Date(nextYear, month - 1, day);
    if (candidate.getMonth() !== month - 1) {
      candidate = new Date(nextYear, month - 1, 28);
    }
  }
  return candidate;
}

function todayStart(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/** Dias de diferencia en días naturales entre dos fechas (solo fecha, sin hora). */
export function daysUntil(fromStart: Date, toDate: Date): number {
  const a = todayStart(fromStart).getTime();
  const b = todayStart(toDate).getTime();
  return Math.round((b - a) / 86400000);
}

/** Dice si una fecha está "a 7 días" de su próxima celebración (exactamente 7). */
export function isReminderDue(d: ImportantDate, today: Date): boolean {
  const next = nextOccurrence(d, today);
  if (!next) return false;
  return daysUntil(today, next) === 7;
}

// ---- CRUD (RLS: user_id = auth.uid()) ----

export async function getConsumerImportantDates(): Promise<{ data: ImportantDate[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_important_dates')
      .select('*')
      .order('month', { ascending: true })
      .order('day', { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as ImportantDate[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error al consultar tus fechas' };
  }
}

export async function addImportantDate(input: ImportantDateInput): Promise<{ data: ImportantDate | null; error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { data: null, error: 'No hay sesión de usuario autenticada.' };
    }
    const { data, error } = await supabase
      .from('consumer_important_dates')
      .insert({ user_id: userData.user.id, ...input })
      .select('*')
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ImportantDate, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error al guardar la fecha' };
  }
}

export async function updateImportantDate(id: string, input: ImportantDateInput): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('consumer_important_dates')
      .update({ ...input })
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar la fecha' };
  }
}

export async function deleteImportantDate(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('consumer_important_dates')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar la fecha' };
  }
}

// ---- Recomendaciones para una ocasión ----

/**
 * Resultado de una recomendación para una ocasión.
 * Basado únicamente en datos reales devueltos por Google Places (search-places).
 */
export interface OccasionRecommendation {
  placeId: string;
  name: string;
  address?: string;
  category?: string;
  rating?: number;
  userRatingCount?: number;
  /** Nº de gustos de la ocasión que coinciden con los datos reales del lugar. */
  affinity: number;
  /** Nº total de gustos de la ocasión. */
  totalGustos: number;
  /** Momentos/atributos de la ocasión que coinciden (etiquetas). */
  matchedGustos: string[];
  /** Explicación honesta del motivo. */
  reason: string;
  /** Razon de escala de proximidad al perfil con los datos disponibles. */
  score: number;
}

/** Construye el término de búsqueda combinando los gustos seleccionados + zona. */
export function buildOccasionSearchQuery(gustoIds: string[], zone?: string): string {
  const terms: string[] = [];
  for (const id of gustoIds) {
    const g = gustoById(id);
    if (g) terms.push(g.label);
  }
  if (zone) terms.push(zone);
  return terms.join(' ');
}

/** Devuelve los gustos de la ocasión que coinciden con datos reales de un lugar. */
function matchGustos(gustoIds: string[], text: string): { matched: string[]; labels: string[] } {
  const haystack = text.toLowerCase();
  const matched: string[] = [];
  const labels: string[] = [];
  for (const id of gustoIds) {
    const g = gustoById(id);
    if (!g) continue;
    const hit = g.keywords.some((k) => haystack.includes(k.toLowerCase()));
    if (hit) {
      matched.push(id);
      labels.push(g.label);
    }
  }
  return { matched, labels };
}

export interface RecommendParams {
  gustoIds: string[];
  zone?: string;
  preferredRating?: number;
}

/**
 * Busca establecimientos reales en la zona del consumidor y los ordena por
 * afinidad con los gustos de la ocasión (coincidencia sobre datos reales) y
 * por su rating de Google.
 *
 * No inventa establecimientos ni puntuaciones: usa el resultado real de la
 * Edge Function `search-places`. Si no hay suficientes coincidencias, devuelve
 * solo los resultados reales válidos (pueden ser menos de 3).
 */
export async function getOccasionRecommendations(
  params: RecommendParams
): Promise<{ data: OccasionRecommendation[]; error: string | null; searched: boolean }> {
  const searchQuery = buildOccasionSearchQuery(params.gustoIds, params.zone).trim();
  if (!searchQuery) {
    return { data: [], error: 'No hay gustos para buscar recomendaciones.', searched: false };
  }

  try {
    const res = await supabase.functions.invoke('search-places', {
      body: { query: searchQuery },
    });

    if (res.error) {
      return { data: [], error: 'No se pudieron obtener recomendaciones. Inténtalo de nuevo.', searched: true };
    }

    const raw = res.data;
    const places: Array<Record<string, any>> = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.places)
      ? (raw as any).places
      : [];

    const recommendations: OccasionRecommendation[] = places
      .map((p) => {
        const name: string = p?.displayName?.text ?? p?.name ?? '';
        const category: string = p?.primaryTypeDisplayName?.text ?? p?.primaryType ?? '';
        const address: string = p?.formattedAddress ?? '';
        const rating: number | undefined =
          typeof p?.rating === 'number' ? p.rating : undefined;
        const count: number | undefined =
          typeof p?.userRatingCount === 'number' ? p.userRatingCount : undefined;
        const searchText = `${name} ${category} ${address}`;

        const { matched, labels } = matchGustos(params.gustoIds, searchText);
        const totalGustos = params.gustoIds.length;

        if (matched.length === 0) return null;

        let affinity = matched.length / totalGustos;
        if (typeof rating === 'number' && rating > 0) {
          affinity += rating / 100;
        }
        const score = affinity;

        return {
          placeId: p?.id ?? '',
          name,
          address,
          category,
          rating,
          userRatingCount: count,
          affinity: matched.length,
          totalGustos,
          matchedGustos: labels,
          reason: labels.length
            ? `Te lo recomendamos porque coincide con: ${labels.join(', ')} (según la categoría e información real disponible en Google).`
            : '',
          score,
        };
      })
      .filter((r): r is Exclude<typeof r, null> => r !== null && r.name.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { data: recommendations, error: null, searched: true };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error al buscar recomendaciones', searched: true };
  }
}
