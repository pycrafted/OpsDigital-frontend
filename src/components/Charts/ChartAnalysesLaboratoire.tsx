import { ApexOptions } from 'apexcharts';
import React, { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  AnalyseRow,
  hourLabels,
  hours,
  productLabels,
  products,
  type ProductKey,
} from '../../data/analysesLaboratoire';

const EMBEDDED_WRAPPER_CLASS = 'flex min-h-0 w-full flex-1 flex-col items-start';

const CHART_COLOR = '#3C50E0';
const HOUR_COLORS = { h7: '#3C50E0', h15: '#0891B2', h23: '#E85347' };

type DurationFilter = 'day' | 'week' | 'month';

const DURATION_LABELS: Record<DurationFilter, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
};

function parseValue(s: string): number {
  const n = parseFloat(s?.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Données d'exemple pour la vue Semaine : une seule courbe, 7 jours × 3 relevés (7h, 15h, 23h) = 21 points */
function getExampleWeekData(): { categories: string[]; series: { name: string; data: number[] }[] } {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hourSuffixes = ['7h', '15h', '23h'];
  const categories: string[] = [];
  const data: number[] = [];
  const baseByDay = [0.72, 0.71, 0.73, 0.72, 0.74, 0.73, 0.72];
  days.forEach((day, dayIndex) => {
    hourSuffixes.forEach((h, hourIndex) => {
      categories.push(`${day} ${h}`);
      data.push(baseByDay[dayIndex] + hourIndex * 0.01 + (dayIndex % 3) * 0.005);
    });
  });
  return {
    categories,
    series: [{ name: 'Relevés', data }],
  };
}

/** Données d'exemple pour la vue Mois : une seule courbe, 30 jours × 3 relevés (7h, 15h, 23h) = 90 points */
function getExampleMonthData(): { categories: string[]; series: { name: string; data: number[] }[] } {
  const hourSuffixes = ['7h', '15h', '23h'];
  const categories: string[] = [];
  const data: number[] = [];
  const baseByDay = Array.from({ length: 30 }, (_, i) => 0.71 + Math.sin(i / 5) * 0.02);
  for (let dayIndex = 0; dayIndex < 30; dayIndex++) {
    hourSuffixes.forEach((h, hourIndex) => {
      categories.push(`J${dayIndex + 1} ${h}`);
      data.push(baseByDay[dayIndex] + hourIndex * 0.01 + (dayIndex % 3) * 0.005);
    });
  }
  return {
    categories,
    series: [{ name: 'Relevés', data }],
  };
}

export interface ChartAnalysesLaboratoireProps {
  data: AnalyseRow[];
  embedded?: boolean;
}

const ChartAnalysesLaboratoire: React.FC<ChartAnalysesLaboratoireProps> = ({
  data,
  embedded = true,
}) => {
  const measureNames = useMemo(() => data.map((r) => r.property), [data]);
  const [selectedMeasure, setSelectedMeasure] = useState<string>(() => measureNames[0] ?? '');
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>(products[0]);
  const [duration, setDuration] = useState<DurationFilter>('day');

  useEffect(() => {
    if (measureNames.length > 0 && !measureNames.includes(selectedMeasure)) {
      setSelectedMeasure(measureNames[0]);
    }
  }, [measureNames, selectedMeasure]);

  // Journée : données du tableau (7h, 15h, 23h). Semaine / Mois : exemples visuels.
  const chartData = useMemo(() => {
    if (duration === 'week') return getExampleWeekData();
    if (duration === 'month') return getExampleMonthData();

    // Jour : abscisses = heures (7h, 15h, 23h), une série = produit choisi. Si tout est vide, exemple non nul.
    const row = data.find((r) => r.property === selectedMeasure);
    if (!row) return { categories: [] as string[], series: [] as { name: string; data: number[] }[] };

    const categories = hours.map((h) => hourLabels[h]);
    const productRow = row[selectedProduct];
    let values = hours.map((h) => parseValue(productRow[h]));
    if (values.every((v) => v === 0)) {
      values = [0.72, 0.71, 0.73]; // exemple pour le graphique jour (ne pas afficher 0)
    }
    const series: { name: string; data: number[] }[] = [
      { name: productLabels[selectedProduct], data: values },
    ];
    return { categories, series };
  }, [data, selectedMeasure, selectedProduct, duration]);

  const isDay = duration === 'day';
  const xTitle = duration === 'day' ? 'Heure' : duration === 'week' ? 'Jour' : 'Jour (1 mois)';

  /** Marqueurs discrets : couleur selon 7h / 15h / 23h (Jour = 3 points, Semaine = 21, Mois = 90) */
  const discreteMarkers = useMemo(() => {
    if (chartData.series.length === 0) return undefined;
    const count = chartData.series[0].data.length;
    const hourColors = [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23];
    const size = duration === 'month' ? 3 : duration === 'day' ? 6 : 5;
    return Array.from({ length: count }, (_, i) => ({
      seriesIndex: 0,
      dataPointIndex: i,
      fillColor: hourColors[i % 3],
      strokeColor: '#fff',
      size,
      strokeWidth: 1,
    }));
  }, [duration, chartData.series]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        type: 'line',
        toolbar: { show: false },
        stacked: false,
        zoom: { enabled: false },
      },
      colors: [CHART_COLOR],
      plotOptions: {
        line: { stroke: { width: 2 } },
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        customLegendItems: ['7h', '15h', '23h'],
        markers: {
          fillColors: [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23],
        },
      },
      stroke: {
        width: 2,
        colors: [CHART_COLOR],
      },
      markers:
        discreteMarkers
          ? { size: 0, discrete: discreteMarkers, hover: { size: duration === 'month' ? 4 : duration === 'day' ? 8 : 6 } }
          : { size: 3, strokeWidth: 0, strokeColors: '#fff', hover: { size: 5 } },
      grid: {
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        type: 'category',
        categories: chartData.categories,
        title: { text: xTitle, style: { fontSize: '12px' } },
        labels: {
          style: { fontSize: duration === 'month' ? '9px' : '11px' },
          rotate: duration === 'month' || duration === 'week' ? -45 : 0,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: selectedMeasure || 'Valeur',
          style: { fontSize: '12px' },
        },
        labels: { style: { fontSize: '11px' } },
      },
      tooltip: {
        y: { formatter: (val: number) => (Number.isFinite(val) ? String(val) : '') },
      },
    }),
    [chartData.categories, chartData.series, selectedMeasure, duration, isDay, xTitle, discreteMarkers]
  );

  return (
    <div className={embedded ? EMBEDDED_WRAPPER_CLASS : ''}>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {/* Filtre durée */}
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

        {/* Mesure (ordonnée) */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-black dark:text-white">Mesure (ordonnée) :</label>
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

        {/* Produit */}
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
      <div className="-ml-5 w-full min-h-[300px]">
        {chartData.series.length > 0 && chartData.categories.length > 0 ? (
          <ReactApexChart
            options={options}
            series={chartData.series}
            type="line"
            height={350}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center rounded border border-dashed border-stroke text-sm text-bodydark dark:border-strokedark dark:text-bodydark">
            Aucune donnée à afficher pour cette mesure.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartAnalysesLaboratoire;
