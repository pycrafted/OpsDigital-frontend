import React, { createContext, useContext, useState } from 'react';
import { FEUILLES_CONFIG } from '../types/feuilles';

type FeuilleVisibility = {
  visible: boolean;
  hiddenFields: string[];
};

type VisibilityConfig = Record<string, FeuilleVisibility>;

const buildDefault = (): VisibilityConfig => {
  const config: VisibilityConfig = {};
  for (const feuille of FEUILLES_CONFIG) {
    config[feuille.id] = { visible: true, hiddenFields: [] };
  }
  return config;
};

const STORAGE_KEY = 'saisie_visibility_config';

const load = (): VisibilityConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...buildDefault(), ...JSON.parse(raw) };
  } catch {}
  return buildDefault();
};

interface SaisieVisibilityContextType {
  config: VisibilityConfig;
  isFeuilleVisible: (id: string) => boolean;
  toggleFeuille: (id: string) => void;
  isFieldVisible: (feuilleId: string, fieldKey: string) => boolean;
  toggleField: (feuilleId: string, fieldKey: string) => void;
  setBulkFieldsVisibility: (feuilleId: string, fieldKeys: string[], visible: boolean) => void;
}

const SaisieVisibilityContext = createContext<SaisieVisibilityContextType | null>(null);

export const SaisieVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<VisibilityConfig>(load);

  const save = (next: VisibilityConfig) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const isFeuilleVisible = (id: string) => config[id]?.visible ?? true;

  const toggleFeuille = (id: string) => {
    save({ ...config, [id]: { ...config[id], visible: !isFeuilleVisible(id) } });
  };

  const isFieldVisible = (feuilleId: string, fieldKey: string) =>
    !(config[feuilleId]?.hiddenFields ?? []).includes(fieldKey);

  const toggleField = (feuilleId: string, fieldKey: string) => {
    const hidden = config[feuilleId]?.hiddenFields ?? [];
    save({
      ...config,
      [feuilleId]: {
        ...config[feuilleId],
        hiddenFields: hidden.includes(fieldKey)
          ? hidden.filter((k) => k !== fieldKey)
          : [...hidden, fieldKey],
      },
    });
  };

  const setBulkFieldsVisibility = (feuilleId: string, fieldKeys: string[], visible: boolean) => {
    const currentHidden = config[feuilleId]?.hiddenFields ?? [];
    const newHidden = visible
      ? currentHidden.filter((k) => !fieldKeys.includes(k))
      : [...new Set([...currentHidden, ...fieldKeys])];
    save({ ...config, [feuilleId]: { ...config[feuilleId], hiddenFields: newHidden } });
  };

  return (
    <SaisieVisibilityContext.Provider
      value={{ config, isFeuilleVisible, toggleFeuille, isFieldVisible, toggleField, setBulkFieldsVisibility }}
    >
      {children}
    </SaisieVisibilityContext.Provider>
  );
};

export const useSaisieVisibility = () => {
  const ctx = useContext(SaisieVisibilityContext);
  if (!ctx) throw new Error('useSaisieVisibility must be used within SaisieVisibilityProvider');
  return ctx;
};
