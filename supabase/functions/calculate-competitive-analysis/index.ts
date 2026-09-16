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
    // 1. Último snapshot del negocio
    // --------------------------------------
    const { data: businessSnapshot, error: businessSnapshotError } = await supabase
      .from('business_snapshots')
      .select('rating, user_ratings_total, snapshot_date')
      .eq('business_id', businessId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (businessSnapshotError) {
      console.error('Error consultando snapshot del negocio:', businessSnapshotError)
      return new Response(
        JSON.stringify({ error: 'Error consultando snapshot del negocio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!businessSnapshot) {
      console.log('El negocio aún no tiene snapshots:', businessId)
      return new Response(
        JSON.stringify({
          success: true,
          has_data: false,
          reason: 'no_business_snapshot',
          message: 'El negocio aún no tiene snapshots. Espera al próximo cron.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Snapshot del negocio encontrado:', { rating: businessSnapshot.rating, snapshot_date: businessSnapshot.snapshot_date })

    // --------------------------------------
    // 2. Competidores del negocio
    // --------------------------------------
    const { data: competitors, error: competitorsError } = await supabase
      .from('business_competitors')
      .select('id, competitor_place_id, competitor_name, competitor_primary_type, distance_meters')
      .eq('business_id', businessId)

    if (competitorsError) {
      console.error('Error consultando competidores:', competitorsError)
      return new Response(
        JSON.stringify({ error: 'Error consultando competidores' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!competitors || competitors.length === 0) {
      console.log('No hay competidores registrados para este negocio:', businessId)
      return new Response(
        JSON.stringify({
          success: true,
          has_data: false,
          reason: 'no_competitors',
          message: 'No hay competidores registrados para este negocio.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Competidores encontrados: ${competitors.length}`)

    // --------------------------------------
    // 3. Último snapshot de cada competidor
    // --------------------------------------
    const competitorsWithSnapshots = await Promise.all(
      competitors.map(async (c: any) => {
        const { data: snapshot } = await supabase
          .from('competitor_snapshots')
          .select('rating, user_ratings_total, snapshot_date')
          .eq('competitor_id', c.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          id: c.id,
          place_id: c.competitor_place_id,
          name: c.competitor_name,
          primary_type: c.competitor_primary_type,
          distance_meters: c.distance_meters,
          rating: snapshot?.rating ?? null,
          user_ratings_total: snapshot?.user_ratings_total ?? 0,
          snapshot_date: snapshot?.snapshot_date ?? null
        }
      })
    )

    const validCompetitors = competitorsWithSnapshots.filter((c: any) => c.rating !== null)

    if (validCompetitors.length === 0) {
      console.log('Los competidores aún no tienen snapshots:', businessId)
      return new Response(
        JSON.stringify({
          success: true,
          has_data: false,
          reason: 'no_competitor_snapshots',
          message: 'Los competidores aún no tienen snapshots. Espera al próximo cron.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Competidores con snapshot válido: ${validCompetitors.length}`)

    // --------------------------------------
    // 4. Cálculo de métricas
    // --------------------------------------
    const businessRating = Number(businessSnapshot.rating)
    const businessReviewsTotal = businessSnapshot.user_ratings_total

    const competitorRatings = validCompetitors.map((c: any) => Number(c.rating))
    const averageCompetitorRating = competitorRatings.reduce((sum: number, r: number) => sum + r, 0) / competitorRatings.length

    // Combinar negocio + competidores para calcular posición
    const allRatings = [...competitorRatings, businessRating].sort((a, b) => b - a) // desc
    const businessPosition = allRatings.indexOf(businessRating) + 1 // 1-indexed
    const totalNegocios = allRatings.length
    const percentile = Math.round(((totalNegocios - businessPosition) / totalNegocios) * 100)

    // Diferencial vs media
    const differenceVsAverage = Number((businessRating - averageCompetitorRating).toFixed(2))

    // Ranking status
    let rankingStatus: string
    if (percentile >= 75) rankingStatus = 'top_25'
    else if (percentile >= 50) rankingStatus = 'top_50'
    else if (percentile >= 25) rankingStatus = 'bottom_50'
    else rankingStatus = 'bottom_25'

    console.log('Métricas calculadas:', { businessPosition, totalNegocios, percentile, rankingStatus, differenceVsAverage })

    // --------------------------------------
    // 5. Top 5 competidores por rating
    // --------------------------------------
    const topCompetitors = [...validCompetitors]
      .sort((a: any, b: any) => Number(b.rating) - Number(a.rating))
      .slice(0, 5)

    return new Response(
      JSON.stringify({
        success: true,
        has_data: true,
        business: {
          rating: businessRating,
          user_ratings_total: businessReviewsTotal,
          snapshot_date: businessSnapshot.snapshot_date,
          position: businessPosition,
          total_negocios: totalNegocios,
          percentile,
          ranking_status: rankingStatus,
          difference_vs_average: differenceVsAverage
        },
        competitors: {
          count: validCompetitors.length,
          average_rating: Number(averageCompetitorRating.toFixed(2)),
          top: topCompetitors
        },
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error inesperado en calculate-competitive-analysis:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
