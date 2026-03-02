import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  COMPRESSEUR_K245_CATEGORIES,
  COMPRESSEUR_K245_HOURS,
  compresseurK245HourLabels,
  getCompresseurK245IndicateurOptions,
  type CompresseurK245HourKey,
} from '../data/compresseurK245';

const STORAGE_KEY = 'compresseurK245Labels';

const indicatorOptions = getCompresseurK245IndicateurOptions();
const defaultMeasureLabels: Record<string, string> = {};
indicatorOptions.forEach(({ key, label }) => {
  defaultMeasureLabels[key] = label;
});

const defaultCategoryKeys = COMPRESSEUR_K245_CATEGORIES.map((c) => c.category);
const defaultCategoryLabels: Record<string, string> = {};
COMPRESSEUR_K245_CATEGORIES.forEach((c) => {
  defaultCategoryLabels[c.category] = c.category;
});

export interface CompresseurK245LabelsState {
  hours: Partial<Record<CompresseurK245HourKey, string>>;
  categories: Partial<Record<string, string>>;
  measures: Partial<Record<string, string>>;
}

function loadStored(): CompresseurK245LabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompresseurK245LabelsState;
      return {
        hours: parsed.hours ?? {},
        categories: parsed.categories ?? {},
        measures: parsed.measures ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, categories: {}, measures: {} };
}

function saveStored(state: CompresseurK245LabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: CompresseurK245HourKey) => string;
  getCategoryLabel: (categoryKey: string) => string;
  getMeasureLabel: (measureKey: string) => string;
  customLabels: CompresseurK245LabelsState;
  setCustomLabels: (updater: (prev: CompresseurK245LabelsState) => CompresseurK245LabelsState) => void;
  defaultHourKeys: readonly CompresseurK245HourKey[];
  defaultCategoryKeys: readonly string[];
  defaultCategoryLabels: Record<string, string>;
  defaultMeasureKeys: readonly string[];
  defaultMeasureLabels: Record<string, string>;
}

const CompresseurK245LabelsContext = createContext<ContextValue | null>(null);

export function CompresseurK245LabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<CompresseurK245LabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: CompresseurK245LabelsState) => CompresseurK245LabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: CompresseurK245HourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (compresseurK245HourLabels[key] ?? key);
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
      defaultHourKeys: COMPRESSEUR_K245_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    }),
    [getHourLabel, getCategoryLabel, getMeasureLabel, customLabels, setCustomLabels]
  );

  return (
    <CompresseurK245LabelsContext.Provider value={value}>
      {children}
    </CompresseurK245LabelsContext.Provider>
  );
}

export function useCompresseurK245Labels(): ContextValue {
  const ctx = useContext(CompresseurK245LabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: CompresseurK245HourKey) => compresseurK245HourLabels[key] ?? key,
      getCategoryLabel: (key: string) => defaultCategoryLabels[key] ?? key,
      getMeasureLabel: (key: string) => defaultMeasureLabels[key] ?? key,
      customLabels: { hours: {}, categories: {}, measures: {} },
      setCustomLabels: () => {},
      defaultHourKeys: COMPRESSEUR_K245_HOURS,
      defaultCategoryKeys,
      defaultCategoryLabels,
      defaultMeasureKeys: indicatorOptions.map((o) => o.key),
      defaultMeasureLabels,
    };
  }
  return ctx;
}
