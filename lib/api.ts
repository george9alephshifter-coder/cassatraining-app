// lib/api.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

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