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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DEFAULT_PERIOD_DAYS = 30
const MAX_REVIEWS_FOR_PROMPT = 50

const EMPTY_ANALYSIS = {
  resumen_general: 'No hay reseñas suficientes para generar un análisis en este periodo.',
  fortalezas: [] as string[],
  debilidades: [] as string[],
  recomendaciones: [] as Array<{ titulo: string; descripcion: string; prioridad: string }>,
  tendencia: 'estable',
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
    const businessId: string = body.businessId
    const periodDays: number = Number(body.periodDays ?? DEFAULT_PERIOD_DAYS)

    console.log('Petición recibida:', { businessId, periodDays })

    // --------------------------------------
    // 1. Validaciones
    // --------------------------------------
    if (!businessId || typeof businessId !== 'string' || !UUID_REGEX.test(businessId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid businessId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 2. Fetch reseñas del periodo
    // --------------------------------------
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: reviews, error: reviewsError } = await supabase
      .from('business_reviews')
      .select('rating, text, author_name, captured_at')
      .eq('business_id', businessId)
      .gte('captured_at', periodStart)
      .order('captured_at', { ascending: false })
      .limit(MAX_REVIEWS_FOR_PROMPT)

    if (reviewsError) {
      console.error('Error al consultar business_reviews:', reviewsError)
      return new Response(
        JSON.stringify({ success: false, error: reviewsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Reseñas encontradas en el periodo:', reviews?.length ?? 0)

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: EMPTY_ANALYSIS,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 3. Preparar prompt para Gemini
    // --------------------------------------
    const geminiPrompt = `Eres un analista de reputación online para negocios en España. Analiza las siguientes reseñas de Google del negocio y devuelve un análisis estructurado.

RESEÑAS (${reviews.length} reseñas):
${reviews.map((r, i) => `Reseña ${i+1} (${r.rating}★): "${r.text || 'Sin texto'}" - ${r.author_name}`).join('\n')}

INSTRUCCIONES:
- Analiza patrones, temas recurrentes y sentimiento general.
- Identifica fortalezas concretas (3-4 puntos, cosas que el negocio hace bien).
- Identifica debilidades concretas (3-4 puntos, quejas o áreas problemáticas repetidas).
- Genera 3-5 recomendaciones accionables con prioridad (alta/media/baja).
- Determina la tendencia general: positiva, estable o negativa.
- Redacta un resumen general de 2-3 frases.

RESPUESTA REQUERIDA (JSON válido, sin texto adicional, sin markdown):
{
  "resumen_general": "string",
  "fortalezas": ["string", "string", ...],
  "debilidades": ["string", "string", ...],
  "recomendaciones": [
    {"titulo": "string", "descripcion": "string", "prioridad": "alta|media|baja"}
  ],
  "tendencia": "positiva|estable|negativa"
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

    console.log('Llamando a Gemini para analizar', reviews.length, 'reseñas')

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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
      console.error('Error parseando respuesta de Gemini:', parseError, 'Raw:', rawText)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Gemini response format', raw: rawText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 6. Validar y normalizar campos esperados
    // --------------------------------------
    if (typeof analysis.resumen_general !== 'string') {
      analysis.resumen_general = EMPTY_ANALYSIS.resumen_general
    }
    if (!Array.isArray(analysis.fortalezas)) {
      analysis.fortalezas = []
    }
    if (!Array.isArray(analysis.debilidades)) {
      analysis.debilidades = []
    }
    if (!Array.isArray(analysis.recomendaciones)) {
      analysis.recomendaciones = []
    }
    if (typeof analysis.tendencia !== 'string') {
      analysis.tendencia = 'estable'
    }

    console.log('Análisis generado correctamente:', {
      fortalezas: (analysis.fortalezas as unknown[]).length,
      debilidades: (analysis.debilidades as unknown[]).length,
      recomendaciones: (analysis.recomendaciones as unknown[]).length,
      tendencia: analysis.tendencia,
    })

    // --------------------------------------
    // 7. Devolver análisis
    // --------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        reviews_analyzed: reviews.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('generate-report-analysis error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
