import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  ATM_MEROX_CATEGORIES,
  ATM_MEROX_HOURS,
  atmMeroxHourLabels,
  getAtmMeroxIndicateurOptions,
  type AtmMeroxHourKey,
} from '../data/atmMeroxPreFlash';

const STORAGE_KEY = 'atmMeroxLabels';

const indicatorOptions = getAtmMeroxIndicateurOptions();
const defaultMeasureLabels: Record<string, string> = {};
indicatorOptions.forEach(({ key, label }) => {
  defaultMeasureLabels[key] = label;
});

/** Clés des catégories (chaîne vide pour la catégorie vide). */
const defaultCategoryKeys = ATM_MEROX_CATEGORIES.map((c) => c.category);
const defaultCategoryLabels: Record<string, string> = {};
ATM_MEROX_CATEGORIES.forEach((c) => {
  defaultCategoryLabels[c.category] = c.category || '—';
});

export interface AtmMeroxLabelsState {
  hours: Partial<Record<AtmMeroxHourKey, string>>;
  categories: Partial<Record<string, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): AtmMeroxLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AtmMeroxLabelsState;
      return {
        hours: parsed.hours ?? {},
        categories: parsed.categories ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, categories: {}, measures: {} };
}

function saveStored(state: AtmMeroxLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: AtmMeroxHourKey) => string;
  getCategoryLabel: (categoryKey: string) => string;
  getMeasureLabel: (measureKey: string) => string;
  customLabels: AtmMeroxLabelsState;
  setCustomLabels: (updater: (prev: AtmMeroxLabelsState) => AtmMeroxLabelsState) => void;
  defaultHourKeys: readonly AtmMeroxHourKey[];
  defaultCategoryKeys: readonly string[];
  defaultCategoryLabels: Record<string, string>;
  defaultMeasureKeys: readonly string[];
  defaultMeasureLabels: Record<string, string>;
}

const AtmMeroxLabelsContext = createContext<ContextValue | null>(null);

export function AtmMeroxLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<AtmMeroxLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: AtmMeroxLabelsState) => AtmMeroxLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: AtmMeroxHourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (atmMeroxHourLabels[key] ?? key);
  }, [customLabels.hours]);

  const getCategoryLabel = useCallback((categoryKey: string) => {
    const v = customLabels.categories[categoryKey];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultCategoryLabels[categoryKey] ?? (categoryKey || '—'));
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
      defaultHourKeys: ATM_MEROX_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    }),
    [getHourLabel, getCategoryLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <AtmMeroxLabelsContext.Provider value={value}>
      {children}
    </AtmMeroxLabelsContext.Provider>
  );
}

export function useAtmMeroxLabels(): ContextValue {
  const ctx = useContext(AtmMeroxLabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: AtmMeroxHourKey) => atmMeroxHourLabels[key] ?? key,
      getCategoryLabel: (key: string) => defaultCategoryLabels[key] ?? (key || '—'),
      getMeasureLabel: (key: string) => defaultMeasureLabels[key] ?? key,
      customLabels: { hours: {}, categories: {}, measures: {} },
      setCustomLabels: () => {},
      defaultHourKeys: ATM_MEROX_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    };
  }
  return ctx;
}
