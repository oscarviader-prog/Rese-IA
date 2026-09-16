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

const GOOGLE_PLACES_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')!

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ==========================================
// CONSULTA GOOGLE PLACES (Place Details New)
// ==========================================
async function obtenerDetallesGoogle(placeId: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || `Google Places API error (${response.status})`)
  }

  return data
}

// ==========================================
// HASH DE RESEÑA (deduplicación)
// ==========================================
async function generarReviewHash(
  businessId: string,
  authorName: string | null,
  rating: number | null,
  text: string | null
): Promise<string> {
  const raw = `${businessId}|${authorName ?? ''}|${rating ?? ''}|${text ?? ''}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw))
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessId } = await req.json()
    console.log('Petición recibida para businessId:', businessId)

    if (!businessId || typeof businessId !== 'string' || !UUID_REGEX.test(businessId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid businessId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, google_place_id')
      .eq('id', businessId)
      .single()

    console.log('Consulta a businesses completada:', { encontrado: !!business, error: businessError?.message })

    if (businessError || !business || !business.google_place_id) {
      return new Response(
        JSON.stringify({ error: 'Business not found or not verified' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let googleData: any
    try {
      googleData = await obtenerDetallesGoogle(business.google_place_id)
      console.log('Respuesta de Google Places recibida:', { rating: googleData?.rating, userRatingCount: googleData?.userRatingCount })
    } catch (googleErr) {
      console.error('Error al consultar Google Places:', googleErr)
      return new Response(
        JSON.stringify({ error: (googleErr as Error).message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rating = googleData?.rating ?? null
    const userRatingsTotal = googleData?.userRatingCount ?? null

    const { error: insertError } = await supabase
      .from('business_snapshots')
      .insert({
        business_id: businessId,
        rating,
        user_ratings_total: userRatingsTotal,
        raw_data: googleData
      })

    if (insertError) {
      console.error('Error al insertar snapshot:', insertError)
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Snapshot insertado correctamente para businessId:', businessId)

    const googleReviews = Array.isArray(googleData?.reviews) ? googleData.reviews : []
    console.log('Reseñas devueltas por Google:', googleReviews.length)

    let reviewsCaptured = 0

    if (googleReviews.length > 0) {
      const reviewRows = await Promise.all(googleReviews.map(async (review: any) => {
        const authorName = review.authorAttribution?.displayName ?? null
        const reviewRating = review.rating ?? null
        const reviewText = review.text?.text ?? null
        const relativeTime = review.relativePublishTimeDescription ?? null
        const reviewHash = await generarReviewHash(businessId, authorName, reviewRating, reviewText)

        return {
          business_id: businessId,
          author_name: authorName,
          rating: reviewRating,
          text: reviewText,
          relative_time: relativeTime,
          raw_data: review,
          review_hash: reviewHash
        }
      }))

      console.log('Reseñas a intentar insertar:', reviewRows.length)

      const { error: reviewsError } = await supabase
        .from('business_reviews')
        .upsert(reviewRows, { onConflict: 'review_hash', ignoreDuplicates: true })

      if (reviewsError) {
        console.error('Error al insertar reseñas:', reviewsError)
      } else {
        reviewsCaptured = reviewRows.length
        console.log('Reseñas insertadas correctamente:', reviewsCaptured)
      }
    }

    // ==========================================
    // 5. Snapshots de competidores
    // ==========================================
    console.log('Iniciando snapshots de competidores...')

    const { data: competitors, error: competitorsError } = await supabase
      .from('business_competitors')
      .select('id, competitor_place_id, competitor_name')
      .eq('business_id', businessId)

    let competitorSnapshotsCount = 0

    if (competitorsError) {
      console.error('Error consultando competidores:', competitorsError)
    } else if (!competitors || competitors.length === 0) {
      console.log('No hay competidores registrados para este negocio')
    } else {
      console.log(`Encontrados ${competitors.length} competidores, capturando snapshots...`)

      for (const competitor of competitors) {
        try {
          const competitorData = await obtenerDetallesGoogle(competitor.competitor_place_id)

          const competitorRating = competitorData?.rating ?? null
          const competitorRatingsTotal = competitorData?.userRatingCount ?? 0

          if (competitorRating === null) {
            console.log(`Sin rating para competidor ${competitor.competitor_name}, saltando`)
            continue
          }

          const { error: snapshotError } = await supabase
            .from('competitor_snapshots')
            .insert({
              competitor_id: competitor.id,
              rating: competitorRating,
              user_ratings_total: competitorRatingsTotal,
              snapshot_date: new Date().toISOString()
            })

          if (snapshotError) {
            console.error(`Error insertando snapshot para ${competitor.competitor_name}:`, snapshotError)
          } else {
            competitorSnapshotsCount++
          }
        } catch (competitorErr) {
          console.error(`Error consultando Google Places para ${competitor.competitor_name}:`, competitorErr)
          // No bloquea el flujo, sigue con el siguiente competidor.
        }
      }

      console.log(`Snapshots de competidores capturados: ${competitorSnapshotsCount}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: { rating, user_ratings_total: userRatingsTotal, reviews_captured: reviewsCaptured },
        competitor_snapshots_captured: competitorSnapshotsCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Snapshot error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})