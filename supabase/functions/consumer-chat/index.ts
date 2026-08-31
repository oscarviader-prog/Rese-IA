import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

function construirPrompt(history: ChatMessage[], userCity?: string): string {
  const locationContext = userCity
    ? `El consumidor se encuentra en la zona de ${userCity}. Si es relevante, prioriza establecimientos cercanos a esa zona.`
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
4. Si el consumidor pide algo vago o ambiguo, haz una pregunta de seguimiento para entender mejor qué busca. No asumas preferencias.
5. Cuando el consumidor te dé información suficiente (tipo de establecimiento, características deseadas, zona, etc.), ofrece recomendaciones orientadas basándote en tu conocimiento general.
6. Si no tienes información suficiente para recomendar un establecimiento específico, di honestamente que no puedes proporcionar una recomendación concreta pero sugiere qué tipo de establecimiento buscar y qué características considerar.
7. Mantén el contexto de la conversación: si el consumidor menciona algo antes, tenlo en cuenta en tus respuestas posteriores.
8. Sé conciso pero completo. Respuestas de entre 2 y 5 oraciones son ideales.
9. Cuando sea posible, sugiere qué buscar (por ejemplo: "busca restaurantes italianos con terraza en tu zona") en lugar de inventar nombres.
10. No uses emojis.
${locationContext}

CONVERSACIÓN ACTUAL:
${historyText}

Responde al último mensaje del consumidor. Si la conversación acaba de empezar y el primer mensaje es ambiguo, pide información adicional.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory, userCity } = await req.json()

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

    const prompt = construirPrompt(fullHistory, typeof userCity === 'string' ? userCity : undefined)

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
