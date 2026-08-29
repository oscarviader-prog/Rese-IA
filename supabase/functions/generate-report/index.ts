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

const VALID_REPORT_TYPES = ['weekly', 'biweekly', 'monthly', 'on_demand']

// Días de período según el tipo de informe
const PERIOD_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  on_demand: 7,
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
    let reportType: string = body.reportType

    console.log('Petición recibida:', { businessId, reportType })

    // --------------------------------------
    // 1. Validaciones
    // --------------------------------------
    if (!businessId || typeof businessId !== 'string' || !UUID_REGEX.test(businessId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid businessId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!reportType || typeof reportType !== 'string' || !VALID_REPORT_TYPES.includes(reportType)) {
      reportType = 'on_demand'
    }

    // --------------------------------------
    // 2. Verificar que el negocio existe
    // --------------------------------------
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, report_frequency')
      .eq('id', businessId)
      .maybeSingle()

    if (businessError) {
      console.error('Error al consultar businesses:', businessError)
      return new Response(
        JSON.stringify({ success: false, error: businessError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 3. Calcular período
    // --------------------------------------
    // Si es on_demand, usar la frecuencia configurada del negocio para dar coherencia
    let periodKey = reportType
    if (reportType === 'on_demand') {
      const freq = business.report_frequency
      if (freq && typeof freq === 'string' && VALID_REPORT_TYPES.includes(freq) && freq !== 'on_demand') {
        periodKey = freq
      } else {
        periodKey = 'weekly'
      }
    }

    const periodDays = PERIOD_DAYS[periodKey] ?? 7
    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const periodStartISO = periodStart.toISOString()
    const periodEndISO = periodEnd.toISOString()

    console.log('Período calculado:', { period_start: periodStartISO, period_end: periodEndISO })

    // --------------------------------------
    // 4. METRIC 1 — ratings
    // --------------------------------------
    let currentRating: number | null = null
    let previousRating: number | null = null
    let ratingChange: number | null = null

    // Snapshot más reciente dentro del período
    const { data: latestInPeriod, error: latestErr } = await supabase
      .from('business_snapshots')
      .select('rating')
      .eq('business_id', businessId)
      .gte('snapshot_date', periodStartISO)
      .order('snapshot_date', { ascending: false })
      .limit(1)

    if (latestErr) {
      console.error('Error al consultar snapshot más reciente del período:', latestErr)
      return new Response(
        JSON.stringify({ success: false, error: latestErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Snapshot más antiguo dentro del período
    const { data: oldestInPeriod, error: oldestErr } = await supabase
      .from('business_snapshots')
      .select('rating')
      .eq('business_id', businessId)
      .gte('snapshot_date', periodStartISO)
      .order('snapshot_date', { ascending: true })
      .limit(1)

    if (oldestErr) {
      console.error('Error al consultar snapshot más antiguo del período:', oldestErr)
      return new Response(
        JSON.stringify({ success: false, error: oldestErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (latestInPeriod && latestInPeriod.length > 0) {
      currentRating = Number(latestInPeriod[0].rating)
    } else {
      // No hay snapshots en el período: usar el más reciente absoluto
      const { data: latestAbs, error: latestAbsErr } = await supabase
        .from('business_snapshots')
        .select('rating')
        .eq('business_id', businessId)
        .order('snapshot_date', { ascending: false })
        .limit(1)

      if (latestAbsErr) {
        console.error('Error al consultar snapshot más reciente absoluto:', latestAbsErr)
        return new Response(
          JSON.stringify({ success: false, error: latestAbsErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (latestAbs && latestAbs.length > 0) {
        currentRating = Number(latestAbs[0].rating)
      }
    }

    if (oldestInPeriod && oldestInPeriod.length > 0) {
      previousRating = Number(oldestInPeriod[0].rating)
      if (currentRating !== null) {
        ratingChange = Math.round((currentRating - previousRating) * 10) / 10
      }
    } else {
      // No hay snapshots en el período
      previousRating = null
      ratingChange = null
    }

    // --------------------------------------
    // 5. METRIC 2 — reseñas nuevas del período
    // --------------------------------------
    const { count: newReviewsCount, error: countErr } = await supabase
      .from('business_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('captured_at', periodStartISO)

    if (countErr) {
      console.error('Error al contar reseñas del período:', countErr)
      return new Response(
        JSON.stringify({ success: false, error: countErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newReviews = newReviewsCount ?? 0

    let topPositiveReview: Record<string, unknown> | null = null
    let topNegativeReview: Record<string, unknown> | null = null

    if (newReviews > 0) {
      const { data: positive, error: posErr } = await supabase
        .from('business_reviews')
        .select('author_name, rating, text')
        .eq('business_id', businessId)
        .gte('captured_at', periodStartISO)
        .order('rating', { ascending: false })
        .limit(1)

      if (posErr) {
        console.error('Error al consultar top positive review:', posErr)
        return new Response(
          JSON.stringify({ success: false, error: posErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: negative, error: negErr } = await supabase
        .from('business_reviews')
        .select('author_name, rating, text')
        .eq('business_id', businessId)
        .gte('captured_at', periodStartISO)
        .order('rating', { ascending: true })
        .limit(1)

      if (negErr) {
        console.error('Error al consultar top negative review:', negErr)
        return new Response(
          JSON.stringify({ success: false, error: negErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      topPositiveReview = positive && positive.length > 0 ? positive[0] : null
      topNegativeReview = negative && negative.length > 0 ? negative[0] : null
    }

    // --------------------------------------
    // 6. METRIC 3 — total absoluto de reseñas
    // --------------------------------------
    const { count: totalReviewsCaptured, error: totalErr } = await supabase
      .from('business_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)

    if (totalErr) {
      console.error('Error al contar total de reseñas:', totalErr)
      return new Response(
        JSON.stringify({ success: false, error: totalErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 7. Construir objeto metrics
    // --------------------------------------
    const metrics = {
      current_rating: currentRating,
      rating_change: ratingChange,
      previous_rating: previousRating,
      new_reviews_count: newReviews,
      top_positive_review: topPositiveReview,
      top_negative_review: topNegativeReview,
      total_reviews_captured: totalReviewsCaptured ?? 0,
    }

    console.log('Métricas calculadas:', metrics)

    // --------------------------------------
    // 8. Insertar en business_reports
    // --------------------------------------
    const { data: inserted, error: insertError } = await supabase
      .from('business_reports')
      .insert({
        business_id: businessId,
        report_type: reportType,
        period_start: periodStartISO,
        period_end: periodEndISO,
        metrics,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error al insertar en business_reports:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Informe insertado:', { id: inserted.id })

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          id: inserted.id,
          report_type: reportType,
          period_start: periodStartISO,
          period_end: periodEndISO,
          metrics,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('generate-report error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
