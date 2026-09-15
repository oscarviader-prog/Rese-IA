import React from 'react';
import { CalendarClock } from 'lucide-react';
import { CAPACITY_LABELS, CapacityId } from '../lib/categories';

/**
 * Presentación no operativa de una capacidad aún sin flujo implementado.
 *
 * Muestra la acción que la categoría del establecimiento permite, pero marcada
 * explícitamente como "No disponible todavía": no hay botón que aparente
 * funcionar ni se simula una reserva/cita/presupuesto inexistente. Sirve para
 * dejar preparada la arquitectura (categoría → capacidades → acciones) sin
 * maquetar funcionalidades falsas.
 */

interface ConsumerFutureActionCardProps {
  capacity: CapacityId;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  placeName: string;
}

export const ConsumerFutureActionCard: React.FC<ConsumerFutureActionCardProps> = ({
  capacity,
  description,
  icon: Icon,
  placeName,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
        {Icon ? <Icon className="w-5 h-5" /> : <CalendarClock className="w-5 h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-gray-900">
            {CAPACITY_LABELS[capacity]} en {placeName}
          </h4>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-semibold uppercase tracking-wide">
            No disponible todavía
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
};