/**
 * API d'authentification (login, refresh, me).
 */
import { getAccessToken, getRefreshToken, setTokens } from './authStorage';

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';
const AUTH_BASE = `${API_BASE}/api/auth`;

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  poste: string;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface RefreshResponse {
  access: string;
}

/** Réponse erreur API (detail ou champs de validation). */
function readError(res: Response, body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body && typeof (body as { detail: unknown }).detail === 'string') {
    return (body as { detail: string }).detail;
  }
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    for (const key of ['current_password', 'new_password', 'email', 'password']) {
      const val = o[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
      if (typeof val === 'string') return val;
    }
  }
  return `Erreur ${res.status}`;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      throw new Error('E-mail ou mot de passe incorrect.');
    }
    throw new Error(readError(res, data));
  }
  const out = data as LoginResponse;
  setTokens(out.access, out.refresh);
  return out;
}

export async function refresh(): Promise<RefreshResponse> {
  const ref = getRefreshToken();
  if (!ref) throw new Error('Pas de token de rafraîchissement');
  const res = await fetch(`${AUTH_BASE}/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: ref }),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    throw new Error(readError(res, data));
  }
  const out = data as RefreshResponse;
  setTokens(out.access, ref);
  return out;
}

export async function getMe(accessTokenParam?: string | null): Promise<AuthUser> {
  const token = accessTokenParam ?? getAccessToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${AUTH_BASE}/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(readError(res, data));
  return data as AuthUser;
}

export interface UpdateMePayload {
  fullName?: string;
  poste?: string;
  email?: string;
}

export async function updateMe(
  payload: UpdateMePayload,
  accessTokenParam?: string | null
): Promise<AuthUser> {
  const token = accessTokenParam ?? getAccessToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${AUTH_BASE}/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(readError(res, data));
  return data as AuthUser;
}

export async function changePassword(newPassword: string): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${AUTH_BASE}/change-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(readError(res, data));
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const token = getAccessToken();
  if (!token) throw new Error('Non authentifié');
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await fetch(`${AUTH_BASE}/me/avatar/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(readError(res, data));
  return data as AuthUser;
}

export async function deleteAvatar(): Promise<AuthUser> {
  const token = getAccessToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${AUTH_BASE}/me/avatar/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(readError(res, data));
  return data as AuthUser;
}
