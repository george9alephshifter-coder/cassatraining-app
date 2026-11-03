// lib/api.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://virtuous-boney-superjet.ngrok-free.dev";

// Cabeceras globales para todas las peticiones a la API
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

export function getApiUrl(): string {
  return API_BASE_URL;
}

// Types & Interfaces
export interface CalificacionPayload {
  estudiante_id: number;
  asignatura_id: number;
  nota: number;
}