import React, { createContext, useContext, useState } from 'react';
import { FEUILLES_CONFIG } from '../types/feuilles';

interface RenommageConfig {
  feuilleNames: Record<string, string>;
  categoryNames: Record<string, Record<string, string>>;
  fieldNames: Record<string, Record<string, string>>;
}

const STORAGE_KEY = 'renommage_config';

const buildDefault = (): RenommageConfig => ({
  feuilleNames: {},
  categoryNames: {},
  fieldNames: {},
});

const load = (): RenommageConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...buildDefault(), ...JSON.parse(raw) };
  } catch {}
  return buildDefault();
};

interface RenommageContextType {
  config: RenommageConfig;
  getFeuilleTitle: (feuilleId: string) => string;
  getCategoryLabel: (feuilleId: string, category: string) => string;
  getFieldLabel: (feuilleId: string, fieldKey: string, defaultLabel: string) => string;
  renameFeuille: (feuilleId: string, name: string) => void;
  renameCategory: (feuilleId: string, category: string, name: string) => void;
  renameField: (feuilleId: string, fieldKey: string, label: string) => void;
  resetFeuille: (feuilleId: string) => void;
  resetCategory: (feuilleId: string, category: string) => void;
  resetField: (feuilleId: string, fieldKey: string) => void;
}

const RenommageContext = createContext<RenommageContextType | null>(null);

export const RenommageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RenommageConfig>(load);

  const save = (next: RenommageConfig) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getDefaultFeuilleTitle = (feuilleId: string) =>
    FEUILLES_CONFIG.find((f) => f.id === feuilleId)?.title ?? feuilleId;

  const getFeuilleTitle = (feuilleId: string) =>
    config.feuilleNames[feuilleId] ?? getDefaultFeuilleTitle(feuilleId);

  const getCategoryLabel = (feuilleId: string, category: string) =>
    config.categoryNames[feuilleId]?.[category] ?? category;

  const getFieldLabel = (feuilleId: string, fieldKey: string, defaultLabel: string) =>
    config.fieldNames[feuilleId]?.[fieldKey] ?? defaultLabel;

  const renameFeuille = (feuilleId: string, name: string) => {
    const defaultTitle = getDefaultFeuilleTitle(feuilleId);
    const next = { ...config };
    if (name === defaultTitle || name.trim() === '') {
      const { [feuilleId]: _removed, ...rest } = next.feuilleNames;
      next.feuilleNames = rest;
    } else {
      next.feuilleNames = { ...next.feuilleNames, [feuilleId]: name };
    }
    save(next);
  };

  const renameCategory = (feuilleId: string, category: string, name: string) => {
    const cats = { ...(config.categoryNames[feuilleId] ?? {}) };
    if (name === category || name.trim() === '') {
      delete cats[category];
    } else {
      cats[category] = name;
    }
    save({ ...config, categoryNames: { ...config.categoryNames, [feuilleId]: cats } });
  };

  const renameField = (feuilleId: string, fieldKey: string, label: string) => {
    const feuille = FEUILLES_CONFIG.find((f) => f.id === feuilleId);
    const defaultLabel = feuille?.fields.find((f) => f.key === fieldKey)?.label ?? fieldKey;
    const fields = { ...(config.fieldNames[feuilleId] ?? {}) };
    if (label === defaultLabel || label.trim() === '') {
      delete fields[fieldKey];
    } else {
      fields[fieldKey] = label;
    }
    save({ ...config, fieldNames: { ...config.fieldNames, [feuilleId]: fields } });
  };

  const resetFeuille = (feuilleId: string) => {
    const { [feuilleId]: _f, ...restNames } = config.feuilleNames;
    const { [feuilleId]: _c, ...restCats } = config.categoryNames;
    const { [feuilleId]: _fi, ...restFields } = config.fieldNames;
    save({ feuilleNames: restNames, categoryNames: restCats, fieldNames: restFields });
  };

  const resetCategory = (feuilleId: string, category: string) => {
    const cats = { ...(config.categoryNames[feuilleId] ?? {}) };
    delete cats[category];
    save({ ...config, categoryNames: { ...config.categoryNames, [feuilleId]: cats } });
  };

  const resetField = (feuilleId: string, fieldKey: string) => {
    const fields = { ...(config.fieldNames[feuilleId] ?? {}) };
    delete fields[fieldKey];
    save({ ...config, fieldNames: { ...config.fieldNames, [feuilleId]: fields } });
  };

  return (
    <RenommageContext.Provider
      value={{
        config,
        getFeuilleTitle,
        getCategoryLabel,
        getFieldLabel,
        renameFeuille,
        renameCategory,
        renameField,
        resetFeuille,
        resetCategory,
        resetField,
      }}
    >
      {children}
    </RenommageContext.Provider>
  );
};

export const useRenommage = () => {
  const ctx = useContext(RenommageContext);
  if (!ctx) throw new Error('useRenommage must be used within RenommageProvider');
  return ctx;
};
