import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'atmMeroxBounds';

export type AtmMeroxBoundsState = Record<string, { min: string; max: string }>;

function loadStored(): AtmMeroxBoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AtmMeroxBoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: AtmMeroxBoundsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  /** Bornes min/max pour une clé composite (category_subRow). */
  getBounds: (measureKey: string) => { min: string; max: string };
  /** Indique si une valeur numérique est hors intervalle (min/max définis et value en dehors). */
  isOutOfBounds: (measureKey: string, value: string) => boolean;
  /** État complet des bornes (pour la page Settings). */
  bounds: AtmMeroxBoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: AtmMeroxBoundsState) => AtmMeroxBoundsState) => void;
}

const AtmMeroxBoundsContext = createContext<ContextValue | null>(null);

export function AtmMeroxBoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<AtmMeroxBoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: AtmMeroxBoundsState) => AtmMeroxBoundsState) => {
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
          const parsed = JSON.parse(e.newValue) as AtmMeroxBoundsState;
          setState(parsed ?? {});
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getBounds = useCallback((measureKey: string) => {
    return bounds[measureKey] ?? { min: '', max: '' };
  }, [bounds]);

  const isOutOfBounds = useCallback(
    (measureKey: string, value: string): boolean => {
      const v = (value ?? '').trim().replace(',', '.');
      if (v === '') return false;
      const num = parseFloat(v);
      if (Number.isNaN(num)) return false;
      const { min, max } = getBounds(measureKey);
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
    <AtmMeroxBoundsContext.Provider value={value}>
      {children}
    </AtmMeroxBoundsContext.Provider>
  );
}

export function useAtmMeroxBounds(): ContextValue {
  const ctx = useContext(AtmMeroxBoundsContext);
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
