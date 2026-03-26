/**
 * API client pour les parametres de configuration des tableaux (ordre des colonnes).
 */
import { getAuthHeaders } from './authStorage';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

export async function fetchTableSettings(feuilleId: string): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${API_BASE}/api/table-settings/?feuille_id=${encodeURIComponent(feuilleId)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function saveTableSettings(
  feuilleId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/table-settings/save/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ feuille_id: feuilleId, settings }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}
