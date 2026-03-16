import React, { createContext, useContext, useState } from 'react';

export type FieldSource = 'manual' | 'sap' | 'ip21';

export interface FieldTagConfig {
  source: FieldSource;
  ip21Tag: string;
}

type TagsConfig = Record<string, Record<string, FieldTagConfig>>;

const STORAGE_KEY = 'tags_ip21_config';

const load = (): TagsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const DEFAULT_CONFIG: FieldTagConfig = { source: 'manual', ip21Tag: '' };

interface TagsIp21ContextType {
  config: TagsConfig;
  getFieldConfig: (feuilleId: string, fieldKey: string) => FieldTagConfig;
  setFieldSource: (feuilleId: string, fieldKey: string, source: FieldSource) => void;
  setFieldTag: (feuilleId: string, fieldKey: string, tag: string) => void;
  getIp21TagsForFeuille: (feuilleId: string) => Record<string, string>;
}

const TagsIp21Context = createContext<TagsIp21ContextType | null>(null);

export const TagsIp21Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TagsConfig>(load);

  const save = (next: TagsConfig) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getFieldConfig = (feuilleId: string, fieldKey: string): FieldTagConfig =>
    config[feuilleId]?.[fieldKey] ?? DEFAULT_CONFIG;

  const setFieldSource = (feuilleId: string, fieldKey: string, source: FieldSource) => {
    const current = getFieldConfig(feuilleId, fieldKey);
    save({
      ...config,
      [feuilleId]: { ...config[feuilleId], [fieldKey]: { ...current, source } },
    });
  };

  const setFieldTag = (feuilleId: string, fieldKey: string, tag: string) => {
    const current = getFieldConfig(feuilleId, fieldKey);
    save({
      ...config,
      [feuilleId]: { ...config[feuilleId], [fieldKey]: { ...current, ip21Tag: tag } },
    });
  };

  const getIp21TagsForFeuille = (feuilleId: string): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(config[feuilleId] ?? {})) {
      if (val.source === 'ip21' && val.ip21Tag) result[key] = val.ip21Tag;
    }
    return result;
  };

  return (
    <TagsIp21Context.Provider
      value={{ config, getFieldConfig, setFieldSource, setFieldTag, getIp21TagsForFeuille }}
    >
      {children}
    </TagsIp21Context.Provider>
  );
};

export const useTagsIp21 = () => {
  const ctx = useContext(TagsIp21Context);
  if (!ctx) throw new Error('useTagsIp21 must be used within TagsIp21Provider');
  return ctx;
};
