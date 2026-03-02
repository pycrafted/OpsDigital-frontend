import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTableauxFilter } from '../context/TableauxFilterContext';
import TableAnalysesLaboratoire from '../components/Tables/TableAnalysesLaboratoire';
import TableReformateurCatalytique from '../components/Tables/TableReformateurCatalytique';
import TableMouvementDesBacs from '../components/Tables/TableMouvementDesBacs';
import TableProductionValeurElectricite from '../components/Tables/TableProductionValeurElectricite';
import TableCompresseurK245 from '../components/Tables/TableCompresseurK245';
import TableCompresseurK244 from '../components/Tables/TableCompresseurK244';
import TableAtmMeroxPreFlash from '../components/Tables/TableAtmMeroxPreFlash';
import TableGaz from '../components/Tables/TableGaz';
import { createInitialAnalysesData, type AnalyseRow } from '../data/analysesLaboratoire';
import { createInitialReformateurData, type HourRow } from '../data/reformateur';
import { createInitialProductionData, type HourRow as ProductionHourRow } from '../data/production';
import { createInitialAtmMeroxData, type HourRow as AtmMeroxHourRow } from '../data/atmMeroxPreFlash';
import { createInitialCompresseurK245Data, type HourRow as CompresseurK245HourRow } from '../data/compresseurK245';
import { createInitialCompresseurK244Data, type HourRow as CompresseurK244HourRow } from '../data/compresseurK244';
import { createInitialGazData, type HourRow as GazHourRow } from '../data/gaz';
import { fetchAnalysesByDate, saveAnalysesBulk } from '../api/analysesLaboratoire';
import { fetchReformateurByDate, saveReformateurBulk } from '../api/reformateur';
import { fetchProductionByDate, saveProductionBulk } from '../api/production';
import { fetchAtmMeroxByDate, saveAtmMeroxBulk } from '../api/atmMerox';
import { fetchCompresseurK245ByDate, saveCompresseurK245Bulk } from '../api/compresseurK245';
import { fetchCompresseurK244ByDate, saveCompresseurK244Bulk } from '../api/compresseurK244';
import { fetchGazByDate, saveGazBulk } from '../api/gaz';
import {
  createInitialMouvementBacsData,
  MOUVEMENT_BACS_HOURS,
  MOUVEMENT_BACS_PRODUCTS,
  type HourRowWithBacs,
} from '../data/mouvementDesBacs';
import {
  fetchMouvementBacsByDate,
  saveMouvementBacsBulk,
  fetchMouvementBacsBacTypes,
  type BacTypeDto,
} from '../api/mouvementDesBacs';

const TABLEAU_FILTER_OPTIONS = [
  'Analyses du laboratoire',
  'Réformateur catalytique',
  'Production',
  'Gaz',
  'Mouvement des bacs',
  'Atm/merox & pré flash',
  'Compresseur K 245',
  'Compresseur K 244',
  'Tout',
] as const;

const CHEVRON_DOWN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="currentColor" />
  </svg>
);

const AnalysesLaboratoire = () => {
  const [searchParams] = useSearchParams();
  const showAllTables = searchParams.get('tableau') === 'Tout';
  const [data, setData] = useState<AnalyseRow[]>(() => createInitialAnalysesData());
  const tableauFromUrl = searchParams.get('tableau');
  const initialTableau = tableauFromUrl && TABLEAU_FILTER_OPTIONS.includes(tableauFromUrl as (typeof TABLEAU_FILTER_OPTIONS)[number])
    ? tableauFromUrl
    : TABLEAU_FILTER_OPTIONS[0];
  const [selectedTableau, setSelectedTableau] = useState<string>(initialTableau);
  const tableauxCtx = useTableauxFilter();
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const selectedDate = showAllTables ? tableauxCtx.selectedDate : localSelectedDate;
  const setSelectedDate = showAllTables ? tableauxCtx.setSelectedDate : setLocalSelectedDate;
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [reformateurData, setReformateurData] = useState<HourRow[]>(() => createInitialReformateurData());
  const [loadingReformateur, setLoadingReformateur] = useState(false);
  const [productionData, setProductionData] = useState<ProductionHourRow[]>(() => createInitialProductionData());
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [atmMeroxData, setAtmMeroxData] = useState<AtmMeroxHourRow[]>(() => createInitialAtmMeroxData());
  const [loadingAtmMerox, setLoadingAtmMerox] = useState(false);
  const [compresseurK245Data, setCompresseurK245Data] = useState<CompresseurK245HourRow[]>(() => createInitialCompresseurK245Data());
  const [loadingCompresseurK245, setLoadingCompresseurK245] = useState(false);
  const [compresseurK244Data, setCompresseurK244Data] = useState<CompresseurK244HourRow[]>(() => createInitialCompresseurK244Data());
  const [loadingCompresseurK244, setLoadingCompresseurK244] = useState(false);
  const [gazData, setGazData] = useState<GazHourRow[]>(() => createInitialGazData());
  const [loadingGaz, setLoadingGaz] = useState(false);
  const [mouvementBacsData, setMouvementBacsData] = useState<HourRowWithBacs[]>(() =>
    createInitialMouvementBacsData().map((r) => ({ ...r, bacs: {} }))
  );
  const [mouvementBacsBacs, setMouvementBacsBacs] = useState<Record<string, string>>({});
  const [loadingMouvementBacs, setLoadingMouvementBacs] = useState(false);
  const [bacTypesOptions, setBacTypesOptions] = useState<BacTypeDto[]>([]);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.focus();
    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    }
  };

  // Synchroniser l'URL avec le tableau sélectionné (arrivée depuis le menu navbar)
  useEffect(() => {
    if (tableauFromUrl && TABLEAU_FILTER_OPTIONS.includes(tableauFromUrl as (typeof TABLEAU_FILTER_OPTIONS)[number])) {
      setSelectedTableau(tableauFromUrl);
    }
  }, [tableauFromUrl]);

  // Charger les données du backend pour « Analyses du laboratoire »
  const isAnalysesLabo = selectedTableau === TABLEAU_FILTER_OPTIONS[0];
  const [analysesDataIsDirty, setAnalysesDataIsDirty] = useState(false);
  const lastSavedAnalysesRef = useRef<AnalyseRow[]>([]);
  useEffect(() => {
    if (!isAnalysesLabo && !showAllTables) return;
    let cancelled = false;
    setLoadingAnalyses(true);
    fetchAnalysesByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialAnalysesData();
          setData(initialData);
          lastSavedAnalysesRef.current = initialData;
          setAnalysesDataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialAnalysesData();
          setData(initialData);
          lastSavedAnalysesRef.current = initialData;
          setAnalysesDataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalyses(false);
      });
    return () => { cancelled = true; };
  }, [isAnalysesLabo, showAllTables, selectedDate]);

  // Charger les données du backend pour « Réformateur catalytique »
  const isReformateurTableau = selectedTableau === 'Réformateur catalytique';
  const [reformateurDataIsDirty, setReformateurDataIsDirty] = useState(false);
  const lastSavedReformateurRef = useRef<HourRow[]>([]);
  useEffect(() => {
    if (!isReformateurTableau && !showAllTables) return;
    let cancelled = false;
    setLoadingReformateur(true);
    fetchReformateurByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialReformateurData();
          setReformateurData(initialData);
          lastSavedReformateurRef.current = initialData;
          setReformateurDataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialReformateurData();
          setReformateurData(initialData);
          lastSavedReformateurRef.current = initialData;
          setReformateurDataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReformateur(false);
      });
    return () => { cancelled = true; };
  }, [isReformateurTableau, showAllTables, selectedDate]);

  // Charger les données du backend pour « Production »
  const isProductionTableau = selectedTableau === 'Production';
  const [productionDataIsDirty, setProductionDataIsDirty] = useState(false);
  const lastSavedProductionRef = useRef<ProductionHourRow[]>([]);
  useEffect(() => {
    if (!isProductionTableau && !showAllTables) return;
    let cancelled = false;
    setLoadingProduction(true);
    fetchProductionByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialProductionData();
          setProductionData(initialData);
          lastSavedProductionRef.current = initialData;
          setProductionDataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialProductionData();
          setProductionData(initialData);
          lastSavedProductionRef.current = initialData;
          setProductionDataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProduction(false);
      });
    return () => { cancelled = true; };
  }, [isProductionTableau, showAllTables, selectedDate]);

  // Charger les données du backend pour « Atm/merox & pré flash »
  const isAtmMeroxTableau = selectedTableau === 'Atm/merox & pré flash';
  const [atmMeroxDataIsDirty, setAtmMeroxDataIsDirty] = useState(false);
  const lastSavedAtmMeroxRef = useRef<AtmMeroxHourRow[]>([]);
  useEffect(() => {
    if (!isAtmMeroxTableau && !showAllTables) return;
    let cancelled = false;
    setLoadingAtmMerox(true);
    fetchAtmMeroxByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialAtmMeroxData();
          setAtmMeroxData(initialData);
          lastSavedAtmMeroxRef.current = initialData;
          setAtmMeroxDataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialAtmMeroxData();
          setAtmMeroxData(initialData);
          lastSavedAtmMeroxRef.current = initialData;
          setAtmMeroxDataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAtmMerox(false);
      });
    return () => { cancelled = true; };
  }, [isAtmMeroxTableau, showAllTables, selectedDate]);

  // Charger les données du backend pour « Compresseur K 245 »
  const isCompresseurK245Tableau = selectedTableau === 'Compresseur K 245';
  const [compresseurK245DataIsDirty, setCompresseurK245DataIsDirty] = useState(false);
  const lastSavedCompresseurK245Ref = useRef<CompresseurK245HourRow[]>([]);
  useEffect(() => {
    if (!isCompresseurK245Tableau && !showAllTables) return;
    let cancelled = false;
    setLoadingCompresseurK245(true);
    fetchCompresseurK245ByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialCompresseurK245Data();
          setCompresseurK245Data(initialData);
          lastSavedCompresseurK245Ref.current = initialData;
          setCompresseurK245DataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialCompresseurK245Data();
          setCompresseurK245Data(initialData);
          lastSavedCompresseurK245Ref.current = initialData;
          setCompresseurK245DataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCompresseurK245(false);
      });
    return () => { cancelled = true; };
  }, [isCompresseurK245Tableau, showAllTables, selectedDate]);

  // Charger les données du backend pour « Compresseur K 244 »
  const isCompresseurK244Tableau = selectedTableau === 'Compresseur K 244';
  const [compresseurK244DataIsDirty, setCompresseurK244DataIsDirty] = useState(false);
  const lastSavedCompresseurK244Ref = useRef<CompresseurK244HourRow[]>([]);
  useEffect(() => {
    if (!isCompresseurK244Tableau && !showAllTables) return;
    let cancelled = false;
    setLoadingCompresseurK244(true);
    fetchCompresseurK244ByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialCompresseurK244Data();
          setCompresseurK244Data(initialData);
          lastSavedCompresseurK244Ref.current = initialData;
          setCompresseurK244DataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialCompresseurK244Data();
          setCompresseurK244Data(initialData);
          lastSavedCompresseurK244Ref.current = initialData;
          setCompresseurK244DataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCompresseurK244(false);
      });
    return () => { cancelled = true; };
  }, [isCompresseurK244Tableau, showAllTables, selectedDate]);

  // Charger les données du backend pour « Gaz »
  const isGazTableau = selectedTableau === 'Gaz';
  const [gazDataIsDirty, setGazDataIsDirty] = useState(false);
  const lastSavedGazRef = useRef<GazHourRow[]>([]);
  useEffect(() => {
    if (!isGazTableau && !showAllTables) return;
    let cancelled = false;
    setLoadingGaz(true);
    fetchGazByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialGazData();
          setGazData(initialData);
          lastSavedGazRef.current = initialData;
          setGazDataIsDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialGazData();
          setGazData(initialData);
          lastSavedGazRef.current = initialData;
          setGazDataIsDirty(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGaz(false);
      });
    return () => { cancelled = true; };
  }, [isGazTableau, showAllTables, selectedDate]);

  // Charger les types de bacs (une fois) pour Mouvement des bacs
  useEffect(() => {
    let cancelled = false;
    fetchMouvementBacsBacTypes()
      .then((list) => {
        if (!cancelled) setBacTypesOptions(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Charger les données du backend pour « Mouvement des bacs »
  const isMouvementDesBacsTableau = selectedTableau === 'Mouvement des bacs';
  const [mouvementBacsDataIsDirty, setMouvementBacsDataIsDirty] = useState(false);
  const lastSavedMouvementBacsRef = useRef<HourRowWithBacs[]>([]);
  useEffect(() => {
    if (!isMouvementDesBacsTableau && !showAllTables) return;
    let cancelled = false;
    setLoadingMouvementBacs(true);
    fetchMouvementBacsByDate(selectedDate)
      .then((rows) => {
        if (!cancelled) {
          const initialData = rows.length > 0 ? rows : createInitialMouvementBacsData().map((r) => ({ ...r, bacs: {} }));
          setMouvementBacsData(initialData);
          lastSavedMouvementBacsRef.current = initialData;
          setMouvementBacsDataIsDirty(false);
          const firstBacs = initialData[0]?.bacs ?? {};
          setMouvementBacsBacs(firstBacs);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const initialData = createInitialMouvementBacsData().map((r) => ({ ...r, bacs: {} }));
          setMouvementBacsData(initialData);
          lastSavedMouvementBacsRef.current = initialData;
          setMouvementBacsDataIsDirty(false);
          setMouvementBacsBacs({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMouvementBacs(false);
      });
    return () => { cancelled = true; };
  }, [isMouvementDesBacsTableau, showAllTables, selectedDate]);

  const [savingAnalyses, setSavingAnalyses] = useState(false);
  const handleAnalysesDataChange = useCallback((newData: AnalyseRow[]) => {
    setData(newData);
    setAnalysesDataIsDirty(true);
  }, []);
  const handleAnalysesValidate = useCallback(() => {
    if (!isAnalysesLabo && !showAllTables) return;
    setSavingAnalyses(true);
    saveAnalysesBulk(selectedDate, data)
      .then(() => {
        lastSavedAnalysesRef.current = data;
        setAnalysesDataIsDirty(false);
      })
      .finally(() => setSavingAnalyses(false));
  }, [isAnalysesLabo, showAllTables, selectedDate, data]);

  const [savingReformateur, setSavingReformateur] = useState(false);
  const handleReformateurDataChange = useCallback((newData: HourRow[]) => {
    setReformateurData(newData);
    setReformateurDataIsDirty(true);
  }, []);
  const handleReformateurValidate = useCallback(() => {
    if (!isReformateurTableau && !showAllTables) return;
    setSavingReformateur(true);
    saveReformateurBulk(selectedDate, reformateurData)
      .then(() => {
        lastSavedReformateurRef.current = reformateurData;
        setReformateurDataIsDirty(false);
      })
      .finally(() => setSavingReformateur(false));
  }, [isReformateurTableau, showAllTables, selectedDate, reformateurData]);

  const [savingProduction, setSavingProduction] = useState(false);
  const handleProductionDataChange = useCallback((newData: ProductionHourRow[]) => {
    setProductionData(newData);
    setProductionDataIsDirty(true);
  }, []);
  const handleProductionValidate = useCallback(() => {
    if (!isProductionTableau && !showAllTables) return;
    setSavingProduction(true);
    saveProductionBulk(selectedDate, productionData)
      .then(() => {
        lastSavedProductionRef.current = productionData;
        setProductionDataIsDirty(false);
      })
      .finally(() => setSavingProduction(false));
  }, [isProductionTableau, showAllTables, selectedDate, productionData]);

  const [savingAtmMerox, setSavingAtmMerox] = useState(false);
  const handleAtmMeroxDataChange = useCallback((newData: AtmMeroxHourRow[]) => {
    setAtmMeroxData(newData);
    setAtmMeroxDataIsDirty(true);
  }, []);
  const handleAtmMeroxValidate = useCallback(() => {
    if (!isAtmMeroxTableau && !showAllTables) return;
    setSavingAtmMerox(true);
    saveAtmMeroxBulk(selectedDate, atmMeroxData)
      .then(() => {
        lastSavedAtmMeroxRef.current = atmMeroxData;
        setAtmMeroxDataIsDirty(false);
      })
      .finally(() => setSavingAtmMerox(false));
  }, [isAtmMeroxTableau, selectedDate, atmMeroxData]);

  const [savingCompresseurK245, setSavingCompresseurK245] = useState(false);
  const handleCompresseurK245DataChange = useCallback((newData: CompresseurK245HourRow[]) => {
    setCompresseurK245Data(newData);
    setCompresseurK245DataIsDirty(true);
  }, []);
  const handleCompresseurK245Validate = useCallback(() => {
    if (!isCompresseurK245Tableau && !showAllTables) return;
    setSavingCompresseurK245(true);
    saveCompresseurK245Bulk(selectedDate, compresseurK245Data)
      .then(() => {
        lastSavedCompresseurK245Ref.current = compresseurK245Data;
        setCompresseurK245DataIsDirty(false);
      })
      .finally(() => setSavingCompresseurK245(false));
  }, [isCompresseurK245Tableau, selectedDate, compresseurK245Data]);

  const [savingCompresseurK244, setSavingCompresseurK244] = useState(false);
  const handleCompresseurK244DataChange = useCallback((newData: CompresseurK244HourRow[]) => {
    setCompresseurK244Data(newData);
    setCompresseurK244DataIsDirty(true);
  }, []);
  const handleCompresseurK244Validate = useCallback(() => {
    if (!isCompresseurK244Tableau && !showAllTables) return;
    setSavingCompresseurK244(true);
    saveCompresseurK244Bulk(selectedDate, compresseurK244Data)
      .then(() => {
        lastSavedCompresseurK244Ref.current = compresseurK244Data;
        setCompresseurK244DataIsDirty(false);
      })
      .finally(() => setSavingCompresseurK244(false));
  }, [isCompresseurK244Tableau, selectedDate, compresseurK244Data]);

  const [savingGaz, setSavingGaz] = useState(false);
  const handleGazDataChange = useCallback((newData: GazHourRow[]) => {
    setGazData(newData);
    setGazDataIsDirty(true);
  }, []);
  const handleGazValidate = useCallback(() => {
    if (!isGazTableau && !showAllTables) return;
    setSavingGaz(true);
    saveGazBulk(selectedDate, gazData)
      .then(() => {
        lastSavedGazRef.current = gazData;
        setGazDataIsDirty(false);
      })
      .finally(() => setSavingGaz(false));
  }, [isGazTableau, selectedDate, gazData]);

  const [savingMouvementBacs, setSavingMouvementBacs] = useState(false);
  const handleMouvementBacsDataChange = useCallback(
    (newTableData: Record<string, Record<string, string>>, newBacs: Record<string, string>) => {
      setMouvementBacsBacs(newBacs);
      const rows: HourRowWithBacs[] = MOUVEMENT_BACS_HOURS.map((hour) => ({
        hour,
        values: { ...Object.fromEntries(MOUVEMENT_BACS_PRODUCTS.map((p) => [p, ''])), ...(newTableData[hour] ?? {}) },
        bacs: newBacs,
      }));
      setMouvementBacsData(rows);
      setMouvementBacsDataIsDirty(true);
    },
    []
  );
  const handleMouvementBacsValidate = useCallback(() => {
    if (!isMouvementDesBacsTableau && !showAllTables) return;
    setSavingMouvementBacs(true);
    const rowsToSave = mouvementBacsData.map((r) => ({ ...r, bacs: mouvementBacsBacs }));
    saveMouvementBacsBulk(selectedDate, rowsToSave)
      .then((updated) => {
        lastSavedMouvementBacsRef.current = updated;
        setMouvementBacsData(updated);
        setMouvementBacsBacs(updated[0]?.bacs ?? {});
        setMouvementBacsDataIsDirty(false);
      })
      .finally(() => setSavingMouvementBacs(false));
  }, [isMouvementDesBacsTableau, selectedDate, mouvementBacsData, mouvementBacsBacs]);

  const mouvementBacsTableData = useMemo(() => {
    const t: Record<string, Record<string, string>> = {};
    mouvementBacsData.forEach((r) => {
      t[r.hour] = { ...r.values };
    });
    return t;
  }, [mouvementBacsData]);

  const isReformateur = selectedTableau === 'Réformateur catalytique';
  const isMouvementDesBacs = selectedTableau === 'Mouvement des bacs';
  const isProduction = selectedTableau === 'Production';
  const isGaz = selectedTableau === 'Gaz';
  const isCompresseurK245 = selectedTableau === 'Compresseur K 245';
  const isCompresseurK244 = selectedTableau === 'Compresseur K 244';
  const isAtmMeroxPreFlash = selectedTableau === 'Atm/merox & pré flash';
  const isContentSizedTable =
    isReformateur ||
    isMouvementDesBacs ||
    isProduction ||
    isGaz ||
    isCompresseurK245 ||
    isCompresseurK244 ||
    isAtmMeroxPreFlash;

  const cardTitle = isReformateur
    ? 'Tableau — Réformateur catalytique'
    : isMouvementDesBacs
      ? 'Tableau — Mouvement des bacs'
      : isProduction
        ? 'Tableau — Production'
        : isGaz
          ? 'Tableau — Gaz'
          : isCompresseurK245
            ? 'Tableau — Compresseur K 245'
            : isCompresseurK244
              ? 'Tableau — Compresseur K 244'
              : isAtmMeroxPreFlash
                ? 'Tableau — Atm/merox & pré flash'
                : selectedTableau === TABLEAU_FILTER_OPTIONS[0]
                  ? 'Tableau — Analyses du laboratoire'
                  : `Tableau — ${selectedTableau}`;

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-[#3c50e0] shadow-sm transition hover:border-primary/50 hover:bg-white hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80 dark:hover:text-white';

  const headerBlock = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-2xl font-semibold text-primary dark:text-white">
          {cardTitle}
        </p>
        <div className="relative">
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute left-0 bottom-0 h-0 w-0 opacity-0 pointer-events-none"
            aria-hidden
          />
          <button type="button" onClick={openDatePicker} className={filterTriggerClass}>
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {selectedDate}
            <span>{CHEVRON_DOWN}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const tableContent = isReformateur ? (
    <div className="flex min-w-0 flex-col">
      <TableReformateurCatalytique
        data={reformateurData}
        onDataChange={handleReformateurDataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingReformateur}
        onValidate={handleReformateurValidate}
        saving={savingReformateur}
        showValidateButton={reformateurDataIsDirty}
        lastSavedData={lastSavedReformateurRef.current}
        sectionTitle="Tableau — Réformateur catalytique"
        showInlineDate
      />
    </div>
  ) : isMouvementDesBacs ? (
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden">
      <TableMouvementDesBacs
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        data={mouvementBacsTableData}
        onDataChange={handleMouvementBacsDataChange}
        bacTypeByProduct={mouvementBacsBacs}
        loading={loadingMouvementBacs}
        onValidate={handleMouvementBacsValidate}
        saving={savingMouvementBacs}
        showValidateButton={mouvementBacsDataIsDirty}
        bacTypesOptions={bacTypesOptions}
        lastSavedData={lastSavedMouvementBacsRef.current}
        sectionTitle="Tableau — Mouvement des bacs"
        showInlineDate
      />
    </div>
  ) : isProduction ? (
    <div className="flex min-w-0 flex-col">
      <TableProductionValeurElectricite
        data={productionData}
        onDataChange={handleProductionDataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingProduction}
        onValidate={handleProductionValidate}
        saving={savingProduction}
        showValidateButton={productionDataIsDirty}
        lastSavedData={lastSavedProductionRef.current}
        sectionTitle="Tableau — Production"
        showInlineDate
      />
    </div>
  ) : isGaz ? (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <TableGaz
        data={gazData}
        onDataChange={handleGazDataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingGaz}
        onValidate={handleGazValidate}
        saving={savingGaz}
        showValidateButton={gazDataIsDirty}
        lastSavedData={lastSavedGazRef.current}
        sectionTitle="Tableau — Gaz"
        showInlineDate
      />
    </div>
  ) : isCompresseurK245 ? (
    <div className="flex min-w-0 flex-col">
      <TableCompresseurK245
        data={compresseurK245Data}
        onDataChange={handleCompresseurK245DataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingCompresseurK245}
        onValidate={handleCompresseurK245Validate}
        saving={savingCompresseurK245}
        showValidateButton={compresseurK245DataIsDirty}
        lastSavedData={lastSavedCompresseurK245Ref.current}
        sectionTitle="Tableau — Compresseur K 245"
        showInlineDate
      />
    </div>
  ) : isCompresseurK244 ? (
    <div className="flex min-w-0 flex-col">
      <TableCompresseurK244
        data={compresseurK244Data}
        onDataChange={handleCompresseurK244DataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingCompresseurK244}
        onValidate={handleCompresseurK244Validate}
        saving={savingCompresseurK244}
        showValidateButton={compresseurK244DataIsDirty}
        lastSavedData={lastSavedCompresseurK244Ref.current}
        sectionTitle="Tableau — Compresseur K 244"
        showInlineDate
      />
    </div>
  ) : isAtmMeroxPreFlash ? (
    <div className="flex min-w-0 flex-col">
      <TableAtmMeroxPreFlash
        data={atmMeroxData}
        onDataChange={handleAtmMeroxDataChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        loading={loadingAtmMerox}
        onValidate={handleAtmMeroxValidate}
        saving={savingAtmMerox}
        showValidateButton={atmMeroxDataIsDirty}
        lastSavedData={lastSavedAtmMeroxRef.current}
        sectionTitle="Tableau — Atm/merox & pré flash"
        showInlineDate
      />
    </div>
  ) : (
    <TableAnalysesLaboratoire data={data} onDataChange={handleAnalysesDataChange} selectedDate={selectedDate} onDateChange={setSelectedDate} loading={loadingAnalyses} onValidate={handleAnalysesValidate} saving={savingAnalyses} showValidateButton={analysesDataIsDirty} lastSavedData={lastSavedAnalysesRef.current} sectionTitle="Tableau — Analyses du laboratoire" showInlineDate />
  );


  if (showAllTables) {
    return (
      <div className="flex flex-col gap-10 pt-14">

        {/* Réformateur catalytique — premier tableau après la navbar */}
        <div className="-mt-4 flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="flex min-w-0 flex-col">
              <TableReformateurCatalytique
                data={reformateurData}
                onDataChange={handleReformateurDataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingReformateur}
                onValidate={handleReformateurValidate}
                saving={savingReformateur}
                showValidateButton={reformateurDataIsDirty}
                lastSavedData={lastSavedReformateurRef.current}
                sectionTitle="Tableau — Réformateur catalytique"
              />
            </div>
          </div>
        </div>

        {/* Production */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="flex min-w-0 flex-col">
              <TableProductionValeurElectricite
                data={productionData}
                onDataChange={handleProductionDataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingProduction}
                onValidate={handleProductionValidate}
                saving={savingProduction}
                showValidateButton={productionDataIsDirty}
                lastSavedData={lastSavedProductionRef.current}
                sectionTitle="Tableau — Production"
              />
            </div>
          </div>
        </div>

        {/* Gaz */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col items-center overflow-visible">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <TableGaz
                data={gazData}
                onDataChange={handleGazDataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingGaz}
                onValidate={handleGazValidate}
                saving={savingGaz}
                showValidateButton={gazDataIsDirty}
                lastSavedData={lastSavedGazRef.current}
                sectionTitle="Tableau — Gaz"
              />
            </div>
          </div>
        </div>

        {/* Mouvement des bacs */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col items-center overflow-visible">
            <div className="flex min-w-0 w-full max-w-full flex-col overflow-visible">
              <TableMouvementDesBacs
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                data={mouvementBacsTableData}
                onDataChange={handleMouvementBacsDataChange}
                bacTypeByProduct={mouvementBacsBacs}
                loading={loadingMouvementBacs}
                onValidate={handleMouvementBacsValidate}
                saving={savingMouvementBacs}
                showValidateButton={mouvementBacsDataIsDirty}
                bacTypesOptions={bacTypesOptions}
                lastSavedData={lastSavedMouvementBacsRef.current}
                sectionTitle="Tableau — Mouvement des bacs"
              />
            </div>
          </div>
        </div>

        {/* Atm/merox & pré flash */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="flex min-w-0 flex-col">
              <TableAtmMeroxPreFlash
                data={atmMeroxData}
                onDataChange={handleAtmMeroxDataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingAtmMerox}
                onValidate={handleAtmMeroxValidate}
                saving={savingAtmMerox}
                showValidateButton={atmMeroxDataIsDirty}
                lastSavedData={lastSavedAtmMeroxRef.current}
                sectionTitle="Tableau — Atm/merox & pré flash"
              />
            </div>
          </div>
        </div>

        {/* Compresseur K 245 */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="flex min-w-0 flex-col">
              <TableCompresseurK245
                data={compresseurK245Data}
                onDataChange={handleCompresseurK245DataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingCompresseurK245}
                onValidate={handleCompresseurK245Validate}
                saving={savingCompresseurK245}
                showValidateButton={compresseurK245DataIsDirty}
                lastSavedData={lastSavedCompresseurK245Ref.current}
                sectionTitle="Tableau — Compresseur K 245"
              />
            </div>
          </div>
        </div>

        {/* Compresseur K 244 */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="flex min-w-0 flex-col">
              <TableCompresseurK244
                data={compresseurK244Data}
                onDataChange={handleCompresseurK244DataChange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingCompresseurK244}
                onValidate={handleCompresseurK244Validate}
                saving={savingCompresseurK244}
                showValidateButton={compresseurK244DataIsDirty}
                lastSavedData={lastSavedCompresseurK244Ref.current}
                sectionTitle="Tableau — Compresseur K 244"
              />
            </div>
          </div>
        </div>

        {/* Analyses du laboratoire — dernier tableau en bas de page, toutes les lignes visibles sans scroll interne */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <TableAnalysesLaboratoire
              data={data}
              onDataChange={handleAnalysesDataChange}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              loading={loadingAnalyses}
              onValidate={handleAnalysesValidate}
              saving={savingAnalyses}
              showValidateButton={analysesDataIsDirty}
              lastSavedData={lastSavedAnalysesRef.current}
              allRowsVisible
              sectionTitle="Tableau — Analyses du laboratoire"
            />
          </div>
        </div>
      </div>
    );
  }

  if (isGaz) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-6">
        {tableContent}
      </div>
    );
  }

  if (isAnalysesLabo) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
        {tableContent}
      </div>
    );
  }

  if (isReformateur) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-visible pt-6">
        {tableContent}
      </div>
    );
  }

  if (isMouvementDesBacs) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden pt-6">
        {tableContent}
      </div>
    );
  }

  if (isProduction) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-visible pt-6">
        {tableContent}
      </div>
    );
  }

  if (isCompresseurK245) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-visible pt-6">
        {tableContent}
      </div>
    );
  }

  if (isCompresseurK244) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-visible pt-6">
        {tableContent}
      </div>
    );
  }

  if (isAtmMeroxPreFlash) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-visible pt-6">
        {tableContent}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
      {tableContent}
    </div>
  );
};

export default AnalysesLaboratoire;
