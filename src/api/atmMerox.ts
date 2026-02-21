/**
 * API client pour le tableau Atm/merox & pré flash.
 */
import type { HourRow } from '../data/atmMeroxPreFlash';
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

/**
 * Charge les lignes pour une date (format attendu par le tableau).
 */
export async function fetchAtmMeroxByDate(
  date: string
): Promise<HourRow[]> {
  const res = await fetch(
    `${API_BASE}/api/atm-merox/by-date/?date=${encodeURIComponent(date)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const rows = (await res.json()) as HourRow[];
  return rows;
}

/**
 * Charge les données pour une plage de dates (une requête).
 * Retourne { "YYYY-MM-DD": [ rows ], ... }.
 */
export async function fetchAtmMeroxByDateRange(
  start: string,
  end: string
): Promise<Record<string, HourRow[]>> {
  const res = await fetch(
    `${API_BASE}/api/atm-merox/by-date-range/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return (await res.json()) as Record<string, HourRow[]>;
}

/**
 * Enregistre toutes les lignes pour une date (bulk).
 */
export async function saveAtmMeroxBulk(
  date: string,
  rows: HourRow[]
): Promise<HourRow[]> {
  const res = await fetch(`${API_BASE}/api/atm-merox/bulk-by-date/`, {
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
  return (await res.json()) as HourRow[];
}
