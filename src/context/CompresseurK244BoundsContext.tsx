import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'compresseurK244Bounds';

export type CompresseurK244BoundsState = Record<string, { min: string; max: string }>;

function loadStored(): CompresseurK244BoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompresseurK244BoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: CompresseurK244BoundsState) {
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
  bounds: CompresseurK244BoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: CompresseurK244BoundsState) => CompresseurK244BoundsState) => void;
}

const CompresseurK244BoundsContext = createContext<ContextValue | null>(null);

export function CompresseurK244BoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<CompresseurK244BoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: CompresseurK244BoundsState) => CompresseurK244BoundsState) => {
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
          const parsed = JSON.parse(e.newValue) as CompresseurK244BoundsState;
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
    <CompresseurK244BoundsContext.Provider value={value}>
      {children}
    </CompresseurK244BoundsContext.Provider>
  );
}

export function useCompresseurK244Bounds(): ContextValue {
  const ctx = useContext(CompresseurK244BoundsContext);
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
