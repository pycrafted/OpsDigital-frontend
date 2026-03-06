import { ApexOptions } from 'apexcharts';
import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { HourRow } from '../../data/atmMeroxPreFlash';
import {
  getAtmMeroxIndicateurOptions,
  ATM_MEROX_HOURS,
} from '../../data/atmMeroxPreFlash';
import { useAtmMeroxBounds } from '../../context/AtmMeroxBoundsContext';
import { useAtmMeroxLabels } from '../../context/AtmMeroxLabelsContext';
import { type DurationFilter } from './ChartAnalysesLaboratoire';
import useColorMode from '../../hooks/useColorMode';

const WEEK_DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;

function parseValue(s: string): number {
  const n = parseFloat(String(s).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatYAxisLabel(val: number): string {
  return Number.isFinite(val) ? Number(val.toFixed(2)).toString() : '';
}

function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (y && m && d) return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  return ymd;
}

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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateDDMMYYYY(day: number, month: number, year: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(day)}/${pad(month)}/${year}`;
}

const indicateurOptions = getAtmMeroxIndicateurOptions();
const HOUR_COLORS: Record<string, string> = {
  '7h': '#EA580C',
  '11h': '#0EA5E9',
  '15h': '#059669',
  '19h': '#8B5CF6',
  '23h': '#DC2626',
  '3h': '#F59E0B',
};

/** Données mensuelles ATM/MEROX : une date par jour du mois + lignes par date (6 créneaux par jour). */
export interface MonthAtmMeroxData {
  dates: string[];
  rowsByDate: Record<string, HourRow[]>;
}

export interface ChartAtmMeroxPreFlashProps {
  data: HourRow[];
  duration: DurationFilter;
  selectedDate?: string;
  selectedWeek?: string;
  selectedMonth?: string;
  selectedQuarter?: string;
  selectedSemester?: string;
  selectedYear?: string;
  selectedIndicateur: string;
  onIndicateurChange: (key: string) => void;
  embedded?: boolean;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  monthAtmMeroxData?: MonthAtmMeroxData;
  weekAtmMeroxData?: MonthAtmMeroxData;
  quarterAtmMeroxData?: MonthAtmMeroxData;
  semesterAtmMeroxData?: MonthAtmMeroxData;
  yearAtmMeroxData?: MonthAtmMeroxData;
}

function parseQuarterString(quarterStr: string): { year: number; quarter: number } | null {
  const match = quarterStr.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
}

/** Trimestre = continuité de la courbe mensuelle : mois 1 + mois 2 + mois 3 collés (3× plus de relevés). Données vides. */
function getEmptyQuarterData(selectedQuarter: string | undefined, getHourLabel: (h: string) => string): { categories: string[]; series: { name: string; data: number[] }[] } {
  let year: number;
  let startMonth: number;
  const parsed = selectedQuarter ? parseQuarterString(selectedQuarter) : null;
  if (parsed) {
    year = parsed.year;
    startMonth = (parsed.quarter - 1) * 3;
  } else {
    const now = new Date();
    year = now.getFullYear();
    startMonth = Math.floor(now.getMonth() / 3) * 3;
  }
  const allCategories: string[] = [];
  const allData: number[] = [];
  for (let m = 0; m < 3; m++) {
    const month = startMonth + m;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, getHourLabel);
    allCategories.push(...monthResult.categories);
    allData.push(...monthResult.series[0].data);
  }
  return { categories: allCategories, series: [{ name: 'Relevés', data: allData }] };
}

function formatQuarterLabel(yq: string): string {
  const p = parseQuarterString(yq);
  if (!p) return yq;
  const startMonth = (p.quarter - 1) * 3;
  const endMonth = startMonth + 2;
  return `T${p.quarter} ${p.year} (${MONTH_NAMES[startMonth]} - ${MONTH_NAMES[endMonth]})`;
}

function parseSemesterString(semesterStr: string): { year: number; semester: number } | null {
  const match = semesterStr.match(/^(\d{4})-S([12])$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), semester: parseInt(match[2], 10) };
}

function getEmptySemesterData(selectedSemester: string | undefined, getHourLabel: (h: string) => string): { categories: string[]; series: { name: string; data: number[] }[] } {
  let year: number;
  let startMonth: number;
  const parsed = selectedSemester ? parseSemesterString(selectedSemester) : null;
  if (parsed) {
    year = parsed.year;
    startMonth = (parsed.semester - 1) * 6;
  } else {
    const now = new Date();
    year = now.getFullYear();
    startMonth = Math.floor(now.getMonth() / 6) * 6;
  }
  const allCategories: string[] = [];
  const allData: number[] = [];
  for (let m = 0; m < 6; m++) {
    const month = startMonth + m;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, getHourLabel);
    allCategories.push(...monthResult.categories);
    allData.push(...monthResult.series[0].data);
  }
  return { categories: allCategories, series: [{ name: 'Relevés', data: allData }] };
}

function formatSemesterLabel(ys: string): string {
  const p = parseSemesterString(ys);
  if (!p) return ys;
  const startMonth = (p.semester - 1) * 6;
  const endMonth = startMonth + 5;
  return `S${p.semester} ${p.year} (${MONTH_NAMES[startMonth]} - ${MONTH_NAMES[endMonth]})`;
}

function getEmptyYearData(selectedYear: string | undefined, getHourLabel: (h: string) => string): { categories: string[]; series: { name: string; data: number[] }[] } {
  const year = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
  if (!Number.isFinite(year)) return getEmptyYearData(String(new Date().getFullYear()), getHourLabel);
  const allCategories: string[] = [];
  const allData: number[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
    const monthResult = getEmptyMonthData(monthStr, getHourLabel);
    allCategories.push(...monthResult.categories);
    allData.push(...monthResult.series[0].data);
  }
  return { categories: allCategories, series: [{ name: 'Relevés', data: allData }] };
}

function formatYearLabel(y: string): string {
  const year = parseInt(y, 10);
  return Number.isFinite(year) ? `Année ${year}` : y;
}

function getEmptyWeekData(getHourLabel: (h: string) => string): { categories: string[]; series: { name: string; data: number[] }[]; outOfBoundsIndices: number[] } {
  const categories: string[] = [];
  const chartData: number[] = [];
  const hourSuffixes = ATM_MEROX_HOURS.map((h) => getHourLabel(h));
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayLabel = WEEK_DAY_LABELS[dayIndex];
    hourSuffixes.forEach((h) => {
      categories.push(`${dayLabel} ${h}`);
      chartData.push(0);
    });
  }
  return { categories, series: [{ name: 'Relevés', data: chartData }], outOfBoundsIndices: [] };
}

function getEmptyMonthData(selectedMonth: string | undefined, getHourLabel: (h: string) => string): { categories: string[]; series: { name: string; data: number[] }[] } {
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
  const categories: string[] = [];
  const chartData: number[] = [];
  const monthNum = month + 1;
  const hourSuffixes = ATM_MEROX_HOURS.map((h) => getHourLabel(h));
  for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
    const dayNum = dayIndex + 1;
    const dateStr = formatDateDDMMYYYY(dayNum, monthNum, year);
    hourSuffixes.forEach((hourLabel) => {
      categories.push(`${dateStr} ${hourLabel}`);
      chartData.push(0);
    });
  }
  return { categories, series: [{ name: 'Relevés', data: chartData }] };
}

const ChartAtmMeroxPreFlash: React.FC<ChartAtmMeroxPreFlashProps> = ({
  data,
  duration,
  selectedDate: selectedDateProp,
  selectedWeek: selectedWeekProp,
  selectedMonth: selectedMonthProp,
  selectedQuarter: selectedQuarterProp,
  selectedSemester: selectedSemesterProp,
  selectedYear: selectedYearProp,
  selectedIndicateur,
  onIndicateurChange,
  embedded = false,
  leftSlot,
  centerSlot,
  rightSlot,
  monthAtmMeroxData,
  weekAtmMeroxData,
  quarterAtmMeroxData,
  semesterAtmMeroxData,
  yearAtmMeroxData,
}) => {
  const { getHourLabel, getMeasureLabel } = useAtmMeroxLabels();
  const { isOutOfBounds } = useAtmMeroxBounds();
  const [colorMode] = useColorMode();
  const isDay = duration === 'day';
  const isWeek = duration === 'week';
  const isMonth = duration === 'month';
  const isQuarter = duration === 'quarter';

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

  const indicateurLabel = getMeasureLabel(selectedIndicateur);

  const chartData = useMemo(() => {
    if (duration === 'week') {
      if (weekAtmMeroxData && weekAtmMeroxData.dates.length > 0) {
        const categories: string[] = [];
        const chartValues: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const conformeIndices: number[] = [];
        weekAtmMeroxData.dates.forEach((date, dayIndex) => {
          const dayRows = weekAtmMeroxData.rowsByDate[date] ?? [];
          const dayLabel = WEEK_DAY_LABELS[dayIndex] ?? date;
          ATM_MEROX_HOURS.forEach((h) => {
            categories.push(`${dayLabel} ${getHourLabel(h)}`);
            const row = dayRows.find((r) => r.hour === h);
            const rawValue = row?.values[selectedIndicateur] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartValues.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedIndicateur, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
            else if (rawValue !== '') conformeIndices.push(categories.length - 1);
          });
        });
        return {
          categories,
          series: [{ name: indicateurLabel, data: chartValues }],
          outOfBoundsIndices,
          conformeIndices,
        };
      }
      return getEmptyWeekData(getHourLabel);
    }
    if (duration === 'month') {
      if (monthAtmMeroxData && monthAtmMeroxData.dates.length > 0) {
        const categories: string[] = [];
        const chartValues: number[] = [];
        const outOfBoundsIndices: number[] = [];
        const conformeIndices: number[] = [];
        monthAtmMeroxData.dates.forEach((date) => {
          const dayRows = monthAtmMeroxData.rowsByDate[date] ?? [];
          const parts = date.split('-').map(Number);
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          const dateLabel =
            parts.length === 3 && parts.every((n) => Number.isFinite(n))
              ? formatDateDDMMYYYY(day, month, year)
              : date;
          ATM_MEROX_HOURS.forEach((h) => {
            categories.push(`${dateLabel} ${getHourLabel(h)}`);
            const row = dayRows.find((r) => r.hour === h);
            const rawValue = row?.values[selectedIndicateur] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartValues.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedIndicateur, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
            else if (rawValue !== '') conformeIndices.push(categories.length - 1);
          });
        });
        return {
          categories,
          series: [{ name: indicateurLabel, data: chartValues }],
          outOfBoundsIndices,
          conformeIndices,
        };
      }
      return getEmptyMonthData(selectedMonthProp, getHourLabel);
    }
    if (duration === 'quarter') {
      if (quarterAtmMeroxData && quarterAtmMeroxData.dates.length > 0) {
        const categories: string[] = [];
        const chartValues: number[] = [];
        const outOfBoundsIndices: number[] = [];
        quarterAtmMeroxData.dates.forEach((date) => {
          const dayRows = quarterAtmMeroxData.rowsByDate[date] ?? [];
          const parts = date.split('-').map(Number);
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          const dateLabel =
            parts.length === 3 && parts.every((n) => Number.isFinite(n))
              ? formatDateDDMMYYYY(day, month, year)
              : date;
          ATM_MEROX_HOURS.forEach((h) => {
            categories.push(`${dateLabel} ${getHourLabel(h)}`);
            const row = dayRows.find((r) => r.hour === h);
            const rawValue = row?.values[selectedIndicateur] ?? '';
            const v = rawValue ? parseValue(rawValue) : 0;
            chartValues.push(v);
            const oob = rawValue !== '' && isOutOfBounds(selectedIndicateur, rawValue);
            if (rawValue !== '' && oob) outOfBoundsIndices.push(categories.length - 1);
          });
        });
        return {
          categories,
          series: [{ name: indicateurLabel, data: chartValues }],
          outOfBoundsIndices,
        };
      }
      return getEmptyQuarterData(selectedQuarterProp, getHourLabel);
    }
    if (duration === 'semester') {
      if (semesterAtmMeroxData && semesterAtmMeroxData.dates.length > 0) {
        const categories: string[] = [];
        const chartValues: number[] = [];
        semesterAtmMeroxData.dates.forEach((date) => {
          const dayRows = semesterAtmMeroxData.rowsByDate[date] ?? [];
          const parts = date.split('-').map(Number);
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          const dateLabel =
            parts.length === 3 && parts.every((n) => Number.isFinite(n))
              ? formatDateDDMMYYYY(day, month, year)
              : date;
          ATM_MEROX_HOURS.forEach((h) => {
            categories.push(`${dateLabel} ${getHourLabel(h)}`);
            const row = dayRows.find((r) => r.hour === h);
            const v = row ? parseValue(row.values[selectedIndicateur] ?? '') : 0;
            chartValues.push(v);
          });
        });
        return {
          categories,
          series: [{ name: indicateurLabel, data: chartValues }],
        };
      }
      return getEmptySemesterData(selectedSemesterProp, getHourLabel);
    }
    if (duration === 'year') {
      if (yearAtmMeroxData && yearAtmMeroxData.dates.length > 0) {
        const categories: string[] = [];
        const chartValues: number[] = [];
        yearAtmMeroxData.dates.forEach((date) => {
          const dayRows = yearAtmMeroxData.rowsByDate[date] ?? [];
          const parts = date.split('-').map(Number);
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          const dateLabel =
            parts.length === 3 && parts.every((n) => Number.isFinite(n))
              ? formatDateDDMMYYYY(day, month, year)
              : date;
          ATM_MEROX_HOURS.forEach((h) => {
            categories.push(`${dateLabel} ${getHourLabel(h)}`);
            const row = dayRows.find((r) => r.hour === h);
            const v = row ? parseValue(row.values[selectedIndicateur] ?? '') : 0;
            chartValues.push(v);
          });
        });
        return {
          categories,
          series: [{ name: indicateurLabel, data: chartValues }],
        };
      }
      return getEmptyYearData(selectedYearProp, getHourLabel);
    }

    const categories = ATM_MEROX_HOURS.map((h) => getHourLabel(h));
    const values = ATM_MEROX_HOURS.map((h, i) => {
      const row = data[i];
      if (!row || !selectedIndicateur) return 0;
      return parseValue(row.values[selectedIndicateur] ?? '');
    });
    return {
      categories,
      series: [{ name: indicateurLabel, data: values }],
    };
  }, [data, duration, selectedIndicateur, indicateurLabel, selectedMonthProp, selectedQuarterProp, selectedSemesterProp, selectedYearProp, monthAtmMeroxData, weekAtmMeroxData, quarterAtmMeroxData, semesterAtmMeroxData, yearAtmMeroxData, getHourLabel, getMeasureLabel, isOutOfBounds]);

  const isDarkMode =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const options: ApexOptions = useMemo(() => {
    const hourColorsArr = ATM_MEROX_HOURS.map((h) => HOUR_COLORS[h] ?? '#3C50E0');

    if (isDay) {
      return {
        colors: hourColorsArr,
        chart: {
          fontFamily: 'Satoshi, sans-serif',
          type: 'bar',
          height: 335,
          stacked: true,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        stroke: { width: 2, colors: hourColorsArr },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 0,
            columnWidth: '15%',
            borderRadiusApplication: 'end',
            borderRadiusWhenStacked: 'last',
            distributed: true,
          },
        },
        dataLabels: { enabled: false },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        legend: { show: false },
        fill: { opacity: 1 },
        yaxis: {
          title: { text: indicateurLabel || 'Valeur', style: { fontSize: '12px' } },
          max: (max: number) => max * 1.1,
          labels: { minWidth: 50, style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: { y: { formatter: (val: number) => formatYAxisLabel(val) } },
      };
    }

    if (isWeek) {
      // Courbe SEMAINE : valeurs hors bornes = ligne verticale rouge + point rouge
      const weekColor = isDarkMode ? '#4ade80' : '#044c4b';
      const oobRed = '#DC2626';
      const conformeBlue = '#3c50e0';
      const weekChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
        conformeIndices?: number[];
      };
      const outOfBoundsIndices = weekChartData.outOfBoundsIndices ?? [];
      const conformeIndices = weekChartData.conformeIndices ?? [];
      const categoriesWeek = weekChartData.categories ?? [];
      const discreteMarkersConform = conformeIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: conformeBlue,
        strokeColor: '#fff',
        size: 5,
        strokeWidth: 1,
      }));
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
          dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
          toolbar: { show: false },
          animations: { dynamicAnimation: { enabled: false } },
        },
        annotations: {
          xaxis: outOfBoundsIndices.map((dataPointIndex) => ({
            x: categoriesWeek[dataPointIndex],
            borderColor: oobRed,
            strokeWidth: 2,
            opacity: 1,
            strokeDashArray: 0,
            label: { borderColor: oobRed, style: { fontSize: '0px' }, text: '' },
          })),
        },
        stroke: { width: 2, curve: 'straight' },
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
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 2,
          colors: '#fff',
          strokeColors: [weekColor],
          strokeWidth: 2,
          strokeOpacity: 0.9,
          fillOpacity: 1,
          discrete: [...discreteMarkersConform, ...discreteMarkersOob],
          hover: { size: undefined, sizeOffset: 3 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: {
            show: false,
            style: { fontSize: '9px' },
            rotate: 0,
            formatter: (val: string, _timestamp?: unknown, opts?: { i?: number }) => {
              const dayPart = String(val).split(' ')[0] ?? '';
              const idx = opts?.i ?? 0;
              if (idx === 0) return dayPart;
              const prevLabel = String(chartData.categories[idx - 1]).split(' ')[0] ?? '';
              return dayPart !== prevLabel ? dayPart : '';
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: indicateurLabel || 'Valeur', style: { fontSize: '12px' } },
          min: 0,
          max: (max: number) => max * 1.1,
          labels: { minWidth: 50, style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: {
          x: {
            formatter: (_val: string, opts?: { dataPointIndex?: number }) =>
              chartData.categories[opts?.dataPointIndex ?? 0] ?? '',
          },
          y: { formatter: (val: number) => formatYAxisLabel(val) },
        },
      };
    }

    if (isMonth) {
      // Courbe MOIS : mêmes règles que la semaine, les valeurs hors bornes sont mises en rouge
      const monthColor = isDarkMode ? '#E5E7EB' : '#000000';
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
        legend: { show: false },
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
        stroke: { width: 2, curve: 'straight' },
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
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [monthColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          fillOpacity: 1,
          discrete: [...discreteMarkersConform, ...discreteMarkersOob],
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: {
            show: false,
            style: { fontSize: '9px' },
            rotate: 0,
            formatter: (val: string, _timestamp?: unknown, opts?: { i?: number }) => {
              const datePart = String(val).split(' ')[0] ?? '';
              const day = datePart.split('/')[0] ?? '';
              const idx = opts?.i ?? 0;
              if (idx === 0) return day;
              const prevDate = String(chartData.categories[idx - 1]).split(' ')[0] ?? '';
              return datePart !== prevDate ? day : '';
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: indicateurLabel || 'Valeur', style: { fontSize: '12px' } },
          max: (max: number) => max * 1.1,
          labels: { minWidth: 50, style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: {
          x: {
            formatter: (_val: string, opts?: { dataPointIndex?: number }) =>
              chartData.categories[opts?.dataPointIndex ?? 0] ?? '',
          },
          y: { formatter: (val: number) => formatYAxisLabel(val) },
        },
      };
    }

    if (isQuarter) {
      // Courbe TRIMESTRE : mêmes règles que semaine/mois, les valeurs hors bornes sont mises en rouge
      const quarterColor = '#7B9FD4';
      const oobRed = '#DC2626';
      const quarterChartData = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
        outOfBoundsIndices?: number[];
      };
      const outOfBoundsIndices = quarterChartData.outOfBoundsIndices ?? [];
      const categoriesQuarter = quarterChartData.categories ?? [];
      const discreteMarkersOob = outOfBoundsIndices.map((dataPointIndex) => ({
        seriesIndex: 0,
        dataPointIndex,
        fillColor: oobRed,
        strokeColor: '#fff',
        size: 2,
        strokeWidth: 1,
      }));
      return {
        legend: { show: false },
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
        stroke: { width: 2, curve: 'straight' },
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
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        markers: {
          size: 1,
          colors: '#fff',
          strokeColors: [quarterColor],
          strokeWidth: 1,
          strokeOpacity: 0.9,
          fillOpacity: 1,
          discrete: discreteMarkersOob,
          hover: { size: 3, sizeOffset: 2 },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          title: { text: xTitle, style: { fontSize: '12px' } },
          labels: {
            show: false,
            style: { fontSize: '9px' },
            rotate: 0,
            formatter: (val: string, _timestamp?: unknown, opts?: { i?: number }) => {
              const datePart = String(val).split(' ')[0] ?? '';
              const day = datePart.split('/')[0] ?? '';
              const idx = opts?.i ?? 0;
              if (idx === 0) return day;
              const prevDate = String(chartData.categories[idx - 1]).split(' ')[0] ?? '';
              return datePart !== prevDate ? day : '';
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
        },
        yaxis: {
          title: { text: indicateurLabel || 'Valeur', style: { fontSize: '12px' } },
          max: (max: number) => max * 1.1,
          labels: { minWidth: 50, style: { fontSize: '11px' }, formatter: formatYAxisLabel },
        },
        tooltip: {
          x: {
            formatter: (_val: string, opts?: { dataPointIndex?: number }) =>
              chartData.categories[opts?.dataPointIndex ?? 0] ?? '',
          },
          y: { formatter: (val: number) => formatYAxisLabel(val) },
        },
      };
    }

    // Du plus clair au plus foncé : Semaine → Mois → Trimestre → Semestre → Année
    const areaColor =
      duration === 'month'
        ? isDarkMode ? '#E5E7EB' : '#000000'
        : duration === 'quarter'
          ? '#7B9FD4'
          : duration === 'semester'
            ? '#6960ec'
            : duration === 'year'
              ? '#3C50E0'
              : '#B4CFEC';
    const areaStroke =
      duration === 'month'
        ? isDarkMode ? '#E5E7EB' : '#000000'
        : duration === 'quarter'
          ? '#7B9FD4'
          : duration === 'semester'
            ? '#6960ec'
            : duration === 'year'
              ? '#3C50E0'
              : '#B4CFEC';
    return {
      legend: { show: false },
      colors: [areaColor],
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        height: 335,
        type: 'area',
        background: 'transparent',
        dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
        toolbar: { show: false },
        animations: { dynamicAnimation: { enabled: false } },
      },
      stroke: { width: 2, curve: 'straight' },
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
      grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
      dataLabels: { enabled: false },
      markers: {
        size: 1,
        colors: '#fff',
        strokeColors: [areaStroke],
        strokeWidth: 1,
        strokeOpacity: 0.9,
        fillOpacity: 1,
        discrete: [],
        hover: { size: 3, sizeOffset: 2 },
      },
      xaxis: {
        type: 'category',
        categories: chartData.categories,
        title: { text: xTitle, style: { fontSize: '12px' } },
        labels: {
          show: false,
          style: { fontSize: '9px' },
          rotate: 0,
          formatter: (val: string, _timestamp?: unknown, opts?: { i?: number }) => {
            const datePart = String(val).split(' ')[0] ?? '';
            const day = datePart.split('/')[0] ?? '';
            const idx = opts?.i ?? 0;
            if (idx === 0) return day;
            const prevDate = String(chartData.categories[idx - 1]).split(' ')[0] ?? '';
            return datePart !== prevDate ? day : '';
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, position: 'back' as const, stroke: { width: 1, color: '#b1b9c4' } },
      },
      yaxis: {
        title: { text: indicateurLabel || 'Valeur', style: { fontSize: '12px' } },
        max: (max: number) => max * 1.1,
        labels: { minWidth: 50, style: { fontSize: '11px' }, formatter: formatYAxisLabel },
      },
      tooltip: {
        x: {
          formatter: (_val: string, opts?: { dataPointIndex?: number }) =>
            chartData.categories[opts?.dataPointIndex ?? 0] ?? '',
        },
        y: { formatter: (val: number) => formatYAxisLabel(val) },
      },
    };
  }, [chartData, duration, isDay, isWeek, isMonth, isQuarter, xTitle, indicateurLabel, isDarkMode]);

  return (
    <div className={embedded ? 'flex min-h-0 w-full flex-1 flex-col items-start' : ''}>
      {(leftSlot || centerSlot || rightSlot) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1">{leftSlot}</div>
          <div className="flex justify-center gap-2">{centerSlot}</div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">{rightSlot}</div>
        </div>
      )}
      <div className="w-full min-h-[300px]">
        {chartData.series.length > 0 && chartData.categories.length > 0 ? (
          <ReactApexChart
            key={duration}
            options={options}
            series={chartData.series}
            className={isWeek ? 'atm-merox-week-chart' : undefined}
            type={isDay ? 'bar' : 'area'}
            height={350}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center rounded border border-dashed border-stroke text-sm text-bodydark dark:border-strokedark dark:text-bodydark">
            Aucune donnée à afficher pour cet indicateur.
          </div>
        )}
      </div>
      {isDay && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {Object.entries(HOUR_COLORS).map(([hour, color]) => (
            <div key={hour} className="flex items-center gap-2 rounded border bg-white px-3 py-1 shadow-sm dark:bg-[#1d2a38]" style={{ borderColor: colorMode === 'dark' ? 'white' : color }}>
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color }}>{hour}</span>
            </div>
          ))}
        </div>
      )}
      {(isWeek || isMonth) && (
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

export default ChartAtmMeroxPreFlash;
