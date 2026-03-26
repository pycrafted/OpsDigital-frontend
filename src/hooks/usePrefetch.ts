/**
 * Préchargement silencieux des données des pages Tableaux et Graphiques.
 * S'exécute une fois au montage de l'application et peuple le fetchCache
 * afin que ces pages affichent les données immédiatement sans spinner.
 */
import { useEffect } from 'react';
import { cacheKey, getCached, setCached } from '../utils/fetchCache';
import { fetchAnalysesByDate, fetchAnalysesByDateRange } from '../api/analysesLaboratoire';
import { fetchReformateurByDate, fetchReformateurByDateRange } from '../api/reformateur';
import { fetchProductionByDate, fetchProductionByDateRange } from '../api/production';
import { fetchGazByDate, fetchGazByDateRange } from '../api/gaz';
import { fetchMouvementBacsByDate, fetchMouvementBacsByDateRange } from '../api/mouvementDesBacs';
import { fetchCompresseurK244ByDate, fetchCompresseurK244ByDateRange } from '../api/compresseurK244';
import { fetchCompresseurK245ByDate, fetchCompresseurK245ByDateRange } from '../api/compresseurK245';
import { fetchAtmMeroxByDate, fetchAtmMeroxByDateRange } from '../api/atmMerox';

function isoWeekString(d: Date): string {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekDates(week: string): string[] {
  const match = week.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return [];
  const year = parseInt(match[1], 10);
  const weekNum = parseInt(match[2], 10);
  const jan4 = new Date(year, 0, 4);
  const daysToMonday = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
  const monday = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - daysToMonday + (weekNum - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DATASETS = [
  { key: 'analyses',            day: fetchAnalysesByDate,        range: fetchAnalysesByDateRange },
  { key: 'reformateur',         day: fetchReformateurByDate,      range: fetchReformateurByDateRange },
  { key: 'production',          day: fetchProductionByDate,       range: fetchProductionByDateRange },
  { key: 'gaz',                 day: fetchGazByDate,              range: fetchGazByDateRange },
  { key: 'mouvement-des-bacs',  day: fetchMouvementBacsByDate,    range: fetchMouvementBacsByDateRange },
  { key: 'compresseur-k244',    day: fetchCompresseurK244ByDate,  range: fetchCompresseurK244ByDateRange },
  { key: 'compresseur-k245',    day: fetchCompresseurK245ByDate,  range: fetchCompresseurK245ByDateRange },
  { key: 'atm-merox-pre-flash', day: fetchAtmMeroxByDate,        range: fetchAtmMeroxByDateRange },
] as const;

export function usePrefetch(): void {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const week = isoWeekString(new Date());
    const dates = weekDates(week);

    for (const ds of DATASETS) {
      // Vue "Jour" — pour la page Tableaux (selectedDate = today par défaut)
      const dayKey = cacheKey(ds.key, 'day', today);
      if (!getCached(dayKey)) {
        ds.day(today).then((data) => setCached(dayKey, data)).catch(() => {});
      }

      // Vue "Semaine" — pour la page Graphiques (duration = 'week' par défaut)
      if (dates.length === 7) {
        const weekKey = cacheKey(ds.key, 'week', week);
        if (!getCached(weekKey)) {
          ds.range(dates[0], dates[6])
            .then((response) => {
              const rowsByDate: Record<string, unknown[]> = {};
              for (const d of dates) {
                rowsByDate[d] = (response as Record<string, unknown[]>)[d] ?? [];
              }
              setCached(weekKey, { dates, rowsByDate });
            })
            .catch(() => {});
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
