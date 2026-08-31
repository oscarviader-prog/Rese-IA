import { supabase } from './supabase';

export interface ConsumerPreferences {
  id?: string;
  user_id?: string;
  text: string;
  updated_at?: string;
}

/**
 * Recupera las preferencias del consumidor autenticado.
 * Devuelve null si el usuario no tiene preferencias guardadas.
 * Se apoya en RLS (user_id = auth.uid()).
 */
export async function getConsumerPreferences(): Promise<{ data: ConsumerPreferences | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_preferences')
      .select('id, user_id, text, updated_at')
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data ? (data as ConsumerPreferences) : null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error al consultar preferencias' };
  }
}

/**
 * Guarda las preferencias del consumidor autenticado (insert si no existen,
 * update si ya existen), mediante upsert sobre user_id.
 */
export async function saveConsumerPreferences(text: string): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }

    const { error } = await supabase
      .from('consumer_preferences')
      .upsert(
        { user_id: userData.user.id, text },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al guardar preferencias' };
  }
}

/**
 * Elimina las preferencias del consumidor autenticado.
 */
export async function deleteConsumerPreferences(): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }

    const { error } = await supabase
      .from('consumer_preferences')
      .delete()
      .eq('user_id', userData.user.id);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar preferencias' };
  }
}
