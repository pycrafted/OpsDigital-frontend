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
// Même code couleur que les colonnes d'heure du tableau Analyses
const HOUR_COLORS = { h7: '#fff2db', h15: '#e1f8f0', h23: '#feeaea' };

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

/** Données d'exemple pour la vue Semaine : même forme et valeurs que le graphe "Total Revenue / Total Sales" du tableau de bord */
function getExampleWeekData(): { categories: string[]; series: { name: string; data: number[] }[] } {
  const categories = [
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
  ];

  // Même forme que ChartOne, mais avec des libellés adaptés au contexte "mesures"
  const series = [
    {
      name: 'Mesure 1',
      data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45],
    },
    {
      name: 'Mesure 2',
      data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51],
    },
  ];

  return {
    categories,
    series,
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
      // Valeurs d'exemple pour la vue Jour : 1er = 0.72, 2ème = 0.54, 3ème = 0.93
      values = [0.72, 0.54, 0.93];
    }
    const series: { name: string; data: number[] }[] = [
      { name: productLabels[selectedProduct], data: values },
    ];
    return { categories, series };
  }, [data, selectedMeasure, selectedProduct, duration]);

  const isDay = duration === 'day';
  const isWeek = duration === 'week';
  const xTitle = duration === 'day' ? 'Heure' : duration === 'week' ? 'Jour' : 'Jour (1 mois)';

  /** Marqueurs discrets : utilisés uniquement pour la vue Mois (line chart) */
  const discreteMarkers = useMemo(() => {
    if (isDay || isWeek || chartData.series.length === 0) return undefined;
    const count = chartData.series[0].data.length;
    const hourColors = [HOUR_COLORS.h7, HOUR_COLORS.h15, HOUR_COLORS.h23];
    const size = duration === 'month' ? 3 : 5;
    return Array.from({ length: count }, (_, i) => ({
      seriesIndex: 0,
      dataPointIndex: i,
      fillColor: hourColors[i % 3],
      strokeColor: '#fff',
      size,
      strokeWidth: 1,
    }));
  }, [duration, chartData.series, isDay, isWeek]);

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
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontFamily: 'Satoshi',
          fontWeight: 500,
          fontSize: '14px',
          markers: {
            radius: 99,
          },
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          y: { formatter: (val: number) => (Number.isFinite(val) ? String(val) : '') },
        },
      };
    }

    if (isWeek) {
      // Vue Semaine : design type ChartOne, fond transparent
      return {
        legend: {
          show: false,
          position: 'top',
          horizontalAlign: 'left',
        },
        colors: ['#3C50E0', '#80CAEE'],
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
          width: [2, 2],
          curve: 'straight',
        },
        // Remplissage uniforme (même transparence de gauche à droite sous la courbe)
        fill: {
          type: 'solid',
          opacity: 0.35,
        },
        grid: {
          xaxis: {
            lines: {
              show: true,
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
          size: 4,
          colors: '#fff',
          strokeColors: ['#3056D3', '#80CAEE'],
          strokeWidth: 3,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: [],
          hover: {
            size: undefined,
            sizeOffset: 5,
          },
        },
        xaxis: {
          type: 'category',
          categories: chartData.categories,
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          title: {
            style: {
              fontSize: '0px',
            },
          },
          min: 0,
          max: 100,
        },
        tooltip: {
          y: { formatter: (val: number) => (Number.isFinite(val) ? String(val) : '') },
        },
      };
    }

    // Vue Mois : line chart avec marqueurs discrets
    return {
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
          ? { size: 0, discrete: discreteMarkers, hover: { size: duration === 'month' ? 4 : 6 } }
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
          rotate: duration === 'month' ? -45 : 0,
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
    };
  }, [chartData.categories, duration, isDay, isWeek, xTitle, discreteMarkers, selectedMeasure]);

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
            className={isWeek ? 'analyses-week-chart' : undefined}
            type={isDay ? 'bar' : isWeek ? 'area' : 'line'}
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
