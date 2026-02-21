/**
 * API client pour le tableau Mouvement des bacs.
 */
import type { HourRowWithBacs } from '../data/mouvementDesBacs';
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

export interface BacTypeDto {
  id: number;
  name: string;
  order: number;
}

/**
 * Liste des types de bacs (T 543, T 544, …).
 */
export async function fetchMouvementBacsBacTypes(): Promise<BacTypeDto[]> {
  const res = await fetch(`${API_BASE}/api/mouvement-des-bacs/bac-types/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return (await res.json()) as BacTypeDto[];
}

/**
 * Charge les lignes pour une date (values + bacs par produit).
 */
export async function fetchMouvementBacsByDate(date: string): Promise<HourRowWithBacs[]> {
  const res = await fetch(
    `${API_BASE}/api/mouvement-des-bacs/by-date/?date=${encodeURIComponent(date)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const rows = (await res.json()) as HourRowWithBacs[];
  return rows;
}

/**
 * Charge les données pour une plage de dates (une requête).
 * Retourne { "YYYY-MM-DD": [ { hour, values, bacs? }, ... ], ... }.
 */
export async function fetchMouvementBacsByDateRange(
  start: string,
  end: string
): Promise<Record<string, HourRowWithBacs[]>> {
  const res = await fetch(
    `${API_BASE}/api/mouvement-des-bacs/by-date-range/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return (await res.json()) as Record<string, HourRowWithBacs[]>;
}

/**
 * Enregistre toutes les lignes pour une date (bulk). Chaque ligne peut avoir values et bacs.
 */
export async function saveMouvementBacsBulk(
  date: string,
  rows: HourRowWithBacs[]
): Promise<HourRowWithBacs[]> {
  const res = await fetch(`${API_BASE}/api/mouvement-des-bacs/bulk-by-date/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ date, rows }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string })?.detail || `API error: ${res.status}`
    );
  }
  return (await res.json()) as HourRowWithBacs[];
}
