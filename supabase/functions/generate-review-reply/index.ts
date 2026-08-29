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

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ==========================================
// PROMPT DINÁMICO
// ==========================================
function construirPrompt(authorName: string | null, rating: number | null, text: string | null): string {
  const autor = authorName || 'Cliente anónimo'
  const textoReseña = text || 'Sin texto adicional'

  return `Eres el dueño de un negocio y necesitas responder profesionalmente a una reseña de un cliente en Google Business Profile. La respuesta debe: estar en español, ser empática pero profesional, agradecer al cliente por su feedback. Si la reseña es negativa (rating 1-2), pedir disculpas y ofrecer solucionar el problema (invitar a contactar por email/teléfono). Si es neutra (rating 3), agradecer y mencionar mejoras constantes. Si es positiva (rating 4-5), agradecer efusivamente y transmitir compromiso continuo. No más de 100 palabras. No usar emojis. No inventar nombres propios ni datos específicos del negocio. Terminar con 'Un cordial saludo' sin firma con nombre. Reseña a responder: Autor: ${autor}, Rating: ${rating} de 5 estrellas, Texto: '${textoReseña}'. Genera SOLO el texto de la respuesta, sin preámbulos ni explicaciones.`
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { alertId } = await req.json()
    console.log('Petición recibida para alertId:', alertId)

    if (!alertId || typeof alertId !== 'string' || !UUID_REGEX.test(alertId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid alertId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 1. Consultar la alerta
    // --------------------------------------
    const { data: alert, error: alertError } = await supabase
      .from('business_alerts')
      .select('id, alert_type, related_review_id, suggested_reply')
      .eq('id', alertId)
      .maybeSingle()

    if (alertError) {
      console.error('Error al consultar business_alerts:', alertError)
      return new Response(
        JSON.stringify({ error: alertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!alert) {
      return new Response(
        JSON.stringify({ error: 'Alert not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (alert.alert_type !== 'new_review') {
      return new Response(
        JSON.stringify({ error: 'Reply generation only supported for new_review alerts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!alert.related_review_id) {
      return new Response(
        JSON.stringify({ error: 'Alert has no associated review' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Alerta encontrada y validada:', { id: alert.id, alert_type: alert.alert_type })

    // --------------------------------------
    // 2. Cache hit: ya hay respuesta guardada
    // --------------------------------------
    if (alert.suggested_reply != null) {
      console.log('Cache hit: devolviendo suggested_reply guardada para alertId:', alertId)
      return new Response(
        JSON.stringify({ success: true, suggested_reply: alert.suggested_reply, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 3. Consultar la reseña asociada
    // --------------------------------------
    const { data: review, error: reviewError } = await supabase
      .from('business_reviews')
      .select('author_name, rating, text')
      .eq('id', alert.related_review_id)
      .maybeSingle()

    if (reviewError) {
      console.error('Error al consultar business_reviews:', reviewError)
      return new Response(
        JSON.stringify({ error: reviewError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!review) {
      return new Response(
        JSON.stringify({ error: 'Related review not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 4. Llamar a Gemini API REST
    // --------------------------------------
    const prompt = construirPrompt(review.author_name, review.rating, review.text)
    console.log('Llamando a Gemini para generar respuesta a reseña de rating:', review.rating)

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
          maxOutputTokens: 300,
        },
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      const geminiErrMsg = geminiData?.error?.message || `HTTP ${geminiResponse.status}`
      console.error('Error de Gemini API:', geminiErrMsg)
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiErrMsg}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      console.error('Estructura inesperada en respuesta de Gemini:', JSON.stringify(geminiData))
      return new Response(
        JSON.stringify({ error: 'Unexpected Gemini response structure' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const suggestedReply = rawText.trim().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')

    // --------------------------------------
    // 5. Guardar en business_alerts (best-effort)
    // --------------------------------------
    const { error: updateError } = await supabase
      .from('business_alerts')
      .update({ suggested_reply: suggestedReply })
      .eq('id', alertId)

    if (updateError) {
      console.error('Error al guardar suggested_reply (se devuelve la respuesta igualmente):', updateError)
    } else {
      console.log('Respuesta guardada en business_alerts para alertId:', alertId)
    }

    return new Response(
      JSON.stringify({ success: true, suggested_reply: suggestedReply, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('generate-review-reply error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
