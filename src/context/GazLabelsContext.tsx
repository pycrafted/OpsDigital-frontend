import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { GAZ_COLUMNS, GAZ_HOURS, type GazColumnKey, type GazHourKey } from '../data/gaz';

const STORAGE_KEY = 'gazLabels';

const defaultHourLabels: Record<GazHourKey, string> = Object.fromEntries(
  GAZ_HOURS.map((h) => [h, h])
) as Record<GazHourKey, string>;

const defaultColumnTitles: Record<GazColumnKey, string> = Object.fromEntries(
  GAZ_COLUMNS.map((c) => [c.key, c.title])
) as Record<GazColumnKey, string>;

const defaultColumnSubtitles: Record<GazColumnKey, string> = Object.fromEntries(
  GAZ_COLUMNS.map((c) => [c.key, c.subtitle])
) as Record<GazColumnKey, string>;

export interface GazLabelsState {
  hours: Partial<Record<GazHourKey, string>>;
  columnTitles: Partial<Record<GazColumnKey, string>>;
  columnSubtitles: Partial<Record<GazColumnKey, string>>;
}

function loadStored(): GazLabelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GazLabelsState;
      return {
        hours: parsed.hours ?? {},
        columnTitles: parsed.columnTitles ?? {},
        columnSubtitles: parsed.columnSubtitles ?? {},
      };
    }
  } catch (_) {}
  return { hours: {}, columnTitles: {}, columnSubtitles: {} };
}

function saveStored(state: GazLabelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  getHourLabel: (key: GazHourKey) => string;
  getColumnTitle: (key: GazColumnKey) => string;
  getColumnSubtitle: (key: GazColumnKey) => string;
  customLabels: GazLabelsState;
  setCustomLabels: (updater: (prev: GazLabelsState) => GazLabelsState) => void;
  defaultHourKeys: readonly GazHourKey[];
  defaultColumnKeys: readonly GazColumnKey[];
  defaultHourLabels: Record<GazHourKey, string>;
  defaultColumnTitles: Record<GazColumnKey, string>;
  defaultColumnSubtitles: Record<GazColumnKey, string>;
}

const GazLabelsContext = createContext<ContextValue | null>(null);

export function GazLabelsProvider({ children }: { children: React.ReactNode }) {
  const [customLabels, setState] = useState<GazLabelsState>(loadStored);

  const setCustomLabels = useCallback((updater: (prev: GazLabelsState) => GazLabelsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const getHourLabel = useCallback((key: GazHourKey) => {
    const v = customLabels.hours[key];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultHourLabels[key] ?? key);
  }, [customLabels.hours]);

  const getColumnTitle = useCallback((key: GazColumnKey) => {
    const v = customLabels.columnTitles[key];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultColumnTitles[key] ?? key);
  }, [customLabels.columnTitles]);

  const getColumnSubtitle = useCallback((key: GazColumnKey) => {
    const v = customLabels.columnSubtitles[key];
    return (v != null && v.trim() !== '') ? v.trim() : (defaultColumnSubtitles[key] ?? key);
  }, [customLabels.columnSubtitles]);

  const value = useMemo<ContextValue>(
    () => ({
      getHourLabel,
      getColumnTitle,
      getColumnSubtitle,
      customLabels,
      setCustomLabels,
      defaultHourKeys: GAZ_HOURS,
      defaultColumnKeys: GAZ_COLUMNS.map((c) => c.key) as unknown as readonly GazColumnKey[],
      defaultHourLabels,
      defaultColumnTitles,
      defaultColumnSubtitles,
    }),
    [getHourLabel, getColumnTitle, getColumnSubtitle, customLabels, setCustomLabels]
  );

  return (
    <GazLabelsContext.Provider value={value}>
      {children}
    </GazLabelsContext.Provider>
  );
}

export function useGazLabels(): ContextValue {
  const ctx = useContext(GazLabelsContext);
  if (!ctx) {
    return {
      getHourLabel: (key: GazHourKey) => defaultHourLabels[key] ?? key,
      getColumnTitle: (key: GazColumnKey) => defaultColumnTitles[key] ?? key,
      getColumnSubtitle: (key: GazColumnKey) => defaultColumnSubtitles[key] ?? key,
      customLabels: { hours: {}, columnTitles: {}, columnSubtitles: {} },
      setCustomLabels: () => {},
      defaultHourKeys: GAZ_HOURS,
      defaultColumnKeys: GAZ_COLUMNS.map((c) => c.key) as unknown as readonly GazColumnKey[],
      defaultHourLabels,
      defaultColumnTitles,
      defaultColumnSubtitles,
    };
  }
  return ctx;
}
