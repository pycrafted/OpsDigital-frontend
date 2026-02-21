import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChartAnalysesLaboratoire, { type DurationFilter, type WeekAnalysesData, type MonthAnalysesData, type QuarterAnalysesData, type SemesterAnalysesData, type YearAnalysesData } from '../components/Charts/ChartAnalysesLaboratoire';
import ChartAtmMeroxPreFlash, { type MonthAtmMeroxData } from '../components/Charts/ChartAtmMeroxPreFlash';
import ChartGaz from '../components/Charts/ChartGaz';
import ChartMouvementDesBacs, { type WeekMouvementBacsData, type MonthMouvementBacsData, type QuarterMouvementBacsData, type SemesterMouvementBacsData, type YearMouvementBacsData } from '../components/Charts/ChartMouvementDesBacs';
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
  QuarterReformateurData,
  SemesterReformateurData,
  YearReformateurData,
} from '../components/Charts/ChartReformateurCatalytique';
import type {
  WeekProductionData,
  MonthProductionData,
  QuarterProductionData,
  SemesterProductionData,
  YearProductionData,
} from '../components/Charts/ChartProduction';
import type { WeekGazData, MonthGazData, QuarterGazData, SemesterGazData, YearGazData } from '../components/Charts/ChartGaz';
import type { WeekCompresseurK245Data, MonthCompresseurK245Data, QuarterCompresseurK245Data, SemesterCompresseurK245Data, YearCompresseurK245Data } from '../components/Charts/ChartCompresseurK245';
import type { WeekCompresseurK244Data, MonthCompresseurK244Data, QuarterCompresseurK244Data, SemesterCompresseurK244Data, YearCompresseurK244Data } from '../components/Charts/ChartCompresseurK244';

/** Retourne la semaine ISO (YYYY-Www) pour une date */
function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Retourne le trimestre courant au format YYYY-Qn */
function getCurrentQuarterString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

/** Liste des options trimestre (8 derniers trimestres) */
function getQuarterOptions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  const options: string[] = [];
  for (let i = 0; i < 8; i++) {
    let y = year;
    let q = currentQ - i;
    while (q < 1) {
      q += 4;
      y -= 1;
    }
    options.push(`${y}-Q${q}`);
  }
  return options;
}

/** Retourne le semestre courant au format YYYY-Sn (S1 = jan-juin, S2 = juil-déc) */
function getCurrentSemesterString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const s = Math.floor(now.getMonth() / 6) + 1;
  return `${year}-S${s}`;
}

/** Liste des options semestre (8 derniers semestres) */
function getSemesterOptions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const currentS = Math.floor(now.getMonth() / 6) + 1;
  const options: string[] = [];
  for (let i = 0; i < 8; i++) {
    let y = year;
    let s = currentS - i;
    while (s < 1) {
      s += 2;
      y -= 1;
    }
    options.push(`${y}-S${s}`);
  }
  return options;
}

/** Retourne l'année courante (YYYY) */
function getCurrentYearString(): string {
  return String(new Date().getFullYear());
}

/** Liste des options année (8 dernières années) */
function getYearOptions(): string[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => String(year - i));
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
  const [quarterAnalysesData, setQuarterAnalysesData] = useState<QuarterAnalysesData | null>(null);
  const [loadingAnalysesQuarter, setLoadingAnalysesQuarter] = useState(false);
  const [errorAnalysesQuarter, setErrorAnalysesQuarter] = useState<string | null>(null);
  const [semesterAnalysesData, setSemesterAnalysesData] = useState<SemesterAnalysesData | null>(null);
  const [loadingAnalysesSemester, setLoadingAnalysesSemester] = useState(false);
  const [errorAnalysesSemester, setErrorAnalysesSemester] = useState<string | null>(null);
  const [yearAnalysesData, setYearAnalysesData] = useState<YearAnalysesData | null>(null);
  const [loadingAnalysesYear, setLoadingAnalysesYear] = useState(false);
  const [errorAnalysesYear, setErrorAnalysesYear] = useState<string | null>(null);
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
  const [quarterReformateurData, setQuarterReformateurData] = useState<QuarterReformateurData | null>(null);
  const [loadingReformateurQuarter, setLoadingReformateurQuarter] = useState(false);
  const [errorReformateurQuarter, setErrorReformateurQuarter] = useState<string | null>(null);
  const [semesterReformateurData, setSemesterReformateurData] = useState<SemesterReformateurData | null>(null);
  const [loadingReformateurSemester, setLoadingReformateurSemester] = useState(false);
  const [errorReformateurSemester, setErrorReformateurSemester] = useState<string | null>(null);
  const [yearReformateurData, setYearReformateurData] = useState<YearReformateurData | null>(null);
  const [loadingReformateurYear, setLoadingReformateurYear] = useState(false);
  const [errorReformateurYear, setErrorReformateurYear] = useState<string | null>(null);
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
  const [quarterProductionData, setQuarterProductionData] = useState<QuarterProductionData | null>(null);
  const [loadingProductionQuarter, setLoadingProductionQuarter] = useState(false);
  const [errorProductionQuarter, setErrorProductionQuarter] = useState<string | null>(null);
  const [semesterProductionData, setSemesterProductionData] = useState<SemesterProductionData | null>(null);
  const [loadingProductionSemester, setLoadingProductionSemester] = useState(false);
  const [errorProductionSemester, setErrorProductionSemester] = useState<string | null>(null);
  const [yearProductionData, setYearProductionData] = useState<YearProductionData | null>(null);
  const [loadingProductionYear, setLoadingProductionYear] = useState(false);
  const [errorProductionYear, setErrorProductionYear] = useState<string | null>(null);
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
  const [quarterMouvementBacsData, setQuarterMouvementBacsData] = useState<QuarterMouvementBacsData | null>(null);
  const [loadingMouvementBacsQuarter, setLoadingMouvementBacsQuarter] = useState(false);
  const [errorMouvementBacsQuarter, setErrorMouvementBacsQuarter] = useState<string | null>(null);
  const [semesterMouvementBacsData, setSemesterMouvementBacsData] = useState<SemesterMouvementBacsData | null>(null);
  const [loadingMouvementBacsSemester, setLoadingMouvementBacsSemester] = useState(false);
  const [errorMouvementBacsSemester, setErrorMouvementBacsSemester] = useState<string | null>(null);
  const [yearMouvementBacsData, setYearMouvementBacsData] = useState<YearMouvementBacsData | null>(null);
  const [loadingMouvementBacsYear, setLoadingMouvementBacsYear] = useState(false);
  const [errorMouvementBacsYear, setErrorMouvementBacsYear] = useState<string | null>(null);
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
  const [quarterGazData, setQuarterGazData] = useState<QuarterGazData | null>(null);
  const [loadingGazQuarter, setLoadingGazQuarter] = useState(false);
  const [errorGazQuarter, setErrorGazQuarter] = useState<string | null>(null);
  const [semesterGazData, setSemesterGazData] = useState<SemesterGazData | null>(null);
  const [loadingGazSemester, setLoadingGazSemester] = useState(false);
  const [errorGazSemester, setErrorGazSemester] = useState<string | null>(null);
  const [yearGazData, setYearGazData] = useState<YearGazData | null>(null);
  const [loadingGazYear, setLoadingGazYear] = useState(false);
  const [errorGazYear, setErrorGazYear] = useState<string | null>(null);
  const [compresseurK245Data, setCompresseurK245Data] = useState<CompresseurK245HourRow[] | null>(null);
  const [loadingCompresseurK245, setLoadingCompresseurK245] = useState(false);
  const [errorCompresseurK245, setErrorCompresseurK245] = useState<string | null>(null);
  const [weekCompresseurK245Data, setWeekCompresseurK245Data] = useState<WeekCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Week, setLoadingCompresseurK245Week] = useState(false);
  const [errorCompresseurK245Week, setErrorCompresseurK245Week] = useState<string | null>(null);
  const [monthCompresseurK245Data, setMonthCompresseurK245Data] = useState<MonthCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Month, setLoadingCompresseurK245Month] = useState(false);
  const [errorCompresseurK245Month, setErrorCompresseurK245Month] = useState<string | null>(null);
  const [quarterCompresseurK245Data, setQuarterCompresseurK245Data] = useState<QuarterCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Quarter, setLoadingCompresseurK245Quarter] = useState(false);
  const [errorCompresseurK245Quarter, setErrorCompresseurK245Quarter] = useState<string | null>(null);
  const [semesterCompresseurK245Data, setSemesterCompresseurK245Data] = useState<SemesterCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Semester, setLoadingCompresseurK245Semester] = useState(false);
  const [errorCompresseurK245Semester, setErrorCompresseurK245Semester] = useState<string | null>(null);
  const [yearCompresseurK245Data, setYearCompresseurK245Data] = useState<YearCompresseurK245Data | null>(null);
  const [loadingCompresseurK245Year, setLoadingCompresseurK245Year] = useState(false);
  const [errorCompresseurK245Year, setErrorCompresseurK245Year] = useState<string | null>(null);
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
  const [quarterCompresseurK244Data, setQuarterCompresseurK244Data] = useState<QuarterCompresseurK244Data | null>(null);
  const [loadingCompresseurK244Quarter, setLoadingCompresseurK244Quarter] = useState(false);
  const [errorCompresseurK244Quarter, setErrorCompresseurK244Quarter] = useState<string | null>(null);
  const [semesterCompresseurK244Data, setSemesterCompresseurK244Data] = useState<SemesterCompresseurK244Data | null>(null);
  const [loadingCompresseurK244Semester, setLoadingCompresseurK244Semester] = useState(false);
  const [errorCompresseurK244Semester, setErrorCompresseurK244Semester] = useState<string | null>(null);
  const [yearCompresseurK244Data, setYearCompresseurK244Data] = useState<YearCompresseurK244Data | null>(null);
  const [loadingCompresseurK244Year, setLoadingCompresseurK244Year] = useState(false);
  const [errorCompresseurK244Year, setErrorCompresseurK244Year] = useState<string | null>(null);
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
  const [quarterAtmMeroxData, setQuarterAtmMeroxData] = useState<MonthAtmMeroxData | null>(null);
  const [loadingAtmMeroxQuarter, setLoadingAtmMeroxQuarter] = useState(false);
  const [errorAtmMeroxQuarter, setErrorAtmMeroxQuarter] = useState<string | null>(null);
  const [semesterAtmMeroxData, setSemesterAtmMeroxData] = useState<MonthAtmMeroxData | null>(null);
  const [loadingAtmMeroxSemester, setLoadingAtmMeroxSemester] = useState(false);
  const [errorAtmMeroxSemester, setErrorAtmMeroxSemester] = useState<string | null>(null);
  const [yearAtmMeroxData, setYearAtmMeroxData] = useState<MonthAtmMeroxData | null>(null);
  const [loadingAtmMeroxYear, setLoadingAtmMeroxYear] = useState(false);
  const [errorAtmMeroxYear, setErrorAtmMeroxYear] = useState<string | null>(null);
  const initialAtmMeroxData = useMemo(() => createInitialAtmMeroxData(), []);
  const atmMeroxDataForChart = atmMeroxData ?? initialAtmMeroxData;
  const measureNames = useMemo(() => analysesDataForChart.map((r) => r.property), [analysesDataForChart]);
  const [duration, setDuration] = useState<DurationFilter>(() =>
    pathname === '/graphique' ? 'day' : 'week'
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getISOWeekString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => getCurrentQuarterString());
  const [selectedSemester, setSelectedSemester] = useState<string>(() => getCurrentSemesterString());
  const [selectedYear, setSelectedYear] = useState<string>(() => getCurrentYearString());
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

  // Charger les données Analyses du laboratoire (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'day') return;
    console.log('[Graphique Jour] useEffect fetch: graphType=', graphType, 'duration=', duration, 'selectedDate=', selectedDate);
    setLoadingAnalyses(true);
    setErrorAnalyses(null);
    fetchAnalysesByDate(selectedDate)
      .then((rows) => {
        console.log('[Graphique Jour] fetch OK: rows.length=', rows?.length ?? 0, 'sample=', rows?.[0]?.property);
        setAnalysesData(rows.length > 0 ? rows : null);
      })
      .catch((err) => {
        console.warn('[Graphique Jour] fetch erreur:', err?.message ?? err);
        setErrorAnalyses(err instanceof Error ? err.message : 'Erreur chargement');
      })
      .finally(() => setLoadingAnalyses(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'day') return;
    setLoadingAtmMerox(true);
    setErrorAtmMerox(null);
    fetchAtmMeroxByDate(selectedDate)
      .then((rows) => setAtmMeroxData(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorAtmMerox(err instanceof Error ? err.message : 'Erreur chargement'),
      )
      .finally(() => setLoadingAtmMerox(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Analyses du laboratoire (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'week') return;
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
        setWeekAnalysesData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAnalysesWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingAnalysesWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'week') return;
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
        setWeekAtmMeroxData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAtmMeroxWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingAtmMeroxWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Compresseur K 244 (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k244' || duration !== 'day') return;
    setLoadingCompresseurK244(true);
    setErrorCompresseurK244(null);
    fetchCompresseurK244ByDate(selectedDate)
      .then((rows) => setCompresseurK244Data(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorCompresseurK244(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingCompresseurK244(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Compresseur K 245 (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k245' || duration !== 'day') return;
    setLoadingCompresseurK245(true);
    setErrorCompresseurK245(null);
    fetchCompresseurK245ByDate(selectedDate)
      .then((rows) => setCompresseurK245Data(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorCompresseurK245(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingCompresseurK245(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Mouvement des bacs (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'mouvement-des-bacs' || duration !== 'day') return;
    setLoadingMouvementBacsDay(true);
    setErrorMouvementBacsDay(null);
    fetchMouvementBacsByDate(selectedDate)
      .then((rows) => setMouvementBacsDataDay(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorMouvementBacsDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingMouvementBacsDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Production (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'production' || duration !== 'day') return;
    setLoadingProductionDay(true);
    setErrorProductionDay(null);
    fetchProductionByDate(selectedDate)
      .then((rows) => setProductionData(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorProductionDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingProductionDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Réformateur catalytique (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'reformateur' || duration !== 'day') return;
    setLoadingReformateurDay(true);
    setErrorReformateurDay(null);
    fetchReformateurByDate(selectedDate)
      .then((rows) => setReformateurData(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorReformateurDay(
          err instanceof Error ? err.message : 'Erreur chargement',
        ),
      )
      .finally(() => setLoadingReformateurDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Compresseur K 244 (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k244' || duration !== 'week') return;
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
        setWeekCompresseurK244Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK244Week(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingCompresseurK244Week(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Compresseur K 245 (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k245' || duration !== 'week') return;
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
        setWeekCompresseurK245Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK245Week(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingCompresseurK245Week(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Réformateur catalytique (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'reformateur' || duration !== 'week') return;
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
        setWeekReformateurData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorReformateurWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingReformateurWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Production (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'production' || duration !== 'week') return;
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
        setWeekProductionData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorProductionWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingProductionWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Mouvement des bacs (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'mouvement-des-bacs' || duration !== 'week') return;
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
        setWeekMouvementBacsData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorMouvementBacsWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingMouvementBacsWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Analyses du laboratoire (vue Mois) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthAnalysesData({ dates, rowsByDate });
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
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthAtmMeroxData({ dates, rowsByDate });
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
    if (graphType !== 'compresseur-k244' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthCompresseurK244Data({ dates, rowsByDate });
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
    if (graphType !== 'compresseur-k245' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthCompresseurK245Data({ dates, rowsByDate });
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
    if (graphType !== 'production' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthProductionData({ dates, rowsByDate });
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
    if (graphType !== 'reformateur' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthReformateurData({ dates, rowsByDate });
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
    if (graphType !== 'mouvement-des-bacs' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthMouvementBacsData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorMouvementBacsMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingMouvementBacsMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Analyses du laboratoire (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAnalysesQuarter(true);
    setErrorAnalysesQuarter(null);
    fetchAnalysesByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AnalyseRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterAnalysesData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAnalysesQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingAnalysesQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Production (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'production' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingProductionQuarter(true);
    setErrorProductionQuarter(null);
    fetchProductionByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ProductionHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterProductionData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorProductionQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingProductionQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Réformateur catalytique (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'reformateur' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingReformateurQuarter(true);
    setErrorReformateurQuarter(null);
    fetchReformateurByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ReformateurHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterReformateurData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorReformateurQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingReformateurQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Mouvement des bacs (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'mouvement-des-bacs' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingMouvementBacsQuarter(true);
    setErrorMouvementBacsQuarter(null);
    fetchMouvementBacsByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, HourRowWithBacs[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterMouvementBacsData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorMouvementBacsQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingMouvementBacsQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Mouvement des bacs (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'mouvement-des-bacs' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingMouvementBacsSemester(true);
    setErrorMouvementBacsSemester(null);
    fetchMouvementBacsByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, HourRowWithBacs[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterMouvementBacsData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorMouvementBacsSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingMouvementBacsSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Mouvement des bacs (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'mouvement-des-bacs' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingMouvementBacsYear(true);
    setErrorMouvementBacsYear(null);
    fetchMouvementBacsByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, HourRowWithBacs[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearMouvementBacsData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorMouvementBacsYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingMouvementBacsYear(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAtmMeroxQuarter(true);
    setErrorAtmMeroxQuarter(null);
    fetchAtmMeroxByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AtmMeroxHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterAtmMeroxData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAtmMeroxQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingAtmMeroxQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Compresseur K 244 (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k244' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK244Quarter(true);
    setErrorCompresseurK244Quarter(null);
    fetchCompresseurK244ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK244HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterCompresseurK244Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK244Quarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingCompresseurK244Quarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Compresseur K 245 (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k245' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK245Quarter(true);
    setErrorCompresseurK245Quarter(null);
    fetchCompresseurK245ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK245HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterCompresseurK245Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK245Quarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingCompresseurK245Quarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Analyses du laboratoire (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAnalysesSemester(true);
    setErrorAnalysesSemester(null);
    fetchAnalysesByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AnalyseRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterAnalysesData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAnalysesSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingAnalysesSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAtmMeroxSemester(true);
    setErrorAtmMeroxSemester(null);
    fetchAtmMeroxByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AtmMeroxHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterAtmMeroxData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAtmMeroxSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingAtmMeroxSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Compresseur K 244 (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k244' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK244Semester(true);
    setErrorCompresseurK244Semester(null);
    fetchCompresseurK244ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK244HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterCompresseurK244Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK244Semester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingCompresseurK244Semester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Compresseur K 245 (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k245' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK245Semester(true);
    setErrorCompresseurK245Semester(null);
    fetchCompresseurK245ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK245HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterCompresseurK245Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK245Semester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingCompresseurK245Semester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Réformateur catalytique (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'reformateur' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingReformateurSemester(true);
    setErrorReformateurSemester(null);
    fetchReformateurByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ReformateurHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterReformateurData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorReformateurSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingReformateurSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Production (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'production' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingProductionSemester(true);
    setErrorProductionSemester(null);
    fetchProductionByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ProductionHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterProductionData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorProductionSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingProductionSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Analyses du laboratoire (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAnalysesYear(true);
    setErrorAnalysesYear(null);
    fetchAnalysesByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AnalyseRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearAnalysesData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAnalysesYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingAnalysesYear(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données ATM/MEROX & Pre-Flash (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'atm-merox-pre-flash' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingAtmMeroxYear(true);
    setErrorAtmMeroxYear(null);
    fetchAtmMeroxByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, AtmMeroxHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearAtmMeroxData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorAtmMeroxYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingAtmMeroxYear(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données Compresseur K 244 (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k244' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK244Year(true);
    setErrorCompresseurK244Year(null);
    fetchCompresseurK244ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK244HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearCompresseurK244Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK244Year(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingCompresseurK244Year(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données Compresseur K 245 (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'compresseur-k245' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingCompresseurK245Year(true);
    setErrorCompresseurK245Year(null);
    fetchCompresseurK245ByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, CompresseurK245HourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearCompresseurK245Data({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorCompresseurK245Year(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingCompresseurK245Year(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données Production (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'production' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingProductionYear(true);
    setErrorProductionYear(null);
    fetchProductionByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ProductionHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearProductionData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorProductionYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingProductionYear(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données Réformateur catalytique (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'reformateur' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingReformateurYear(true);
    setErrorReformateurYear(null);
    fetchReformateurByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, ReformateurHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearReformateurData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorReformateurYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingReformateurYear(false));
  }, [graphType, duration, selectedYear]);

  // Charger les données Gaz (vue Jour) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'day') return;
    setLoadingGazDay(true);
    setErrorGazDay(null);
    fetchGazByDate(selectedDate)
      .then((rows) => setGazDataDay(rows.length > 0 ? rows : null))
      .catch((err) =>
        setErrorGazDay(err instanceof Error ? err.message : 'Erreur chargement'),
      )
      .finally(() => setLoadingGazDay(false));
  }, [graphType, duration, selectedDate]);

  // Charger les données Gaz (vue Semaine) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'week') return;
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
        setWeekGazData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorGazWeek(
          err instanceof Error ? err.message : 'Erreur chargement hebdomadaire',
        ),
      )
      .finally(() => setLoadingGazWeek(false));
  }, [graphType, duration, selectedWeek]);

  // Charger les données Gaz (vue Mois) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'month') return;
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return;
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
        setMonthGazData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorGazMonth(
          err instanceof Error ? err.message : 'Erreur chargement mois',
        ),
      )
      .finally(() => setLoadingGazMonth(false));
  }, [graphType, duration, selectedMonth]);

  // Charger les données Gaz (vue Trimestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'quarter') return;
    const match = selectedQuarter?.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const quarter = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(quarter)) return;

    const startMonth = (quarter - 1) * 3;
    const dates: string[] = [];
    for (let m = 0; m < 3; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingGazQuarter(true);
    setErrorGazQuarter(null);
    fetchGazByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, GazHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setQuarterGazData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorGazQuarter(
          err instanceof Error ? err.message : 'Erreur chargement trimestre',
        ),
      )
      .finally(() => setLoadingGazQuarter(false));
  }, [graphType, duration, selectedQuarter]);

  // Charger les données Gaz (vue Semestre) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'semester') return;
    const match = selectedSemester?.match(/^(\d{4})-S([12])$/);
    if (!match) return;
    const year = parseInt(match[1], 10);
    const semester = parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(semester)) return;

    const startMonth = (semester - 1) * 6;
    const dates: string[] = [];
    for (let m = 0; m < 6; m++) {
      const month = startMonth + m;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingGazSemester(true);
    setErrorGazSemester(null);
    fetchGazByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, GazHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setSemesterGazData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorGazSemester(
          err instanceof Error ? err.message : 'Erreur chargement semestre',
        ),
      )
      .finally(() => setLoadingGazSemester(false));
  }, [graphType, duration, selectedSemester]);

  // Charger les données Gaz (vue Année) depuis le backend
  useEffect(() => {
    if (graphType !== 'gaz' || duration !== 'year') return;
    const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    if (!Number.isFinite(year)) return;

    const dates: string[] = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, m, day);
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    const start = dates[0];
    const end = dates[dates.length - 1];
    setLoadingGazYear(true);
    setErrorGazYear(null);
    fetchGazByDateRange(start, end)
      .then((response) => {
        const rowsByDate: Record<string, GazHourRow[]> = {};
        dates.forEach((d) => {
          rowsByDate[d] = response[d] ?? [];
        });
        setYearGazData({ dates, rowsByDate });
      })
      .catch((err) =>
        setErrorGazYear(
          err instanceof Error ? err.message : 'Erreur chargement année',
        ),
      )
      .finally(() => setLoadingGazYear(false));
  }, [graphType, duration, selectedYear]);

  // Logs debug graphique jour (Analyses)
  useEffect(() => {
    if (graphType !== 'analyses' || duration !== 'day') return;
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
    if (graphType !== 'compresseur-k244' || duration !== 'month') return;
    console.log('[K244 Mois] page state:', {
      selectedMonth,
      monthCompresseurK244DataDatesLength: monthCompresseurK244Data?.dates?.length,
      monthCompresseurK244DataFirstDates: monthCompresseurK244Data?.dates?.slice(0, 3),
      loadingCompresseurK244Month,
      errorCompresseurK244Month,
    });
  }, [graphType, duration, selectedMonth, monthCompresseurK244Data, loadingCompresseurK244Month, errorCompresseurK244Month]);

  const graphTitle =
    graphType === 'analyses'
      ? 'Analyses du laboratoire'
      : graphType === 'reformateur'
        ? 'Réformateur catalytique'
        : graphType === 'production'
          ? 'Production'
          : graphType === 'mouvement-des-bacs'
            ? 'Mouvement des bacs'
            : graphType === 'compresseur-k245'
              ? 'Compresseur K 245'
              : graphType === 'compresseur-k244'
                ? 'Compresseur K 244'
                : graphType === 'atm-merox-pre-flash'
                  ? 'Atm/merox & pré flash'
                  : 'Gaz';

  const headerBlock = (
    <div className="border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
      <p className="text-2xl font-semibold text-primary">
        Graphique — {graphTitle}
      </p>
    </div>
  );

  const contentBlock = (
    <div
      className={`grid gap-6 p-6 ${
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
              {/* Filtre Jour / Semaine / Mois + filtres Produit/Mesure (analyses) + sélection de période, compact en haut */}
              <div className="mb-3 flex w-full flex-wrap items-end justify-between gap-3">
                {/* Boutons Jour / Semaine / Mois (à gauche) */}
                <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                  <button
                    type="button"
                    onClick={() => setDuration('day')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'day'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Jour
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration('week')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'week'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration('month')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'month'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration('quarter')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'quarter'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Trimestre
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration('semester')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'semester'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Semestre
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration('year')}
                    className={`rounded py-1 px-3 text-xs font-medium text-black dark:text-white ${
                      duration === 'year'
                        ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                        : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                    }`}
                  >
                    Année
                  </button>
                </div>
                {/* Filtres Produit/Mesure (Analyses), Indicateur (Réformateur, Production, Compresseurs, ATM/MEROX), Produit (Mouvement des bacs), placés au centre */}
                {(graphType === 'analyses' ||
                  graphType === 'reformateur' ||
                  graphType === 'production' ||
                  graphType === 'mouvement-des-bacs' ||
                  graphType === 'compresseur-k245' ||
                  graphType === 'compresseur-k244' ||
                  graphType === 'atm-merox-pre-flash' ||
                  graphType === 'gaz') && (
                  <div className="flex flex-1 min-w-[220px] flex-wrap items-end gap-3 justify-center">
                    {graphType === 'analyses' && (
                      <>
                        <div className="flex flex-col min-w-[160px]">
                          <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                            Produit
                          </label>
                          <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value as ProductKey)}
                            className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          >
                            {products.map((p) => (
                              <option key={p} value={p}>
                                {productLabels[p]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col min-w-[160px]">
                          <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                            Mesure
                          </label>
                          <select
                            value={selectedMeasure}
                            onChange={(e) => setSelectedMeasure(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          >
                            {measureNames.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {graphType === 'reformateur' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedIndicateur}
                          onChange={(e) => setSelectedIndicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {reformateurIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'production' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedProductionIndicateur}
                          onChange={(e) => setSelectedProductionIndicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {productionIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'compresseur-k245' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedK245Indicateur}
                          onChange={(e) => setSelectedK245Indicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {compresseurK245IndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'mouvement-des-bacs' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Produit
                        </label>
                        <select
                          value={selectedMouvementBacsIndicateur}
                          onChange={(e) => setSelectedMouvementBacsIndicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {mouvementBacsIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'compresseur-k244' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedK244Indicateur}
                          onChange={(e) => setSelectedK244Indicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {compresseurK244IndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'atm-merox-pre-flash' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedAtmMeroxIndicateur}
                          onChange={(e) => setSelectedAtmMeroxIndicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {atmMeroxIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {graphType === 'gaz' && (
                      <div className="flex flex-col min-w-[200px]">
                        <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-bodydark2 dark:text-bodydark1">
                          Indicateur
                        </label>
                        <select
                          value={selectedGazIndicateur}
                          onChange={(e) => setSelectedGazIndicateur(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        >
                          {gazIndicateurOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {/* Sélecteur de période (à droite), sans libellé au-dessus */}
                <div className="w-40 sm:w-48">
                  {duration === 'day' && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    />
                  )}
                  {duration === 'week' && (
                    <>
                      <input
                        type="week"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      />
                    </>
                  )}
                  {duration === 'month' && (
                    <>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      />
                    </>
                  )}
                  {duration === 'quarter' && (
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    >
                      {getQuarterOptions().map((q) => (
                        <option key={q} value={q}>
                          {q.replace('-', ' — ').replace('Q', 'T')}
                        </option>
                      ))}
                    </select>
                  )}
                  {duration === 'semester' && (
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    >
                      {getSemesterOptions().map((s) => (
                        <option key={s} value={s}>
                          {s.replace('-', ' — ')}
                        </option>
                      ))}
                    </select>
                  )}
                  {duration === 'year' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    >
                      {getYearOptions().map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
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
                  {duration === 'quarter' && loadingAnalysesQuarter && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorAnalysesQuarter && !loadingAnalysesQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalysesQuarter}</p>
                  )}
                  {duration === 'semester' && loadingAnalysesSemester && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (semestre)…</p>
                  )}
                  {duration === 'semester' && errorAnalysesSemester && !loadingAnalysesSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalysesSemester}</p>
                  )}
                  {duration === 'year' && loadingAnalysesYear && (
                    <p className="text-sm text-bodydark2">Chargement des analyses (année)…</p>
                  )}
                  {duration === 'year' && errorAnalysesYear && !loadingAnalysesYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAnalysesYear}</p>
                  )}
                  <ChartAnalysesLaboratoire
                    data={analysesDataForChart}
                    embedded={false}
                    duration={duration}
                    onDurationChange={setDuration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedMeasure={selectedMeasure}
                    onMeasureChange={setSelectedMeasure}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                    weekAnalysesData={duration === 'week' ? weekAnalysesData ?? undefined : undefined}
                    monthAnalysesData={duration === 'month' ? monthAnalysesData ?? undefined : undefined}
                    quarterAnalysesData={duration === 'quarter' ? quarterAnalysesData ?? undefined : undefined}
                    semesterAnalysesData={duration === 'semester' ? semesterAnalysesData ?? undefined : undefined}
                    yearAnalysesData={duration === 'year' ? yearAnalysesData ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingReformateurQuarter && (
                    <p className="text-sm text-bodydark2">
                      Chargement du réformateur (trimestre)…
                    </p>
                  )}
                  {duration === 'quarter' && errorReformateurQuarter && !loadingReformateurQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorReformateurQuarter}
                    </p>
                  )}
                  {duration === 'semester' && loadingReformateurSemester && (
                    <p className="text-sm text-bodydark2">
                      Chargement du réformateur (semestre)…
                    </p>
                  )}
                  {duration === 'semester' && errorReformateurSemester && !loadingReformateurSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorReformateurSemester}
                    </p>
                  )}
                  {duration === 'year' && loadingReformateurYear && (
                    <p className="text-sm text-bodydark2">
                      Chargement du réformateur (année)…
                    </p>
                  )}
                  {duration === 'year' && errorReformateurYear && !loadingReformateurYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errorReformateurYear}
                    </p>
                  )}
                  <ChartReformateurCatalytique
                    data={reformateurDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedIndicateur}
                    onIndicateurChange={setSelectedIndicateur}
                    embedded={false}
                    weekReformateurData={duration === 'week' ? weekReformateurData ?? undefined : undefined}
                    monthReformateurData={duration === 'month' ? monthReformateurData ?? undefined : undefined}
                    quarterReformateurData={duration === 'quarter' ? quarterReformateurData ?? undefined : undefined}
                    semesterReformateurData={duration === 'semester' ? semesterReformateurData ?? undefined : undefined}
                    yearReformateurData={duration === 'year' ? yearReformateurData ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingProductionQuarter && (
                    <p className="text-sm text-bodydark2">Chargement de la production (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorProductionQuarter && !loadingProductionQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionQuarter}</p>
                  )}
                  {duration === 'semester' && loadingProductionSemester && (
                    <p className="text-sm text-bodydark2">Chargement de la production (semestre)…</p>
                  )}
                  {duration === 'semester' && errorProductionSemester && !loadingProductionSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionSemester}</p>
                  )}
                  {duration === 'year' && loadingProductionYear && (
                    <p className="text-sm text-bodydark2">Chargement de la production (année)…</p>
                  )}
                  {duration === 'year' && errorProductionYear && !loadingProductionYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorProductionYear}</p>
                  )}
                  <ChartProduction
                    data={productionDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedProductionIndicateur}
                    onIndicateurChange={setSelectedProductionIndicateur}
                    embedded={false}
                    weekProductionData={duration === 'week' ? weekProductionData ?? undefined : undefined}
                    monthProductionData={duration === 'month' ? monthProductionData ?? undefined : undefined}
                    quarterProductionData={duration === 'quarter' ? quarterProductionData ?? undefined : undefined}
                    semesterProductionData={duration === 'semester' ? semesterProductionData ?? undefined : undefined}
                    yearProductionData={duration === 'year' ? yearProductionData ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingMouvementBacsQuarter && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorMouvementBacsQuarter && !loadingMouvementBacsQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsQuarter}</p>
                  )}
                  {duration === 'semester' && loadingMouvementBacsSemester && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (semestre)…</p>
                  )}
                  {duration === 'semester' && errorMouvementBacsSemester && !loadingMouvementBacsSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsSemester}</p>
                  )}
                  {duration === 'year' && loadingMouvementBacsYear && (
                    <p className="text-sm text-bodydark2">Chargement du mouvement des bacs (année)…</p>
                  )}
                  {duration === 'year' && errorMouvementBacsYear && !loadingMouvementBacsYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMouvementBacsYear}</p>
                  )}
                  <ChartMouvementDesBacs
                    data={mouvementBacsDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedMouvementBacsIndicateur}
                    onIndicateurChange={setSelectedMouvementBacsIndicateur}
                    weekMouvementBacsData={duration === 'week' ? weekMouvementBacsData ?? undefined : undefined}
                    monthMouvementBacsData={duration === 'month' ? monthMouvementBacsData ?? undefined : undefined}
                    quarterMouvementBacsData={duration === 'quarter' ? quarterMouvementBacsData ?? undefined : undefined}
                    semesterMouvementBacsData={duration === 'semester' ? semesterMouvementBacsData ?? undefined : undefined}
                    yearMouvementBacsData={duration === 'year' ? yearMouvementBacsData ?? undefined : undefined}
                    embedded={false}
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
                  {duration === 'quarter' && loadingCompresseurK245Quarter && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorCompresseurK245Quarter && !loadingCompresseurK245Quarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245Quarter}</p>
                  )}
                  {duration === 'semester' && loadingCompresseurK245Semester && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (semestre)…</p>
                  )}
                  {duration === 'semester' && errorCompresseurK245Semester && !loadingCompresseurK245Semester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245Semester}</p>
                  )}
                  {duration === 'year' && loadingCompresseurK245Year && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 245 (année)…</p>
                  )}
                  {duration === 'year' && errorCompresseurK245Year && !loadingCompresseurK245Year && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK245Year}</p>
                  )}
                  <ChartCompresseurK245
                    data={compresseurK245DataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedK245Indicateur}
                    onIndicateurChange={setSelectedK245Indicateur}
                    embedded={false}
                    weekCompresseurK245Data={duration === 'week' ? weekCompresseurK245Data ?? undefined : undefined}
                    monthCompresseurK245Data={duration === 'month' ? monthCompresseurK245Data ?? undefined : undefined}
                    quarterCompresseurK245Data={duration === 'quarter' ? quarterCompresseurK245Data ?? undefined : undefined}
                    semesterCompresseurK245Data={duration === 'semester' ? semesterCompresseurK245Data ?? undefined : undefined}
                    yearCompresseurK245Data={duration === 'year' ? yearCompresseurK245Data ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingCompresseurK244Quarter && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorCompresseurK244Quarter && !loadingCompresseurK244Quarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244Quarter}</p>
                  )}
                  {duration === 'semester' && loadingCompresseurK244Semester && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (semestre)…</p>
                  )}
                  {duration === 'semester' && errorCompresseurK244Semester && !loadingCompresseurK244Semester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244Semester}</p>
                  )}
                  {duration === 'year' && loadingCompresseurK244Year && (
                    <p className="text-sm text-bodydark2">Chargement du compresseur K 244 (année)…</p>
                  )}
                  {duration === 'year' && errorCompresseurK244Year && !loadingCompresseurK244Year && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorCompresseurK244Year}</p>
                  )}
                  <ChartCompresseurK244
                    data={compresseurK244DataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedK244Indicateur}
                    onIndicateurChange={setSelectedK244Indicateur}
                    embedded={false}
                    weekCompresseurK244Data={duration === 'week' ? weekCompresseurK244Data ?? undefined : undefined}
                    monthCompresseurK244Data={duration === 'month' ? monthCompresseurK244Data ?? undefined : undefined}
                    quarterCompresseurK244Data={duration === 'quarter' ? quarterCompresseurK244Data ?? undefined : undefined}
                    semesterCompresseurK244Data={duration === 'semester' ? semesterCompresseurK244Data ?? undefined : undefined}
                    yearCompresseurK244Data={duration === 'year' ? yearCompresseurK244Data ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingAtmMeroxQuarter && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorAtmMeroxQuarter && !loadingAtmMeroxQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMeroxQuarter}</p>
                  )}
                  {duration === 'semester' && loadingAtmMeroxSemester && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (semestre)…</p>
                  )}
                  {duration === 'semester' && errorAtmMeroxSemester && !loadingAtmMeroxSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMeroxSemester}</p>
                  )}
                  {duration === 'year' && loadingAtmMeroxYear && (
                    <p className="text-sm text-bodydark2">Chargement ATM/MEROX & Pre-Flash (année)…</p>
                  )}
                  {duration === 'year' && errorAtmMeroxYear && !loadingAtmMeroxYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorAtmMeroxYear}</p>
                  )}
                  <ChartAtmMeroxPreFlash
                    data={atmMeroxDataForChart}
                    duration={duration}
                    selectedDate={duration === 'day' ? selectedDate : undefined}
                    selectedWeek={duration === 'week' ? selectedWeek : undefined}
                    selectedMonth={duration === 'month' ? selectedMonth : undefined}
                    selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                    selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                    selectedYear={duration === 'year' ? selectedYear : undefined}
                    selectedIndicateur={selectedAtmMeroxIndicateur}
                    onIndicateurChange={setSelectedAtmMeroxIndicateur}
                    embedded={false}
                    monthAtmMeroxData={duration === 'month' ? monthAtmMeroxData ?? undefined : undefined}
                    weekAtmMeroxData={duration === 'week' ? weekAtmMeroxData ?? undefined : undefined}
                    quarterAtmMeroxData={duration === 'quarter' ? quarterAtmMeroxData ?? undefined : undefined}
                    semesterAtmMeroxData={duration === 'semester' ? semesterAtmMeroxData ?? undefined : undefined}
                    yearAtmMeroxData={duration === 'year' ? yearAtmMeroxData ?? undefined : undefined}
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
                  {duration === 'quarter' && loadingGazQuarter && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (trimestre)…</p>
                  )}
                  {duration === 'quarter' && errorGazQuarter && !loadingGazQuarter && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazQuarter}</p>
                  )}
                  {duration === 'semester' && loadingGazSemester && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (semestre)…</p>
                  )}
                  {duration === 'semester' && errorGazSemester && !loadingGazSemester && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazSemester}</p>
                  )}
                  {duration === 'year' && loadingGazYear && (
                    <p className="text-sm text-bodydark2">Chargement Gaz (année)…</p>
                  )}
                  {duration === 'year' && errorGazYear && !loadingGazYear && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorGazYear}</p>
                  )}
                <ChartGaz
                  data={gazDataForChart}
                  duration={duration}
                  selectedDate={duration === 'day' ? selectedDate : undefined}
                  selectedWeek={duration === 'week' ? selectedWeek : undefined}
                  selectedMonth={duration === 'month' ? selectedMonth : undefined}
                  selectedQuarter={duration === 'quarter' ? selectedQuarter : undefined}
                  selectedSemester={duration === 'semester' ? selectedSemester : undefined}
                  selectedYear={duration === 'year' ? selectedYear : undefined}
                  selectedIndicateur={selectedGazIndicateur}
                  onIndicateurChange={setSelectedGazIndicateur}
                  embedded={false}
                  weekGazData={duration === 'week' ? weekGazData ?? undefined : undefined}
                  monthGazData={duration === 'month' ? monthGazData ?? undefined : undefined}
                  quarterGazData={duration === 'quarter' ? quarterGazData ?? undefined : undefined}
                  semesterGazData={duration === 'semester' ? semesterGazData ?? undefined : undefined}
                  yearGazData={duration === 'year' ? yearGazData ?? undefined : undefined}
                />
                </>
              )}
            </div>
          </section>
        </div>
  );

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
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
        <div className="flex-shrink-0 px-1">
          {headerBlock}
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {contentBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      {/* Même enveloppe que Saisie / Analyses laboratoire */}
      <div className="rounded-2xl border border-stroke bg-gradient-to-br from-sky-50 to-indigo-50 shadow-lg dark:border-strokedark dark:from-boxdark dark:to-meta-4">
        {/* En-tête aligné sur les autres pages */}
        {headerBlock}

        {/* Layout 2 colonnes : sidebar filtres + zone graphique (comme Saisie) */}
        {contentBlock}
      </div>
    </div>
  );
};

export default AnalysesLaboratoireGraphique;
