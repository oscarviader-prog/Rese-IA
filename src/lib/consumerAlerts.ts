import { supabase } from './supabase';

// Tipo de alerta del consumidor
export type ConsumerAlertType = 'important_date_reminder' | 'favorite_news';

// Canales permitidos
export type AlertChannel = 'email' | 'in_app';

// Frecuencias permitidas
export type AlertFrequency = 'immediate' | 'daily' | 'weekly';

/**
 * Catálogo de alertas disponibles para el consumidor, con su estado por defecto.
 *
 * `hasRealEventSource`: indica si hoy existe un evento real en la aplicación que
 * dispare esta alerta. Si es `false`, la configuración queda lista para su uso
 * pero la integración real sigue pendiente (no se generan eventos falsos).
 */
export interface ConsumerAlertDefinition {
  type: ConsumerAlertType;
  label: string;
  description: string;
  defaultEnabled: boolean;
  defaultChannels: AlertChannel[];
  defaultFrequency: AlertFrequency;
  hasRealEventSource: boolean;
}

export const CONSUMER_ALERTS: ConsumerAlertDefinition[] = [
  {
    type: 'important_date_reminder',
    label: 'Recordatorio de fechas importantes',
    description:
      'Te avisamos cuando se acerca una de tus fechas importantes (a 7 días de la celebración).',
    defaultEnabled: true,
    defaultChannels: ['in_app'],
    defaultFrequency: 'immediate',
    // Fuente real: el recordatorio a 7 días de "Mis Fechas Importantes" existe en la app.
    hasRealEventSource: true,
  },
  {
    type: 'favorite_news',
    label: 'Novedades de tus favoritos',
    description:
      'Te avisamos cuando aparezca una novedad u oferta relacionada con uno de tus establecimientos favoritos.',
    defaultEnabled: true,
    defaultChannels: ['in_app'],
    defaultFrequency: 'immediate',
    // Pendiente de integración: no existe aún una fuente real de "ofertas/novedades"
    // por favorito (no hay tabla de ofertas ni feed de novedades). La configuración
    // queda preparada; la integración con un evento real se conectará cuando exista.
    hasRealEventSource: false,
  },
];

export const alertDefByType = (type: ConsumerAlertType): ConsumerAlertDefinition | undefined =>
  CONSUMER_ALERTS.find((a) => a.type === type);

export const isAlertChannel = (c: unknown): c is AlertChannel => c === 'email' || c === 'in_app';

export const isAlertFrequency = (f: unknown): f is AlertFrequency =>
  f === 'immediate' || f === 'daily' || f === 'weekly';

/** Configuración almacenada de una alerta (una fila de consumer_alert_config). */
export interface ConsumerAlertConfigRow {
  id?: string;
  user_id?: string;
  alert_type: ConsumerAlertType;
  enabled: boolean;
  channels: AlertChannel[];
  frequency: AlertFrequency;
  created_at?: string;
  updated_at?: string;
}

/** Configuración "No molestar" (una fila de consumer_no_molestar). */
export interface NoMolestarRow {
  id?: string;
  user_id?: string;
  enabled: boolean;
  start_date: string | null; // ISO date yyyy-mm-dd
  end_date: string | null;   // ISO date yyyy-mm-dd
  created_at?: string;
  updated_at?: string;
}

// ------------------------------------------------------------------
// Valores por defecto (documentados en el informe)
// ------------------------------------------------------------------

export const DEFAULT_ALERT_SETTINGS: Record<ConsumerAlertType, {
  enabled: boolean;
  channels: AlertChannel[];
  frequency: AlertFrequency;
}> = Object.fromEntries(
  CONSUMER_ALERTS.map((a) => [
    a.type,
    { enabled: a.defaultEnabled, channels: a.defaultChannels, frequency: a.defaultFrequency },
  ])
) as Record<ConsumerAlertType, {
  enabled: boolean;
  channels: AlertChannel[];
  frequency: AlertFrequency;
}>;

export const DEFAULT_NO_MOLESTAR: { enabled: boolean; start_date: null; end_date: null } = {
  enabled: false,
  start_date: null,
  end_date: null,
};

/** Normaliza un resultado del cliente a un array de canales válido (no vacío). */
function normalizeChannels(channels: unknown): AlertChannel[] {
  const arr = Array.isArray(channels) ? channels : [];
  const valid = arr.filter(isAlertChannel);
  return valid.length > 0 ? (Array.from(new Set(valid)) as AlertChannel[]) : ['in_app'];
}

// ------------------------------------------------------------------
// CRUD
// ------------------------------------------------------------------

/** Carga la configuración de todas las alertas del consumidor autenticado. */
export async function getConsumerAlertConfig(): Promise<{ data: ConsumerAlertConfigRow[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_alert_config')
      .select('*');
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as ConsumerAlertConfigRow[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error al consultar tus alertas' };
  }
}

/** Guarda la configuración de una alerta (upsert sobre user_id + alert_type). */
export async function saveAlertConfig(
  alertType: ConsumerAlertType,
  partial: Partial<Pick<ConsumerAlertConfigRow, 'enabled' | 'channels' | 'frequency'>>
): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }
    const current = DEFAULT_ALERT_SETTINGS[alertType];
    const patch = {
      enabled: partial.enabled ?? current.enabled,
      channels: normalizeChannels(partial.channels ?? current.channels),
      frequency: (partial.frequency && isAlertFrequency(partial.frequency)
        ? partial.frequency
        : current.frequency),
    };
    const { error } = await supabase
      .from('consumer_alert_config')
      .upsert(
        { user_id: userData.user.id, alert_type: alertType, ...patch },
        { onConflict: 'user_id,alert_type', ignoreDuplicates: false }
      );
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al guardar tu configuración de alertas' };
  }
}

/** Carga la configuración "No molestar" del consumidor autenticado. */
export async function getNoMolestar(): Promise<{ data: NoMolestarRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('consumer_no_molestar')
      .select('*')
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ? (data as NoMolestarRow) : null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error al consultar No molestar' };
  }
}

/** Valida las fechas del modo "No molestar". Devuelve mensaje de error o null. */
export function validateNoMolestarDates(start: string, end: string): string | null {
  if (!start || !end) return 'Debes indicar la fecha de inicio y la fecha de fin.';
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Las fechas no son válidas.';
  if (e.getTime() < s.getTime()) return 'La fecha de fin no puede ser anterior a la de inicio.';
  return null;
}

/** Guarda la configuración "No molestar" (upsert sobre user_id). */
export async function saveNoMolestar(
  enabled: boolean,
  start: string | null,
  end: string | null
): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }
    if (enabled) {
      if (!start || !end) return { error: 'Debes indicar fecha de inicio y fin para activar No molestar.' };
      const vErr = validateNoMolestarDates(start, end);
      if (vErr) return { error: vErr };
    }
    const { error } = await supabase
      .from('consumer_no_molestar')
      .upsert(
        {
          user_id: userData.user.id,
          enabled,
          start_date: enabled ? start : null,
          end_date: enabled ? end : null,
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al guardar No molestar' };
  }
}

/**
 * Restaura los valores predeterminados: resetea cada alerta a su configuración
 * por defecto y desactiva "No molestar". Devuelve el mismo usuario autenticado.
 */
export async function resetConsumerAlerts(): Promise<{ error: string | null }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return { error: 'No hay sesión de usuario autenticada.' };
    }
    const userId = userData.user.id;
    const rows = CONSUMER_ALERTS.map((a) => ({
      user_id: userId,
      alert_type: a.type,
      enabled: DEFAULT_ALERT_SETTINGS[a.type].enabled,
      channels: DEFAULT_ALERT_SETTINGS[a.type].channels,
      frequency: DEFAULT_ALERT_SETTINGS[a.type].frequency,
    }));
    const { error: upErr } = await supabase
      .from('consumer_alert_config')
      .upsert(rows, { onConflict: 'user_id,alert_type', ignoreDuplicates: false });
    if (upErr) return { error: upErr.message };

    const { error: nmErr } = await supabase
      .from('consumer_no_molestar')
      .upsert(
        { user_id: userId, enabled: false, start_date: null, end_date: null },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );
    if (nmErr) return { error: nmErr.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al restaurar los valores predeterminados' };
  }
}

// ------------------------------------------------------------------
// Capa de evaluación (reutilizable desde UI, Edge Functions o cron)
// ------------------------------------------------------------------

/** Resultado de evaluar si debe notificarse un evento. */
export interface NotifyDecision {
  shouldNotify: boolean;
  /** Canales efectivos si shouldNotify es true. */
  channels: AlertChannel[];
  frequency: AlertFrequency;
  /** true si el consumidor tiene el modo "No molestar" activo hoy. */
  inDnd: boolean;
}

/** Normaliza una fecha "yyyy-mm-dd" (o ISO) a fecha local a medianoche. */
function parseDateOnly(value: string): Date | null {
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  return isNaN(d.getTime()) ? null : d;
}

/** Devuelve 'yyyy-mm-dd' de una fecha local. */
export function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Comprueba si hoy está dentro del periodo [start, end] (inclusive). */
export function isNoMolestarActive(
  nm: Pick<NoMolestarRow, 'enabled' | 'start_date' | 'end_date'> | null,
  today: Date = new Date()
): boolean {
  if (!nm?.enabled) return false;
  if (!nm.start_date || !nm.end_date) return false;
  const start = parseDateOnly(nm.start_date);
  const end = parseDateOnly(nm.end_date);
  if (!start || !end) return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // Si la fecha ya pasó, el modo deja de aplicarse automáticamente (no se
  // requiere desactivarlo manualmente).
  if (end.getTime() < t.getTime()) return false;
  return t.getTime() >= start.getTime();
}

/**
 * Resuelve la configuración efectiva de una alerta considerando los valores
 * por defecto (si el consumidor aún no la ha configurado).
 */
export function resolveAlertConfig(
  configs: ConsumerAlertConfigRow[],
  alertType: ConsumerAlertType
): { enabled: boolean; channels: AlertChannel[]; frequency: AlertFrequency } {
  const row = configs.find((c) => c.alert_type === alertType);
  if (!row) return { ...DEFAULT_ALERT_SETTINGS[alertType] };
  return {
    enabled: row.enabled,
    channels: normalizeChannels(row.channels),
    frequency: isAlertFrequency(row.frequency) ? row.frequency : DEFAULT_ALERT_SETTINGS[alertType].frequency,
  };
}

/**
 * Capa central de decisión: dice si un evento de tipo `alertType` debe generar
 * una notificación para el consumidor autenticado, respetando toda su
 * configuración (activa/inactiva, canales, frecuencia) y el modo "No molestar".
 *
 * Esta función es independiente de la UI y puede reutilizarse desde Edge
 * Functions o un cron cuando exista una infraestructura real de envío.
 */
export async function shouldNotify(
  alertType: ConsumerAlertType,
  opts: { today?: Date } = {}
): Promise<{ decision: NotifyDecision; error: string | null }> {
  const today = opts.today ?? new Date();
  try {
    const { data: configs, error: cfgErr } = await getConsumerAlertConfig();
    if (cfgErr) return { decision: defaultNegative(today), error: cfgErr };

    const effective = resolveAlertConfig(configs, alertType);

    const { data: nm, error: nmErr } = await getNoMolestar();
    if (nmErr) return { decision: defaultNegative(today), error: nmErr };

    const inDnd = isNoMolestarActive(nm, today);

    const shouldNotify = effective.enabled && !inDnd;
    return {
      decision: {
        shouldNotify,
        channels: shouldNotify ? effective.channels : [],
        frequency: effective.frequency,
        inDnd,
      },
      error: null,
    };
  } catch (err) {
    return {
      decision: defaultNegative(today),
      error: err instanceof Error ? err.message : 'Error al evaluar la notificación',
    };
  }
}

function defaultNegative(today: Date): NotifyDecision {
  return { shouldNotify: false, channels: [], frequency: 'immediate', inDnd: false };
}
