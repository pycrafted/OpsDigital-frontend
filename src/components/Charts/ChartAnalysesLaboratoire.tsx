import { ApexOptions } from 'apexcharts';
import React, { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAnalysesLaboBounds } from '../../context/AnalysesLaboBoundsContext';
import {
  ANALYSES_MEASURE_NAMES,
  AnalyseRow,
  hourLabels,
  hours,
  productLabels,
  products,
  type ProductKey,
} from '../../data/analysesLaboratoire';

const EMBEDDED_WRAPPER_CLASS = 'flex min-h-0 w-full flex-1 flex-col items-start';

const CHART_COLOR = '#3C50E0';
// Couleurs pour le graphique Jour (7h, 15h, 23h)
const HOUR_COLORS = { h7: '#EA580C', h15: '#059669', h23: '#DC2626' };
// Couleurs plus vives pour le graphique Mois (meilleure visibilité)
const HOUR_COLORS_VIVID = { h7: '#FF6B00', h15: '#00C853', h23: '#FF1744' };

export type DurationFilter = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

const DURATION_LABELS: Record<DurationFilter, string> = {
  day: 'Jour',
  week: 'Hebdomadaire',
  month: 'Mois',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Année',
};

function parseValue(s: string): number {
  const n = parseFloat(s?.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Normalise le libellé de mesure pour matcher backend (ex. "Densité à 15°") et frontend ("densité à 15°"). */
function normalizeMeasureLabel(label: string): string {
  return (label ?? '').trim().toLowerCase();
}

/** Formate les valeurs de l'axe des ordonnées : au plus 2 chiffres après la virgule */
function formatYAxisLabel(val: number): string {
  return Number.isFinite(val) ? Number(val.toFixed(2)).toString() : '';
}

/** Jours de la semaine (abscisses alignées sur la page tableaux : 3 relevés 7h, 15h, 23h par jour) */
const WEEK_DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Formate une date en DD/MM/YYYY */
function formatDateDDMMYYYY(day: number, month: number, year: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(day)}/${pad(month)}/${year}`;
}

const hourSuffixesAnalyses = [hourLabels.h7, hourLabels.h15, hourLabels.h23] as const;

/** Données vides (sans exemple) : 7 jours × 3 relevés, valeurs à 0. */
function getEmptyWeekData(productLabel: string): { categories: string[]; series: { name: string; data: number[] }[]; outOfBoundsIndices: number[] } {
  const categories: string[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayLabel = WEEK_DAY_LABELS[dayIndex];
    hourSuffixesAnalyses.forEach((h) => {
      categories.push(`${dayLabel} ${h}`);
    });
  }
  return { categories, series: [{ name: productLabel, data: categories.map(() => 0) }], outOfBoundsIndices: [] };
}

/** Données vides pour la vue Mois : N jours × 3 relevés, valeurs à 0. */
function getEmptyMonthData(selectedMonth: string | undefined, productLabel: string): { categories: string[]; series: { name: string; data: number[] }[]; outOfBoundsIndices: number[] } {
  let year: number;
  let month: number;
  if (selectedMonth) {
    const [y, m] = selectedMonth.split('-').map(Number);
    year = y;
    month = (m ?? 1) - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }
  const daysInMonth = getDaysInMonth(year, month);
  const monthNum = month + 1;
  const categories: string[] = [];
  for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
    const dayNum = dayIndex + 1;
    const dateStr = formatDateDDMMYYYY(dayNum, monthNum, year);
    (['7h', '15h', '23h'] as const).forEach((h) => {
      categories.push(`${dateStr} ${h}`);
    });
  }
  return { categories, series: [{ name: productLabel, data: categories.map(() => 0) }], outOfBoundsIndices: [] };
}

/** Retourne l'année et le numéro de trimestre (1-4) à partir de "YYYY-Qn" */
function parseQuarterString(quarterStr: string): { year: number; quarter: number } | null {
  const match = quarterStr.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
}

/** Données vides pour la vue Trimestre : 3 mois de catégories, valeurs à 0. */
function getEmptyQuarterData(selectedQuarter: string | undefined, productLabel: string): { categories: string[]; series: { name: string; data: number[] }[] } {
  const parsed = selectedQuarter ? parseQuarterString(selectedQuarter) : null;
  let year: number;
  let startMonth: number;
  if (parsed) {
    year = parsed.year;
    startMonth = (parsed.quarter - 1) * 3;
  } else {
    const now = new Date();
    year = now.getFullYear();
    startMonth = Math.floor(now.getMonth() / 3) * 3;
  }
  const allCategories: string[] = [];
  for (let m = 0; m < 3; m++) {
    const month = startMonth + m;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, productLabel);
    allCategories.push(...monthResult.categories);
  }
  return { categories: allCategories, series: [{ name: productLabel, data: allCategories.map(() => 0) }] };
}

/** Retourne l'année et le numéro de semestre (1 ou 2) à partir de "YYYY-Sn". S1 = jan-juin, S2 = juil-déc. */
function parseSemesterString(semesterStr: string): { year: number; semester: number } | null {
  const match = semesterStr.match(/^(\d{4})-S([12])$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), semester: parseInt(match[2], 10) };
}

/** Données vides pour la vue Semestre : 6 mois de catégories, valeurs à 0. */
function getEmptySemesterData(selectedSemester: string | undefined, productLabel: string): { categories: string[]; series: { name: string; data: number[] }[]; outOfBoundsIndices: number[] } {
  const parsed = selectedSemester ? parseSemesterString(selectedSemester) : null;
  let year: number;
  let startMonth: number;
  if (parsed) {
    year = parsed.year;
    startMonth = (parsed.semester - 1) * 6;
  } else {
    const now = new Date();
    year = now.getFullYear();
    startMonth = Math.floor(now.getMonth() / 6) * 6;
  }
  const allCategories: string[] = [];
  for (let m = 0; m < 6; m++) {
    const month = startMonth + m;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, productLabel);
    allCategories.push(...monthResult.categories);
  }
  return { categories: allCategories, series: [{ name: productLabel, data: allCategories.map(() => 0) }], outOfBoundsIndices: [] };
}

function formatSemesterLabel(ys: string): string {
  const p = parseSemesterString(ys);
  if (!p) return ys;
  const startMonth = (p.semester - 1) * 6;
  const endMonth = startMonth + 5;
  return `S${p.semester} ${p.year} (${MONTH_NAMES[startMonth]} - ${MONTH_NAMES[endMonth]})`;
}

/** Données vides pour la vue Année : 12 mois de catégories, valeurs à 0. */
function getEmptyYearData(selectedYear: string | undefined, productLabel: string): { categories: string[]; series: { name: string; data: number[] }[]; outOfBoundsIndices: number[] } {
  const year = selectedYear && Number.isFinite(parseInt(selectedYear, 10)) ? parseInt(selectedYear, 10) : new Date().getFullYear();
  const allCategories: string[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, productLabel);
    allCategories.push(...monthResult.categories);
  }
  return { categories: allCategories, series: [{ name: productLabel, data: allCategories.map(() => 0) }], outOfBoundsIndices: [] };
}

function formatYearLabel(y: string): string {
  const year = parseInt(y, 10);
  return Number.isFinite(year) ? `Année ${year}` : y;
}

export { DURATION_LABELS };

export interface WeekAnalysesData {
  /** Dates de la semaine au format YYYY-MM-DD, dans l'ordre lundi -> dimanche. */
  dates: string[];
  /** Données backend par date. */
  rowsByDate: Record<string, AnalyseRow[]>;
}

export interface MonthAnalysesData {
  /** Dates du mois au format YYYY-MM-DD, dans l'ordre chronologique. */
  dates: string[];
  /** Données backend par date. */
  rowsByDate: Record<string, AnalyseRow[]>;
}

export interface QuarterAnalysesData {
  /** Dates du trimestre au format YYYY-MM-DD, dans l'ordre chronologique. */
  dates: string[];
  /** Données backend par date. */
  rowsByDate: Record<string, AnalyseRow[]>;
}

export interface SemesterAnalysesData {
  /** Dates du semestre au format YYYY-MM-DD, dans l'ordre chronologique. */
  dates: string[];
  /** Données backend par date. */
  rowsByDate: Record<string, AnalyseRow[]>;
}

export interface YearAnalysesData {
  /** Dates de l'année au format YYYY-MM-DD, dans l'ordre chronologique. */
  dates: string[];
  /** Données backend par date. */
  rowsByDate: Record<string, AnalyseRow[]>;
}

export interface ChartAnalysesLaboratoireProps {
  data: AnalyseRow[];
  embedded?: boolean;
  /** Contenu affiché à gauche dans la rangée des légendes (ex. titre de section). */
  leftSlot?: React.ReactNode;
  /** Contenu affiché au centre dans la rangée du haut (ex. sélecteur période/date). */
  centerSlot?: React.ReactNode;
  /** Contenu affiché à droite dans la rangée des légendes (ex. sélecteurs Produit/Mesure). */
  rightSlot?: React.ReactNode;
  /** Mode contrôlé : le parent fournit les filtres (sidebar). Si définis, la barre de filtres intégrée est masquée. */
  duration?: DurationFilter;
  onDurationChange?: (d: DurationFilter) => void;
  /** Période choisie (pour titres / données ciblées). Optionnel. */
  selectedDate?: string; // YYYY-MM-DD
  selectedWeek?: string; // YYYY-Www
  selectedMonth?: string; // YYYY-MM
  selectedQuarter?: string; // YYYY-Q1 | YYYY-Q2 | YYYY-Q3 | YYYY-Q4
  selectedSemester?: string; // YYYY-S1 | YYYY-S2
  selectedYear?: string; // YYYY
  selectedMeasure?: string;
  onMeasureChange?: (m: string) => void;
  selectedProduct?: ProductKey;
  onProductChange?: (p: ProductKey) => void;
  /** Données hebdomadaires issues du backend (analyses) pour alimenter la vue Semaine. */
  weekAnalysesData?: WeekAnalysesData;
  /** Données mensuelles issues du backend (analyses) pour alimenter la vue Mois. */
  monthAnalysesData?: MonthAnalysesData;
  /** Données trimestrielles issues du backend (analyses) pour alimenter la vue Trimestre. */
  quarterAnalysesData?: QuarterAnalysesData;
  /** Données semestrielles issues du backend (analyses) pour alimenter la vue Semestre. */
  semesterAnalysesData?: SemesterAnalysesData;
  /** Données annuelles issues du backend (analyses) pour alimenter la vue Année. */
  yearAnalysesData?: YearAnalysesData;
}

function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (y && m && d) return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  return ymd;
}
/** Retourne le lundi et le dimanche de la semaine ISO (YYYY-Www) */
function getISOWeekBounds(weekStr: string): { start: Date; end: Date } | null {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const weekNum = parseInt(match[2], 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayWeek1 = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday);
  const mondayOfWeek = new Date(mondayWeek1.getFullYear(), mondayWeek1.getMonth(), mondayWeek1.getDate() + (weekNum - 1) * 7);
  const sundayOfWeek = new Date(mondayOfWeek.getFullYear(), mondayOfWeek.getMonth(), mondayOfWeek.getDate() + 6);
  return { start: mondayOfWeek, end: sundayOfWeek };
}

function formatWeekLabel(weekStr: string): string {
  const bounds = getISOWeekBounds(weekStr);
  if (!bounds) return weekStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `semaine du ${fmt(bounds.start)} au ${fmt(bounds.end)}`;
}
function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (y && m) return `${MONTH_NAMES[m - 1]} ${y}`;
  return ym;
}

function formatQuarterLabel(yq: string): string {
  const p = parseQuarterString(yq);
  if (!p) return yq;
  const startMonth = (p.quarter - 1) * 3;
  const endMonth = startMonth + 2;
  return `T${p.quarter} ${p.year} (${MONTH_NAMES[startMonth]} - ${MONTH_NAMES[endMonth]})`;
}

const ChartAnalysesLaboratoire: React.FC<ChartAnalysesLaboratoireProps> = ({
  data,
  embedded = true,
  leftSlot,
  centerSlot,
  rightSlot,
  duration: controlledDuration,
  onDurationChange,
  selectedDate: selectedDateProp,
  selectedWeek: selectedWeekProp,
  selectedMonth: selectedMonthProp,
  selectedQuarter: selectedQuarterProp,
  selectedSemester: selectedSemesterProp,
  selectedYear: selectedYearProp,
  selectedMeasure: controlledMeasure,
  onMeasureChange,
  selectedProduct: controlledProduct,
  onProductChange,
  weekAnalysesData,
  monthAnalysesData,
  quarterAnalysesData,
  semesterAnalysesData,
  yearAnalysesData,
}) => {
  useEffect(() => {
    if (controlledDuration !== 'day') return;
    console.log('[Graphique Jour] Chart props reçus:', {
      dataLength: data?.length,
      duration: controlledDuration,
      selectedMeasure: controlledMeasure,
      selectedProduct: controlledProduct,
      selectedDate: selectedDateProp,
    });
  }, [controlledDuration, data?.length, controlledMeasure, controlledProduct, selectedDateProp]);

  const measureNames = useMemo(() => data.map((r) => r.property), [data]);
  const [internalMeasure, setInternalMeasure] = useState<string>(() => measureNames[0] ?? '');
  const [internalProduct, setInternalProduct] = useState<ProductKey>(products[0]);
  const [internalDuration, setInternalDuration] = useState<DurationFilter>('day');

  const isControlled =
    controlledDuration !== undefined &&
    onDurationChange !== undefined &&
    controlledMeasure !== undefined &&
    onMeasureChange !== undefined &&
    controlledProduct !== undefined &&
    onProductChange !== undefined;

  const duration = isControlled ? controlledDuration! : internalDuration;
  const setDuration = isControlled ? onDurationChange! : setInternalDuration;
  const selectedMeasure = isControlled ? controlledMeasure! : internalMeasure;
  const setSelectedMeasure = isControlled ? onMeasureChange! : setInternalMeasure;
  const selectedProduct = isControlled ? controlledProduct! : internalProduct;
  const setSelectedProduct = isControlled ? onProductChange! : setInternalProduct;

  const { isOutOfBounds, bounds: analysesBounds } = useAnalysesLaboBounds();

  useEffect(() => {
    if (measureNames.length > 0 && !measureNames.includes(selectedMeasure)) {
      setSelectedMeasure(measureNames[0]);
    }
  }, [measureNames, selectedMeasure, setSelectedMeasure]);

  // Journée : données du tableau (7h, 15h, 23h). Semaine / Mois / Trimestre : exemples visuels.
  const chartData = useMemo(() => {
    if (duration === 'week') {
      if (weekAnalysesData && weekAnalysesData.dates.length > 0) {
        const categories: string[] = [];
        const chartData: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const conformeIndices: number[] = [];
        const hourSuffixes = [hourLabels.h7, hourLabels.h15, hourLabels.h23]; // '7h', '15h', '23h'

        const selectedNorm = normalizeMeasureLabel(selectedMeasure);
        // Clé canonique (identique à Settings) pour que getBounds trouve toujours les bornes
        const measureKeyForBounds =
          ANALYSES_MEASURE_NAMES.find((m) => normalizeMeasureLabel(m) === selectedNorm) ??
          selectedMeasure;
        const debugPoints: { index: number; cat: string; rawValue: string; value: number; oob: boolean }[] = [];
        weekAnalysesData.dates.forEach((date, dayIndex) => {
          const dayRows = weekAnalysesData.rowsByDate[date] ?? [];
          const row = dayRows.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);
          hourSuffixes.forEach((label, hourIndex) => {
            const hourKey = hours[hourIndex];
            const cat = `${WEEK_DAY_LABELS[dayIndex]} ${label}`;
            categories.push(cat);
            const productHours = row && row[selectedProduct] ? row[selectedProduct] : null;
            const rawValue = productHours?.[hourKey] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartData.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedProduct, measureKeyForBounds, rawValue);
            if (rawValue !== '' && oob) {
              outOfBoundsIndices.push(categories.length - 1);
            } else if (rawValue !== '') {
              conformeIndices.push(categories.length - 1);
            }
            if (rawValue !== '') {
              debugPoints.push({
                index: categories.length - 1,
                cat,
                rawValue,
                value: v,
                oob,
              });
            }
          });
        });
        const boundsUsed = analysesBounds[selectedProduct]?.[measureKeyForBounds];
        if (outOfBoundsIndices.length > 0 || debugPoints.some((p) => p.oob)) {
          console.log('[Graphique Semaine] Bornes / traits rouges', {
            selectedProduct,
            measureKeyForBounds,
            boundsUsed: boundsUsed ?? 'non trouvé',
            outOfBoundsIndices,
            tousLesPointsOob: debugPoints.filter((p) => p.oob),
          });
        }

        return {
          categories,
          series: [{ name: productLabels[selectedProduct], data: chartData }],
          outOfBoundsIndices,
          conformeIndices,
        };
      }
      return getEmptyWeekData(productLabels[selectedProduct]);
    }
    if (duration === 'month') {
      if (monthAnalysesData && monthAnalysesData.dates.length > 0) {
        const categories: string[] = [];
        const chartData: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const conformeIndices: number[] = [];
        const hourSuffixes = ['7h', '15h', '23h'] as const;
        const selectedNorm = normalizeMeasureLabel(selectedMeasure);
        const measureKeyForBounds =
          ANALYSES_MEASURE_NAMES.find((m) => normalizeMeasureLabel(m) === selectedNorm) ?? selectedMeasure;

        monthAnalysesData.dates.forEach((date) => {
          const dayRows = monthAnalysesData.rowsByDate[date] ?? [];
          const row = dayRows.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);

          let year = 0;
          let month = 0;
          let day = 0;
          const parts = date.split('-').map(Number);
          if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
          }
          const dateLabel =
            year && month && day ? formatDateDDMMYYYY(day, month, year) : date;

          hourSuffixes.forEach((label, hourIndex) => {
            const hourKey = hours[hourIndex];
            categories.push(`${dateLabel} ${label}`);
            const productHours = row && row[selectedProduct] ? row[selectedProduct] : null;
            const rawValue = productHours?.[hourKey] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartData.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedProduct, measureKeyForBounds, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
            else if (rawValue !== '') conformeIndices.push(categories.length - 1);
          });
        });

        return {
          categories,
          series: [{ name: productLabels[selectedProduct], data: chartData }],
          outOfBoundsIndices,
          conformeIndices,
        };
      }
      return getEmptyMonthData(selectedMonthProp, productLabels[selectedProduct]);
    }
    if (duration === 'quarter') {
      if (quarterAnalysesData && quarterAnalysesData.dates.length > 0) {
        const categories: string[] = [];
        const chartData: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const hourSuffixes = ['7h', '15h', '23h'] as const;
        const selectedNorm = normalizeMeasureLabel(selectedMeasure);
        const measureKeyForBounds =
          ANALYSES_MEASURE_NAMES.find((m) => normalizeMeasureLabel(m) === selectedNorm) ??
          selectedMeasure;

        quarterAnalysesData.dates.forEach((date) => {
          const dayRows = quarterAnalysesData.rowsByDate[date] ?? [];
          const row = dayRows.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);

          let year = 0;
          let month = 0;
          let day = 0;
          const parts = date.split('-').map(Number);
          if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
          }
          const dateLabel =
            year && month && day ? formatDateDDMMYYYY(day, month, year) : date;

          hourSuffixes.forEach((label, hourIndex) => {
            const hourKey = hours[hourIndex];
            categories.push(`${dateLabel} ${label}`);
            const productHours = row && row[selectedProduct] ? row[selectedProduct] : null;
            const rawValue = productHours?.[hourKey] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartData.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedProduct, measureKeyForBounds, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
          });
        });

        return {
          categories,
          series: [{ name: productLabels[selectedProduct], data: chartData }],
          outOfBoundsIndices,
        };
      }
      return getEmptyQuarterData(selectedQuarterProp, productLabels[selectedProduct]);
    }
    if (duration === 'semester') {
      if (semesterAnalysesData && semesterAnalysesData.dates.length > 0) {
        const categories: string[] = [];
        const chartData: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const hourSuffixes = ['7h', '15h', '23h'] as const;
        const selectedNorm = normalizeMeasureLabel(selectedMeasure);
        const measureKeyForBounds =
          ANALYSES_MEASURE_NAMES.find((m) => normalizeMeasureLabel(m) === selectedNorm) ?? selectedMeasure;

        semesterAnalysesData.dates.forEach((date) => {
          const dayRows = semesterAnalysesData.rowsByDate[date] ?? [];
          const row = dayRows.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);

          let year = 0;
          let month = 0;
          let day = 0;
          const parts = date.split('-').map(Number);
          if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
          }
          const dateLabel =
            year && month && day ? formatDateDDMMYYYY(day, month, year) : date;

          hourSuffixes.forEach((label, hourIndex) => {
            const hourKey = hours[hourIndex];
            categories.push(`${dateLabel} ${label}`);
            const productHours = row && row[selectedProduct] ? row[selectedProduct] : null;
            const rawValue = productHours?.[hourKey] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartData.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedProduct, measureKeyForBounds, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
          });
        });

        return {
          categories,
          series: [{ name: productLabels[selectedProduct], data: chartData }],
          outOfBoundsIndices,
        };
      }
      return getEmptySemesterData(selectedSemesterProp, productLabels[selectedProduct]);
    }
    if (duration === 'year') {
      if (yearAnalysesData && yearAnalysesData.dates.length > 0) {
        const categories: string[] = [];
        const chartData: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const hourSuffixes = ['7h', '15h', '23h'] as const;
        const selectedNorm = normalizeMeasureLabel(selectedMeasure);
        const measureKeyForBounds =
          ANALYSES_MEASURE_NAMES.find((m) => normalizeMeasureLabel(m) === selectedNorm) ?? selectedMeasure;

        yearAnalysesData.dates.forEach((date) => {
          const dayRows = yearAnalysesData.rowsByDate[date] ?? [];
          const row = dayRows.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);

          let year = 0;
          let month = 0;
          let day = 0;
          const parts = date.split('-').map(Number);
          if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
          }
          const dateLabel =
            year && month && day ? formatDateDDMMYYYY(day, month, year) : date;

          hourSuffixes.forEach((label, hourIndex) => {
            const hourKey = hours[hourIndex];
            categories.push(`${dateLabel} ${label}`);
            const productHours = row && row[selectedProduct] ? row[selectedProduct] : null;
            const rawValue = productHours?.[hourKey] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartData.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedProduct, measureKeyForBounds, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
          });
        });

        return {
          categories,
          series: [{ name: productLabels[selectedProduct], data: chartData }],
          outOfBoundsIndices,
        };
      }
      return getEmptyYearData(selectedYearProp, productLabels[selectedProduct]);
    }

    // Jour : abscisses = heures (7h, 15h, 23h), une série = produit choisi.
    const categories = hours.map((h) => hourLabels[h]);
    const selectedNorm = normalizeMeasureLabel(selectedMeasure);
    const row = data.find((r) => normalizeMeasureLabel(r.property) === selectedNorm);
    const productRow = row?.[selectedProduct];
    const values = hours.map((h) => parseValue(productRow?.[h] ?? ''));
    const series: { name: string; data: number[] }[] = [
      { name: productLabels[selectedProduct], data: values },
    ];
    if (duration === 'day') {
      console.log('[Graphique Jour] chartData jour:', {
        dataLength: data?.length,
        selectedMeasure,
        selectedNorm,
        rowFound: !!row,
        productRowKeys: row ? Object.keys(row).filter((k) => k !== 'property' && k !== 'date' && k !== 'creneau' && k !== 'id') : [],
        selectedProduct,
        values,
        categoriesLength: categories.length,
        seriesLength: series.length,
      });
    }
    return { categories, series };
  }, [
    data,
    selectedMeasure,
    selectedProduct,
    duration,
    selectedMonthProp,
    selectedQuarterProp,
    selectedSemesterProp,
    selectedYearProp,
    weekAnalysesData,
    monthAnalysesData,
    quarterAnalysesData,
    semesterAnalysesData,
    yearAnalysesData,
    isOutOfBounds,
    analysesBounds,
  ]);

  const isDay = duration === 'day';
  const isWeek = duration === 'week';

  useEffect(() => {
    if (duration !== 'day') return;
    const showChart = chartData.series.length > 0 && chartData.categories.length > 0;
    console.log('[Graphique Jour] render decision:', {
      showChart,
      seriesLength: chartData.series.length,
      categoriesLength: chartData.categories.length,
      willShowEmptyMessage: !showChart,
    });
  }, [duration, chartData.series.length, chartData.categories.length]);

  const xTitle =
    duration === 'day'
      ? (selectedDateProp ? formatDateLabel(selectedDateProp) : 'Heure')
      : duration === 'week'
        ? (selectedWeekProp ? formatWeekLabel(selectedWeekProp) : 'Jour')
        : duration === 'quarter'
          ? (selectedQuarterProp ? formatQuarterLabel(selectedQuarterProp) : 'Trimestre')
          : duration === 'semester'
            ? (selectedSemesterProp ? formatSemesterLabel(selectedSemesterProp) : 'Semestre')
            : duration === 'year'
              ? (selectedYearProp ? formatYearLabel(selectedYearProp) : 'Année')
              : selectedMonthProp
                ? formatMonthLabel(selectedMonthProp)
                : `${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`;

  /** Marqueurs discrets : utilisés pour les vues Mois et Trimestre (line chart) — couleurs vives */
  const discreteMarkers = useMemo(() => {
    if (isDay || isWeek || chartData.series.length === 0) return undefined;
    const count = chartData.series[0].data.length;
    const useVivid = duration === 'month' || duration === 'quarter' || duration === 'semester' || duration === 'year';
    const hourColors = useVivid
      ? [HOUR_COLORS_VIVID.h7, HOUR_COLORS_VIVID.h15, HOUR_COLORS_VIVID.h23]
      : [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23];
    const size = useVivid ? 4 : 5;
    return Array.from({ length: count }, (_, i) => ({
      seriesIndex: 0,
      dataPointIndex: i,
      fillColor: hourColors[i % 3],
      strokeColor: '#fff',
      size,
      strokeWidth: 1,
    }));
  }, [duration, chartData.series, isDay, isWeek]);

  const isDarkMode =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const options: ApexOptions = useMemo(() => {
    if (isDay) {
      // Vue Jour : design type ChartTwo, mais avec une couleur différente pour chaque plot (7h, 15h, 23h)
      return {
        colors: [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          type: 'bar',
          height: 335,
          stacked: true,
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
          animations: {
            dynamicAnimation: { enabled: false },
          },
        },
        stroke: {
          width: 2,
          colors: [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23],
        },
        responsive: [
          {
            breakpoint: 1536,
            options: {
              plotOptions: {
                bar: {
                  borderRadius: 0,
                  columnWidth: '25%',
                },
              },
            },
          },
        ],
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 0,
            // Pour 3 barres (7h, 15h, 23h) on réduit encore pour avoir des plots plus fins.
            columnWidth: '10%',
            borderRadiusApplication: 'end',
            borderRadiusWhenStacked: 'last',
            distributed: true,
          },
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        legend: { show: false },
        fill: {
          opacity: 1,
        },
        yaxis: {
          title: {
            text: selectedMeasure || 'Valeur',
            style: { fontSize: '12px' },
          },
          labels: {
            style: { fontSize: '11px' },
            formatter: formatYAxisLabel,
          },
        },
        tooltip: {
          y: { formatter: (val: number) => formatYAxisLabel(val) },
        },
      };
    }

    if (isWeek) {
      // Vue Semaine : valeurs hors intervalle (bornes Settings) = ligne verticale rouge + point rouge.
      const weekColor = isDarkMode ? '#4ade80' : '#044c4b';
      const conformeBlue = '#3c50e0';
      const oobRed = '#DC2626';
      const weekChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
        conformeIndices?: number[];
      };
      const outOfBoundsIndices = weekChartData.outOfBoundsIndices ?? [];
      const conformeIndices = weekChartData.conformeIndices ?? [];
      const categories = weekChartData.categories ?? [];
      // Points conformes (données saisies, dans les bornes) : marqueurs bleus.
      const discreteMarkersConform = conformeIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: conformeBlue,
        strokeColor: '#fff',
        size: 5,
        strokeWidth: 1,
      }));
      // Points hors intervalle : marqueurs rouges + annotation verticale.
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 5,
        strokeWidth: 1,
      }));
      return {
        legend: { show: false },
        colors: [weekColor],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          height: 335,
          type: 'area',
          background: 'transparent',
          dropShadow: {
            enabled: true,
            color: '#623CEA14',
            top: 10,
            blur: 4,
            left: 0,
            opacity: 0.1,
          },
          toolbar: {
            show: false,
          },
          animations: {
            dynamicAnimation: { enabled: false },
          },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => {
            const categoryLabel = categories[dataPointIndex];
            return {
              x: categoryLabel,
              borderColor: oobRed,
              strokeWidth: 2,
              opacity: 1,
              strokeDashArray: 0,
              label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
            };
          }),
        },
        responsive: [
          {
            breakpoint: 1024,
            options: { chart: { height: 300 } },
          },
          {
            breakpoint: 1366,
            options: { chart: { height: 350 } },
          },
        ],
        stroke: {
          width: 2,
          curve: 'straight',
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.5,
            opacityFrom: 0.55,
            opacityTo: 0.05,
          },
        },
        grid: {
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
        },
        dataLabels: {
          enabled: false,
        },
        markers: {
          size: 2,
          colors: '#fff',
          strokeColors: [weekColor],
          strokeWidth: 2,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: [...discreteMarkersConform, ...discreteMarkersOob],
          hover: {
            size: undefined,
            sizeOffset: 3,
          },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: { show: false },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: {
            text: selectedMeasure || 'Valeur',
            style: { fontSize: '12px' },
          },
          min: 0,
          max: 100,
          labels: {
            style: { fontSize: '11px' },
            formatter: formatYAxisLabel,
          },
        },
        tooltip: {
          y: { formatter: (val: number) => formatYAxisLabel(val) },
        },
      };
    }

    // Vue Mois : valeurs hors intervalle = ligne verticale rouge + point rouge (comme Semaine)
    if (duration === 'month') {
      const oobRed = '#DC2626';
      const conformeBlue = '#3c50e0';
      const monthChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
        conformeIndices?: number[];
      };
      const outOfBoundsIndices = monthChartData.outOfBoundsIndices ?? [];
      const conformeIndices = monthChartData.conformeIndices ?? [];
      const categoriesMonth = monthChartData.categories ?? [];
      const monthColor = isDarkMode ? '#E5E7EB' : '#000000';
      const discreteMarkersConform = conformeIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: conformeBlue,
        strokeColor: '#fff',
        size: 3,
        strokeWidth: 1,
      }));
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 3,
        strokeWidth: 1,
      }));
      return {
        legend: { show: false, position: 'top', horizontalAlign: 'left' },
        colors: [monthColor],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          height: 335,
          type: 'area',
          background: 'transparent',
          dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
          toolbar: { show: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => ({
            x: categoriesMonth[dataPointIndex],
            borderColor: oobRed,
            strokeWidth: 2,
            opacity: 1,
            strokeDashArray: 0,
            label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
          })),
        },
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 300 } } },
          { breakpoint: 1366, options: { chart: { height: 350 } } },
        ],
        stroke: { width: 2, curve: 'straight' },
        fill: {
          type: 'gradient',
          gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.5, opacityFrom: 0.55, opacityTo: 0.05 },
        },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [monthColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: [...discreteMarkersConform, ...discreteMarkersOob],
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: { show: false, style: { fontSize: '9px' }, rotate: -45 },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: selectedMeasure || 'Valeur', style: { fontSize: '12px' } },
          labels: { style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: { y: { formatter: (val: number) => formatYAxisLabel(val) } },
      };
    }

    // Vue Trimestre : valeurs hors intervalle = ligne verticale rouge + point rouge (comme Semaine / Mois)
    if (duration === 'quarter') {
      const oobRed = '#DC2626';
      const quarterChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
      };
      const outOfBoundsIndices = quarterChartData.outOfBoundsIndices ?? [];
      const categoriesQuarter = quarterChartData.categories ?? [];
      const quarterColor = '#7B9FD4';
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 2,
        strokeWidth: 1,
      }));
      return {
        legend: { show: false, position: 'top', horizontalAlign: 'left' },
        colors: [quarterColor],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          height: 335,
          type: 'area',
          background: 'transparent',
          dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
          toolbar: { show: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => ({
            x: categoriesQuarter[dataPointIndex],
            borderColor: oobRed,
            strokeWidth: 2,
            opacity: 1,
            strokeDashArray: 0,
            label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
          })),
        },
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 300 } } },
          { breakpoint: 1366, options: { chart: { height: 350 } } },
        ],
        stroke: { width: 2, curve: 'straight' },
        fill: {
          type: 'gradient',
          gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.5, opacityFrom: 0.55, opacityTo: 0.05 },
        },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [quarterColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: discreteMarkersOob,
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: { show: false, style: { fontSize: '9px' }, rotate: -45 },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: selectedMeasure || 'Valeur', style: { fontSize: '12px' } },
          labels: { style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: { y: { formatter: (val: number) => formatYAxisLabel(val) } },
      };
    }

    // Vue Semestre : valeurs hors intervalle = ligne verticale rouge + point rouge (comme Semaine / Mois / Trimestre)
    if (duration === 'semester') {
      const oobRed = '#DC2626';
      const semesterChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
      };
      const outOfBoundsIndices = semesterChartData.outOfBoundsIndices ?? [];
      const categoriesSemester = semesterChartData.categories ?? [];
      const semesterColor = '#6960ec';
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 2,
        strokeWidth: 0,
      }));
      return {
        legend: { show: false, position: 'top', horizontalAlign: 'left' },
        colors: [semesterColor],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          height: 335,
          type: 'area',
          background: 'transparent',
          dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
          toolbar: { show: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => ({
            x: categoriesSemester[dataPointIndex],
            borderColor: oobRed,
            strokeWidth: 2,
            opacity: 1,
            strokeDashArray: 0,
            label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
          })),
        },
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 300 } } },
          { breakpoint: 1366, options: { chart: { height: 350 } } },
        ],
        stroke: { width: 2, curve: 'straight' },
        fill: {
          type: 'gradient',
          gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.5, opacityFrom: 0.55, opacityTo: 0.05 },
        },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [semesterColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: discreteMarkersOob,
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: { show: false, style: { fontSize: '9px' }, rotate: -45 },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: selectedMeasure || 'Valeur', style: { fontSize: '12px' } },
          labels: { style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: { y: { formatter: (val: number) => formatYAxisLabel(val) } },
      };
    }

    // Vue Année : valeurs hors intervalle = ligne verticale rouge + point rouge (comme Semaine / Mois / Trimestre / Semestre)
    if (duration === 'year') {
      const oobRed = '#DC2626';
      const yearChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
      };
      const outOfBoundsIndices = yearChartData.outOfBoundsIndices ?? [];
      const categoriesYear = yearChartData.categories ?? [];
      const yearColor = '#3C50E0';
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 2,
        strokeWidth: 0,
      }));
      return {
        legend: { show: false, position: 'top', horizontalAlign: 'left' },
        colors: [yearColor],
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          height: 335,
          type: 'area',
          background: 'transparent',
          dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
          toolbar: { show: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => ({
            x: categoriesYear[dataPointIndex],
            borderColor: oobRed,
            strokeWidth: 2,
            opacity: 1,
            strokeDashArray: 0,
            label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
          })),
        },
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 300 } } },
          { breakpoint: 1366, options: { chart: { height: 350 } } },
        ],
        stroke: { width: 2, curve: 'straight' },
        fill: {
          type: 'gradient',
          gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.5, opacityFrom: 0.55, opacityTo: 0.05 },
        },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [yearColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: discreteMarkersOob,
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: { show: false, style: { fontSize: '9px' }, rotate: -45 },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: selectedMeasure || 'Valeur', style: { fontSize: '12px' } },
          labels: { style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: { y: { formatter: (val: number) => formatYAxisLabel(val) } },
      };
    }

    // Fallback (ne devrait pas être atteint : toutes les durées ont leur bloc)
    const areaColor = '#B4CFEC';
    const areaStroke = '#B4CFEC';
    return {
      legend: {
        show: false,
        position: 'top',
        horizontalAlign: 'left',
      },
      colors: [areaColor],
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        height: 335,
        type: 'area',
        background: 'transparent',
        dropShadow: {
          enabled: true,
          color: '#623CEA14',
          top: 10,
          blur: 4,
          left: 0,
          opacity: 0.1,
        },
        toolbar: {
          show: false,
        },
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 300,
            },
          },
        },
        {
          breakpoint: 1366,
          options: {
            chart: {
              height: 350,
            },
          },
        },
      ],
      stroke: {
        width: 2,
        curve: 'straight',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.5,
          opacityFrom: 0.55,
          opacityTo: 0.05,
        },
      },
      grid: {
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 1,
        colors: '#fff',
        strokeColors: [areaStroke],
        strokeWidth: 1,
        strokeOpacity: 0.9,
        strokeDashArray: 0,
        fillOpacity: 1,
        discrete: [],
        hover: {
          size: 3,
          sizeOffset: 2,
        },
      },
      xaxis: {
        type: 'category',
        categories: chartData.categories,
        title: { text: xTitle, style: { fontSize: '12px' } },
        labels: {
          show: false,
          style: { fontSize: '9px' },
          rotate: -45,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
      },
      yaxis: {
        title: {
          text: selectedMeasure || 'Valeur',
          style: { fontSize: '12px' },
        },
        labels: {
          style: { fontSize: '11px' },
          formatter: formatYAxisLabel,
        },
      },
      tooltip: {
        y: { formatter: (val: number) => formatYAxisLabel(val) },
      },
    };
  }, [chartData, duration, isDay, isWeek, xTitle, selectedMeasure, isDarkMode]);

  return (
    <div className={embedded ? EMBEDDED_WRAPPER_CLASS : ''}>
      {!isControlled && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black dark:text-white">Durée :</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationFilter)}
              className="rounded border border-stroke bg-transparent py-1.5 pl-2 pr-6 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
            >
              {(Object.entries(DURATION_LABELS) as [DurationFilter, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black dark:text-white">Mesure :</label>
            <select
              value={selectedMeasure}
              onChange={(e) => setSelectedMeasure(e.target.value)}
              className="rounded border border-stroke bg-transparent py-1.5 pl-2 pr-6 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
            >
              {measureNames.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black dark:text-white">Produit :</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value as ProductKey)}
              className="rounded border border-stroke bg-transparent py-1.5 pl-2 pr-6 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
            >
              {products.map((p) => (
                <option key={p} value={p}>
                  {productLabels[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {(leftSlot || centerSlot || rightSlot) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1">{leftSlot}</div>
          <div className="flex justify-center gap-2">{centerSlot}</div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">{rightSlot}</div>
        </div>
      )}
      <div className={isControlled ? 'w-full min-h-[300px]' : '-ml-5 w-full min-h-[300px]'}>
        {chartData.series.length > 0 && chartData.categories.length > 0 ? (
          <ReactApexChart
            key={duration}
            options={options}
            series={chartData.series}
            className={isWeek ? 'analyses-week-chart' : undefined}
            type={isDay ? 'bar' : 'area'}
            height={350}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center rounded border border-dashed border-stroke text-sm text-bodydark dark:border-strokedark dark:text-bodydark">
            Aucune donnée à afficher pour cette mesure.
          </div>
        )}
      </div>
      {isDay && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <div className="flex items-center gap-2 rounded border border-[#EA580C] bg-white px-3 py-1 shadow-sm dark:bg-[#EA580C]/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C] shadow-sm" />
            <span className="text-xs font-semibold tracking-wide text-[#EA580C]">7h</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-[#059669] bg-white px-3 py-1 shadow-sm dark:bg-[#059669]/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#059669] shadow-sm" />
            <span className="text-xs font-semibold tracking-wide text-[#059669]">15h</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-[#DC2626] bg-white px-3 py-1 shadow-sm dark:bg-[#DC2626]/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626] shadow-sm" />
            <span className="text-xs font-semibold tracking-wide text-[#DC2626]">23h</span>
          </div>
        </div>
      )}
      {(isWeek || duration === 'month') && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <div className="flex items-center gap-2 rounded border border-[#3c50e0] bg-white px-3 py-1 shadow-sm dark:bg-[#3c50e0]/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3c50e0] shadow-sm" />
            <span className="text-xs font-semibold tracking-wide text-[#3c50e0]">Conforme</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-[#DC2626] bg-white px-3 py-1 shadow-sm dark:bg-[#DC2626]/20">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626] shadow-sm" />
            <span className="text-xs font-semibold tracking-wide text-[#DC2626]">Non conforme</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartAnalysesLaboratoire;
