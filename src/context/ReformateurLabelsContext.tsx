import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  REFORMATEUR_CATEGORIES,
  REFORMATEUR_HOURS,
  reformateurHourLabels,
  type ReformateurHourKey,
} from '../data/reformateur';

const STORAGE_KEY = 'reformateurLabels';

const indicatorOptions: { key: string; label: string }[] = [];
REFORMATEUR_CATEGORIES.forEach((cat) => {
  cat.subRows.forEach((subRow) => {
    indicatorOptions.push({ key: `${cat.category}_${subRow}`, label: subRow });
  });
});

const defaultMeasureLabels: Record<string, string> = {};
indicatorOptions.forEach(({ key, label }) => {
  defaultMeasureLabels[key] = label;
});

const defaultCategoryKeys = REFORMATEUR_CATEGORIES.map((c) => c.category);
const defaultCategoryLabels: Record<string, string> = {};
REFORMATEUR_CATEGORIES.forEach((c) => {
  defaultCategoryLabels[c.category] = c.category;
});

export interface ReformateurLabelsState {
  hours: Partial<Record<ReformateurHourKey, string>>;
  categories: Partial<Record<string, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): ReformateurLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReformateurLabelsState;
      return {
        hours: parsed.hours ?? {},
        categories: parsed.categories ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, categories: {}, measures: {} };
}

function saveStored(state: ReformateurLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: ReformateurHourKey) => string;
  getCategoryLabel: (categoryKey: string) => string;
  getMeasureLabel: (measureKey: string) => string;
  customLabels: ReformateurLabelsState;
  setCustomLabels: (updater: (prev: ReformateurLabelsState) => ReformateurLabelsState) => void;
  defaultHourKeys: readonly ReformateurHourKey[];
  defaultCategoryKeys: readonly string[];
  defaultCategoryLabels: Record<string, string>;
  defaultMeasureKeys: readonly string[];
  defaultMeasureLabels: Record<string, string>;
}

const ReformateurLabelsContext = createContext<ContextValue | null>(null);

export function ReformateurLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<ReformateurLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: ReformateurLabelsState) => ReformateurLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: ReformateurHourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (reformateurHourLabels[key] ?? key);
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
      defaultHourKeys: REFORMATEUR_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    }),
    [getHourLabel, getCategoryLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <ReformateurLabelsContext.Provider value={value}>
      {children}
    </ReformateurLabelsContext.Provider>
  );
}

export function useReformateurLabels(): ContextValue {
  const ctx = useContext(ReformateurLabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: ReformateurHourKey) => reformateurHourLabels[key] ?? key,
      getCategoryLabel: (key: string) => defaultCategoryLabels[key] ?? key,
      getMeasureLabel: (key: string) => defaultMeasureLabels[key] ?? key,
      customLabels: { hours: {}, categories: {}, measures: {} },
      setCustomLabels: () => {},
      defaultHourKeys: REFORMATEUR_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    };
  }
  return ctx;
}
