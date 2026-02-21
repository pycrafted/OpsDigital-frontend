/**
 * API client pour le tableau Analyses du laboratoire.
 */
import type { AnalyseRow } from '../data/analysesLaboratoire';
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

/**
 * Charge les lignes pour une date (format attendu par le tableau).
 */
export async function fetchAnalysesByDate(
  date: string
): Promise<AnalyseRow[]> {
  const res = await fetch(
    `${API_BASE}/api/analyses-laboratoire/by-date/?date=${encodeURIComponent(date)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const rows = (await res.json()) as AnalyseRow[];
  return rows;
}

/**
 * Charge les données pour une plage de dates (une requête).
 * Retourne { "YYYY-MM-DD": [ rows ], ... }.
 */
export async function fetchAnalysesByDateRange(
  start: string,
  end: string
): Promise<Record<string, AnalyseRow[]>> {
  const res = await fetch(
    `${API_BASE}/api/analyses-laboratoire/by-date-range/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return (await res.json()) as Record<string, AnalyseRow[]>;
}

/**
 * Enregistre toutes les lignes pour une date (bulk).
 */
export async function saveAnalysesBulk(
  date: string,
  rows: AnalyseRow[]
): Promise<AnalyseRow[]> {
  const res = await fetch(`${API_BASE}/api/analyses-laboratoire/bulk-by-date/`, {
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
  return (await res.json()) as AnalyseRow[];
}
