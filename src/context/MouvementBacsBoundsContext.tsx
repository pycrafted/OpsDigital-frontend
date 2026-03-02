import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mouvementBacsBounds';

export type MouvementBacsBoundsState = Record<string, { min: string; max: string }>;

function loadStored(): MouvementBacsBoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MouvementBacsBoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: MouvementBacsBoundsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  /** Bornes min/max pour un produit (ex. "naphta sesulf"). */
  getBounds: (product: string) => { min: string; max: string };
  /** Indique si une valeur numérique est hors intervalle (min/max définis et value en dehors). */
  isOutOfBounds: (product: string, value: string) => boolean;
  /** État complet des bornes (pour la page Settings). */
  bounds: MouvementBacsBoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: MouvementBacsBoundsState) => MouvementBacsBoundsState) => void;
}

const MouvementBacsBoundsContext = createContext<ContextValue | null>(null);

export function MouvementBacsBoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<MouvementBacsBoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: MouvementBacsBoundsState) => MouvementBacsBoundsState) => {
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
          const parsed = JSON.parse(e.newValue) as MouvementBacsBoundsState;
          setState(parsed ?? {});
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getBounds = useCallback((product: string) => {
    return bounds[product] ?? { min: '', max: '' };
  }, [bounds]);

  const isOutOfBounds = useCallback(
    (product: string, value: string): boolean => {
      const v = (value ?? '').trim().replace(',', '.');
      if (v === '') return false;
      const num = parseFloat(v);
      if (Number.isNaN(num)) return false;
      const { min, max } = getBounds(product);
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
    <MouvementBacsBoundsContext.Provider value={value}>
      {children}
    </MouvementBacsBoundsContext.Provider>
  );
}

export function useMouvementBacsBounds(): ContextValue {
  const ctx = useContext(MouvementBacsBoundsContext);
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
