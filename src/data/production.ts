/** Données partagées pour Production (tableau + graphique). */

export interface CategoryData {
  category: string;
  subRows: string[];
}

export interface HourRow {
  hour: string;
  values: Record<string, string>;
}

export const PRODUCTION_CATEGORIES: CategoryData[] = [
  { category: 'FO D349', subRows: ['30LJ002', '30TC002'] },
  { category: 'D362', subRows: ['37 LI 018 NIVEAU  D362'] },
  { category: 'H 341', subRows: ['30F1012', '30A1002 O2 Fumées Chem'] },
  { category: 'Autres producteurs', subRows: ['20FI1052 Débit Vap D242', '10FI1052 Débit Vap E143'] },
  { category: 'H302', subRows: ['30FI005 Débit vap H 302', '30QI004 O2 Fumées Chen'] },
  { category: 'eau traitée', subRows: ['Débit Permo A', 'Débit Permo B', 'Niveau T341'] },
  { category: 'AIR/EAU REF', subRows: ['Press AIR instrum 30 PI 040', 'Lancement 30PI 068', 'Débit eau refroidissement 30 FI 036', 'T° eau circulation retour 30 TI 014'] },
  { category: 'production electrique', subRows: ['Charge', 'Intensité', 'Fréquence', 'S1', 'S2', 'S3', 'S4', 'S5', 'J351', 'J352', 'J355'] },
];

export const PRODUCTION_HOURS = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
export type ProductionHourKey = (typeof PRODUCTION_HOURS)[number];

export const productionHourLabels: Record<ProductionHourKey, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

/** Liste des indicateurs pour le graphique : { key (category_subRow), label } */
export function getProductionIndicateurOptions(): { key: string; label: string }[] {
  const list: { key: string; label: string }[] = [];
  PRODUCTION_CATEGORIES.forEach((cat) => {
    cat.subRows.forEach((subRow) => {
      if (subRow) list.push({ key: `${cat.category}_${subRow}`, label: subRow });
    });
  });
  return list;
}

export function createInitialProductionData(): HourRow[] {
  const hourRows: HourRow[] = [];
  PRODUCTION_HOURS.forEach((hour) => {
    const values: Record<string, string> = {};
    PRODUCTION_CATEGORIES.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        if (subRow) values[`${cat.category}_${subRow}`] = '';
      });
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}
