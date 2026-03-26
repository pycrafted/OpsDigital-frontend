/**
 * API client pour la configuration des tags IP21.
 */
import { getAuthHeaders } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';

export interface TagsIp21ConfigItem {
  feuille_id: string;
  field_key: string;
  source: 'manual' | 'sap' | 'ip21';
  ip21_tag: string;
}

export async function fetchTagsIp21Config(): Promise<TagsIp21ConfigItem[]> {
  const res = await fetch(`${API_BASE}/api/tags-ip21/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as TagsIp21ConfigItem[];
}

export async function bulkUpdateTagsIp21Config(
  items: TagsIp21ConfigItem[]
): Promise<TagsIp21ConfigItem[]> {
  const res = await fetch(`${API_BASE}/api/tags-ip21/bulk-update/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(items),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const detail =
      (err['error'] as string | undefined) ||
      (Array.isArray(err['errors']) ? `Erreurs de validation : ${JSON.stringify(err['errors'])}` : undefined) ||
      `Erreur HTTP ${res.status}`;
    throw new Error(detail);
  }
  return (await res.json()) as TagsIp21ConfigItem[];
}

export interface TestTagResult {
  ok: boolean;
  message: string;
  value?: number | null;
  unit?: string | null;
  description?: string | null;
}

/**
 * Teste si un tag IP21 est accessible et retourne sa valeur courante.
 */
export async function testIp21Tag(tag: string): Promise<TestTagResult> {
  const res = await fetch(`${API_BASE}/api/tags-ip21/test-tag/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ tag }),
  });
  return (await res.json()) as TestTagResult;
}
