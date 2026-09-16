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

const RADIUS_METERS = 2000 // 2 km
const MAX_COMPETITORS = 5

// ==========================================
// DISTANCIA (fórmula de Haversine)
// ==========================================
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // metros
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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

    // --------------------------------------
    // 1. Datos del negocio
    // --------------------------------------
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, google_place_id')
      .eq('id', businessId)
      .maybeSingle()

    if (businessError || !business) {
      console.error('Negocio no encontrado:', businessError)
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!business.google_place_id) {
      return new Response(
        JSON.stringify({ error: 'Business has no place_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!googleApiKey) {
      console.error('GOOGLE_PLACES_API_KEY no configurada')
      return new Response(
        JSON.stringify({ success: false, error: 'GOOGLE_PLACES_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --------------------------------------
    // 2. Ubicación y tipo del negocio en Google Places
    // --------------------------------------
    console.log('Consultando detalles del negocio en Google Places:', business.google_place_id)

    const placeDetailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${business.google_place_id}?languageCode=es`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask': 'id,displayName,location,primaryType'
        }
      }
    )

    if (!placeDetailsRes.ok) {
      const errorBody = await placeDetailsRes.text()
      console.error('Error Google Place Details:', errorBody)
      return new Response(
        JSON.stringify({ success: false, error: 'Error consultando Google Places', details: errorBody }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const placeDetails = await placeDetailsRes.json()

    const businessLat = placeDetails.location?.latitude
    const businessLng = placeDetails.location?.longitude
    const businessPrimaryType = placeDetails.primaryType

    if (!businessLat || !businessLng || !businessPrimaryType) {
      console.error('Faltan datos del negocio en Google Places:', placeDetails)
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot get business location/type' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Tipo de negocio:', businessPrimaryType, 'Ubicación:', businessLat, businessLng)

    // --------------------------------------
    // 3. Búsqueda de competidores cercanos
    // --------------------------------------
    const searchBody = {
      includedPrimaryTypes: [businessPrimaryType],
      maxResultCount: 20, // pedimos 20, filtramos después
      locationRestriction: {
        circle: {
          center: {
            latitude: businessLat,
            longitude: businessLng
          },
          radius: RADIUS_METERS
        }
      }
    }

    const nearbySearchRes = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.location'
        },
        body: JSON.stringify(searchBody)
      }
    )

    if (!nearbySearchRes.ok) {
      const errorBody = await nearbySearchRes.text()
      console.error('Error Google Nearby Search:', errorBody)
      return new Response(
        JSON.stringify({ success: false, error: 'Error buscando competidores en Google Places', details: errorBody }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nearbyData = await nearbySearchRes.json()
    const allPlaces = nearbyData.places || []

    console.log('Competidores potenciales encontrados:', allPlaces.length)

    // --------------------------------------
    // 4. Filtrar, calcular distancia y quedarnos con los más cercanos
    // --------------------------------------
    const competitorsWithDistance = allPlaces
      .filter((p: any) => p.id !== business.google_place_id)
      .map((p: any) => {
        const distance = calculateDistance(
          businessLat,
          businessLng,
          p.location.latitude,
          p.location.longitude
        )
        return {
          place_id: p.id,
          name: p.displayName?.text || 'Sin nombre',
          address: p.formattedAddress || null,
          primary_type: p.primaryType || null,
          distance_meters: Math.round(distance)
        }
      })
      .sort((a: any, b: any) => a.distance_meters - b.distance_meters)
      .slice(0, MAX_COMPETITORS)

    console.log('Competidores finales tras filtrar:', competitorsWithDistance.length)

    // --------------------------------------
    // 5. Guardar en business_competitors (upsert)
    // --------------------------------------
    const upsertData = competitorsWithDistance.map((c: any) => ({
      business_id: businessId,
      competitor_place_id: c.place_id,
      competitor_name: c.name,
      competitor_address: c.address,
      competitor_primary_type: c.primary_type,
      distance_meters: c.distance_meters,
      detected_at: new Date().toISOString()
    }))

    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from('business_competitors')
        .upsert(upsertData, {
          onConflict: 'business_id,competitor_place_id'
        })

      if (upsertError) {
        console.error('Error guardando competidores:', upsertError)
        return new Response(
          JSON.stringify({ success: false, error: 'Error guardando competidores en la base de datos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('Detección de competidores completada para businessId:', businessId)

    return new Response(
      JSON.stringify({
        success: true,
        business_primary_type: businessPrimaryType,
        competitors_found: competitorsWithDistance.length,
        competitors: competitorsWithDistance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error inesperado en detect-competitors:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
