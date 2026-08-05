import { createReservation } from "../lib/reservations";
import React from "react";

export default function ReservationModal() {
  const [businessName, setBusinessName] = React.useState("");
  const [reservationDate, setReservationDate] = React.useState("");
  const [reservationTime, setReservationTime] = React.useState("");
  const [people, setPeople] = React.useState(1);
  const [notes, setNotes] = React.useState("");
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
await createReservation({
  id: crypto.randomUUID(),
  user_id: "",
  business_name: businessName,
  reservation_date: reservationDate,
  reservation_time: reservationTime,
  people: people,
  notes: notes,
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

<input
  type="text"
  placeholder="Nombre del establecimiento"
  className="w-full border rounded-lg p-2"
  value={businessName}
  onChange={(e) => setBusinessName(e.target.value)}
/>

<input
  type="date"
  className="w-full border rounded-lg p-2"
  value={reservationDate}
  onChange={(e) => setReservationDate(e.target.value)}
/>

<input
  type="time"
  className="w-full border rounded-lg p-2"
  value={reservationTime}
  onChange={(e) => setReservationTime(e.target.value)}
/>

<input
  type="number"
  min="1"
  placeholder="Número de personas"
  className="w-full border rounded-lg p-2"
  value={people}
  onChange={(e) => setPeople(Number(e.target.value))}
/>

<textarea
  placeholder="Observaciones"
  className="w-full border rounded-lg p-2"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
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
