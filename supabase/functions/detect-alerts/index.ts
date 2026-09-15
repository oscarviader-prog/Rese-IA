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
      .select('enable_new_review, enable_rating_change, enable_low_rating_review, enable_review_spike, enable_no_activity, rating_change_critical, rating_change_warning, low_rating_threshold, review_spike_count, review_spike_hours, no_activity_days')
      .eq('business_id', businessId)
      .maybeSingle()

    if (settingsError) {
      console.error('Error consultando alert_settings:', settingsError)
    }

    const enableNewReview = settings?.enable_new_review ?? true
    const enableRatingChange = settings?.enable_rating_change ?? true
    const enableLowRatingReview = settings?.enable_low_rating_review ?? true
    const enableReviewSpike = settings?.enable_review_spike ?? true
    const enableNoActivity = settings?.enable_no_activity ?? true
    const ratingCritical = Number(settings?.rating_change_critical ?? 0.3)
    const ratingWarning = Number(settings?.rating_change_warning ?? 0.2)
    const lowRatingThreshold = Number(settings?.low_rating_threshold ?? 2)
    const reviewSpikeCount = Number(settings?.review_spike_count ?? 5)
    const reviewSpikeHours = Number(settings?.review_spike_hours ?? 24)
    const noActivityDays = Number(settings?.no_activity_days ?? 30)

    console.log('Config alertas:', {
      enableNewReview,
      enableRatingChange,
      enableLowRatingReview,
      enableReviewSpike,
      enableNoActivity,
      ratingCritical,
      ratingWarning,
      lowRatingThreshold,
      reviewSpikeCount,
      reviewSpikeHours,
      noActivityDays,
    })

    const alerts: Array<Record<string, unknown>> = []

    // --------------------------------------
    // 2. Sin actividad reciente
    // --------------------------------------
    let noActivityDetected = false

    if (enableNoActivity) {
      const { data: latestReview, error: latestReviewError } = await supabase
        .from('business_reviews')
        .select('captured_at')
        .eq('business_id', businessId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestReviewError) {
        console.error('Error al consultar la última reseña:', latestReviewError)
      } else if (latestReview) {
        const daysSinceLastReview = Math.floor(
          (Date.now() - new Date(latestReview.captured_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastReview >= noActivityDays) {
          const { data: existingNoActivity, error: existingNoActivityError } = await supabase
            .from('business_alerts')
            .select('id')
            .eq('business_id', businessId)
            .eq('alert_type', 'no_activity')
            .eq('is_read', false)
            .limit(1)
            .maybeSingle()

          if (existingNoActivityError) {
            console.error('Error al comprobar alertas de no_activity existentes:', existingNoActivityError)
          } else if (!existingNoActivity) {
            noActivityDetected = true

            console.log('Sin actividad reciente detectada:', { daysSinceLastReview })

            alerts.push({
              business_id: businessId,
              alert_type: 'no_activity',
              severity: 'info',
              title: `Sin actividad reciente`,
              message: `Han pasado ${daysSinceLastReview} días desde la última reseña de tu negocio.`,
              triggered_at: new Date().toISOString(),
            })
          }
        }
      }
    }

    // --------------------------------------
    // 3. Últimos 2 snapshots
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
      if (alerts.length > 0) {
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
      }

      return new Response(
        JSON.stringify({
          success: true,
          alerts_created: alerts.length,
          reason: 'not_enough_snapshots',
          no_activity_detected: noActivityDetected,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentSnapshot = snapshots[0]
    const previousSnapshot = snapshots[1]

    // --------------------------------------
    // 4. Diferencia de rating
    // --------------------------------------
    const currentRating = Number(currentSnapshot.rating)
    const previousRating = Number(previousSnapshot.rating)
    const ratingDiff = Math.round((currentRating - previousRating) * 10) / 10

    let ratingChangeDetected = false

    if (enableRatingChange) {
      const absRatingDiff = Math.abs(ratingDiff)
      if (absRatingDiff >= ratingWarning) {
        const severity = absRatingDiff >= ratingCritical ? 'critical' : 'warning'
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
    // 5. Reseñas nuevas desde el snapshot anterior
    // --------------------------------------
    let reviewsList: any[] = []
    let lowRatingReviewsCount = 0
    let reviewSpikeDetected = false

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

        if (enableLowRatingReview && reviewRating <= lowRatingThreshold) {
          lowRatingReviewsCount++

          alerts.push({
            business_id: businessId,
            alert_type: 'low_rating_review',
            severity: 'critical',
            title: `Reseña con ${review.rating} estrella${review.rating === 1 ? '' : 's'}`,
            message: `Nueva reseña de baja puntuación (${review.rating}★) requiere tu atención.`,
            related_review_id: review.id,
            triggered_at: new Date().toISOString(),
          })
        }
      }

      const newReviewsCount = reviewsList.length

      if (enableReviewSpike && newReviewsCount >= reviewSpikeCount) {
        const spikeThreshold = new Date(Date.now() - reviewSpikeHours * 60 * 60 * 1000).toISOString()
        const { count: recentCount, error: spikeError } = await supabase
          .from('business_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('captured_at', spikeThreshold)

        if (spikeError) {
          console.error('Error al consultar el pico de reseñas:', spikeError)
        } else if ((recentCount ?? 0) >= reviewSpikeCount) {
          reviewSpikeDetected = true

          console.log('Pico de reseñas detectado:', { recentCount, reviewSpikeHours })

          alerts.push({
            business_id: businessId,
            alert_type: 'review_spike',
            severity: 'warning',
            title: `Aumento repentino de reseñas`,
            message: `Has recibido ${recentCount} reseñas en las últimas ${reviewSpikeHours} horas.`,
            triggered_at: new Date().toISOString(),
          })
        }
      }
    }

    // --------------------------------------
    // 6. Insertar todas las alertas
    // --------------------------------------
    if (alerts.length === 0) {
      console.log('No hay alertas que crear')
      return new Response(
        JSON.stringify({
          success: true,
          alerts_created: 0,
          rating_change_detected: ratingChangeDetected,
          new_reviews_detected: reviewsList.length,
          low_rating_reviews_detected: lowRatingReviewsCount,
          review_spike_detected: reviewSpikeDetected,
          no_activity_detected: noActivityDetected,
          settings_applied: {
            enableNewReview,
            enableRatingChange,
            enableLowRatingReview,
            enableReviewSpike,
            enableNoActivity,
            ratingCritical,
            ratingWarning,
            lowRatingThreshold,
            reviewSpikeCount,
            reviewSpikeHours,
            noActivityDays,
          },
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
        low_rating_reviews_detected: lowRatingReviewsCount,
        review_spike_detected: reviewSpikeDetected,
        no_activity_detected: noActivityDetected,
        settings_applied: {
          enableNewReview,
          enableRatingChange,
          enableLowRatingReview,
          enableReviewSpike,
          enableNoActivity,
          ratingCritical,
          ratingWarning,
          lowRatingThreshold,
          reviewSpikeCount,
          reviewSpikeHours,
          noActivityDays,
        },
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
