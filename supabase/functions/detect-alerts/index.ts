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

// Umbrales de cambio de rating
const RATING_DIFF_CRITICAL = 0.3
const RATING_DIFF_WARNING = 0.2

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

    // --------------------------------------
    // 1. Configuración de alertas del negocio
    // --------------------------------------
    const { data: settings, error: settingsError } = await supabase
      .from('business_alert_settings')
      .select('enable_new_review, enable_rating_change')
      .eq('business_id', businessId)
      .maybeSingle()

    if (settingsError) {
      console.error('Error consultando alert_settings:', settingsError)
    }

    const enableNewReview = settings?.enable_new_review ?? true
    const enableRatingChange = settings?.enable_rating_change ?? true

    console.log('Config alertas:', { enableNewReview, enableRatingChange })

    // --------------------------------------
    // 2. Últimos 2 snapshots
    // --------------------------------------
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('business_snapshots')
      .select('rating, user_ratings_total, snapshot_date')
      .eq('business_id', businessId)
      .order('snapshot_date', { ascending: false })
      .limit(2)

    if (snapshotsError) {
      console.error('Error al consultar business_snapshots:', snapshotsError)
      return new Response(
        JSON.stringify({ success: false, error: snapshotsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Snapshots encontrados:', snapshots?.length ?? 0)

    if (!snapshots || snapshots.length < 2) {
      return new Response(
        JSON.stringify({ success: true, alerts_created: 0, reason: 'not_enough_snapshots' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentSnapshot = snapshots[0]
    const previousSnapshot = snapshots[1]

    // --------------------------------------
    // 3. Diferencia de rating
    // --------------------------------------
    const currentRating = Number(currentSnapshot.rating)
    const previousRating = Number(previousSnapshot.rating)
    const ratingDiff = Math.round((currentRating - previousRating) * 10) / 10

    const alerts: Array<Record<string, unknown>> = []
    let ratingChangeDetected = false

    if (enableRatingChange) {
      const absRatingDiff = Math.abs(ratingDiff)
      if (absRatingDiff >= RATING_DIFF_WARNING) {
        const severity = absRatingDiff >= RATING_DIFF_CRITICAL ? 'critical' : 'warning'
        ratingChangeDetected = true

        console.log('Cambio de rating detectado:', {
          old_rating: previousRating,
          new_rating: currentRating,
          diff: ratingDiff,
          severity,
        })

        alerts.push({
          business_id: businessId,
          alert_type: 'rating_change',
          severity,
          title: `Cambio significativo de rating: ${previousRating} → ${currentRating}`,
          message: `El rating de tu negocio ha ${ratingDiff > 0 ? 'subido' : 'bajado'} ${absRatingDiff.toFixed(1)} puntos.`,
          metadata: {
            old_rating: previousRating,
            new_rating: currentRating,
            diff: ratingDiff,
          },
        })
      }
    }

    // --------------------------------------
    // 4. Reseñas nuevas desde el snapshot anterior
    // --------------------------------------
    let reviewsList: any[] = []

    if (enableNewReview) {
      const { data: newReviews, error: reviewsError } = await supabase
        .from('business_reviews')
        .select('id, author_name, rating, text')
        .eq('business_id', businessId)
        .gt('captured_at', previousSnapshot.snapshot_date)

      if (reviewsError) {
        console.error('Error al consultar business_reviews:', reviewsError)
        return new Response(
          JSON.stringify({ success: false, error: reviewsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      reviewsList = newReviews ?? []
      console.log('Reseñas nuevas detectadas:', reviewsList.length)

      for (const review of reviewsList) {
        const reviewRating = Number(review.rating)
        const severity = reviewRating <= 2 ? 'warning' : 'info'
        const authorName = review.author_name || 'usuario anónimo'
        const message = review.text
          ? `"${review.text.substring(0, 200)}${review.text.length > 200 ? '...' : ''}"`
          : 'Reseña sin texto.'

        alerts.push({
          business_id: businessId,
          alert_type: 'new_review',
          severity,
          related_review_id: review.id,
          title: `Nueva reseña de ${review.rating}★ por ${authorName}`,
          message,
          metadata: {
            review_id: review.id,
            author_name: review.author_name,
            rating: review.rating,
          },
        })
      }
    }

    // --------------------------------------
    // 5. Insertar todas las alertas
    // --------------------------------------
    if (alerts.length === 0) {
      console.log('No hay alertas que crear')
      return new Response(
        JSON.stringify({
          success: true,
          alerts_created: 0,
          rating_change_detected: ratingChangeDetected,
          new_reviews_detected: reviewsList.length,
          settings_applied: { enableNewReview, enableRatingChange },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: insertError } = await supabase
      .from('business_alerts')
      .insert(alerts)

    if (insertError) {
      console.error('Error al insertar alertas:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Alertas insertadas correctamente:', alerts.length)

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alerts.length,
        rating_change_detected: ratingChangeDetected,
        new_reviews_detected: reviewsList.length,
        settings_applied: { enableNewReview, enableRatingChange },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('detect-alerts error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
