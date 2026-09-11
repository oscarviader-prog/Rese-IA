import { PlaceResult } from '../components/SearchBar';

/**
 * Capa de categorización de establecimientos (experiencia de consumidor).
 *
 * Cada establecimiento se clasifica en una familia de negocio y, a partir de
 * ella, se decide qué capacidades/funcionalidades se muestran. El objetivo es
 * que `ConsumerView` pregunte `categoria.permite('reserva_mesa')` en lugar de
 * llenarse de `if` por tipo concreto.
 */

/** Identificadores de las familias de establecimiento soportadas. */
export type CategoryId =
  | 'restauracion'
  | 'alojamiento'
  | 'salud'
  | 'belleza'
  | 'comercio'
  | 'deporte_bienestar'
  | 'automocion'
  | 'mascotas'
  | 'ocio_cultura'
  | 'servicios'
  | 'generico';

/** Capacidades que un establecimiento puede permitir. */
export type CapacityId =
  | 'reserva_mesa'
  | 'solicitar_cita'
  | 'reservar_estancia'
  | 'reservar_actividad'
  | 'pedir_domicilio'
  | 'solicitar_presupuesto';

/**
 * Capacidades en progreso (futuras), aún sin flujo implementado.
 * Aquí solo se definen los identificadores para dejar preparada la arquitectura.
 */
export const CAPACITY_LABELS: Record<CapacityId, string> = {
  reserva_mesa: 'Reserva de mesa',
  solicitar_cita: 'Solicitar cita',
  reservar_estancia: 'Reservar estancia',
  reservar_actividad: 'Reservar actividad',
  pedir_domicilio: 'Pedir a domicilio',
  solicitar_presupuesto: 'Solicitar presupuesto',
};

/** Cada familia de negocio con las capacidades que permite. */
export interface BusinessCategory {
  id: CategoryId;
  label: string;
  /** Puede extender la UI en el futuro con iconos/colores por familia. */
  icon?: string;
  capacidades: CapacityId[];
}

export const CATEGORIES: Record<CategoryId, BusinessCategory> = {
  restauracion: {
    id: 'restauracion',
    label: 'Restauración',
    capacidades: ['reserva_mesa', 'pedir_domicilio'],
  },
  alojamiento: {
    id: 'alojamiento',
    label: 'Alojamiento',
    capacidades: ['reservar_estancia'],
  },
  salud: {
    id: 'salud',
    label: 'Salud',
    capacidades: ['solicitar_cita'],
  },
  belleza: {
    id: 'belleza',
    label: 'Belleza',
    capacidades: ['solicitar_cita'],
  },
  comercio: {
    id: 'comercio',
    label: 'Comercio',
    // Sin acción de reserva/cita genérica por ahora.
    capacidades: [],
  },
  deporte_bienestar: {
    id: 'deporte_bienestar',
    label: 'Deporte y bienestar',
    capacidades: ['reservar_actividad'],
  },
  automocion: {
    id: 'automocion',
    label: 'Automoción',
    capacidades: ['solicitar_presupuesto'],
  },
  mascotas: {
    id: 'mascotas',
    label: 'Mascotas',
    capacidades: ['solicitar_cita'],
  },
  ocio_cultura: {
    id: 'ocio_cultura',
    label: 'Ocio y cultura',
    capacidades: ['reservar_actividad'],
  },
  servicios: {
    id: 'servicios',
    label: 'Servicios',
    capacidades: ['solicitar_presupuesto'],
  },
  generico: {
    id: 'generico',
    label: 'Establecimiento',
    capacidades: [],
  },
};

/**
 * Mapeo de los tipos reales de Google Places (`types[]` / `primaryType`) a una
 * familia de negocio. El orden importa: la primera familia que coincida gana.
 *
 * NOTA: estos son los identificadores en inglés (snake_case) que devuelve la
 * Google Places API (New). No usar `primaryTypeDisplayName` como fuente de
 * lógica: es texto localizado pensado para presentación.
 */
const TYPE_TO_CATEGORY: Record<string, CategoryId> = {
  // Restauración
  restaurant: 'restauracion',
  cafe: 'restauracion',
  bar: 'restauracion',
  bakery: 'restauracion',
  meal_takeaway: 'restauracion',
  meal_delivery: 'restauracion',
  restaurant_or_cafe: 'restauracion',
  breakfast_restaurant: 'restauracion',
  brunch_restaurant: 'restauracion',
  dinner_restaurant: 'restauracion',
  vegetarian_restaurant: 'restauracion',
  ice_cream_shop: 'restauracion',
  // Subtipos de restaurante que Google Places devuelve como `primaryType`.
  // Aunque la mayoría incluye también el tipo genérico `restaurant` en `types[]`,
  // se mapean explícitamente para no depender de esa coincidencia.
  italian_restaurant: 'restauracion',
  european_restaurant: 'restauracion',
  family_restaurant: 'restauracion',
  pizza_restaurant: 'restauracion',
  bar_and_grill: 'restauracion',
  cocktail_bar: 'restauracion',
  american_restaurant: 'restauracion',
  fast_food_restaurant: 'restauracion',
  chinese_restaurant: 'restauracion',
  creperie: 'restauracion',
  barbecue_restaurant: 'restauracion',
  steak_house: 'restauracion',
  sushi_restaurant: 'restauracion',
  ramen_restaurant: 'restauracion',
  seafood_restaurant: 'restauracion',
  fine_dining_restaurant: 'restauracion',
  cafe_restaurant: 'restauracion',
  dessert_shop: 'restauracion',
  // Alojamiento
  hotel: 'alojamiento',
  lodging: 'alojamiento',
  motel: 'alojamiento',
  resort_hotel: 'alojamiento',
  bed_and_breakfast: 'alojamiento',
  hostel: 'alojamiento',
  campground: 'alojamiento',
  vacation_rental: 'alojamiento',
  // Salud
  pharmacy: 'salud',
  doctor: 'salud',
  dentist: 'salud',
  hospital: 'salud',
  medical_clinic: 'salud',
  physiotherapist: 'salud',
  optician: 'salud',
  physiotherapy_center: 'salud',
  maternity_hospital: 'salud',
  diagnostic_center: 'salud',
  // Belleza
  hair_care: 'belleza',
  beauty_salon: 'belleza',
  spa: 'belleza',
  barber_shop: 'belleza',
  nail_salon: 'belleza',
  day_spa: 'belleza',
  tanning_studio: 'belleza',
  // Deporte y bienestar
  gym: 'deporte_bienestar',
  fitness_center: 'deporte_bienestar',
  sports_club: 'deporte_bienestar',
  yoga_studio: 'deporte_bienestar',
  swimming_pool: 'deporte_bienestar',
  tennis_court: 'deporte_bienestar',
  athletic_field: 'deporte_bienestar',
  stadium: 'deporte_bienestar',
  // Automoción
  car_dealer: 'automocion',
  car_repair: 'automocion',
  car_wash: 'automocion',
  gas_station: 'automocion',
  electric_vehicle_charging_station: 'automocion',
  motorcycle_dealer: 'automocion',
  motorcycle_repair: 'automocion',
  car_rental: 'automocion',
  // Mascotas
  veterinary_care: 'mascotas',
  pet_store: 'mascotas',
  pet_sitter: 'mascotas',
  // Ocio y cultura
  movie_theater: 'ocio_cultura',
  theater: 'ocio_cultura',
  museum: 'ocio_cultura',
  tourist_attraction: 'ocio_cultura',
  amusement_center: 'ocio_cultura',
  bowling_alley: 'ocio_cultura',
  night_club: 'ocio_cultura',
  casino: 'ocio_cultura',
  art_gallery: 'ocio_cultura',
  library: 'ocio_cultura',
  amusement_park: 'ocio_cultura',
  concert_hall: 'ocio_cultura',
  aquarium: 'ocio_cultura',
  zoo: 'ocio_cultura',
  // Comercio
  store: 'comercio',
  supermarket: 'comercio',
  shopping_mall: 'comercio',
  clothing_store: 'comercio',
  electronics_store: 'comercio',
  department_store: 'comercio',
  furniture_store: 'comercio',
  home_goods_store: 'comercio',
  jewelry_store: 'comercio',
  florist: 'comercio',
  book_store: 'comercio',
  shoe_store: 'comercio',
  toy_store: 'comercio',
  liquor_store: 'comercio',
  convenience_store: 'comercio',
  discount_store: 'comercio',
  grocery_store: 'comercio',
  market: 'comercio',
  hardware_store: 'comercio',
  // Servicios
  lawyer: 'servicios',
  real_estate_agency: 'servicios',
  insurance_agency: 'servicios',
  accounting: 'servicios',
  plumber: 'servicios',
  electrician: 'servicios',
  travel_agency: 'servicios',
  bank: 'servicios',
  post_office: 'servicios',
  city_hall: 'servicios',
  financial_institution: 'servicios',
  local_government_office: 'servicios',
  embassy: 'servicios',
  courthouse: 'servicios',
};

/**
 * Devuelve la categoría de un establecimiento a partir de sus tipos reales de
 * Google Places. La estructura que recibe admite `primaryType` y/o `types[]`.
 *
 * LIMITACIÓN ACTUAL: mientras la Edge Function `search-places` no solicite estos
 * campos (ni `get-place-details` esté versionado), el establecimiento no tendrá
 * `primaryType`/`types` y la función devuelve la categoría genérica. No se
 * inventan categorías a partir de texto presentacional.
 */
export function categoriaDePlace(place: Pick<PlaceResult, 'primaryType' | 'types'> | null | undefined): BusinessCategory {
  if (!place) return CATEGORIES.generico;

  const candidatos: string[] = [];
  if (typeof place.primaryType === 'string' && place.primaryType.trim()) {
    candidatos.push(place.primaryType.trim());
  }
  if (Array.isArray(place.types)) {
    for (const t of place.types) {
      if (typeof t === 'string' && t.trim()) candidatos.push(t.trim());
    }
  }

  for (const tipo of candidatos) {
    if (tipo in TYPE_TO_CATEGORY) {
      return CATEGORIES[TYPE_TO_CATEGORY[tipo]];
    }
  }

  return CATEGORIES.generico;
}

/** Comprueba si una categoría permite una capacidad concreta. */
export function categoríaPermite(category: BusinessCategory, capacidad: CapacityId): boolean {
  return category.capacidades.includes(capacidad);
}
