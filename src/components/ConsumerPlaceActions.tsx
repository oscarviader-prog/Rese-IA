import React from 'react';
import {
  Calendar,
  LogIn,
  UtensilsCrossed,
  BedDouble,
  CalendarCheck,
  Dumbbell,
  Bike,
  FileText,
} from 'lucide-react';
import { BusinessCategory, CAPACITY_LABELS, CapacityId } from '../lib/categories';
import { ConsumerFutureActionCard } from './ConsumerFutureActionCard';

/**
 * Acciones del establecimiento — arquitectura `categoría → capacidades → interfaz`.
 *
 * Este componente decide qué acciones mostrar a partir de las capacidades que la
 * categoría del establecimiento permite (ver `src/lib/categories.ts`), sin que
 * `ConsumerView` se llene de bloques por categoría.
 *
 * De cada capacidad permitida se muestra una tarjeta contextual. Las que tienen
 * flujo real implementado (`implemented: true`) renderizan el contenido funcional
 * que `ConsumerView` pasa como `children` (hoy solo `reserva_mesa`). Las demás se
 * muestran de forma **no operativa** (`ConsumerFutureActionCard`), claramente
 * marcadas como "No disponible todavía", para no aparentar ser funcionales sin
 * existir el flujo.
 */

export interface CapabilityAction {
  capacity: CapacityId;
  description: string;
  /** `true` si existe un flujo real implementado para esta capacidad. */
  implemented: boolean;
}

const CAPABILITY_ACTIONS: Record<CapacityId, CapabilityAction> = {
  reserva_mesa: {
    capacity: 'reserva_mesa',
    description: 'Reserva una mesa en este establecimiento.',
    implemented: true,
  },
  solicitar_cita: {
    capacity: 'solicitar_cita',
    description: 'Solicita una cita en este establecimiento.',
    implemented: false,
  },
  reservar_estancia: {
    capacity: 'reservar_estancia',
    description: 'Reserva tu estancia en este establecimiento.',
    implemented: false,
  },
  reservar_actividad: {
    capacity: 'reservar_actividad',
    description: 'Reserva una actividad en este establecimiento.',
    implemented: false,
  },
  pedir_domicilio: {
    capacity: 'pedir_domicilio',
    description: 'Pide a domicilio en este establecimiento.',
    implemented: false,
  },
  solicitar_presupuesto: {
    capacity: 'solicitar_presupuesto',
    description: 'Solicita un presupuesto en este establecimiento.',
    implemented: false,
  },
};

/** Icono de presentación por capacidad (decisión visual, no lógica de categoría). */
const CAPACITY_ICONS: Record<CapacityId, React.ComponentType<{ className?: string }>> = {
  reserva_mesa: UtensilsCrossed,
  solicitar_cita: CalendarCheck,
  reservar_estancia: BedDouble,
  reservar_actividad: Dumbbell,
  pedir_domicilio: Bike,
  solicitar_presupuesto: FileText,
};

interface ConsumerPlaceActionsProps {
  category: BusinessCategory;
  placeName: string;
  isConsumerAuthed: boolean;
  /**
   * Contenido funcional de la(s) acción(es) implementada(s). Hoy solo `reserva_mesa`
   * está implementada, así que se pasa el formulario real desde `ConsumerView`.
   * Solo se renderiza bajo la tarjeta de una capacidad implementada.
   */
  children?: React.ReactNode;
}

export const ConsumerPlaceActions: React.FC<ConsumerPlaceActionsProps> = ({
  category,
  placeName,
  isConsumerAuthed,
  children,
}) => {
  const actions = category.capacidades
    .map((c) => CAPABILITY_ACTIONS[c])
    .filter((a): a is CapabilityAction => a !== undefined);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {actions.map((action) => {
        const Icon = CAPACITY_ICONS[action.capacity] || Calendar;

        // Capacidad sin flujo implementado: se muestra de forma no operativa,
        // marcada como "No disponible todavía". Nunca un botón que aparente
        // funcionar ni una simulación de reserva/cita/presupuesto.
        if (!action.implemented) {
          return (
            <ConsumerFutureActionCard
              key={action.capacity}
              capacity={action.capacity}
              description={action.description}
              icon={Icon}
              placeName={placeName}
            />
          );
        }

        return (
          <div key={action.capacity}>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-teal-600" />
              {CAPACITY_LABELS[action.capacity]} en {placeName}
            </h3>

            {isConsumerAuthed ? (
              children
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {CAPACITY_LABELS[action.capacity]} en {placeName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Inicia sesión para {action.description}
                  </p>
                </div>
                <LogIn className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};