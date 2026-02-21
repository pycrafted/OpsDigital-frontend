/**
 * Données et types pour le tableau Réformateur catalytique.
 * Aligné avec la structure attendue par l'API (by-date / bulk-by-date).
 */

export interface CategoryData {
  category: string;
  subRows: string[];
}

export interface HourRow {
  hour: string;
  values: Record<string, string>; // key: "category_subRow", value: cell value
}

export const REFORMATEUR_CATEGORIES: CategoryData[] = [
  {
    category: 'prétraitement',
    subRows: [
      '20FI 011 Charge HDT',
      '20FR 003 H --> D203',
      '20TI 004 Chauffe D203',
      'Taux couverture D203',
      '20FR 009 Strip c201',
      '20PDI 044 Δ P D203',
      'Niveau D214 20LI 007',
    ],
  },
  {
    category: 'réactionnelle',
    subRows: [
      '20FR 002 Charge N Réforming',
      '20FR 035 Débit Gaz recv',
      '20TC 002 Transfert F241',
      '20PDI 106 Δ T D204',
      '20TC 001 Transfert F201',
      '20TDI 107 Δ T D205',
      '20TC 092 Transfert F202',
      '20TDI 108  Δ T D206',
      '20LI 003 Niv D241',
      'Densité Shilling',
      '%H2',
      'Taux H2/HC',
      'NO Réformat',
      'débit ccl4',
      '20 TC 105 Transfert F 203',
      'niveau d213',
    ],
  },
];

export const REFORMATEUR_HOURS = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
export type ReformateurHourKey = (typeof REFORMATEUR_HOURS)[number];

export const reformateurHourLabels: Record<ReformateurHourKey, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

/**
 * Données initiales vides pour une date (6 lignes, une par créneau).
 */
export function createInitialReformateurData(): HourRow[] {
  const hourRows: HourRow[] = [];
  for (const hour of REFORMATEUR_HOURS) {
    const values: Record<string, string> = {};
    for (const cat of REFORMATEUR_CATEGORIES) {
      for (const subRow of cat.subRows) {
        values[`${cat.category}_${subRow}`] = '';
      }
    }
    hourRows.push({ hour, values });
  }
  return hourRows;
}
