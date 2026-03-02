import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ProductKey } from '../data/analysesLaboratoire';
import { ANALYSES_MEASURE_NAMES, products } from '../data/analysesLaboratoire';

const STORAGE_KEY = 'analysesLaboBounds';

export type BoundsPerMeasure = Record<string, { min: string; max: string }>;
export type BoundsState = Partial<Record<ProductKey, BoundsPerMeasure>>;

function loadStored(): BoundsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BoundsState;
      return parsed ?? {};
    }
  } catch (_) {}
  return {};
}

function saveStored(state: BoundsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function emptyBoundsPerMeasure(): BoundsPerMeasure {
  const o: BoundsPerMeasure = {};
  ANALYSES_MEASURE_NAMES.forEach((name) => {
    o[name] = { min: '', max: '' };
  });
  return o;
}

interface ContextValue {
  /** Bornes min/max pour un produit et une mesure. */
  getBounds: (product: ProductKey, measure: string) => { min: string; max: string };
  /** Indique si une valeur numérique est hors intervalle (min/max définis et value en dehors). */
  isOutOfBounds: (product: ProductKey, measure: string, value: string) => boolean;
  /** État complet des bornes (pour la page Settings). */
  bounds: BoundsState;
  /** Met à jour les bornes et persiste. */
  setBounds: (updater: (prev: BoundsState) => BoundsState) => void;
  /** Produits et noms de mesures (ordre). */
  products: readonly ProductKey[];
  measureNames: readonly string[];
}

const AnalysesLaboBoundsContext = createContext<ContextValue | null>(null);

export function AnalysesLaboBoundsProvider({ children }: { children: React.ReactNode }) {
  const [bounds, setState] = useState<BoundsState>(loadStored);

  const setBounds = useCallback((updater: (prev: BoundsState) => BoundsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  // Synchroniser l’état avec le localStorage quand il est modifié depuis un autre onglet (ex. Paramètres).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue != null) {
        try {
          const parsed = JSON.parse(e.newValue) as BoundsState;
          setState(parsed ?? {});
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getBounds = useCallback((product: ProductKey, measure: string) => {
    const perProduct = bounds[product];
    if (!perProduct) {
      console.log('[Bornes] getBounds', { product, measure, result: 'pas de bornes pour ce produit' });
      return { min: '', max: '' };
    }
    const measureNorm = (measure ?? '').trim();
    const exact = perProduct[measure];
    if (exact !== undefined) return exact;
    const normalized = ANALYSES_MEASURE_NAMES.find(
      (m) => m.toLowerCase() === measureNorm.toLowerCase()
    );
    const resolved = normalized ? perProduct[normalized] : undefined;
    if (resolved !== undefined) return resolved;
    const keyMatch = Object.keys(perProduct).find(
      (k) => k.trim().toLowerCase() === measureNorm.toLowerCase()
    );
    const result = keyMatch ? (perProduct[keyMatch] ?? { min: '', max: '' }) : { min: '', max: '' };
    if (!keyMatch || (result.min === '' && result.max === '')) {
      console.log('[Bornes] getBounds', {
        product,
        measure,
        measureNorm,
        keysDispo: Object.keys(perProduct),
        keyMatch: keyMatch ?? null,
        result,
      });
    }
    return result;
  }, [bounds]);

  const isOutOfBounds = useCallback(
    (product: ProductKey, measure: string, value: string): boolean => {
      const v = value.trim().replace(',', '.');
      if (v === '') return false;
      const num = parseFloat(v);
      if (Number.isNaN(num)) return false;
      const { min, max } = getBounds(product, measure);
      const minNum = min.trim() === '' ? null : parseFloat(min.replace(',', '.'));
      const maxNum = max.trim() === '' ? null : parseFloat(max.replace(',', '.'));
      const oob = (minNum != null && num < minNum) || (maxNum != null && num > maxNum);
      if (oob) {
        console.log('[Bornes] isOutOfBounds=true', { product, measure, value: num, min, max, minNum, maxNum });
      }
      return oob;
    },
    [getBounds]
  );

  const value = useMemo<ContextValue>(
    () => ({
      getBounds,
      isOutOfBounds,
      bounds,
      setBounds,
      products,
      measureNames: ANALYSES_MEASURE_NAMES,
    }),
    [getBounds, isOutOfBounds, bounds, setBounds]
  );

  return (
    <AnalysesLaboBoundsContext.Provider value={value}>
      {children}
    </AnalysesLaboBoundsContext.Provider>
  );
}

export function useAnalysesLaboBounds(): ContextValue {
  const ctx = useContext(AnalysesLaboBoundsContext);
  if (!ctx) {
    return {
      getBounds: () => ({ min: '', max: '' }),
      isOutOfBounds: () => false,
      bounds: {},
      setBounds: () => {},
      products,
      measureNames: ANALYSES_MEASURE_NAMES,
    };
  }
  return ctx;
}

/** Retourne l'état des bornes pour un produit (toutes mesures), avec valeurs par défaut. */
export function getBoundsForProduct(bounds: BoundsState, product: ProductKey): BoundsPerMeasure {
  const existing = bounds[product];
  const result = emptyBoundsPerMeasure();
  if (existing) {
    ANALYSES_MEASURE_NAMES.forEach((name) => {
      result[name] = existing[name] ?? { min: '', max: '' };
    });
  }
  return result;
}
