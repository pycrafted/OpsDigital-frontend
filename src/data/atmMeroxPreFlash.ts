/** Données partagées pour ATM/MEROX & PRE-FLASH (tableau + graphique). */

export interface CategoryData {
  category: string;
  subRows: string[];
}

export interface HourRow {
  hour: string;
  values: Record<string, string>;
}

export const ATM_MEROX_CATEGORIES: CategoryData[] = [
  { category: 'Charge brut', subRows: ['Pres° Entrée UNITE', '17 FT 001 Débit charge'] },
  { category: "I° Train Brut", subRows: ['10 PC 022 Préssion D120', '10 TI 062 T° Entrée D120'] },
  { category: 'D120', subRows: ['10 KDI 029 Niv Eau D120'] },
  { category: 'FOUR F171', subRows: ['17 TC 025 Transfert F 171', '17 TT 631 T° FUMEE F 171'] },
  { category: 'FOUR F141', subRows: ['10 TI 055 T° Fumée HAUTRAD F 141', '10 TI 040 T° Transf F 141'] },
  {
    category: 'FOUR F 101',
    subRows: [
      '10 TI 086 T° Entrée Brut F 101',
      '10 TI 001 T° Transf F101',
      '10 FI 002 Fumée Rad F101',
      '10 FI 027 A passe A',
      '10 FI 027 B passe B',
      '10 FI 027 C passe C',
      '10 FI 027 D passe D',
    ],
  },
  {
    category: 'C101',
    subRows: [
      '10 PI 001 press Tete C101',
      '10 FI 002 Temp Tete C101',
      'Amime Neut --> C101',
      'Amime Film --> C101',
      'PH EAU D 102',
    ],
  },
  { category: 'C105', subRows: ['10 PI 002 Press C105', 'Amime Film --> C105'] },
  { category: 'C 106', subRows: ['10 PI 053 Press C106'] },
  { category: 'C114', subRows: ['PH EAU D 141'] },
  {
    category: 'C141',
    subRows: [
      '10 PI 008 Vide Z Flash',
      'Amime Neut --> C141',
      'Amime Film --> C141',
    ],
  },
  {
    category: 'C171',
    subRows: [
      'Amime Film --> C171',
      'Amime Neut --> C171',
      '17 PC 022 Press Tete C171',
      '17 TC 017 Temp Tete C171',
      'PH EAU D 171',
    ],
  },
  {
    category: 'MEROX',
    subRows: [
      '80 PI 006 Press Sortie MEROX',
      '% Pompe Sode 3°B',
      '80 FI 002 DEBIT CHRGE MEROX',
    ],
  },
  { category: 'DOPE', subRows: ['Injection Dope GO', 'Injection Dope FO'] },
  { category: '', subRows: ['DEBIT H20 G122'] },
];

export const ATM_MEROX_HOURS = ['7h', '11h', '15h', '19h', '23h', '3h'] as const;
export type AtmMeroxHourKey = (typeof ATM_MEROX_HOURS)[number];

export const atmMeroxHourLabels: Record<AtmMeroxHourKey, string> = {
  '7h': '7h',
  '11h': '11h',
  '15h': '15h',
  '19h': '19h',
  '23h': '23h',
  '3h': '3h',
};

export function getValueKey(category: string, subRow: string): string {
  return `${category || '__empty__'}_${subRow}`;
}

/** Liste des indicateurs pour le graphique : { key (category_subRow), label } */
export function getAtmMeroxIndicateurOptions(): { key: string; label: string }[] {
  const list: { key: string; label: string }[] = [];
  ATM_MEROX_CATEGORIES.forEach((cat) => {
    cat.subRows.forEach((subRow) => {
      list.push({ key: getValueKey(cat.category, subRow), label: subRow });
    });
  });
  return list;
}

export function createInitialAtmMeroxData(): HourRow[] {
  const hourRows: HourRow[] = [];
  ATM_MEROX_HOURS.forEach((hour) => {
    const values: Record<string, string> = {};
    ATM_MEROX_CATEGORIES.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        values[getValueKey(cat.category, subRow)] = '';
      });
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}
