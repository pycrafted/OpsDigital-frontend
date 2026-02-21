/**
 * API client pour le tableau Compresseur K 245.
 */
import type { HourRow } from '../data/compresseurK245';
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

/**
 * Charge les lignes pour une date (format attendu par le tableau).
 */
export async function fetchCompresseurK245ByDate(
  date: string
): Promise<HourRow[]> {
  const res = await fetch(
    `${API_BASE}/api/compresseur-k245/by-date/?date=${encodeURIComponent(date)}`,
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
export async function fetchCompresseurK245ByDateRange(
  start: string,
  end: string
): Promise<Record<string, HourRow[]>> {
  const res = await fetch(
    `${API_BASE}/api/compresseur-k245/by-date-range/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
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
export async function saveCompresseurK245Bulk(
  date: string,
  rows: HourRow[]
): Promise<HourRow[]> {
  const res = await fetch(`${API_BASE}/api/compresseur-k245/bulk-by-date/`, {
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
