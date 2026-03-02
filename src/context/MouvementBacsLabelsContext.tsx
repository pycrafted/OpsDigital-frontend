import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MOUVEMENT_BACS_PRODUCTS,
  MOUVEMENT_BACS_HOURS,
  type MouvementBacsHourKey,
} from '../data/mouvementDesBacs';

const STORAGE_KEY = 'mouvementBacsLabels';

const defaultHourLabels: Record<MouvementBacsHourKey, string> = Object.fromEntries(
  MOUVEMENT_BACS_HOURS.map((h) => [h, h])
) as Record<MouvementBacsHourKey, string>;

const defaultProductLabels: Record<string, string> = Object.fromEntries(
  MOUVEMENT_BACS_PRODUCTS.map((p) => [p, p])
);

export interface MouvementBacsLabelsState {
  hours: Partial<Record<MouvementBacsHourKey, string>>;
  products: Partial<Record<string, string>>;
}

function loadStored(): MouvementBacsLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MouvementBacsLabelsState;
      return {
        hours: parsed.hours ?? {},
        products: parsed.products ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, products: {} };
}

function saveStored(state: MouvementBacsLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: MouvementBacsHourKey) => string;
  getProductLabel: (product: string) => string;
  customLabels: MouvementBacsLabelsState;
  setCustomLabels: (updater: (prev: MouvementBacsLabelsState) => MouvementBacsLabelsState) => void;
  defaultHourKeys: readonly MouvementBacsHourKey[];
  defaultProductKeys: readonly string[];
  defaultHourLabels: Record<MouvementBacsHourKey, string>;
  defaultProductLabels: Record<string, string>;
}

const MouvementBacsLabelsContext = createContext<ContextValue | null>(null);

export function MouvementBacsLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<MouvementBacsLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: MouvementBacsLabelsState) => MouvementBacsLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: MouvementBacsHourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultHourLabels[key] ?? key);
  }, [customLabels.hours]);

  const getProductLabel = useCallback((product: string) => {
    const v = customLabels.products[product];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultProductLabels[product] ?? product);
  }, [customLabels.products]);

  const value = useMemo<ContextValue>(
    () => ({
      getHourLabel,
      getProductLabel,
      customLabels,
      setCustomLabels,
      defaultHourKeys: MOUVEMENT_BACS_HOURS,
      defaultProductKeys: MOUVEMENT_BACS_PRODUCTS,
      defaultHourLabels,
      defaultProductLabels,
    }),
    [getHourLabel, getProductLabel, customLabels, setCustomLabels]
  );

  return (
    <MouvementBacsLabelsContext.Provider value={value}>
      {children}
    </MouvementBacsLabelsContext.Provider>
  );
}

export function useMouvementBacsLabels(): ContextValue {
  const ctx = useContext(MouvementBacsLabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: MouvementBacsHourKey) => defaultHourLabels[key] ?? key,
      getProductLabel: (product: string) => defaultProductLabels[product] ?? product,
      customLabels: { hours: {}, products: {} },
      setCustomLabels: () => {},
      defaultHourKeys: MOUVEMENT_BACS_HOURS,
      defaultProductKeys: MOUVEMENT_BACS_PRODUCTS,
      defaultHourLabels,
      defaultProductLabels,
    };
  }
  return ctx;
}
