import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchTagsIp21Config,
  bulkUpdateTagsIp21Config,
  type TagsIp21ConfigItem,
} from '../api/tagsIp21';

export type FieldSource = 'manual' | 'sap' | 'ip21';

export interface FieldTagConfig {
  source: FieldSource;
  ip21Tag: string;
}

// Structure interne : { feuilleId: { fieldKey: FieldTagConfig } }
type TagsConfig = Record<string, Record<string, FieldTagConfig>>;

const DEFAULT_CONFIG: FieldTagConfig = { source: 'manual', ip21Tag: '' };

// ── Conversion API ↔ interne ────────────────────────────────────────────────

function itemsToConfig(items: TagsIp21ConfigItem[]): TagsConfig {
  const config: TagsConfig = {};
  for (const item of items) {
    if (!config[item.feuille_id]) config[item.feuille_id] = {};
    config[item.feuille_id][item.field_key] = {
      source: item.source,
      ip21Tag: item.ip21_tag,
    };
  }
  return config;
}

// ── Context ─────────────────────────────────────────────────────────────────

interface TagsIp21ContextType {
  config: TagsConfig;
  loading: boolean;
  getFieldConfig: (feuilleId: string, fieldKey: string) => FieldTagConfig;
  setFieldSource: (feuilleId: string, fieldKey: string, source: FieldSource) => void;
  setFieldTag: (feuilleId: string, fieldKey: string, tag: string) => void;
  getIp21TagsForFeuille: (feuilleId: string) => Record<string, string>;
  reload: () => Promise<void>;
}

const TagsIp21Context = createContext<TagsIp21ContextType | null>(null);

export const TagsIp21Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TagsConfig>({});
  const [loading, setLoading] = useState(true);

  const loadFromApi = async () => {
    try {
      setLoading(true);
      const items = await fetchTagsIp21Config();
      setConfig(itemsToConfig(items));
    } catch (err) {
      console.error('TagsIp21: impossible de charger la config depuis l\'API', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromApi();
  }, []);

  const getFieldConfig = (feuilleId: string, fieldKey: string): FieldTagConfig =>
    config[feuilleId]?.[fieldKey] ?? DEFAULT_CONFIG;

  const setFieldSource = (feuilleId: string, fieldKey: string, source: FieldSource) => {
    setConfig(prev => {
      const current = prev[feuilleId]?.[fieldKey] ?? DEFAULT_CONFIG;
      const fc = { ...current, source };
      bulkUpdateTagsIp21Config([{ feuille_id: feuilleId, field_key: fieldKey, source: fc.source, ip21_tag: fc.ip21Tag }])
        .catch(err => console.error('TagsIp21: échec sauvegarde source', err));
      return { ...prev, [feuilleId]: { ...prev[feuilleId], [fieldKey]: fc } };
    });
  };

  const setFieldTag = (feuilleId: string, fieldKey: string, tag: string) => {
    setConfig(prev => {
      const current = prev[feuilleId]?.[fieldKey] ?? DEFAULT_CONFIG;
      const fc = { ...current, ip21Tag: tag };
      bulkUpdateTagsIp21Config([{ feuille_id: feuilleId, field_key: fieldKey, source: fc.source, ip21_tag: fc.ip21Tag }])
        .catch(err => console.error('TagsIp21: échec sauvegarde tag', err));
      return { ...prev, [feuilleId]: { ...prev[feuilleId], [fieldKey]: fc } };
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
      value={{
        config,
        loading,
        getFieldConfig,
        setFieldSource,
        setFieldTag,
        getIp21TagsForFeuille,
        reload: loadFromApi,
      }}
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
