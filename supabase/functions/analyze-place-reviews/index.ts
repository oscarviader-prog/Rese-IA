import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface PlaceReviewInput {
  rating: number
  text: string
  author_name: string
}

const DEFAULT_ANALYSIS = {
  resumen_general: 'No se pudo generar un resumen.',
  lo_bueno: [] as string[],
  lo_malo: [] as string[],
  lo_intermedio: [] as string[],
  veredicto: 'con_reservas',
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const placeId: string = body.place_id
    const reviews: PlaceReviewInput[] = body.reviews
    const businessName: string | undefined = body.business_name

    console.log('Petición recibida:', { place_id: placeId, reviews_count: reviews?.length })

    // --------------------------------------
    // 1. Validaciones
    // --------------------------------------
    if (!placeId || typeof placeId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid place_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid reviews' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 2. Comprobar caché
    // --------------------------------------
    const now = new Date().toISOString()

    const { data: cached, error: cacheError } = await supabase
      .from('place_analysis_cache')
      .select('analysis, reviews_count, generated_at, expires_at')
      .eq('place_id', placeId)
      .gt('expires_at', now)
      .maybeSingle()

    if (cacheError) {
      console.error('Error al consultar place_analysis_cache:', cacheError)
    }

    if (cached) {
      console.log('Cache hit para place_id:', placeId)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: cached.analysis,
          reviews_analyzed: cached.reviews_count,
          from_cache: true,
          generated_at: cached.generated_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Cache miss para place_id:', placeId, '- generando análisis nuevo')

    // --------------------------------------
    // 3. Preparar prompt para Gemini
    // --------------------------------------
    const businessContext = businessName ? `del negocio "${businessName}"` : `del negocio`

    const geminiPrompt = `Eres un analista de reseñas online. Analiza las siguientes reseñas ${businessContext} y devuelve un resumen útil para un consumidor que está decidiendo si visitarlo.

RESEÑAS (${reviews.length} reseñas):
${reviews.map((r, i) => `Reseña ${i+1} (${r.rating}★): "${r.text || 'Sin texto'}" - ${r.author_name}`).join('\n')}

INSTRUCCIONES:
- Analiza patrones, temas recurrentes y sentimiento general.
- Identifica lo BUENO (aspectos positivos destacados): 3-4 puntos concretos.
- Identifica lo MALO (aspectos negativos o quejas repetidas): 3-4 puntos concretos.
- Identifica lo INTERMEDIO (aspectos con opiniones mixtas o matices): 2-3 puntos.
- Redacta un resumen general de 2-3 frases que ayude al consumidor a decidir.
- Determina el veredicto general: "muy recomendado", "recomendado", "con reservas", "no recomendado".

IMPORTANTE:
- Sé HONESTO y DIRECTO en el análisis, sin exagerar ni minimizar.
- Si las reseñas son contradictorias, dilo en el intermedio.
- Si hay poco texto en las reseñas, di que faltan datos.
- Responde en español, en un tono neutral e informativo.

RESPUESTA REQUERIDA (JSON válido, sin texto adicional, sin markdown):
{
  "resumen_general": "string",
  "lo_bueno": ["string", "string", ...],
  "lo_malo": ["string", "string", ...],
  "lo_intermedio": ["string", "string", ...],
  "veredicto": "muy_recomendado|recomendado|con_reservas|no_recomendado"
}

Responde SOLO con el JSON, en español, sin comillas triples ni bloques de código.`

    // --------------------------------------
    // 4. Llamar a Gemini API
    // --------------------------------------
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY no configurada')
      return new Response(
        JSON.stringify({ success: false, error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`

    console.log('Llamando a Gemini para analizar', reviews.length, 'reseñas de place_id:', placeId)

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Error de Gemini:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'Gemini API error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 5. Parsear respuesta de Gemini
    // --------------------------------------
    const geminiData = await geminiResponse.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(rawText)
    } catch (parseError) {
      console.error('Error parseando Gemini:', parseError, 'Raw:', rawText)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Gemini response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 6. Normalizar campos con defaults
    // --------------------------------------
    analysis = {
      resumen_general:
        typeof analysis.resumen_general === 'string' && analysis.resumen_general
          ? analysis.resumen_general
          : DEFAULT_ANALYSIS.resumen_general,
      lo_bueno: Array.isArray(analysis.lo_bueno) ? analysis.lo_bueno : DEFAULT_ANALYSIS.lo_bueno,
      lo_malo: Array.isArray(analysis.lo_malo) ? analysis.lo_malo : DEFAULT_ANALYSIS.lo_malo,
      lo_intermedio: Array.isArray(analysis.lo_intermedio)
        ? analysis.lo_intermedio
        : DEFAULT_ANALYSIS.lo_intermedio,
      veredicto:
        typeof analysis.veredicto === 'string' && analysis.veredicto
          ? analysis.veredicto
          : DEFAULT_ANALYSIS.veredicto,
    }

    console.log('Análisis generado correctamente para place_id:', placeId, {
      veredicto: (analysis as { veredicto: string }).veredicto,
    })

    // --------------------------------------
    // 7. Guardar en caché (upsert)
    // --------------------------------------
    const generatedAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()

    const { error: upsertError } = await supabase
      .from('place_analysis_cache')
      .upsert(
        {
          place_id: placeId,
          analysis,
          reviews_count: reviews.length,
          generated_at: generatedAt,
          expires_at: expiresAt,
        },
        { onConflict: 'place_id' }
      )

    if (upsertError) {
      console.error('Error al guardar en place_analysis_cache (se devuelve el análisis igualmente):', upsertError)
    } else {
      console.log('Análisis guardado en caché para place_id:', placeId, '- expira:', expiresAt)
    }

    // --------------------------------------
    // 8. Devolver análisis
    // --------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        reviews_analyzed: reviews.length,
        from_cache: false,
        generated_at: generatedAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('analyze-place-reviews error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
