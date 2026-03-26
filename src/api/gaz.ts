/**
 * API client pour le tableau Gaz.
 */
import type { HourRow } from '../data/gaz';
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

/**
 * Charge les lignes pour une date (format attendu par le tableau).
 */
export async function fetchGazByDate(date: string): Promise<HourRow[]> {
  const res = await fetch(
    `${API_BASE}/api/gaz/by-date/?date=${encodeURIComponent(date)}`,
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
export async function fetchGazByDateRange(
  start: string,
  end: string
): Promise<Record<string, HourRow[]>> {
  const res = await fetch(
    `${API_BASE}/api/gaz/by-date-range/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return (await res.json()) as Record<string, HourRow[]>;
}

/**
 * Télécharge le tableau Gaz sur une plage de dates en format Excel (.xlsx).
 * Un onglet par jour dans le fichier généré.
 */
export async function exportGazExcel(start: string, end: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/gaz/export-excel/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) {
    throw new Error(`Erreur export: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gaz_${start}_${end}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Enregistre toutes les lignes pour une date (bulk).
 */
export async function saveGazBulk(
  date: string,
  rows: HourRow[]
): Promise<HourRow[]> {
  const res = await fetch(`${API_BASE}/api/gaz/bulk-by-date/`, {
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
