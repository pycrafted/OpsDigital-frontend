import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGraphiqueFilter } from '../context/GraphiqueFilterContext';
import { cacheKey, getCached, invalidateCacheByPrefix, setCached } from '../utils/fetchCache';
import ChartAnalysesLaboratoire, { type DurationFilter, type WeekAnalysesData, type MonthAnalysesData } from '../components/Charts/ChartAnalysesLaboratoire';
import ChartAtmMeroxPreFlash, { type MonthAtmMeroxData } from '../components/Charts/ChartAtmMeroxPreFlash';
import ChartGaz from '../components/Charts/ChartGaz';
import ChartMouvementDesBacs, { type WeekMouvementBacsData, type MonthMouvementBacsData } from '../components/Charts/ChartMouvementDesBacs';
import ChartCompresseurK244 from '../components/Charts/ChartCompresseurK244';
import ChartCompresseurK245 from '../components/Charts/ChartCompresseurK245';
import ChartProduction from '../components/Charts/ChartProduction';
import ChartReformateurCatalytique from '../components/Charts/ChartReformateurCatalytique';
import { ANALYSES_MEASURE_NAMES, createInitialAnalysesData, type AnalyseRow } from '../data/analysesLaboratoire';
import { productLabels, products, type ProductKey } from '../data/analysesLaboratoire';
import { fetchAnalysesByDate, fetchAnalysesByDateRange } from '../api/analysesLaboratoire';
import {
  createInitialCompresseurK244Data,
  getCompresseurK244IndicateurOptions,
  type HourRow as CompresseurK244HourRow,
} from '../data/compresseurK244';
import { fetchCompresseurK244ByDate, fetchCompresseurK244ByDateRange } from '../api/compresseurK244';
import {
  createInitialCompresseurK245Data,
  getCompresseurK245IndicateurOptions,
  type HourRow as CompresseurK245HourRow,
} from '../data/compresseurK245';
import { fetchCompresseurK245ByDate, fetchCompresseurK245ByDateRange } from '../api/compresseurK245';
import {
  createInitialAtmMeroxData,
  getAtmMeroxIndicateurOptions,
  type HourRow as AtmMeroxHourRow,
} from '../data/atmMeroxPreFlash';
import { fetchAtmMeroxByDate, fetchAtmMeroxByDateRange } from '../api/atmMerox';
import {
  createInitialGazData,
  getGazIndicateurOptions,
  type HourRow as GazHourRow,
} from '../data/gaz';
import { fetchGazByDate, fetchGazByDateRange } from '../api/gaz';
import {
  createInitialMouvementBacsData,
  getMouvementBacsIndicateurOptions,
  type HourRowWithBacs,
} from '../data/mouvementDesBacs';
import { fetchMouvementBacsByDate, fetchMouvementBacsByDateRange } from '../api/mouvementDesBacs';
import { createInitialProductionData, getProductionIndicateurOptions, type HourRow as ProductionHourRow } from '../data/production';
import { fetchProductionByDate, fetchProductionByDateRange } from '../api/production';
import {
  createInitialReformateurData,
  getReformateurIndicateurOptions,
  type HourRow as ReformateurHourRow,
} from '../data/reformateurCatalytique';
import { fetchReformateurByDate, fetchReformateurByDateRange } from '../api/reformateur';
import type {
  WeekReformateurData,
  MonthReformateurData,
} from '../components/Charts/ChartReformateurCatalytique';
import type {
  WeekProductionData,
  MonthProductionData,
} from '../components/Charts/ChartProduction';
import type { WeekGazData, MonthGazData } from '../components/Charts/ChartGaz';
import type { WeekCompresseurK245Data, MonthCompresseurK245Data } from '../components/Charts/ChartCompresseurK245';
import type { WeekCompresseurK244Data, MonthCompresseurK244Data } from '../components/Charts/ChartCompresseurK244';

/** Retourne la semaine ISO (YYYY-Www) pour une date */
function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}




type GraphType =
  | 'analyses'
  | 'reformateur'
  | 'production'
  | 'mouvement-des-bacs'
  | 'compresseur-k245'
  | 'compresseur-k244'
  | 'atm-merox-pre-flash'
  | 'gaz';

const reformateurIndicateurOptions = getReformateurIndicateurOptions();
const productionIndicateurOptions = getProductionIndicateurOptions();
const mouvementBacsIndicateurOptions = getMouvementBacsIndicateurOptions();
const compresseurK245IndicateurOptions = getCompresseurK245IndicateurOptions();
const compresseurK244IndicateurOptions = getCompresseurK244IndicateurOptions();
const atmMeroxIndicateurOptions = getAtmMeroxIndicateurOptions();
const gazIndicateurOptions = getGazIndicateurOptions();

const AnalysesLaboratoireGraphique = () => {
  const { pathname } = useLocation();
  const showAllGraphs = pathname === '/graphique/tous';
  const graphType: GraphType =
    pathname === '/graphique/reformateur-catalytique'
      ? 'reformateur'
      : pathname === '/graphique/production'
        ? 'production'
        : pathname === '/graphique/mouvement-des-bacs'
          ? 'mouvement-des-bacs'
          : pathname === '/graphique/compresseur-k245'
            ? 'compresseur-k245'
            : pathname === '/graphique/compresseur-k244'
              ? 'compresseur-k244'
              : pathname === '/graphique/atm-merox-pre-flash'
                ? 'atm-merox-pre-flash'
                : pathname === '/graphique/gaz'
                  ? 'gaz'
                  : pathname === '/graphique/tous'
                    ? 'analyses'
                    : 'analyses';

  const [analysesData, setAnalysesData] = useState<AnalyseRow[] | null>(null);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [errorAnalyses, setErrorAnalyses] = useState<string | null>(null);
  const [weekAnalysesData, setWeekAnalysesData] = useState<WeekAnalysesData | null>(null);
  const [loadingAnalysesWeek, setLoadingAnalysesWeek] = useState(false);
  const [errorAnalysesWeek, setErrorAnalysesWeek] = useState<string | null>(null);
  const [monthAnalysesData, setMonthAnalysesData] = useState<MonthAnalysesData | null>(null);
  const [loadingAnalysesMonth, setLoadingAnalysesMonth] = useState(false);
  const [errorAnalysesMonth, setErrorAnalysesMonth] = useState<string | null>(null);
  const initialAnalysesData = useMemo(() => createInitialAnalysesData(), []);
  const analysesDataForChart = analysesData ?? initialAnalysesData;
  const [reformateurData, setReformateurData] = useState<ReformateurHourRow[] | null>(null);
  const [loadingReformateurDay, setLoadingReformateurDay] = useState(false);
  const [errorReformateurDay, setErrorReformateurDay] = useState<string | null>(null);
  const [weekReformateurData, setWeekReformateurData] = useState<WeekReformateurData | null>(null);
  const [loadingReformateurWeek, setLoadingReformateurWeek] = useState(false);
  const [errorReformateurWeek, setErrorReformateurWeek] = useState<string | null>(null);
  const [monthReformateurData, setMonthReformateurData] = useState<MonthReformateurData | null>(null);
  const [loadingReformateurMonth, setLoadingReformateurMonth] = useState(false);
  const [errorReformateurMonth, setErrorReformateurMonth] = useState<string | null>(null);
  const initialReformateurData = useMemo(() => createInitialReformateurData(), []);
  const reformateurDataForChart = reformateurData ?? initialReformateurData;
  const [productionData, setProductionData] = useState<ProductionHourRow[] | null>(null);
  const [loadingProductionDay, setLoadingProductionDay] = useState(false);
  const [errorProductionDay, setErrorProductionDay] = useState<string | null>(null);
  const [weekProductionData, setWeekProductionData] = useState<WeekProductionData | null>(null);
  const [loadingProductionWeek, setLoadingProductionWeek] = useState(false);
  const [errorProductionWeek, setErrorProductionWeek] = useState<string | null>(null);
  const [monthProductionData, setMonthProductionData] = useState<MonthProductionData | null>(null);
  const [loadingProductionMonth, setLoadingProductionMonth] = useState(false);
  const [errorProductionMonth, setErrorProductionMonth] = useState<string | null>(null);
  const initialProductionData = useMemo(() => createInitialProductionData(), []);
  const productionDataForChart = productionData ?? initialProductionData;
  const [mouvementBacsDataDay, setMouvementBacsDataDay] = useState<HourRowWithBacs[] | null>(null);
  const [loadingMouvementBacsDay, setLoadingMouvementBacsDay] = useState(false);
  const [errorMouvementBacsDay, setErrorMouvementBacsDay] = useState<string | null>(null);
  const [weekMouvementBacsData, setWeekMouvementBacsData] = useState<WeekMouvementBacsData | null>(null);
  const [loadingMouvementBacsWeek, setLoadingMouvementBacsWeek] = useState(false);
  const [errorMouvementBacsWeek, setErrorMouvementBacsWeek] = useState<string | null>(null);
  const [monthMouvementBacsData, setMonthMouvementBacsData] = useState<MonthMouvementBacsData | null>(null);
  const [loadingMouvementBacsMonth, setLoadingMouvementBacsMonth] = useState(false);
  const [errorMouvementBacsMonth, setErrorMouvementBacsMonth] = useState<string | null>(null);
  const initialMouvementBacsData = useMemo(() => createInitialMouvementBacsData(), []);
  const mouvementBacsDataForChart = mouvementBacsDataDay ?? initialMouvementBacsData;
  const [gazDataDay, setGazDataDay] = useState<GazHourRow[] | null>(null);
  const [loadingGazDay, setLoadingGazDay] = useState(false);
  const [errorGazDay, setErrorGazDay] = useState<string | null>(null);
  const initialGazData = useMemo(() => createInitialGazData(), []);
  const gazDataForChart = gazDataDay ?? initialGazData;
  const [weekGazData, setWeekGazData] = useState<WeekGazData | null>(null);
  const [loadingGazWeek, setLoadingGazWeek] = useState(false);
  const [errorGazWeek, setErrorGazWeek] = useState<string | null>(null);
  const [monthGazData, setMonthGazData] = useState<MonthGazData | null>(null);
  const [loadingGazMonth, setLoadingGazMonth] = useState(false);
  const [errorGazMonth, setErrorGazMonth] = useState<string | null>(null);
  const [compresseurK245Data, setCompresseurK245Data] = useState<CompresseurK245HourRow[] | null>(null);
  const [loadingCompresseurK245, setLoadingCompresseurK245] = useState(false);
  const [errorCompresseurK245, setErrorCompresseurK245] = useState<string | null>(null);
  const [weekCompresseurK245Data, setWeekCompresseurK245Data] = useState<WeekCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Week, setLoadingCompresseurK245Week] = useState(false);
  const [errorCompresseurK245Week, setErrorCompresseurK245Week] = useState<string | null>(null);
  const [monthCompresseurK245Data, setMonthCompresseurK245Data] = useState<MonthCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Month, setLoadingCompresseurK245Month] = useState(false);
  const [errorCompresseurK245Month, setErrorCompresseurK245Month] = useState<string | null>(null);
  const initialCompresseurK245Data = useMemo(() => createInitialCompresseurK245Data(), []);
  const compresseurK245DataForChart = compresseurK245Data ?? initialCompresseurK245Data;
  const [compresseurK244Data, setCompresseurK244Data] = useState<CompresseurK244HourRow[] | null>(null);
  const [loadingCompresseurK244, setLoadingCompresseurK244] = useState(false);
  const [errorCompresseurK244, setErrorCompresseurK244] = useState<string | null>(null);
  const [weekCompresseurK244Data, setWeekCompresseurK244Data] = useState<WeekCompresseurK244Data | null>(null);
  const [loadingCompresseurK244Week, setLoadingCompresseurK244Week] = useState(false);
  const [errorCompresseurK244Week, setErrorCompresseurK244Week] = useState<string | null>(null);
  const [monthCompresseurK244Data, setMonthCompresseurK244Data] = useState<MonthCompresseurK244Data | null>(null);
  const [loadingCompresseurK244Month, setLoadingCompresseurK244Month] = useState(false);
  const [errorCompresseurK244Month, setErrorCompresseurK244Month] = useState<string | null>(null);
  const initialCompresseurK244Data = useMemo(() => createInitialCompresseurK244Data(), []);
  const compresseurK244DataForChart = compresseurK244Data ?? initialCompresseurK244Data;
  const [atmMeroxData, setAtmMeroxData] = useState<AtmMeroxHourRow[] | null>(null);
  const [loadingAtmMerox, setLoadingAtmMerox] = useState(false);
  const [errorAtmMerox, setErrorAtmMerox] = useState<string | null>(null);
  const [weekAtmMeroxData, setWeekAtmMeroxData] = useState<MonthAtmMeroxData | null>(null);
  const [loadingAtmMeroxWeek, setLoadingAtmMeroxWeek] = useState(false);
  const [errorAtmMeroxWeek, setErrorAtmMeroxWeek] = useState<string | null>(null);
  const [monthAtmMeroxData, setMonthAtmMeroxData] = useState<MonthAtmMeroxData | null>(null);
  const [loadingAtmMeroxMonth, setLoadingAtmMeroxMonth] = useState(false);
  const [errorAtmMeroxMonth, setErrorAtmMeroxMonth] = useState<string | null>(null);
  const initialAtmMeroxData = useMemo(() => createInitialAtmMeroxData(), []);
  const atmMeroxDataForChart = atmMeroxData ?? initialAtmMeroxData;
  const measureNames = useMemo(() => analysesDataForChart.map((r) => r.property), [analysesDataForChart]);
  const graphiqueCtx = useGraphiqueFilter();
  const [localDuration, setLocalDuration] = useState<DurationFilter>(() =>
    pathname === '/graphique' ? 'day' : 'week'
  );
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [localSelectedWeek, setLocalSelectedWeek] = useState<string>(() => getISOWeekString(new Date()));
  const [localSelectedMonth, setLocalSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const duration = showAllGraphs ? graphiqueCtx.duration : localDuration;
  const setDuration = showAllGraphs ? graphiqueCtx.setDuration : setLocalDuration;
  const selectedDate = showAllGraphs ? graphiqueCtx.selectedDate : localSelectedDate;
  const setSelectedDate = showAllGraphs ? graphiqueCtx.setSelectedDate : setLocalSelectedDate;
  const selectedWeek = showAllGraphs ? graphiqueCtx.selectedWeek : localSelectedWeek;
  const setSelectedWeek = showAllGraphs ? graphiqueCtx.setSelectedWeek : setLocalSelectedWeek;
  const selectedMonth = showAllGraphs ? graphiqueCtx.selectedMonth : localSelectedMonth;
  const setSelectedMonth = showAllGraphs ? graphiqueCtx.setSelectedMonth : setLocalSelectedMonth;
  const [selectedMeasure, setSelectedMeasure] = useState<string>(() => measureNames[0] ?? ANALYSES_MEASURE_NAMES[0] ?? '');
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>(products[0]);
  const [selectedIndicateur, setSelectedIndicateur] = useState<string>(
    () => reformateurIndicateurOptions[0]?.key ?? ''
  );
  const [selectedProductionIndicateur, setSelectedProductionIndicateur] = useState<string>(
    () => productionIndicateurOptions[0]?.key ?? ''
  );
  const [selectedMouvementBacsIndicateur, setSelectedMouvementBacsIndicateur] = useState<string>(
    () => mouvementBacsIndicateurOptions[0]?.key ?? ''
  );
  const [selectedK245Indicateur, setSelectedK245Indicateur] = useState<string>(
    () => compresseurK245IndicateurOptions[0]?.key ?? ''
  );
  const [selectedK244Indicateur, setSelectedK244Indicateur] = useState<string>(
    () => compresseurK244IndicateurOptions[0]?.key ?? ''
  );
  const [selectedAtmMeroxIndicateur, setSelectedAtmMeroxIndicateur] = useState<string>(
    () => atmMeroxIndicateurOptions[0]?.key ?? ''
  );
  const [selectedGazIndicateur, setSelectedGazIndicateur] = useState<string>(
    () => gazIndicateurOptions[0]?.key ?? ''
  );

  // Invalider le cache des analyses pour forcer un rechargement (après modification ailleurs ou au retour sur l’onglet).
  const [analysesCacheVersion, setAnalysesCacheVersion] = useState(0);
  useEffect(() => {
    invalidateCacheByPrefix('analyses:');
  }, []);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        invalidateCacheByPrefix('analyses:');
        setAnalysesCacheVersion((v) => v + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Charger les données Analyses du laboratoire (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'analyses' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('analyses', 'day', selectedDate);
    const cached = getCached<AnalyseRow[] | null>(key);
    if (cached !== null) {
      setAnalysesData(cached);
      return;
    }
    console.log('[Graphique Jour] useEffect fetch: graphType=', graphType, 'duration=', duration, 'selectedDate=', selectedDate);
    setLoadingAnalyses(true);
    setErrorAnalyses(null);
    fetchAnalysesByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        console.log('[Graphique Jour] fetch OK: rows.length=', rows?.length ?? 0, 'sample=', rows?.[0]?.property);
        setAnalysesData(data);
      })
      .catch((err) => {
        console.warn('[Graphique Jour] fetch erreur:', err?.message ?? err);
        setErrorAnalyses(err instanceof Error ? err.message : 'Erreur chargement');
      })
      .finally(() => setLoadingAnalyses(false));
  }, [graphType, duration, selectedDate, analysesCacheVersion]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'atm-merox-pre-flash' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('atm-merox-pre-flash', 'day', selectedDate);
    const cached = getCached<AtmMeroxHourRow[] | null>(key);
    if (cached !== null) {
      setAtmMeroxData(cached);
      return;
    }
    setLoadingAtmMerox(true);
    setErrorAtmMerox(null);
    fetchAtmMeroxByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setAtmMeroxData(data);
      })
      .catch((err) =>
        setErrorAtmMerox(err instanceof Error ? err.message : 'Erreur chargement'),
      )
      .finally(() => setLoadingAtmMerox(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Analyses du laboratoire (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'analyses' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('analyses', 'week', selectedWeek);
    const cached = getCached<WeekAnalysesData>(key);
    if (cached !== null) {
      setWeekAnalysesData(cached);
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAnalysesWeek(true);
    setErrorAnalysesWeek(null);
    fetchAnalysesByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AnalyseRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekAnalysesData(data);
      })
      .catch((err) =>
        setErrorAnalysesWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingAnalysesWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'atm-merox-pre-flash' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('atm-merox-pre-flash', 'week', selectedWeek);
    const cached = getCached<{ dates: string[]; rowsByDate: Record<string, AtmMeroxHourRow[]> }>(key);
    if (cached !== null) {
      setWeekAtmMeroxData({ dates: cached.dates, rowsByDate: cached.rowsByDate });
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAtmMeroxWeek(true);
    setErrorAtmMeroxWeek(null);
    fetchAtmMeroxByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AtmMeroxHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekAtmMeroxData(data);
      })
      .catch((err) =>
        setErrorAtmMeroxWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingAtmMeroxWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Compresseur K 244 (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k244' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('compresseur-k244', 'day', selectedDate);
    const cached = getCached<CompresseurK244HourRow[] | null>(key);
    if (cached !== null) {
      setCompresseurK244Data(cached);
      return;
    }
    setLoadingCompresseurK244(true);
    setErrorCompresseurK244(null);
    fetchCompresseurK244ByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setCompresseurK244Data(data);
      })
      .catch((err) =>
        setErrorCompresseurK244(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingCompresseurK244(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Compresseur K 245 (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k245' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('compresseur-k245', 'day', selectedDate);
    const cached = getCached<CompresseurK245HourRow[] | null>(key);
    if (cached !== null) {
      setCompresseurK245Data(cached);
      return;
    }
    setLoadingCompresseurK245(true);
    setErrorCompresseurK245(null);
    fetchCompresseurK245ByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setCompresseurK245Data(data);
      })
      .catch((err) =>
        setErrorCompresseurK245(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingCompresseurK245(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Mouvement des bacs (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'mouvement-des-bacs' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('mouvement-des-bacs', 'day', selectedDate);
    const cached = getCached<HourRowWithBacs[] | null>(key);
    if (cached !== null) {
      setMouvementBacsDataDay(cached);
      return;
    }
    setLoadingMouvementBacsDay(true);
    setErrorMouvementBacsDay(null);
    fetchMouvementBacsByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setMouvementBacsDataDay(data);
      })
      .catch((err) =>
        setErrorMouvementBacsDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingMouvementBacsDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Production (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'production' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('production', 'day', selectedDate);
    const cached = getCached<ProductionHourRow[] | null>(key);
    if (cached !== null) {
      setProductionData(cached);
      return;
    }
    setLoadingProductionDay(true);
    setErrorProductionDay(null);
    fetchProductionByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setProductionData(data);
      })
      .catch((err) =>
        setErrorProductionDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingProductionDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Réformateur catalytique (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'reformateur' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('reformateur', 'day', selectedDate);
    const cached = getCached<ReformateurHourRow[] | null>(key);
    if (cached !== null) {
      setReformateurData(cached);
      return;
    }
    setLoadingReformateurDay(true);
    setErrorReformateurDay(null);
    fetchReformateurByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setReformateurData(data);
      })
      .catch((err) =>
        setErrorReformateurDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingReformateurDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Compresseur K 244 (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k244' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('compresseur-k244', 'week', selectedWeek);
    const cached = getCached<{ dates: string[]; rowsByDate: Record<string, CompresseurK244HourRow[]> }>(key);
    if (cached !== null) {
      setWeekCompresseurK244Data({ dates: cached.dates, rowsByDate: cached.rowsByDate });
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK244Week(true);
    setErrorCompresseurK244Week(null);
    fetchCompresseurK244ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK244HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekCompresseurK244Data(data);
      })
      .catch((err) =>
        setErrorCompresseurK244Week(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingCompresseurK244Week(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Compresseur K 245 (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k245' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('compresseur-k245', 'week', selectedWeek);
    const cached = getCached<{ dates: string[]; rowsByDate: Record<string, CompresseurK245HourRow[]> }>(key);
    if (cached !== null) {
      setWeekCompresseurK245Data({ dates: cached.dates, rowsByDate: cached.rowsByDate });
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK245Week(true);
    setErrorCompresseurK245Week(null);
    fetchCompresseurK245ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK245HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekCompresseurK245Data(data);
      })
      .catch((err) =>
        setErrorCompresseurK245Week(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingCompresseurK245Week(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Réformateur catalytique (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'reformateur' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('reformateur', 'week', selectedWeek);
    const cached = getCached<WeekReformateurData>(key);
    if (cached !== null) {
      setWeekReformateurData(cached);
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingReformateurWeek(true);
    setErrorReformateurWeek(null);
    fetchReformateurByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ReformateurHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekReformateurData(data);
      })
      .catch((err) =>
        setErrorReformateurWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingReformateurWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Production (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'production' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('production', 'week', selectedWeek);
    const cached = getCached<WeekProductionData>(key);
    if (cached !== null) {
      setWeekProductionData(cached);
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingProductionWeek(true);
    setErrorProductionWeek(null);
    fetchProductionByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ProductionHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekProductionData(data);
      })
      .catch((err) =>
        setErrorProductionWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingProductionWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Mouvement des bacs (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'mouvement-des-bacs' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('mouvement-des-bacs', 'week', selectedWeek);
    const cached = getCached<WeekMouvementBacsData>(key);
    if (cached !== null) {
      setWeekMouvementBacsData(cached);
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingMouvementBacsWeek(true);
    setErrorMouvementBacsWeek(null);
    fetchMouvementBacsByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, HourRowWithBacs[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekMouvementBacsData(data);
      })
      .catch((err) =>
        setErrorMouvementBacsWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingMouvementBacsWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Analyses du laboratoire (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'analyses' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('analyses', 'month', selectedMonth);
    const cached = getCached<MonthAnalysesData>(key);
    if (cached !== null) {
      setMonthAnalysesData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAnalysesMonth(true);
    setErrorAnalysesMonth(null);
    fetchAnalysesByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AnalyseRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthAnalysesData(data);
      })
      .catch((err) =>
        setErrorAnalysesMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingAnalysesMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'atm-merox-pre-flash' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('atm-merox-pre-flash', 'month', selectedMonth);
    const cached = getCached<MonthAtmMeroxData>(key);
    if (cached !== null) {
      setMonthAtmMeroxData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAtmMeroxMonth(true);
    setErrorAtmMeroxMonth(null);
    fetchAtmMeroxByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AtmMeroxHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthAtmMeroxData(data);
      })
      .catch((err) =>
        setErrorAtmMeroxMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingAtmMeroxMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Compresseur K 244 (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k244' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('compresseur-k244', 'month', selectedMonth);
    const cached = getCached<{ dates: string[]; rowsByDate: Record<string, CompresseurK244HourRow[]> }>(key);
    if (cached !== null) {
      setMonthCompresseurK244Data({ dates: cached.dates, rowsByDate: cached.rowsByDate });
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    console.log('[K244 Mois] useEffect fetch: selectedMonth=', selectedMonth, 'dates.length=', dates.length, 'start=', start, 'end=', end);
    setLoadingCompresseurK244Month(true);
    setErrorCompresseurK244Month(null);
    fetchCompresseurK244ByDateRange(start, end)
      .then((response) => {
        const keys = Object.keys(response);
        console.log('[K244 Mois] fetch OK: response keys count=', keys.length, 'sample key=', keys[0], 'sample rows length=', response[keys[0]]?.length);
        const rowsByDate: Record<string, CompresseurK244HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthCompresseurK244Data(data);
      })
      .catch((err) => {
        console.warn('[K244 Mois] fetch erreur:', err?.message ?? err);
        setErrorCompresseurK244Month(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        );
      })
      .finally(() => setLoadingCompresseurK244Month(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Compresseur K 245 (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'compresseur-k245' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('compresseur-k245', 'month', selectedMonth);
    const cached = getCached<{ dates: string[]; rowsByDate: Record<string, CompresseurK245HourRow[]> }>(key);
    if (cached !== null) {
      setMonthCompresseurK245Data({ dates: cached.dates, rowsByDate: cached.rowsByDate });
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK245Month(true);
    setErrorCompresseurK245Month(null);
    fetchCompresseurK245ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK245HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthCompresseurK245Data(data);
      })
      .catch((err) =>
        setErrorCompresseurK245Month(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingCompresseurK245Month(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Production (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'production' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('production', 'month', selectedMonth);
    const cached = getCached<MonthProductionData>(key);
    if (cached !== null) {
      setMonthProductionData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingProductionMonth(true);
    setErrorProductionMonth(null);
    fetchProductionByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ProductionHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthProductionData(data);
      })
      .catch((err) =>
        setErrorProductionMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingProductionMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Réformateur catalytique (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'reformateur' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('reformateur', 'month', selectedMonth);
    const cached = getCached<MonthReformateurData>(key);
    if (cached !== null) {
      setMonthReformateurData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingReformateurMonth(true);
    setErrorReformateurMonth(null);
    fetchReformateurByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ReformateurHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthReformateurData(data);
      })
      .catch((err) =>
        setErrorReformateurMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingReformateurMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Mouvement des bacs (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'mouvement-des-bacs' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('mouvement-des-bacs', 'month', selectedMonth);
    const cached = getCached<MonthMouvementBacsData>(key);
    if (cached !== null) {
      setMonthMouvementBacsData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingMouvementBacsMonth(true);
    setErrorMouvementBacsMonth(null);
    fetchMouvementBacsByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, HourRowWithBacs[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthMouvementBacsData(data);
      })
      .catch((err) =>
        setErrorMouvementBacsMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingMouvementBacsMonth(false));
  }, [graphType, duration, selectedMonth]);















  // Charger les données Gaz (vue Jour) depuis le backend
  useEffect(() => {
    if ((graphType !== 'gaz' && !showAllGraphs) || duration !== 'day') return;
    const key = cacheKey('gaz', 'day', selectedDate);
    const cached = getCached<GazHourRow[] | null>(key);
    if (cached !== null) {
      setGazDataDay(cached);
      return;
    }
    setLoadingGazDay(true);
    setErrorGazDay(null);
    fetchGazByDate(selectedDate)
      .then((rows) => {
        const data = rows.length > 0 ? rows : null;
        setCached(key, data);
        setGazDataDay(data);
      })
      .catch((err) =>
        setErrorGazDay(err instanceof Error ? err.message : 'Erreur chargement'),
      )
      .finally(() => setLoadingGazDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Gaz (vue Semaine) depuis le backend
  useEffect(() => {
    if ((graphType !== 'gaz' && !showAllGraphs) || duration !== 'week') return;
    const key = cacheKey('gaz', 'week', selectedWeek);
    const cached = getCached<WeekGazData>(key);
    if (cached !== null) {
      setWeekGazData(cached);
      return;
    }
    const bounds = ((): { start: Date; end: Date } | null => {
      const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      const year = parseInt(match[1], 10);
      const weekNum = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
      const mondayOfWeek = new Date(
        mondayWeek1.getFullYear(),
        mondayWeek1.getMonth(),
        mondayWeek1.getDate() + (weekNum - 1) * 7,
      );
      const sundayOfWeek = new Date(
        mondayOfWeek.getFullYear(),
        mondayOfWeek.getMonth(),
        mondayOfWeek.getDate() + 6,
      );
      return { start: mondayOfWeek, end: sundayOfWeek };
    })();

    if (!bounds) return;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(bounds.start);
      d.setDate(bounds.start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingGazWeek(true);
    setErrorGazWeek(null);
    fetchGazByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, GazHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setWeekGazData(data);
      })
      .catch((err) =>
        setErrorGazWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingGazWeek(false));
  }, [graphType, duration, selectedWeek, analysesCacheVersion]);

  // Charger les données Gaz (vue Mois) depuis le backend
  useEffect(() => {
    if ((graphType !== 'gaz' && !showAllGraphs) || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    const key = cacheKey('gaz', 'month', selectedMonth);
    const cached = getCached<MonthGazData>(key);
    if (cached !== null) {
      setMonthGazData(cached);
      return;
    }
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      dates.push(d.toISOString().slice(0, 10));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingGazMonth(true);
    setErrorGazMonth(null);
    fetchGazByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, GazHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        const data = { dates, rowsByDate };
        setCached(key, data);
        setMonthGazData(data);
      })
      .catch((err) =>
        setErrorGazMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingGazMonth(false));
  }, [graphType, duration, selectedMonth]);



  // Logs debug graphique jour (Analyses)
  useEffect(() => {
    if ((graphType !== 'analyses' && !showAllGraphs) || duration !== 'day') return;
    console.log('[Graphique Jour] page state:', {
      dataLength: analysesDataForChart?.length,
      selectedMeasure,
      selectedProduct,
      loadingAnalyses,
      errorAnalyses,
      selectedDate,
    });
  }, [graphType, duration, analysesDataForChart?.length, selectedMeasure, selectedProduct, loadingAnalyses, errorAnalyses, selectedDate]);

  // Logs debug graphique mois (Compresseur K244)
  useEffect(() => {
    if ((graphType !== 'compresseur-k244' && !showAllGraphs) || duration !== 'month') return;
    console.log('[K244 Mois] page state:', {
      selectedMonth,
      monthCompresseurK244DataDatesLength: monthCompresseurK244Data?.dates?.length,
      monthCompresseurK244DataFirstDates: monthCompresseurK244Data?.dates?.slice(0, 3),
      loadingCompresseurK244Month,
      errorCompresseurK244Month,
    });
  }, [graphType, duration, selectedMonth, monthCompresseurK244Data, loadingCompresseurK244Month, errorCompresseurK244Month]);

  const _durations = ['day', 'week', 'month'] as const;
  const _durationLabels: Record<DurationFilter, string> = { day: 'Jour', week: 'Semaine', month: 'Mois', quarter: 'Trimestre', semester: 'Semestre', year: 'Année' };
  const _dIdx = _durations.indexOf(duration as 'day' | 'week' | 'month');
  const _prevDur = _durations[_dIdx > 0 ? _dIdx - 1 : _durations.length - 1];
  const _nextDur = _durations[_dIdx < _durations.length - 1 ? _dIdx + 1 : 0];

  const dateControls = (
    <>
      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]" role="group" aria-label="Période">
        <button type="button" onClick={() => setDuration(_prevDur)} className="rounded-l px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10" title={`Période précédente (${_durationLabels[_prevDur]})`}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="min-w-[4rem] py-0.5 text-center text-xs font-bold text-primary dark:text-white">{_durationLabels[duration]}</span>
        <button type="button" onClick={() => setDuration(_nextDur)} className="rounded-r px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10" title={`Période suivante (${_durationLabels[_nextDur]})`}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
        {duration === 'day' && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />}
        {duration === 'week' && <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="w-[7rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />}
        {duration === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-[6.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />}
      </div>
    </>
  );

  const graphNavbar = null;

  const contentBlock = (
    <div
      className={`grid gap-6 pt-1 px-6 pb-6 ${
        graphType === 'analyses' ||
        graphType === 'reformateur' ||
        graphType === 'production' ||
        graphType === 'mouvement-des-bacs' ||
        graphType === 'compresseur-k245' ||
        graphType === 'compresseur-k244' ||
        graphType === 'atm-merox-pre-flash' ||
        graphType === 'gaz'
          ? 'md:grid-cols-1'
          : 'md:grid-cols-[260px,1fr]'
      }`}
    >
          {/* Colonne gauche : filtres en cartes (sauf Produit/Mesure pour Analyses, qui montent dans la barre du haut) */}
          <aside className="space-y-4">
            {graphType === 'analyses' && null}
            {graphType === 'reformateur' && null}
            {graphType === 'production' && null}
            {graphType === 'mouvement-des-bacs' && null}
            {graphType === 'compresseur-k245' && null}
            {graphType === 'compresseur-k244' && null}
            {graphType === 'atm-merox-pre-flash' && null}
            {graphType === 'gaz' && null}
          </aside>

          {/* Colonne droite : graphique dans une carte */}
          <section className="min-h-0 flex min-h-[420px] flex-col">
            <div className="flex min-h-[380px] flex-1 flex-col rounded-xl border border-stroke/70 bg-white/90 p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <div className="mb-3 flex w-full flex-wrap items-center justify-center gap-3">

              </div>
              {graphType === 'analyses' && (
                <>
                  {duration === 'day' && loadingAnalyses && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (jour)…</p>
                  )}
                  {duration === 'day' && errorAnalyses && !loadingAnalyses && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalyses}</p>
                  )}
                  {duration === 'week' && loadingAnalysesWeek && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (hebdomadaire)…</p>
                  )}
                  {duration === 'week' && errorAnalysesWeek && !loadingAnalysesWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalysesWeek}</p>
                  )}
                  {duration === 'month' && loadingAnalysesMonth && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (mois)…</p>
                  )}
                  {duration === 'month' && errorAnalysesMonth && !loadingAnalysesMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalysesMonth}</p>
                  )}
                  <ChartAnalysesLaboratoire
                    data={analysesDataForChart}
                    embedded={false}
                    duration={duration}
                    onDurationChange={setDuration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedMeasure={selectedMeasure}
                    onMeasureChange={setSelectedMeasure}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                    weekAnalysesData={duration === 'week' ? weekAnalysesData ?? undefined : undefined}
                    monthAnalysesData={duration === 'month' ? monthAnalysesData ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Analyses du laboratoire</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <>
                        <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                          <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Produit</span>
                          <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                          <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value as ProductKey)}
                            className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                          >
                            {products.map((p) => (
                              <option key={p} value={p}>{productLabels[p]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                          <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Mesure</span>
                          <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                          <select
                            value={selectedMeasure}
                            onChange={(e) => setSelectedMeasure(e.target.value)}
                            className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                          >
                            {measureNames.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  />
                </>
              )}
              {graphType === 'reformateur' && (
                <>
                  {duration === 'day' && loadingReformateurDay && (
                    <p className="text-sm text-bodydark2">Chargement du réformateur (jour)…</p>
                  )}
                  {duration === 'day' && errorReformateurDay && !loadingReformateurDay && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorReformateurDay}</p>
                  )}
                  {duration === 'week' && loadingReformateurWeek && (
                    <p className="text-sm text-bodydark2">
                      Chargement du réformateur (hebdomadaire)…
                    </p>
                  )}
                  {duration === 'week' && errorReformateurWeek && !loadingReformateurWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorReformateurWeek}
                    </p>
                  )}
                  {duration === 'month' && loadingReformateurMonth && (
                    <p className="text-sm text-bodydark2">
                      Chargement du réformateur (mois)…
                    </p>
                  )}
                  {duration === 'month' && errorReformateurMonth && !loadingReformateurMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorReformateurMonth}
                    </p>
                  )}
                  <ChartReformateurCatalytique
                    data={reformateurDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedIndicateur}
                    onIndicateurChange={setSelectedIndicateur}
                    embedded={false}
                    weekReformateurData={duration === 'week' ? weekReformateurData ?? undefined : undefined}
                    monthReformateurData={duration === 'month' ? monthReformateurData ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Réformateur catalytique</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedIndicateur}
                          onChange={(e) => setSelectedIndicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {reformateurIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'production' && (
                <>
                  {duration === 'day' && loadingProductionDay && (
                    <p className="text-sm text-bodydark2">Chargement de la production (jour)…</p>
                  )}
                  {duration === 'day' && errorProductionDay && !loadingProductionDay && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionDay}</p>
                  )}
                  {duration === 'week' && loadingProductionWeek && (
                    <p className="text-sm text-bodydark2">Chargement de la production (semaine)…</p>
                  )}
                  {duration === 'week' && errorProductionWeek && !loadingProductionWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionWeek}</p>
                  )}
                  {duration === 'month' && loadingProductionMonth && (
                    <p className="text-sm text-bodydark2">Chargement de la production (mois)…</p>
                  )}
                  {duration === 'month' && errorProductionMonth && !loadingProductionMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionMonth}</p>
                  )}
                  <ChartProduction
                    data={productionDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedProductionIndicateur}
                    onIndicateurChange={setSelectedProductionIndicateur}
                    embedded={false}
                    weekProductionData={duration === 'week' ? weekProductionData ?? undefined : undefined}
                    monthProductionData={duration === 'month' ? monthProductionData ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Production</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedProductionIndicateur}
                          onChange={(e) => setSelectedProductionIndicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {productionIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'mouvement-des-bacs' && (
                <>
                  {duration === 'day' && loadingMouvementBacsDay && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (jour)…</p>
                  )}
                  {duration === 'day' && errorMouvementBacsDay && !loadingMouvementBacsDay && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsDay}</p>
                  )}
                  {duration === 'week' && loadingMouvementBacsWeek && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (hebdomadaire)…</p>
                  )}
                  {duration === 'week' && errorMouvementBacsWeek && !loadingMouvementBacsWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsWeek}</p>
                  )}
                  {duration === 'month' && loadingMouvementBacsMonth && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (mois)…</p>
                  )}
                  {duration === 'month' && errorMouvementBacsMonth && !loadingMouvementBacsMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsMonth}</p>
                  )}
                  <ChartMouvementDesBacs
                    data={mouvementBacsDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedMouvementBacsIndicateur}
                    onIndicateurChange={setSelectedMouvementBacsIndicateur}
                    weekMouvementBacsData={duration === 'week' ? weekMouvementBacsData ?? undefined : undefined}
                    monthMouvementBacsData={duration === 'month' ? monthMouvementBacsData ?? undefined : undefined}
                    embedded={false}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Mouvement des bacs</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Produit</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedMouvementBacsIndicateur}
                          onChange={(e) => setSelectedMouvementBacsIndicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {mouvementBacsIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'compresseur-k245' && (
                <>
                  {duration === 'day' && loadingCompresseurK245 && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (jour)…</p>
                  )}
                  {duration === 'day' && errorCompresseurK245 && !loadingCompresseurK245 && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245}</p>
                  )}
                  {duration === 'week' && loadingCompresseurK245Week && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (hebdomadaire)…</p>
                  )}
                  {duration === 'week' && errorCompresseurK245Week && !loadingCompresseurK245Week && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245Week}</p>
                  )}
                  {duration === 'month' && loadingCompresseurK245Month && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (mois)…</p>
                  )}
                  {duration === 'month' && errorCompresseurK245Month && !loadingCompresseurK245Month && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245Month}</p>
                  )}
                  <ChartCompresseurK245
                    data={compresseurK245DataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedK245Indicateur}
                    onIndicateurChange={setSelectedK245Indicateur}
                    embedded={false}
                    weekCompresseurK245Data={duration === 'week' ? weekCompresseurK245Data ?? undefined : undefined}
                    monthCompresseurK245Data={duration === 'month' ? monthCompresseurK245Data ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Compresseur K 245</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedK245Indicateur}
                          onChange={(e) => setSelectedK245Indicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {compresseurK245IndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'compresseur-k244' && (
                <>
                  {duration === 'day' && loadingCompresseurK244 && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (jour)…</p>
                  )}
                  {duration === 'day' && errorCompresseurK244 && !loadingCompresseurK244 && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244}</p>
                  )}
                  {duration === 'week' && loadingCompresseurK244Week && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (hebdomadaire)…</p>
                  )}
                  {duration === 'week' && errorCompresseurK244Week && !loadingCompresseurK244Week && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244Week}</p>
                  )}
                  {duration === 'month' && loadingCompresseurK244Month && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (mois)…</p>
                  )}
                  {duration === 'month' && errorCompresseurK244Month && !loadingCompresseurK244Month && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244Month}</p>
                  )}
                  <ChartCompresseurK244
                    data={compresseurK244DataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedK244Indicateur}
                    onIndicateurChange={setSelectedK244Indicateur}
                    embedded={false}
                    weekCompresseurK244Data={duration === 'week' ? weekCompresseurK244Data ?? undefined : undefined}
                    monthCompresseurK244Data={duration === 'month' ? monthCompresseurK244Data ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Compresseur K 244</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedK244Indicateur}
                          onChange={(e) => setSelectedK244Indicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {compresseurK244IndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'atm-merox-pre-flash' && (
                <>
                  {duration === 'day' && loadingAtmMerox && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (jour)…</p>
                  )}
                  {duration === 'day' && errorAtmMerox && !loadingAtmMerox && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMerox}</p>
                  )}
                  {duration === 'month' && loadingAtmMeroxMonth && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (mois)…</p>
                  )}
                  {duration === 'month' && errorAtmMeroxMonth && !loadingAtmMeroxMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMeroxMonth}</p>
                  )}
                  {duration === 'week' && loadingAtmMeroxWeek && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (semaine)…</p>
                  )}
                  {duration === 'week' && errorAtmMeroxWeek && !loadingAtmMeroxWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMeroxWeek}</p>
                  )}
                  <ChartAtmMeroxPreFlash
                    data={atmMeroxDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedIndicateur={selectedAtmMeroxIndicateur}
                    onIndicateurChange={setSelectedAtmMeroxIndicateur}
                    embedded={false}
                    monthAtmMeroxData={duration === 'month' ? monthAtmMeroxData ?? undefined : undefined}
                    weekAtmMeroxData={duration === 'week' ? weekAtmMeroxData ?? undefined : undefined}
                    leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Atm/merox & pré flash</p>}
                    centerSlot={dateControls}
                    rightSlot={(
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedAtmMeroxIndicateur}
                          onChange={(e) => setSelectedAtmMeroxIndicateur(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {atmMeroxIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </>
              )}
              {graphType === 'gaz' && (
                <>
                  {duration === 'day' && loadingGazDay && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (jour)…</p>
                  )}
                  {duration === 'day' && errorGazDay && !loadingGazDay && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazDay}</p>
                  )}
                  {duration === 'week' && loadingGazWeek && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (hebdomadaire)…</p>
                  )}
                  {duration === 'week' && errorGazWeek && !loadingGazWeek && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazWeek}</p>
                  )}
                  {duration === 'month' && loadingGazMonth && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (mois)…</p>
                  )}
                  {duration === 'month' && errorGazMonth && !loadingGazMonth && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazMonth}</p>
                  )}
                <ChartGaz
                  data={gazDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedGazIndicateur}
                  onIndicateurChange={setSelectedGazIndicateur}
                  embedded={false}
                  weekGazData={duration === 'week' ? weekGazData ?? undefined : undefined}
                  monthGazData={duration === 'month' ? monthGazData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Gaz</p>}
                  centerSlot={dateControls}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedGazIndicateur}
                        onChange={(e) => setSelectedGazIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {gazIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
                </>
              )}
            </div>
          </section>
        </div>
  );

  /** Page « Tous les graphiques » : sections empilées, titre + filtres sur une ligne (comme Tableau — Réformateur catalytique sur tableaux?tableau=Tout) */
  if (showAllGraphs) {
    const chartCard = (children: React.ReactNode) => (
      <div className="flex min-h-[380px] flex-1 flex-col rounded-xl border border-stroke/70 bg-white/90 p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
        {children}
      </div>
    );
    return (
      <div className="flex flex-col gap-10 pt-14">

        {/* Analyses du laboratoire */}
        <div className="-mt-4 flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartAnalysesLaboratoire
                  data={analysesDataForChart}
                  embedded={false}
                  duration={duration}
                  onDurationChange={setDuration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedMeasure={selectedMeasure}
                  onMeasureChange={setSelectedMeasure}
                  selectedProduct={selectedProduct}
                  onProductChange={setSelectedProduct}
                  weekAnalysesData={duration === 'week' ? weekAnalysesData ?? undefined : undefined}
                  monthAnalysesData={duration === 'month' ? monthAnalysesData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Analyses du laboratoire</p>}
                  rightSlot={(
                    <>
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Produit</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value as ProductKey)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {products.map((p) => (
                            <option key={p} value={p}>{productLabels[p]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Mesure</span>
                        <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                        <select
                          value={selectedMeasure}
                          onChange={(e) => setSelectedMeasure(e.target.value)}
                          className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                        >
                          {measureNames.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Réformateur catalytique */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartReformateurCatalytique
                  data={reformateurDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedIndicateur}
                  onIndicateurChange={setSelectedIndicateur}
                  embedded={false}
                  weekReformateurData={duration === 'week' ? weekReformateurData ?? undefined : undefined}
                  monthReformateurData={duration === 'month' ? monthReformateurData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Réformateur catalytique</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedIndicateur}
                        onChange={(e) => setSelectedIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {reformateurIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Production */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartProduction
                  data={productionDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedProductionIndicateur}
                  onIndicateurChange={setSelectedProductionIndicateur}
                  embedded={false}
                  weekProductionData={duration === 'week' ? weekProductionData ?? undefined : undefined}
                  monthProductionData={duration === 'month' ? monthProductionData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Production</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedProductionIndicateur}
                        onChange={(e) => setSelectedProductionIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {productionIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Gaz */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartGaz
                  data={gazDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedGazIndicateur}
                  onIndicateurChange={setSelectedGazIndicateur}
                  embedded={false}
                  weekGazData={duration === 'week' ? weekGazData ?? undefined : undefined}
                  monthGazData={duration === 'month' ? monthGazData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Gaz</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedGazIndicateur}
                        onChange={(e) => setSelectedGazIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {gazIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Mouvement des bacs */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartMouvementDesBacs
                  data={mouvementBacsDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedMouvementBacsIndicateur}
                  onIndicateurChange={setSelectedMouvementBacsIndicateur}
                  weekMouvementBacsData={duration === 'week' ? weekMouvementBacsData ?? undefined : undefined}
                  monthMouvementBacsData={duration === 'month' ? monthMouvementBacsData ?? undefined : undefined}
                  embedded={false}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Mouvement des bacs</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Produit</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedMouvementBacsIndicateur}
                        onChange={(e) => setSelectedMouvementBacsIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {mouvementBacsIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Atm/merox & pré flash */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartAtmMeroxPreFlash
                  data={atmMeroxDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedAtmMeroxIndicateur}
                  onIndicateurChange={setSelectedAtmMeroxIndicateur}
                  embedded={false}
                  monthAtmMeroxData={duration === 'month' ? monthAtmMeroxData ?? undefined : undefined}
                  weekAtmMeroxData={duration === 'week' ? weekAtmMeroxData ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Atm/merox & pré flash</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedAtmMeroxIndicateur}
                        onChange={(e) => setSelectedAtmMeroxIndicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {atmMeroxIndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Compresseur K 245 */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartCompresseurK245
                  data={compresseurK245DataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedK245Indicateur}
                  onIndicateurChange={setSelectedK245Indicateur}
                  embedded={false}
                  weekCompresseurK245Data={duration === 'week' ? weekCompresseurK245Data ?? undefined : undefined}
                  monthCompresseurK245Data={duration === 'month' ? monthCompresseurK245Data ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Compresseur K 245</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedK245Indicateur}
                        onChange={(e) => setSelectedK245Indicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {compresseurK245IndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
        {/* Compresseur K 244 */}
        <div className="flex flex-col gap-6 overflow-visible">
          <div className="flex min-w-0 flex-col overflow-visible">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 px-6 pb-6">
              {chartCard(
                <ChartCompresseurK244
                  data={compresseurK244DataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedIndicateur={selectedK244Indicateur}
                  onIndicateurChange={setSelectedK244Indicateur}
                  embedded={false}
                  weekCompresseurK244Data={duration === 'week' ? weekCompresseurK244Data ?? undefined : undefined}
                  monthCompresseurK244Data={duration === 'month' ? monthCompresseurK244Data ?? undefined : undefined}
                  leftSlot={<p className="text-sm font-semibold text-primary dark:text-white">Graphique — Compresseur K 244</p>}
                  rightSlot={(
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <span className="select-none pr-1.5 text-xs text-bodydark2 dark:text-bodydark1">Indicateur</span>
                      <span className="mr-1.5 h-3.5 w-px bg-primary/30" />
                      <select
                        value={selectedK244Indicateur}
                        onChange={(e) => setSelectedK244Indicateur(e.target.value)}
                        className="bg-transparent border-0 text-xs font-bold text-primary outline-none dark:text-white"
                      >
                        {compresseurK244IndicateurOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    graphType === 'analyses' ||
    graphType === 'reformateur' ||
    graphType === 'production' ||
    graphType === 'mouvement-des-bacs' ||
    graphType === 'compresseur-k245' ||
    graphType === 'compresseur-k244' ||
    graphType === 'atm-merox-pre-flash' ||
    graphType === 'gaz'
  ) {
    return (
      <>
        {graphNavbar}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {contentBlock}
        </div>
      </>
    );
  }

  return (
    <>
      {graphNavbar}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {contentBlock}
      </div>
    </>
  );
};

export default AnalysesLaboratoireGraphique;
