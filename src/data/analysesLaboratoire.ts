/** Données et types partagés pour la page Analyses laboratoire (tableau + graphique). */

export interface ProductHours {
  h7: string;
  h15: string;
  h23: string;
}

export interface AnalyseRow {
  property: string;
  essenceLeger: ProductHours;
  essenceTotale: ProductHours;
  naphta: ProductHours;
  kerosene: ProductHours;
  goAtm: ProductHours;
  goSv: ProductHours;
  goTotal: ProductHours;
  goDeTete: ProductHours;
  goLourd: ProductHours;
  residuSv: ProductHours;
  residuAtm: ProductHours;
  reformat: ProductHours;
  g201: ProductHours;
  g202: ProductHours;
}

const productKeys = [
  'essenceLeger', 'essenceTotale', 'naphta', 'kerosene', 'goAtm', 'goSv',
  'goTotal', 'goDeTete', 'goLourd', 'residuSv', 'residuAtm', 'reformat', 'g201', 'g202',
] as const;

export const products = productKeys;
export type ProductKey = (typeof products)[number];

export const productLabels: Record<ProductKey, string> = {
  essenceLeger: 'essence leger',
  essenceTotale: 'essence totale',
  naphta: 'naphta',
  kerosene: 'kérosene',
  goAtm: 'go atm',
  goSv: 'go s/v',
  goTotal: 'go total',
  goDeTete: 'go de tete',
  goLourd: 'go lourd',
  residuSv: 'residu s/v',
  residuAtm: 'residu atm',
  reformat: 'reformat',
  g201: 'g201',
  g202: 'g202',
};

export const hours = ['h7', 'h15', 'h23'] as const;
export type HourKey = (typeof hours)[number];

export const hourLabels: Record<HourKey, string> = { h7: '7h', h15: '15h', h23: '23h' };

const measureNames = [
  'densité à 15°', 'tv', 'viscosité', 'flash', 'pi', '5%', '10%', '20%', '50%',
  '90%', '95%', 'pf', '%dist', 'résidu', 'congel', 'p° trouble', 'couleur', 'cétane',
];

function createEmptyProductHours(): ProductHours {
  return { h7: '', h15: '', h23: '' };
}

function createEmptyRow(property: string): AnalyseRow {
  const row: Partial<AnalyseRow> = { property };
  products.forEach((p) => { (row as AnalyseRow)[p] = createEmptyProductHours(); });
  return row as AnalyseRow;
}

/** Données initiales pour le tableau / graphique analyses laboratoire. */
export function createInitialAnalysesData(): AnalyseRow[] {
  return measureNames.map((property) => createEmptyRow(property));
}
