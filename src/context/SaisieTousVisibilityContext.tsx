import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { FEUILLES_CONFIG } from '../types/feuilles';

const STORAGE_KEY = 'saisieTousVisibility';

export interface SaisieTousVisibilityState {
  hiddenFeuilles: string[];
  hiddenFields: Record<string, string[]>;
}

/** IDs masqués par défaut (pas encore de support backend complet). */
const DEFAULT_HIDDEN_FEUILLES = ['mouvement-des-bacs', 'analyses-laboratoire'];

function loadStored(): SaisieTousVisibilityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaisieTousVisibilityState;
      return {
        hiddenFeuilles: parsed.hiddenFeuilles ?? DEFAULT_HIDDEN_FEUILLES,
        hiddenFields: parsed.hiddenFields ?? {},
      };
    }
  } catch (_) {}
  return { hiddenFeuilles: DEFAULT_HIDDEN_FEUILLES, hiddenFields: {} };
}

function saveStored(state: SaisieTousVisibilityState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

interface ContextValue {
  hiddenFeuilles: string[];
  hiddenFields: Record<string, string[]>;
  isFeuilleVisible: (feuilleId: string) => boolean;
  isFieldVisible: (feuilleId: string, fieldKey: string) => boolean;
  setHiddenFeuilles: (ids: string[]) => void;
  setHiddenFields: (feuilleId: string, fieldKeys: string[]) => void;
}

const SaisieTousVisibilityContext = createContext<ContextValue | null>(null);

export function SaisieTousVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SaisieTousVisibilityState>(loadStored);

  const setHiddenFeuilles = useCallback((ids: string[]) => {
    setState((prev) => {
      const next = { ...prev, hiddenFeuilles: ids };
      saveStored(next);
      return next;
    });
  }, []);

  const setHiddenFields = useCallback((feuilleId: string, fieldKeys: string[]) => {
    setState((prev) => {
      const next: SaisieTousVisibilityState = {
        ...prev,
        hiddenFields: { ...prev.hiddenFields, [feuilleId]: fieldKeys },
      };
      saveStored(next);
      return next;
    });
  }, []);

  const isFeuilleVisible = useCallback(
    (feuilleId: string) => !state.hiddenFeuilles.includes(feuilleId),
    [state.hiddenFeuilles],
  );

  const isFieldVisible = useCallback(
    (feuilleId: string, fieldKey: string) => {
      const hidden = state.hiddenFields[feuilleId];
      return !hidden || !hidden.includes(fieldKey);
    },
    [state.hiddenFields],
  );

  const value = useMemo<ContextValue>(
    () => ({
      hiddenFeuilles: state.hiddenFeuilles,
      hiddenFields: state.hiddenFields,
      isFeuilleVisible,
      isFieldVisible,
      setHiddenFeuilles,
      setHiddenFields,
    }),
    [state, isFeuilleVisible, isFieldVisible, setHiddenFeuilles, setHiddenFields],
  );

  return (
    <SaisieTousVisibilityContext.Provider value={value}>
      {children}
    </SaisieTousVisibilityContext.Provider>
  );
}

export function useSaisieTousVisibility(): ContextValue {
  const ctx = useContext(SaisieTousVisibilityContext);
  if (!ctx) {
    // Fallback: everything visible
    const allIds = FEUILLES_CONFIG.map((f) => f.id);
    return {
      hiddenFeuilles: [],
      hiddenFields: {},
      isFeuilleVisible: () => true,
      isFieldVisible: () => true,
      setHiddenFeuilles: () => {},
      setHiddenFields: () => {},
    };
  }
  return ctx;
}
