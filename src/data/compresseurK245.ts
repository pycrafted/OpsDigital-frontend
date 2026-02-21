/** Données partagées pour Compresseur K 245 (tableau + graphique). */

export interface CategoryData {
  category: string;
  subRows: string[];
}

export interface HourRow {
  hour: string;
  values: Record<string, string>;
}

export const COMPRESSEUR_K245_CATEGORIES: CategoryData[] = [
  { category: 'huile', subRows: ['t.h 27 tt 146', 'p.h 27 pt 136 a/b', 'p.filtre 27 pdt 147'] },
  { category: 'eau', subRows: ['eau 24 ti 155', 'eau 27 pi 157'] },
  { category: 'hydrogene', subRows: ['p.asp 27 pt 100 a/b', 'p.ref 27 pt 101 a/b', "t° de ch b 27 ti 104 a/b", "t° de ch b 27 ti 105 a/b", '% charge comp'] },
  { category: 'azote', subRows: ['n° cadre', 'p.n 27 pi 122', 'p cadre'] },
  { category: 'air', subRows: ['air ins 27 pi 180', 'palier comp 27 ti 117', 'palier comp 27 ti 118', 't.palier cne 27 ti 116', 't.palier ce 27 ti 112'] },
  { category: 'consommation', subRows: ['consom go d202', 'consom go d314b', 'consom fo d349', 'consom fo d362', 'consom eb th'] },
  { category: 'cotes', subRows: ['cote d 202', 'cote d350'] },
];

export const COMPRESSEUR_K245_HOURS = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
export type CompresseurK245HourKey = (typeof COMPRESSEUR_K245_HOURS)[number];

export const compresseurK245HourLabels: Record<CompresseurK245HourKey, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

/** Liste des indicateurs pour le graphique : { key (category_subRow), label } */
export function getCompresseurK245IndicateurOptions(): { key: string; label: string }[] {
  const list: { key: string; label: string }[] = [];
  COMPRESSEUR_K245_CATEGORIES.forEach((cat) => {
    cat.subRows.forEach((subRow) => {
      list.push({ key: `${cat.category}_${subRow}`, label: subRow });
    });
  });
  return list;
}

export function createInitialCompresseurK245Data(): HourRow[] {
  const hourRows: HourRow[] = [];
  COMPRESSEUR_K245_HOURS.forEach((hour) => {
    const values: Record<string, string> = {};
    COMPRESSEUR_K245_CATEGORIES.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        values[`${cat.category}_${subRow}`] = '';
      });
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}
