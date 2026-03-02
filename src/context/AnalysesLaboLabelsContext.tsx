import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { HourKey, ProductKey } from '../data/analysesLaboratoire';
import { ANALYSES_MEASURE_NAMES, hourLabels, productLabels } from '../data/analysesLaboratoire';

const STORAGE_KEY = 'analysesLaboLabels';

export interface AnalysesLaboLabelsState {
  products: Partial<Record<ProductKey, string>>;
  hours: Partial<Record<HourKey, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): AnalysesLaboLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnalysesLaboLabelsState;
      return {
        products: parsed.products ?? {},
        hours: parsed.hours ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { products: {}, hours: {}, measures: {} };
}

function saveStored(state: AnalysesLaboLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  /** Libellé affiché pour un produit (colonne). */
  getProductLabel: (key: ProductKey) => string;
  /** Libellé affiché pour un créneau horaire. */
  getHourLabel: (key: HourKey) => string;
  /** Libellé affiché pour une mesure (ligne). */
  getMeasureLabel: (measureName: string) => string;
  /** État complet des libellés personnalisés (pour la page Settings). */
  customLabels: AnalysesLaboLabelsState;
  /** Met à jour les libellés et persiste. */
  setCustomLabels: (updater: (prev: AnalysesLaboLabelsState) => AnalysesLaboLabelsState) => void;
  /** Noms des mesures par défaut (ordre). */
  defaultMeasureNames: readonly string[];
}

const AnalysesLaboLabelsContext = createContext<ContextValue | null>(null);

export function AnalysesLaboLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<AnalysesLaboLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: AnalysesLaboLabelsState) => AnalysesLaboLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getProductLabel = useCallback((key: ProductKey) => {
    const v = customLabels.products[key];
    return (v != null && v.trim() !== '') ? v.trim() : productLabels[key];
  }, [customLabels.products]);

  const getHourLabel = useCallback((key: HourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : hourLabels[key];
  }, [customLabels.hours]);

  const getMeasureLabel = useCallback((measureName: string) => {
    const v = customLabels.measures[measureName];
    return (v != null && v.trim() !== '') ? v.trim() : measureName;
  }, [customLabels.measures]);

  const value = useMemo<ContextValue>(
    () => ({
      getProductLabel,
      getHourLabel,
      getMeasureLabel,
      customLabels,
      setCustomLabels,
      defaultMeasureNames: ANALYSES_MEASURE_NAMES,
    }),
    [getProductLabel, getHourLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <AnalysesLaboLabelsContext.Provider value={value}>
      {children}
    </AnalysesLaboLabelsContext.Provider>
  );
}

export function useAnalysesLaboLabels(): ContextValue {
  const ctx = useContext(AnalysesLaboLabelsContext);
  if (!ctx) {
    return {
      getProductLabel: (key: ProductKey) => productLabels[key],
      getHourLabel: (key: HourKey) => hourLabels[key],
      getMeasureLabel: (name: string) => name,
      customLabels: { products: {}, hours: {}, measures: {} },
      setCustomLabels: () => {},
      defaultMeasureNames: ANALYSES_MEASURE_NAMES,
    };
  }
  return ctx;
}
