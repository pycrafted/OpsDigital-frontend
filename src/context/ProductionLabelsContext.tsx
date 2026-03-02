import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  PRODUCTION_CATEGORIES,
  PRODUCTION_HOURS,
  productionHourLabels,
  getProductionIndicateurOptions,
  type ProductionHourKey,
} from '../data/production';

const STORAGE_KEY = 'productionLabels';

const indicatorOptions = getProductionIndicateurOptions();
const defaultMeasureLabels: Record<string, string> = {};
indicatorOptions.forEach(({ key, label }) => {
  defaultMeasureLabels[key] = label;
});

const defaultCategoryKeys = PRODUCTION_CATEGORIES.map((c) => c.category);
const defaultCategoryLabels: Record<string, string> = {};
PRODUCTION_CATEGORIES.forEach((c) => {
  defaultCategoryLabels[c.category] = c.category;
});

export interface ProductionLabelsState {
  hours: Partial<Record<ProductionHourKey, string>>;
  categories: Partial<Record<string, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): ProductionLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProductionLabelsState;
      return {
        hours: parsed.hours ?? {},
        categories: parsed.categories ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, categories: {}, measures: {} };
}

function saveStored(state: ProductionLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: ProductionHourKey) => string;
  getCategoryLabel: (categoryKey: string) => string;
  getMeasureLabel: (measureKey: string) => string;
  customLabels: ProductionLabelsState;
  setCustomLabels: (updater: (prev: ProductionLabelsState) => ProductionLabelsState) => void;
  defaultHourKeys: readonly ProductionHourKey[];
  defaultCategoryKeys: readonly string[];
  defaultCategoryLabels: Record<string, string>;
  defaultMeasureKeys: readonly string[];
  defaultMeasureLabels: Record<string, string>;
}

const ProductionLabelsContext = createContext<ContextValue | null>(null);

export function ProductionLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<ProductionLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: ProductionLabelsState) => ProductionLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: ProductionHourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (productionHourLabels[key] ?? key);
  }, [customLabels.hours]);

  const getCategoryLabel = useCallback((categoryKey: string) => {
    const v = customLabels.categories[categoryKey];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultCategoryLabels[categoryKey] ?? categoryKey);
  }, [customLabels.categories]);

  const getMeasureLabel = useCallback((measureKey: string) => {
    const v = customLabels.measures[measureKey];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultMeasureLabels[measureKey] ?? measureKey);
  }, [customLabels.measures]);

  const value = useMemo<ContextValue>(
    () => ({
      getHourLabel,
      getCategoryLabel,
      getMeasureLabel,
      customLabels,
      setCustomLabels,
      defaultHourKeys: PRODUCTION_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    }),
    [getHourLabel, getCategoryLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <ProductionLabelsContext.Provider value={value}>
      {children}
    </ProductionLabelsContext.Provider>
  );
}

export function useProductionLabels(): ContextValue {
  const ctx = useContext(ProductionLabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: ProductionHourKey) => productionHourLabels[key] ?? key,
      getCategoryLabel: (key: string) => defaultCategoryLabels[key] ?? key,
      getMeasureLabel: (key: string) => defaultMeasureLabels[key] ?? key,
      customLabels: { hours: {}, categories: {}, measures: {} },
      setCustomLabels: () => {},
      defaultHourKeys: PRODUCTION_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    };
  }
  return ctx;
}
