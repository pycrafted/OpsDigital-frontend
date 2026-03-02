import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'gazBounds';

export type GazBoundsState = Record<string, { min: string; max: string }>;

function loadStored(): GazBoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GazBoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: GazBoundsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  /** Bornes min/max pour une clé de colonne (ex. "c105"). */
  getBounds: (colKey: string) => { min: string; max: string };
  /** Indique si une valeur numérique est hors intervalle (min/max définis et value en dehors). */
  isOutOfBounds: (colKey: string, value: string) => boolean;
  /** État complet des bornes (pour la page Settings). */
  bounds: GazBoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: GazBoundsState) => GazBoundsState) => void;
}

const GazBoundsContext = createContext<ContextValue | null>(null);

export function GazBoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<GazBoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: GazBoundsState) => GazBoundsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  // Synchroniser l'état avec le localStorage si modifié depuis un autre onglet (ex. Paramètres).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue != null) {
        try {
          const parsed = JSON.parse(e.newValue) as GazBoundsState;
          setState(parsed ?? {});
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getBounds = useCallback((colKey: string) => {
    return bounds[colKey] ?? { min: '', max: '' };
  }, [bounds]);

  const isOutOfBounds = useCallback(
    (colKey: string, value: string): boolean => {
      const v = (value ?? '').trim().replace(',', '.');
      if (v === '') return false;
      const num = parseFloat(v);
      if (Number.isNaN(num)) return false;
      const { min, max } = getBounds(colKey);
      const minNum = min.trim() === '' ? null : parseFloat(min.replace(',', '.'));
      const maxNum = max.trim() === '' ? null : parseFloat(max.replace(',', '.'));
      return (minNum != null && num < minNum) || (maxNum != null && num > maxNum);
    },
    [getBounds]
  );

  const value = useMemo<ContextValue>(
    () => ({ getBounds, isOutOfBounds, bounds, setBounds }),
    [getBounds, isOutOfBounds, bounds, setBounds]
  );

  return (
    <GazBoundsContext.Provider value={value}>
      {children}
    </GazBoundsContext.Provider>
  );
}

export function useGazBounds(): ContextValue {
  const ctx = useContext(GazBoundsContext);
  if (!ctx) {
    return {
      getBounds: () => ({ min: '', max: '' }),
      isOutOfBounds: () => false,
      bounds: {},
      setBounds: () => {},
    };
  }
  return ctx;
}
