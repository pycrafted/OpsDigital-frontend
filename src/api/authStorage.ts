/**
 * Stockage des tokens JWT (mémoire + persistance).
 * Utilisé par AuthContext et par les clients API pour l'en-tête Authorization.
 */
const STORAGE_KEY = 'opsdigital_tokens';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access;
  refreshToken = refresh;
  if (access && refresh) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ access, refresh }));
    } catch {
      // ignore
    }
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Charge les tokens depuis le localStorage (appelé au démarrage par AuthContext). */
export function loadTokensFromStorage(): { access: string; refresh: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { access?: string; refresh?: string };
    if (data?.access && data?.refresh) {
      accessToken = data.access;
      refreshToken = data.refresh;
      return { access: data.access, refresh: data.refresh };
    }
  } catch {
    // ignore
  }
  return null;
}

/** En-têtes à ajouter aux requêtes authentifiées. */
export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
