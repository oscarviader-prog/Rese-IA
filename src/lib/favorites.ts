import { supabase } from './supabase';
import { PlaceResult } from '../components/SearchBar';

export interface ConsumerFavorite {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string;
  place_address: string;
  place_category: string;
  place_rating?: number | null;
  place_user_rating_count?: number | null;
  created_at?: string;
}

function placeResultToRow(place: PlaceResult) {
  return {
    place_id: place.id,
    place_name: place.displayName?.text ?? 'Establecimiento',
    place_address: place.formattedAddress ?? '',
    place_category: place.primaryTypeDisplayName?.text ?? 'Establecimiento',
    place_rating: place.rating ?? null,
    place_user_rating_count: place.userRatingCount ?? null,
  };
}

/**
 * Recupera los establecimientos favoritos del consumidor autenticado,
 * ordenados por fecha de adición (más recientes primero).
 * Se apoya en RLS (user_id = auth.uid()).
 */
export async function getConsumerFavorites(): Promise<{ data: ConsumerFavorite[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data ?? []) as ConsumerFavorite[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error al consultar favoritos' };
  }
}

/**
 * Añade un establecimiento a los favoritos del consumidor autenticado.
 * Usa upsert sobre (user_id, place_id) para evitar duplicados.
 */
export async function addConsumerFavorite(place: PlaceResult): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }

    const { error } = await supabase
      .from('consumer_favorites')
      .upsert(
        { user_id: userData.user.id, ...placeResultToRow(place) },
        { onConflict: 'user_id,place_id', ignoreDuplicates: true }
      );

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al añadir a favoritos' };
  }
}

/**
 * Elimina un establecimiento de los favoritos del consumidor autenticado.
 */
export async function removeConsumerFavorite(placeId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('consumer_favorites')
      .delete()
      .eq('place_id', placeId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al quitar de favoritos' };
  }
}

export async function isPlaceFavorite(placeId: string): Promise<{ data: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_favorites')
      .select('id')
      .eq('place_id', placeId)
      .maybeSingle();

    if (error) {
      return { data: false, error: error.message };
    }
    return { data: !!data, error: null };
  } catch (err) {
    return { data: false, error: err instanceof Error ? err.message : 'Error al consultar favorito' };
  }
}
