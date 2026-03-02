import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COMPRESSEUR_K244_CATEGORY_OPTIONS,
  FeuilleConfig,
  loadSaisieFromStorage,
  saveSaisieToStorage,
} from '../types/feuilles';
import {
  createInitialReformateurData,
  reformateurHourLabels,
  type HourRow as ReformateurHourRow,
} from '../data/reformateur';
import {
  createInitialProductionData,
  type HourRow as ProductionHourRow,
} from '../data/production';
import {
  createInitialGazData,
  type HourRow as GazHourRow,
} from '../data/gaz';
import {
  createInitialAtmMeroxData,
  type HourRow as AtmMeroxHourRow,
} from '../data/atmMeroxPreFlash';
import {
  createInitialCompresseurK244Data,
  type HourRow as CompresseurK244HourRow,
} from '../data/compresseurK244';
import {
  createInitialCompresseurK245Data,
  type HourRow as CompresseurK245HourRow,
} from '../data/compresseurK245';
import { fetchReformateurByDate, saveReformateurBulk } from '../api/reformateur';
import { fetchProductionByDate, saveProductionBulk } from '../api/production';
import { fetchGazByDate, saveGazBulk } from '../api/gaz';
import { fetchAtmMeroxByDate, saveAtmMeroxBulk } from '../api/atmMerox';
import { fetchCompresseurK244ByDate, saveCompresseurK244Bulk } from '../api/compresseurK244';
import { fetchCompresseurK245ByDate, saveCompresseurK245Bulk } from '../api/compresseurK245';

const HOUR_LABELS: Record<string, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

/** Pour l’affichage : "15.0" → "15", "15.2" → "15.2" (sans .0 inutile). */
function formatDisplayValue(val: string): string {
  if (val === '' || val == null) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  if (Number.isNaN(n)) return val;
  return Number.isInteger(n) ? String(n) : String(n);
}

interface FormulaireSaisieFeuilleProps {
  feuille: FeuilleConfig;
  /** Quand fourni (mode "Tout"), utilise cette date et masque le sélecteur de date. */
  externalDate?: string;
  /** Quand fourni (mode "Tout"), utilise cette heure et masque le sélecteur d'heure. */
  externalHour?: string;
  /** Désactive le focus automatique sur le premier champ (utile en mode "Tout"). */
  disableAutoFocus?: boolean;
  /** Masque le trait séparateur au-dessus (premier formulaire de la liste). */
  hideSeparator?: boolean;
}

const LABELS_K244: Record<string, string> = {
  huile: 'Huile',
  eau: 'Eau',
  hydrogene: 'Hydrogène',
  azote: 'Azote',
  'moteur k244': 'Moteur K244',
};

/** Retourne le créneau horaire correspondant à l'heure réelle actuelle. */
function getCurrentHourSlot(availableHours: string[]): string {
  const h = new Date().getHours();
  let slot: string;
  if (h >= 7 && h < 11) slot = 'h7';
  else if (h >= 11 && h < 15) slot = 'h11';
  else if (h >= 15 && h < 19) slot = 'h15';
  else if (h >= 19 && h < 23) slot = 'h19';
  else if (h >= 23 || h < 3) slot = 'h23';
  else slot = 'h3';
  return availableHours.includes(slot) ? slot : availableHours[0];
}

const FormulaireSaisieFeuille: React.FC<FormulaireSaisieFeuilleProps> = ({
  feuille,
  externalDate,
  externalHour,
  disableAutoFocus = false,
  hideSeparator = false,
}) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [internalDate, setInternalDate] = useState(today);
  const date = externalDate ?? internalDate;
  const setDate = (d: string) => { if (!externalDate) setInternalDate(d); };
  const [internalHour, setInternalHour] = useState(() => getCurrentHourSlot(feuille.hours));
  const hour = externalHour ?? internalHour;
  const setHour = (h: string) => { if (!externalHour) setInternalHour(h); };
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savingBackend, setSavingBackend] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  /** Clé du champ en cours d’édition : on affiche la valeur brute pour permettre de saisir "14.5" (le point). */
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [reformateurRows, setReformateurRows] = useState<ReformateurHourRow[] | null>(null);
  const [loadingReformateur, setLoadingReformateur] = useState(false);
  const [errorReformateur, setErrorReformateur] = useState<string | null>(null);
  const [productionRows, setProductionRows] = useState<ProductionHourRow[] | null>(null);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [errorProduction, setErrorProduction] = useState<string | null>(null);
  const [gazRows, setGazRows] = useState<GazHourRow[] | null>(null);
  const [loadingGaz, setLoadingGaz] = useState(false);
  const [errorGaz, setErrorGaz] = useState<string | null>(null);
  const [atmMeroxRows, setAtmMeroxRows] = useState<AtmMeroxHourRow[] | null>(null);
  const [loadingAtmMerox, setLoadingAtmMerox] = useState(false);
  const [errorAtmMerox, setErrorAtmMerox] = useState<string | null>(null);
  const [compresseurK244Rows, setCompresseurK244Rows] = useState<CompresseurK244HourRow[] | null>(null);
  const [loadingCompresseurK244, setLoadingCompresseurK244] = useState(false);
  const [errorCompresseurK244, setErrorCompresseurK244] = useState<string | null>(null);
  const [compresseurK245Rows, setCompresseurK245Rows] = useState<CompresseurK245HourRow[] | null>(null);
  const [loadingCompresseurK245, setLoadingCompresseurK245] = useState(false);
  const [errorCompresseurK245, setErrorCompresseurK245] = useState<string | null>(null);

  /** Mapping clé formulaire (relevé_*) → API Compresseur K245 (consommation_* / cotes_* / azote_*). */
  const compresseurK245FormKeyToApi: Record<string, string> = useMemo(
    () => ({
      'relevé_n° cadre': 'azote_n° cadre',
      'relevé_p cadre': 'azote_p cadre',
      'relevé_consom go d202': 'consommation_consom go d202',
      'relevé_consom go d314b': 'consommation_consom go d314b',
      'relevé_consom fo d349': 'consommation_consom fo d349',
      'relevé_consom fo d362': 'consommation_consom fo d362',
      'relevé_consom eb th': 'consommation_consom eb th',
      'relevé_cote d 202': 'cotes_cote d 202',
    }),
    [],
  );

  /** Mapping heure formulaire (h7) → API ATM Merox (7h). */
  const atmMeroxFormHourToApi: Record<string, string> = useMemo(
    () => ({ h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '3h' }),
    [],
  );

  /** Mapping heure formulaire (h7) → API Gaz (7h). */
  const gazFormHourToApi: Record<string, string> = useMemo(
    () => ({ h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '03h' }),
    [],
  );
  /** Mapping clé formulaire (gaz_c105) → API Gaz (c105). */
  const gazFormKeyToApi: Record<string, string> = useMemo(
    () => ({ gaz_c105: 'c105', gaz_c261: 'c261', gaz_c106: 'c106' }),
    [],
  );

  const isCompresseurK244 = feuille.id === 'compresseur-k244';
  const isReformateurCatalytique = feuille.id === 'reformateur-catalytique';
  const isGaz = feuille.id === 'gaz';
  const isCompresseurK245 = feuille.id === 'compresseur-k245';
  const isProductionValeurElectricite = feuille.id === 'production-valeur-electricite';
  const isAtmMeroxPreflash = feuille.id === 'atm-merox-preflash';
  const hourIndex = feuille.hours.indexOf(hour);
  const previousHour =
    hourIndex > 0 ? feuille.hours[hourIndex - 1] : feuille.hours[feuille.hours.length - 1];
  const nextHour =
    hourIndex < feuille.hours.length - 1 ? feuille.hours[hourIndex + 1] : feuille.hours[0];

  // Chargement des valeurs depuis le backend pour Réformateur catalytique
  useEffect(() => {
    if (!isReformateurCatalytique) {
      return;
    }
    let cancelled = false;
    setLoadingReformateur(true);
    setErrorReformateur(null);
    fetchReformateurByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialReformateurData();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setReformateurRows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorReformateur(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setReformateurRows(createInitialReformateurData());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingReformateur(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isReformateurCatalytique]);

  // Chargement des valeurs depuis le backend pour Production / Valeur / Électricité
  useEffect(() => {
    if (!isProductionValeurElectricite) {
      return;
    }
    let cancelled = false;
    setLoadingProduction(true);
    setErrorProduction(null);
    fetchProductionByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialProductionData();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setProductionRows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorProduction(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setProductionRows(createInitialProductionData());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingProduction(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isProductionValeurElectricite]);

  // Chargement des valeurs depuis le backend pour Gaz
  useEffect(() => {
    if (!isGaz) {
      return;
    }
    let cancelled = false;
    setLoadingGaz(true);
    setErrorGaz(null);
    fetchGazByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialGazData();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setGazRows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorGaz(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setGazRows(createInitialGazData());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingGaz(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isGaz]);

  // Chargement des valeurs depuis le backend pour ATM/MEROX & Pre-Flash
  useEffect(() => {
    if (!isAtmMeroxPreflash) {
      return;
    }
    let cancelled = false;
    setLoadingAtmMerox(true);
    setErrorAtmMerox(null);
    fetchAtmMeroxByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialAtmMeroxData();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setAtmMeroxRows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorAtmMerox(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setAtmMeroxRows(createInitialAtmMeroxData());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAtmMerox(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isAtmMeroxPreflash]);

  // Chargement des valeurs depuis le backend pour Compresseur K 244
  useEffect(() => {
    if (!isCompresseurK244) {
      return;
    }
    let cancelled = false;
    setLoadingCompresseurK244(true);
    setErrorCompresseurK244(null);
    fetchCompresseurK244ByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialCompresseurK244Data();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setCompresseurK244Rows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorCompresseurK244(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setCompresseurK244Rows(createInitialCompresseurK244Data());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCompresseurK244(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isCompresseurK244]);

  // Chargement des valeurs depuis le backend pour Compresseur K 245
  useEffect(() => {
    if (!isCompresseurK245) {
      return;
    }
    let cancelled = false;
    setLoadingCompresseurK245(true);
    setErrorCompresseurK245(null);
    fetchCompresseurK245ByDate(date)
      .then((rows) => {
        if (cancelled) return;
        const base = createInitialCompresseurK245Data();
        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            const idx = base.findIndex((r) => r.hour === row.hour);
            if (idx >= 0) {
              base[idx] = row;
            }
          });
        }
        setCompresseurK245Rows(base);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorCompresseurK245(
          err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        );
        setCompresseurK245Rows(createInitialCompresseurK245Data());
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCompresseurK245(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isCompresseurK245]);

  // Pour les autres feuilles : chargement depuis le stockage local
  useEffect(() => {
    if (isReformateurCatalytique || isProductionValeurElectricite || isGaz || isAtmMeroxPreflash || isCompresseurK244 || isCompresseurK245) {
      return;
    }
    const stored = loadSaisieFromStorage(feuille.id, date, hour);
    setValues(stored);
  }, [feuille.id, date, hour, isReformateurCatalytique, isProductionValeurElectricite, isGaz, isAtmMeroxPreflash, isCompresseurK244, isCompresseurK245]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour Réformateur
  useEffect(() => {
    if (!isReformateurCatalytique) {
      return;
    }
    if (!reformateurRows) {
      setValues({});
      return;
    }
    const rowForHour = reformateurRows.find((r) => r.hour === hour);
    if (rowForHour) {
      setValues(rowForHour.values ?? {});
    } else {
      setValues({});
    }
  }, [isReformateurCatalytique, reformateurRows, hour]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour Compresseur K244 (même format heure/clés que formulaire)
  useEffect(() => {
    if (!isCompresseurK244) {
      return;
    }
    if (!compresseurK244Rows) {
      setValues({});
      return;
    }
    const rowForHour = compresseurK244Rows.find((r) => r.hour === hour);
    if (rowForHour) {
      setValues(rowForHour.values ?? {});
    } else {
      setValues({});
    }
  }, [isCompresseurK244, compresseurK244Rows, hour]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour Production
  useEffect(() => {
    if (!isProductionValeurElectricite) {
      return;
    }
    if (!productionRows) {
      setValues({});
      return;
    }
    const rowForHour = productionRows.find((r) => r.hour === hour);
    if (rowForHour) {
      setValues(rowForHour.values ?? {});
    } else {
      setValues({});
    }
  }, [isProductionValeurElectricite, productionRows, hour]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour Gaz (avec mapping clés formulaire ↔ API)
  useEffect(() => {
    if (!isGaz) {
      return;
    }
    if (!gazRows) {
      setValues({});
      return;
    }
    const apiHour = gazFormHourToApi[hour];
    const rowForHour = gazRows.find((r) => r.hour === apiHour);
    if (rowForHour) {
      const next: Record<string, string> = {};
      Object.keys(gazFormKeyToApi).forEach((formKey) => {
        const apiKey = gazFormKeyToApi[formKey];
        next[formKey] = rowForHour.values[apiKey as keyof typeof rowForHour.values] ?? '';
      });
      setValues(next);
    } else {
      setValues({});
    }
  }, [isGaz, gazRows, hour, gazFormHourToApi, gazFormKeyToApi]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour ATM/MEROX (mapping heure formulaire → API)
  useEffect(() => {
    if (!isAtmMeroxPreflash) {
      return;
    }
    if (!atmMeroxRows) {
      setValues({});
      return;
    }
    const apiHour = atmMeroxFormHourToApi[hour];
    const rowForHour = atmMeroxRows.find((r) => r.hour === apiHour);
    if (rowForHour) {
      setValues(rowForHour.values ?? {});
    } else {
      setValues({});
    }
  }, [isAtmMeroxPreflash, atmMeroxRows, hour, atmMeroxFormHourToApi]);

  // Synchroniser les valeurs affichées avec la ligne correspondante pour Compresseur K245 (mapping clés formulaire → API)
  useEffect(() => {
    if (!isCompresseurK245) {
      return;
    }
    if (!compresseurK245Rows) {
      setValues({});
      return;
    }
    const rowForHour = compresseurK245Rows.find((r) => r.hour === hour);
    if (rowForHour) {
      const next: Record<string, string> = {};
      Object.keys(compresseurK245FormKeyToApi).forEach((formKey) => {
        const apiKey = compresseurK245FormKeyToApi[formKey];
        next[formKey] = rowForHour.values[apiKey] ?? '';
      });
      setValues(next);
    } else {
      setValues({});
    }
  }, [isCompresseurK245, compresseurK245Rows, hour, compresseurK245FormKeyToApi]);

  // Réinitialiser l'état "modifié" quand on change de date ou de créneau
  useEffect(() => {
    setIsDirty(false);
  }, [date, hour]);

  useEffect(() => {
    if (disableAutoFocus) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [feuille.id, date, hour, selectedCategory, disableAutoFocus]);

  const doSave = useCallback(() => {
    if (isReformateurCatalytique) {
      if (!reformateurRows) {
        return;
      }
      setSavingBackend(true);
      saveReformateurBulk(date, reformateurRows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    if (isCompresseurK244) {
      if (!compresseurK244Rows) {
        return;
      }
      setSavingBackend(true);
      saveCompresseurK244Bulk(date, compresseurK244Rows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    if (isProductionValeurElectricite) {
      if (!productionRows) {
        return;
      }
      setSavingBackend(true);
      saveProductionBulk(date, productionRows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    if (isGaz) {
      if (!gazRows) {
        return;
      }
      setSavingBackend(true);
      saveGazBulk(date, gazRows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    if (isAtmMeroxPreflash) {
      if (!atmMeroxRows) {
        return;
      }
      setSavingBackend(true);
      saveAtmMeroxBulk(date, atmMeroxRows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    if (isCompresseurK245) {
      if (!compresseurK245Rows) {
        return;
      }
      setSavingBackend(true);
      saveCompresseurK245Bulk(date, compresseurK245Rows)
        .then(() => {
          setSaved(true);
          setIsDirty(false);
          setTimeout(() => setSaved(false), 2200);
        })
        .catch(() => {
          setSaved(false);
        })
        .finally(() => {
          setSavingBackend(false);
        });
      return;
    }
    saveSaisieToStorage(feuille.id, date, hour, values);
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => setSaved(false), 2200);
  }, [date, hour, isReformateurCatalytique, isCompresseurK244, isProductionValeurElectricite, isGaz, isAtmMeroxPreflash, isCompresseurK245, feuille.id, reformateurRows, compresseurK244Rows, productionRows, gazRows, atmMeroxRows, compresseurK245Rows, values]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (isReformateurCatalytique) {
      setReformateurRows((prev) => {
        if (!prev) return prev;
        return prev.map((row) =>
          row.hour === hour
            ? {
                ...row,
                values: {
                  ...row.values,
                  [key]: value,
                },
              }
            : row,
        );
      });
    }
    if (isCompresseurK244) {
      setCompresseurK244Rows((prev) => {
        if (!prev) return prev;
        return prev.map((row) =>
          row.hour === hour
            ? {
                ...row,
                values: {
                  ...row.values,
                  [key]: value,
                },
              }
            : row,
        );
      });
    }
    if (isProductionValeurElectricite) {
      setProductionRows((prev) => {
        if (!prev) return prev;
        return prev.map((row) =>
          row.hour === hour
            ? {
                ...row,
                values: {
                  ...row.values,
                  [key]: value,
                },
              }
            : row,
        );
      });
    }
    if (isGaz) {
      const apiKey = gazFormKeyToApi[key];
      const apiHour = gazFormHourToApi[hour];
      if (apiKey != null && apiHour != null) {
        setGazRows((prev) => {
          if (!prev) return prev;
          return prev.map((row) =>
            row.hour === apiHour
              ? {
                  ...row,
                  values: {
                    ...row.values,
                    [apiKey]: value,
                  } as GazHourRow['values'],
                }
              : row,
          );
        });
      }
    }
    if (isAtmMeroxPreflash) {
      const apiHour = atmMeroxFormHourToApi[hour];
      if (apiHour != null) {
        setAtmMeroxRows((prev) => {
          if (!prev) return prev;
          return prev.map((row) =>
            row.hour === apiHour
              ? {
                  ...row,
                  values: {
                    ...row.values,
                    [key]: value,
                  },
                }
              : row,
          );
        });
      }
    }
    if (isCompresseurK245) {
      const apiKey = compresseurK245FormKeyToApi[key];
      if (apiKey != null) {
        setCompresseurK245Rows((prev) => {
          if (!prev) return prev;
          return prev.map((row) =>
            row.hour === hour
              ? {
                  ...row,
                  values: {
                    ...row.values,
                    [apiKey]: value,
                  },
                }
              : row,
          );
        });
      }
    }
    setSaved(false);
    setIsDirty(true);
  };

  const handleSave = () => {
    doSave();
  };

  const goToCreneau = (h: string) => {
    setHour(h);
  };

  const fieldsByCategory = useMemo(() => {
    const map = new Map<string, { label: string; key: string }[]>();
    feuille.fields.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push({ label: f.label, key: f.key });
      map.set(f.category, list);
    });
    return map;
  }, [feuille.fields]);

  const orderedCategories = useMemo(() => {
    const categories = Array.from(fieldsByCategory.keys());
    if (isCompresseurK244) {
      const preferred = COMPRESSEUR_K244_CATEGORY_OPTIONS.filter((cat) =>
        categories.includes(cat),
      );
      const remaining = categories.filter((cat) => !preferred.includes(cat));
      return [...preferred, ...remaining];
    }
    return categories;
  }, [fieldsByCategory, isCompresseurK244]);

  useEffect(() => {
    if (!orderedCategories.length) return;
    setSelectedCategory((prev) =>
      prev && orderedCategories.includes(prev) ? prev : orderedCategories[0],
    );
  }, [feuille.id, orderedCategories]);

  const fieldsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return fieldsByCategory.get(selectedCategory) ?? [];
  }, [fieldsByCategory, selectedCategory]);

  const categoryLabel =
    isCompresseurK244 && LABELS_K244[selectedCategory]
      ? LABELS_K244[selectedCategory]
      : selectedCategory || 'Divers';

  const pageTitle =
    feuille.id === 'compresseur-k244'
      ? 'Compresseur K244'
      : feuille.id === 'compresseur-k245'
        ? 'Compresseur K245'
        : feuille.title;

  /* Même style que Tableaux / Graphiques : boutons filtres */
  const filterControlClass =
    'flex items-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:border-primary/50 hover:bg-white hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80 dark:hover:text-white';

  return (
    <>
      {externalDate && !hideSeparator && (
          <div className="pb-2">
            <hr className="w-full border-t-2 border-white" />
          </div>
        )}
      {/* En-tête : directement sur la page */}
      <div className={`px-6 py-4 ${
        externalDate
          ? ''
          : 'border-b border-stroke/60 bg-gradient-to-r from-primary/5 to-transparent dark:border-strokedark/80 dark:from-primary/10 dark:to-transparent'
      }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="block h-6 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <p className="text-base font-semibold text-primary dark:text-white">
                {externalDate ? pageTitle : `Saisie — ${pageTitle}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!externalDate && (
                <>
                  <label className="sr-only" htmlFor="saisie-date">
                    Date
                  </label>
                  <input
                    id="saisie-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={filterControlClass}
                  />
                </>
              )}
              {!externalHour && (
                <div className={`${filterControlClass} gap-0.5 pr-1 pl-2`} role="group" aria-label="Créneau">
                  <button
                    type="button"
                    onClick={() => goToCreneau(previousHour)}
                    className="rounded-lg p-1.5 text-bodydark2 hover:bg-black/5 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white"
                    title={`Créneau précédent (${HOUR_LABELS[previousHour]})`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="min-w-[2.5rem] py-1.5 text-center text-sm font-medium text-primary dark:text-white">
                    {HOUR_LABELS[hour] ?? hour}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToCreneau(nextHour)}
                    className="rounded-lg p-1.5 text-bodydark2 hover:bg-black/5 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white"
                    title={`Créneau suivant (${HOUR_LABELS[nextHour]})`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Zone de saisie : directement sur la page */}
      <div className={`p-6 ${externalDate ? 'pb-2' : ''}`}>
          {orderedCategories.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {orderedCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label =
                  isCompresseurK244 && LABELS_K244[cat] ? LABELS_K244[cat] : cat || 'Divers';
                return (
                  <button
                    key={cat || 'Divers'}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                      isSelected
                        ? 'border-primary bg-primary text-white dark:border-primary dark:bg-primary'
                        : 'border-stroke/70 bg-white/90 text-primary hover:border-primary/50 hover:bg-white hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {!isCompresseurK244 && !isReformateurCatalytique && !isGaz && !isCompresseurK245 && !isProductionValeurElectricite && !isAtmMeroxPreflash && (
            <p className="mb-4 text-base font-semibold text-body dark:text-bodydark1">
              {categoryLabel}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {fieldsForSelectedCategory.map(({ label, key }, idx) => {
              const rawValue = values[key] ?? '';
              const isFocused = focusedFieldKey === key;
              /** Au focus : afficher la valeur formatée ("56" pas "56.0"), sauf si l’utilisateur tape une décimale (ex. "14."). */
              const isTypingDecimal = rawValue.endsWith('.') || rawValue.endsWith(',');
              const displayValue = isFocused && isTypingDecimal ? rawValue : formatDisplayValue(rawValue);
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-1"
                >
                  <label
                    htmlFor={key}
                    className="sm:w-44 shrink-0 text-sm font-medium text-body dark:text-bodydark1"
                  >
                    {label}
                  </label>
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    id={key}
                    type="text"
                    value={displayValue}
                    onFocus={() => setFocusedFieldKey(key)}
                    onBlur={() => setFocusedFieldKey(null)}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder="—"
                    className="w-full sm:max-w-xs rounded-lg border border-stroke bg-white py-2 px-3 text-sm text-black placeholder:text-bodydark2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  />
                </div>
              );
            })}
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              isDirty ? 'mt-6 max-h-16 opacity-100' : 'mt-0 max-h-0 opacity-0'
            }`}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={savingBackend || !isDirty}
                className="rounded bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-70"
              >
                {savingBackend ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enregistrement…
                  </span>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
    </>
  );
};

export default FormulaireSaisieFeuille;
