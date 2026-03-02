import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  COMPRESSEUR_K244_CATEGORIES,
  COMPRESSEUR_K244_HOURS,
  compresseurK244HourLabels,
  getCompresseurK244IndicateurOptions,
  type CompresseurK244HourKey,
} from '../data/compresseurK244';

const STORAGE_KEY = 'compresseurK244Labels';

const indicatorOptions = getCompresseurK244IndicateurOptions();
const defaultMeasureLabels: Record<string, string> = {};
indicatorOptions.forEach(({ key, label }) => {
  defaultMeasureLabels[key] = label;
});

const defaultCategoryKeys = COMPRESSEUR_K244_CATEGORIES.map((c) => c.category);
const defaultCategoryLabels: Record<string, string> = {};
COMPRESSEUR_K244_CATEGORIES.forEach((c) => {
  defaultCategoryLabels[c.category] = c.category;
});

export interface CompresseurK244LabelsState {
  hours: Partial<Record<CompresseurK244HourKey, string>>;
  categories: Partial<Record<string, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): CompresseurK244LabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompresseurK244LabelsState;
      return {
        hours: parsed.hours ?? {},
        categories: parsed.categories ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, categories: {}, measures: {} };
}

function saveStored(state: CompresseurK244LabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: CompresseurK244HourKey) => string;
  getCategoryLabel: (categoryKey: string) => string;
  getMeasureLabel: (measureKey: string) => string;
  customLabels: CompresseurK244LabelsState;
  setCustomLabels: (updater: (prev: CompresseurK244LabelsState) => CompresseurK244LabelsState) => void;
  defaultHourKeys: readonly CompresseurK244HourKey[];
  defaultCategoryKeys: readonly string[];
  defaultCategoryLabels: Record<string, string>;
  defaultMeasureKeys: readonly string[];
  defaultMeasureLabels: Record<string, string>;
}

const CompresseurK244LabelsContext = createContext<ContextValue | null>(null);

export function CompresseurK244LabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<CompresseurK244LabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: CompresseurK244LabelsState) => CompresseurK244LabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: CompresseurK244HourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (compresseurK244HourLabels[key] ?? key);
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
      defaultHourKeys: COMPRESSEUR_K244_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    }),
    [getHourLabel, getCategoryLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <CompresseurK244LabelsContext.Provider value={value}>
      {children}
    </CompresseurK244LabelsContext.Provider>
  );
}

export function useCompresseurK244Labels(): ContextValue {
  const ctx = useContext(CompresseurK244LabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: CompresseurK244HourKey) => compresseurK244HourLabels[key] ?? key,
      getCategoryLabel: (key: string) => defaultCategoryLabels[key] ?? key,
      getMeasureLabel: (key: string) => defaultMeasureLabels[key] ?? key,
      customLabels: { hours: {}, categories: {}, measures: {} },
      setCustomLabels: () => {},
      defaultHourKeys: COMPRESSEUR_K244_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    };
  }
  return ctx;
}
