import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

// Cliente con service_role: solo se usa en el servidor para leer las
// preferencias del usuario autenticado (nunca se expone al frontend).
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface RealPlace {
  nombre: string
  categoria: string
  direccion: string
  rating: number | null
  numeroResenas: number | null
}

interface FechaImportante {
  name: string
  day: number
  month: number
  year: number | null
  occurrence_type: 'anual' | 'unica'
  gustos: string[]
}

function extraerBearer(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/**
 * Obtiene las preferencias persistentes del consumidor autenticado.
 * Solo devuelve resultados si el JWT del request corresponde a un usuario
 * válido de Supabase. Si no hay sesión (ej. modo mock) devuelve null,
 * manteniendo el comportamiento previo.
 */
async function obtenerPreferencias(token: string | null): Promise<string | null> {
  if (!token) return null

  try {
    // getUser valida el JWT y extrae el usuario autenticado de forma segura.
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      console.warn('consumer-chat: JWT no válido, sin preferencias')
      return null
    }

    const { data, error } = await supabaseAdmin
      .from('consumer_preferences')
      .select('text')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (error) {
      console.warn('consumer-chat: error consultando preferencias:', error.message)
      return null
    }

    return data?.text ? String(data.text).trim() : null
  } catch (err) {
    console.warn('consumer-chat: error obteniendo preferencias:', (err as Error).message)
    return null
  }
}

/**
 * Obtiene los establecimientos favoritos del consumidor autenticado.
 * Solo devuelve resultados si el JWT del request corresponde a un usuario
 * válido de Supabase. Si no hay sesión (ej. modo mock) devuelve null,
 * manteniendo el comportamiento previo.
 */
async function obtenerFavoritos(token: string | null): Promise<string[] | null> {
  if (!token) return null

  try {
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      console.warn('consumer-chat: JWT no válido, sin favoritos')
      return null
    }

    const { data, error } = await supabaseAdmin
      .from('consumer_favorites')
      .select('place_name, place_category, place_address')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('consumer-chat: error consultando favoritos:', error.message)
      return null
    }

    const rows = Array.isArray(data) ? data : []
    return rows.map((r) => {
      const row = r as { place_name?: string; place_category?: string; place_address?: string }
      return [row.place_name, row.place_category, row.place_address]
        .map((p) => String(p || '').trim())
        .filter(Boolean)
        .join(' · ')
    }).filter(Boolean)
  } catch (err) {
    console.warn('consumer-chat: error obteniendo favoritos:', (err as Error).message)
    return null
  }
}

/**
 * Obtiene las fechas importantes del consumidor autenticado (tabla
 * `consumer_important_dates`). Solo devuelve resultados si el JWT del request
 * corresponde a un usuario válido. Si no hay sesión devuelve null.
 */
async function obtenerFechasImportantes(token: string | null): Promise<FechaImportante[] | null> {
  if (!token) return null

  try {
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      console.warn('consumer-chat: JWT no válido, sin fechas importantes')
      return null
    }

    const { data, error } = await supabaseAdmin
      .from('consumer_important_dates')
      .select('name, day, month, year, occurrence_type, gustos')
      .eq('user_id', userData.user.id)
      .order('month', { ascending: true })
      .order('day', { ascending: true })

    if (error) {
      console.warn('consumer-chat: error consultando fechas importantes:', error.message)
      return null
    }

    const rows = Array.isArray(data) ? data : []
    return rows
      .map((r) => {
        const row = r as FechaImportante
        return {
          name: String(row.name || '').trim(),
          day: Number(row.day) || 0,
          month: Number(row.month) || 0,
          year: row.year == null ? null : Number(row.year),
          occurrence_type: row.occurrence_type === 'unica' ? 'unica' : 'anual',
          gustos: Array.isArray(row.gustos) ? row.gustos.map((g) => String(g)).filter(Boolean) : [],
        }
      })
      .filter((d) => d.name.length > 0 && d.day > 0 && d.month > 0)
  } catch (err) {
    console.warn('consumer-chat: error obteniendo fechas importantes:', (err as Error).message)
    return null
  }
}

// ---- Cálculo de próximas celebraciones (equivalente a lib/importantDates.ts) ----

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function diaInicio(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

function proximaOcurrencia(d: FechaImportante, hoy: Date): Date | null {
  if (d.occurrence_type === 'unica') {
    if (d.year == null) return null
    const dt = new Date(d.year, d.month - 1, d.day)
    if (isNaN(dt.getTime())) return null
    return dt >= diaInicio(hoy) ? dt : null
  }
  const anio = hoy.getFullYear()
  let candidata = new Date(anio, d.month - 1, d.day)
  // 29 de febrero en año no bisiesto -> se considera 28 de febrero
  if (candidata.getMonth() !== d.month - 1) candidata = new Date(anio, d.month - 1, 28)
  if (candidata < diaInicio(hoy)) {
    candidata = new Date(anio + 1, d.month - 1, d.day)
    if (candidata.getMonth() !== d.month - 1) candidata = new Date(anio + 1, d.month - 1, 28)
  }
  return candidata
}

function diasHasta(hoy: Date, fecha: Date): number {
  return Math.round((diaInicio(fecha).getTime() - diaInicio(hoy).getTime()) / 86400000)
}

// ---- Heurísticas de relevancia (sin datos inventados, solo orientan el contexto) ----

const REGEX_PETICION_LUGARES = /(recomienda|recomiendame|recomiéndame|busca|buscar|encuentra|encuentre|necesito|quiero|sugiere|sugerir|dónde|donde puedo|donde comer|donde cenar|qué lugares|que lugares|qué sitios|que sitios|qué establecimientos|que establecimientos|qué restaurantes|que restaurantes|cafeterías|cafeterias|bares|sitios|lugares|establecimient|restaurant|cafeter|cena|cenar|comer|desayuna|tomar algo|opciones|plan|llevame|llevarme|celebrar|organizar|sugerencia|regalar|quiero comer|quiero cenar)/i

const REGEX_FECHAS_RELEVANTES = /(fecha|ocasión|ocasion|celebr|festeja|aniversario|cumplea|boda|navidad|año nuevo|noche vieja|san valent|viernes|sabado|sábado|domingo|lunes|martes|miércoles|miercoles|jueves|mañana|fin de semana|semana que viene|próximo|proximo|hoy|esta tarde|esta noche|su cumple|su aniversario|quedada)/i

function etiquetasGustos(gustos: string[], mapa: Record<string, string>): string {
  const labels = gustos.map((id) => (mapa[id] || '').trim()).filter(Boolean)
  return labels.length > 0 ? labels.join(', ') : 'No especificados'
}

function formatearFechas(fechas: FechaImportante[], mapa: Record<string, string>, hoy: Date): string {
  const lineas: string[] = []
  for (const f of fechas) {
    const proxima = proximaOcurrencia(f, hoy)
    if (!proxima) continue
    const dias = diasHasta(hoy, proxima)
    const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`
    const mes = MESES[f.month - 1] ?? String(f.month)
    lineas.push(
      `- ${f.name}: próxima celebración el ${f.day} de ${mes}${f.year ? ` de ${f.year}` : ''} (${cuando}); gustos asociados: ${etiquetasGustos(f.gustos, mapa)}`
    )
  }
  return lineas.join('\n')
}

function mapearEtiquetasGustos(contexto: string): Record<string, string> {
  const mapa: Record<string, string> = {}
  for (const parte of contexto.split('|')) {
    const idx = parte.indexOf('=')
    if (idx <= 0) continue
    const id = parte.slice(0, idx).trim()
    const etiqueta = parte.slice(idx + 1).trim()
    if (id && etiqueta) mapa[id] = etiqueta
  }
  return mapa
}

function formatearResultadosReales(places: RealPlace[]): string {
  return places
    .map((p) => {
      const valoracion = p.rating != null
        ? `valoración ${p.rating}${p.numeroResenas != null ? ` (${p.numeroResenas} reseñas)` : ''}`
        : 'sin valoración publicada'
      const partes = [p.nombre, p.categoria, p.direccion, valoracion]
      return `- ${partes.filter(Boolean).join(' · ')}`
    })
    .join('\n')
}

/**
 * Busca establecimientos reales para la consulta del consumidor reutilizando la
 * Edge Function `search-places` (Google Places, sesgo en la zona de Las Palmas).
 * Devuelve un array vacío ante cualquier error para no bloquear la conversación.
 */
async function buscarEstablecimientosReales(message: string, userCity: string | undefined): Promise<RealPlace[]> {
  try {
    const peticion = [message.slice(0, 200).trim(), (userCity || '').trim()].filter(Boolean).join(' ')
    if (peticion.length < 3) return []

    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return []

    const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/search-places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ query: peticion }),
    })
    if (!res.ok) return []

    const data = await res.json()
    const raw = Array.isArray(data)
      ? data
      : Array.isArray((data as { places?: unknown[] })?.places)
      ? (data as { places: unknown[] }).places
      : []

    return raw
      .slice(0, 5)
      .map((p) => {
        const place = p as {
          displayName?: { text?: string }
          name?: string
          primaryTypeDisplayName?: { text?: string }
          primaryType?: string
          formattedAddress?: string
          rating?: number
          userRatingCount?: number
        }
        return {
          nombre: place?.displayName?.text?.trim() || place?.name?.trim() || '',
          categoria: place?.primaryTypeDisplayName?.text?.trim() || place?.primaryType?.trim() || '',
          direccion: place?.formattedAddress?.trim() || '',
          rating: typeof place?.rating === 'number' ? place.rating : null,
          numeroResenas: typeof place?.userRatingCount === 'number' ? place.userRatingCount : null,
        }
      })
      .filter((r) => r.nombre.length > 0)
  } catch (err) {
    console.warn('consumer-chat: error en búsqueda real de establecimientos:', (err as Error).message)
    return []
  }
}

function construirPrompt(
  history: ChatMessage[],
  userCity: string | undefined,
  preferences: string | null,
  favoritos: string[] | null,
  fechasText: string,
  categorias: string,
  resultadosRealesText: string
): string {
  const locationContext = userCity
    ? `El consumidor se encuentra en la zona de ${userCity}. Si es relevante, prioriza establecimientos cercanos a esa zona.`
    : ''

  const preferencesContext = preferences
    ? `PREFERENCIAS PERSISTENTES DEL CONSUMIDOR (indicadas previamente por él):
${preferences}
Ten en cuenta estas preferencias para personalizar tus recomendaciones. Si la petición actual del consumidor contradice una preferencia anterior, prioriza SIEMPRE la petición actual.`
    : ''

  const favoritosContext = favoritos && favoritos.length > 0
    ? `ESTABLECIMIENTOS FAVORITOS DEL CONSUMIDOR (guardados por él previamente en su lista de favoritos):
${favoritos.join('\n')}
Estos son establecimientos que el consumidor ya conoce y guardó como favoritos. Úsalos como contexto para personalizar tus recomendaciones: sugiere lugares o experiencias relacionadas con esos favoritos cuando encaje con la petición. No inventes que un establecimiento es favorito si no aparece en esta lista, y no sugieras favoritos de otros usuarios. Si la petición actual del consumidor contradice un favorito, prioriza SIEMPRE la petición actual.`
    : ''

  const fechasContext = fechasText
    ? `FECHAS IMPORTANTES DEL CONSUMIDOR (registradas por él en la app, con los gustos asociados a cada ocasión):
${fechasText}
Usa ÚNICAMENTE estas fechas si la consulta del consumidor tiene relación con ellas (celebración, ocasión o planificación de un plan). No inventes fechas ni relaciones con fechas que no estén listadas. Si alguna encaja, puedes personalizar la recomendación con sus gustos asociados; si ninguna encaja, ignóralas.`
    : ''

  const categoriasContext = categorias
    ? `GLOSARIO DE CATEGORÍAS DE RESEÑIA (nombres internos con los que la app clasifica los establecimientos):
${categorias}
Úsalo para interpretar y contextualizar la petición del consumidor (por ejemplo, "comer", "bares de copas" o "dónde dormir" se pueden mapear a la categoría correspondiente). No lo cites en tu respuesta si no aporta valor.`
    : ''

  const resultadosRealesContext = resultadosRealesText
    ? `RESULTADOS REALES DE ESTABLECIMIENTOS (obtenidos ahora mismo desde Google Places, son datos reales, no inventados):
${resultadosRealesText}
REGLAS sobre estos resultados:
- Si encajan con lo que busca el consumidor, recomienda únicamente establecimientos de ESTA lista, citándolos con sus datos reales (nombre, categoría, dirección, valoración) tal cual aparecen.
- Cuando la consulta sea ambigua pero la lista tenga resultados, es aceptable y recomendable mostrar 1 o 2 de ellos como ideas iniciales y pedir después más detalles para afinar la recomendación (zona, tipo de comida, presupuesto u otra preferencia).
- No inventes establecimientos adicionales ni modifiques los datos de la lista.
- Si la lista está vacía en número o ninguno encaja bien, responde de forma general (qué tipo de establecimiento buscar y qué características considerar) en lugar de forzar un resultado.`
    : ''

  const historyText = history
    .map((msg) => `${msg.role === 'user' ? 'Consumidor' : 'Asistente'}: ${msg.content}`)
    .join('\n')

  return `Eres un asistente de recomendaciones de ReseñIA, una aplicación que ayuda a consumidores a encontrar los mejores establecimientos (restaurantes, cafeterías, bares, tiendas, etc.) basándose en reseñas reales y preferencias personales.

Tu objetivo es conversar con el consumidor para entender qué busca y recomendarle establecimientos que se ajusten a sus gustos y necesidades.

REGLAS FUNDAMENTALES:
1. Responde SIEMPRE en español.
2. Sé amable, cercano y útil. Usa un tono conversacional natural.
3. NUNCA inventes establecimientos, productos, precios, valoraciones ni datos que no conozcas.
4. Si el consumidor pide algo vago o ambiguo (por ejemplo "recomiéndame un restaurante") pero existen RESULTADOS REALES DE ESTABLECIMIENTOS disponibles, muestra brevemente 1 o 2 opciones reales de esa lista como ideas iniciales y, a continuación, haz una pregunta de seguimiento útil (zona, tipo de comida, presupuesto u otra preferencia relevante) para afinar la recomendación. Si no hay resultados reales disponibles, haz directamente la pregunta de seguimiento. No asumas preferencias.
5. Cuando el consumidor te dé información suficiente (tipo de establecimiento, características deseadas, zona, etc.), ofrece recomendaciones orientadas basándote en tu conocimiento general.
6. Si no tienes información suficiente para recomendar un establecimiento específico, di honestamente que no puedes proporcionar una recomendación concreta pero sugiere qué tipo de establecimiento buscar y qué características considerar.
7. Mantén el contexto de la conversación: si el consumidor menciona algo antes, tenlo en cuenta en tus respuestas posteriores.
8. Sé conciso pero completo. Respuestas de entre 2 y 5 oraciones son ideales.
9. Cuando sea posible, sugiere qué buscar (por ejemplo: "busca restaurantes italianos con terraza en tu zona") en lugar de inventar nombres.
10. No uses emojis.
11. Usa cada contexto disponible (preferencias, favoritos, fechas importantes, resultados reales) SOLO si es relevante para la petición actual. Si el consumidor pregunta por fechas u ocasiones, apóyate en sus fechas importantes cuando existan y encajen; si no, responde de forma general.
${locationContext}
${preferencesContext}
${favoritosContext}
${fechasContext}
${categoriasContext}
${resultadosRealesContext}

CONVERSACIÓN ACTUAL:
${historyText}

Responde al último mensaje del consumidor. Ten en cuenta las preferencias persistentes, los favoritos, las fechas importantes y los resultados reales cuando existan y sean relevantes, pero respeta la petición actual. Si la conversación acaba de empezar y el primer mensaje es ambiguo, pide información adicional.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { message, conversationHistory, userCity } = body ?? {}
    const categorias = typeof body?.categoriasContext === 'string' ? body.categoriasContext.trim() : ''
    const gustosContext = typeof body?.gustosContext === 'string' ? body.gustosContext : ''

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'El mensaje no puede estar vacío' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'El mensaje excede el límite de 1000 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const history: ChatMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-20).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          content: String(msg.content || ''),
        }))
      : []

    const fullHistory: ChatMessage[] = [...history, { role: 'user', content: trimmedMessage }]

    // Obtener preferencias, favoritos y fechas importantes del usuario
    // autenticado de forma segura.
    const token = extraerBearer(req)
    const [preferences, favoritos, fechas] = await Promise.all([
      obtenerPreferencias(token),
      obtenerFavoritos(token),
      obtenerFechasImportantes(token),
    ])

    // Solo se inyecta contexto real cuando la consulta lo justifica.
    const ciudad = typeof userCity === 'string' ? userCity : undefined
    const mensajeBajado = trimmedMessage.toLowerCase()

    const fechasText =
      fechas && fechas.length > 0 && REGEX_FECHAS_RELEVANTES.test(mensajeBajado)
        ? formatearFechas(fechas, mapearEtiquetasGustos(gustosContext), new Date())
        : ''

    const resultadosRealesText = REGEX_PETICION_LUGARES.test(mensajeBajado)
      ? formatearResultadosReales(await buscarEstablecimientosReales(trimmedMessage, ciudad))
      : ''

    const prompt = construirPrompt(
      fullHistory,
      ciudad,
      preferences,
      favoritos,
      fechasText,
      categorias,
      resultadosRealesText
    )

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'X-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      const geminiErrMsg = geminiData?.error?.message || `HTTP ${geminiResponse.status}`
      console.error('Gemini API error:', geminiErrMsg)
      return new Response(
        JSON.stringify({ error: 'No se pudo obtener respuesta del asistente. Inténtalo de nuevo.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      console.error('Unexpected Gemini response:', JSON.stringify(geminiData))
      return new Response(
        JSON.stringify({ error: 'Respuesta vacía del asistente. Inténtalo de nuevo.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reply = rawText.trim().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')

    return new Response(
      JSON.stringify({ success: true, reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('consumer-chat error:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor. Inténtalo de nuevo.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})