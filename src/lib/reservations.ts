import { supabase } from "./supabase";
import { Reservation } from "../types";

export async function createReservation(reservation: Reservation) {
  if (!supabase) throw new Error("Supabase no está configurado");

  const { data, error } = await supabase
    .from("reservations")
    .insert([reservation]);

  if (error) throw error;

  return data;
}
