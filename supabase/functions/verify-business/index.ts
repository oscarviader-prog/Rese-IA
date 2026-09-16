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

// ==========================================
// VALIDACIÓN MATEMÁTICA NIF (autónomo)
// ==========================================
function validarNIF(nif: string): boolean {
  const nifRegex = /^\d{8}[A-Z]$/
  if (!nifRegex.test(nif)) return false

  const parteNumerica = nif.substring(0, 8)

  // Rechazar NIFs sintéticos obvios
  if (parteNumerica === '00000000') return false
  if (/^(\d)\1{7}$/.test(parteNumerica)) return false // todos iguales

  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const numero = parseInt(parteNumerica)
  return letras[numero % 23] === nif.charAt(8)
}

// ==========================================
// VALIDACIÓN MATEMÁTICA CIF (empresa)
// ==========================================
function validarCIF(cif: string): boolean {
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/
  if (!cifRegex.test(cif)) return false

  const parteNumerica = cif.substring(1, 8)

  // Rechazar CIFs sintéticos obvios
  if (parteNumerica === '0000000') return false
  if (/^(\d)\1{6}$/.test(parteNumerica)) return false // todos iguales (1111111, 2222222, etc.)

  const numeros = parteNumerica.split('').map(Number)
  let suma = 0
  for (let i = 0; i < 7; i++) {
    let n = numeros[i]
    if (i % 2 === 0) {
      n *= 2
      if (n >= 10) n = Math.floor(n / 10) + (n % 10)
    }
    suma += n
  }
  const digitoCalculado = (10 - (suma % 10)) % 10
  const digitoControl = cif.charAt(8)
  const letras = 'JABCDEFGHI'
  const primeraLetra = cif.charAt(0)
  if ('KLM'.includes(primeraLetra)) {
    return digitoControl === letras.charAt(digitoCalculado)
  } else if ('ABEH'.includes(primeraLetra)) {
    return digitoControl === digitoCalculado.toString()
  } else {
    return digitoControl === digitoCalculado.toString() ||
           digitoControl === letras.charAt(digitoCalculado)
  }
}

// ==========================================
// SELECTOR DE VALIDACIÓN
// ==========================================
function validarDocumento(doc: string, tipo: string): boolean {
  const tipoNormalizado = tipo.toLowerCase().trim()
  return tipoNormalizado === 'autonomo' ? validarNIF(doc) : validarCIF(doc)
}

// ==========================================
// VERIFICACIÓN GOOGLE PLACES
// ==========================================
async function verificarGooglePlaces(razonSocial: string, ciudad: string) {
  try {
    const query = `${razonSocial} ${ciudad}`
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'es',
        regionCode: 'ES',
        maxResultCount: 3
      })
    })

    const data = await response.json()

    if (!data.places || data.places.length === 0) {
      return { pass: false, details: { reason: 'No encontrado en Google Places' } }
    }

    const primerResultado = data.places[0]
    const nombreEncontrado = primerResultado.displayName?.text?.toLowerCase() || ''
    const palabras = razonSocial.toLowerCase().split(' ').filter(p => p.length > 3)
    const coincidencias = palabras.filter(p => nombreEncontrado.includes(p))
    const porcentaje = palabras.length > 0 ? coincidencias.length / palabras.length : 0

    return {
      pass: porcentaje >= 0.5,
      details: {
        place_id: primerResultado.id,
        nombre_encontrado: primerResultado.displayName?.text,
        direccion: primerResultado.formattedAddress,
        porcentaje_coincidencia: porcentaje
      }
    }
  } catch (err) {
    return { pass: false, details: { reason: 'Error API Google', error: (err as Error).message } }
  }
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

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Falta businessId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: any[] = []
    let score = 0

    // Check 1: Documento matemático (CIF o NIF)
    const docValido = validarDocumento(business.cif, business.tipo_entidad)
    results.push({
      check_type: 'documento_math',
      result: docValido ? 'pass' : 'fail',
      details: { documento: business.cif, tipo: business.tipo_entidad, valido: docValido }
    })

    if (!docValido) {
      await supabase.from('businesses').update({
        verification_status: 'rejected',
        verification_score: 0,
        verification_data: { reason: 'CIF/NIF inválido matemáticamente' },
        verified_at: new Date().toISOString()
      }).eq('id', businessId)

      for (const r of results) {
        await supabase.from('verification_attempts').insert({
          business_id: businessId,
          check_type: r.check_type,
          result: r.result,
          details: r.details
        })
      }

      return new Response(
        JSON.stringify({ status: 'rejected', score: 0, reason: 'CIF/NIF inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    score += 1

    // Check 2: Google Places
    const googleResult = await verificarGooglePlaces(business.razon_social, business.ciudad)
    results.push({
      check_type: 'google_places',
      result: googleResult.pass ? 'pass' : 'fail',
      details: googleResult.details
    })
    if (googleResult.pass) score += 1

    // Decisión final (2 capas)
    let finalStatus: string
    if (score === 2) finalStatus = 'verified'
    else if (score === 1) finalStatus = 'partially_verified'
    else finalStatus = 'rejected'

    await supabase.from('businesses').update({
      verification_status: finalStatus,
      verification_score: score,
      verification_data: {
        google_places: googleResult.details
      },
      google_place_id: (googleResult.details as any)?.place_id || null,
      verified_at: new Date().toISOString()
    }).eq('id', businessId)

    for (const r of results) {
      await supabase.from('verification_attempts').insert({
        business_id: businessId,
        check_type: r.check_type,
        result: r.result,
        details: r.details
      })
    }

    // ==========================================
    // Trigger detect-competitors si se verificó con place_id
    // ==========================================
    const googlePlaceId = (googleResult.details as any)?.place_id

    if ((finalStatus === 'verified' || finalStatus === 'partially_verified') && googlePlaceId) {
      console.log('Disparando detect-competitors para businessId:', businessId)

      // Llamar en fire-and-forget para no bloquear el response al usuario.
      // Si falla, solo se loguea; el usuario puede llamarlo manualmente después.
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      fetch(`${SUPABASE_URL}/functions/v1/detect-competitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ businessId })
      })
        .then((res) => res.json())
        .then((data) => console.log('detect-competitors ejecutado:', data))
        .catch((err) => console.error('Error ejecutando detect-competitors:', err))

      // NOTA: no se hace await intencionalmente. El usuario recibe el response
      // de verify-business sin esperar a detect-competitors.
    }

    return new Response(
      JSON.stringify({ status: finalStatus, score, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Verify error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})