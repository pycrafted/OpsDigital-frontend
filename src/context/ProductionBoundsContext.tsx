import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'productionBounds';

export type ProductionBoundsState = Record<string, { min: string; max: string }>;

function loadStored(): ProductionBoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProductionBoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: ProductionBoundsState) {
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
  bounds: ProductionBoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: ProductionBoundsState) => ProductionBoundsState) => void;
}

const ProductionBoundsContext = createContext<ContextValue | null>(null);

export function ProductionBoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<ProductionBoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: ProductionBoundsState) => ProductionBoundsState) => {
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
          const parsed = JSON.parse(e.newValue) as ProductionBoundsState;
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
    <ProductionBoundsContext.Provider value={value}>
      {children}
    </ProductionBoundsContext.Provider>
  );
}

export function useProductionBounds(): ContextValue {
  const ctx = useContext(ProductionBoundsContext);
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
