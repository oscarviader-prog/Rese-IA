import { createReservation } from "../lib/reservations";
import React from "react";

export default function ReservationModal() {
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await createReservation({
      id: crypto.randomUUID(),
      user_id: "",
      business_name: "",
      reservation_date: "",
      reservation_time: "",
      people: 1,
      notes: "",
      status: "confirmed",
      created_at: new Date().toISOString(),
    });

    alert("Reserva creada");
  } catch (error) {
    console.error(error);
    alert("Error al crear la reserva");
  }
};
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Nueva reserva</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre del establecimiento"
          className="w-full border rounded-lg p-2"
        />

        <input
          type="date"
          className="w-full border rounded-lg p-2"
        />

        <input
          type="time"
          className="w-full border rounded-lg p-2"
        />

        <input
          type="number"
          min="1"
          placeholder="Número de personas"
          className="w-full border rounded-lg p-2"
        />

        <textarea
          placeholder="Observaciones"
          className="w-full border rounded-lg p-2"
        />

        <button
          type="submit"
          className="bg-cyan-700 text-white px-4 py-2 rounded-lg"
        >
          Reservar
        </button>
      </form>
    </div>
  );
}
