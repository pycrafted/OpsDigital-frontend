/** Données partagées pour Mouvement des bacs (tableau + graphique). */

export const MOUVEMENT_BACS_PRODUCTS = [
  'naphta sesulf',
  'kero S merox',
  'brut injection',
  'brut',
  'butane',
  'essence',
  'naphta',
  'reform AT',
  'kéro',
  'naphta charge',
  'go',
  'go lourd',
  'résidu',
  'slop',
  'go de tete',
] as const;

export const MOUVEMENT_BACS_HOURS = ['04h', '8h', '12h', '16h', '20h', '00h'] as const;
export type MouvementBacsHourKey = (typeof MOUVEMENT_BACS_HOURS)[number];

export interface HourRow {
  hour: MouvementBacsHourKey;
  values: Record<string, string>; // key: product name
}

/** Réponse API : chaque ligne peut inclure les bacs sélectionnés par produit */
export interface HourRowWithBacs extends HourRow {
  bacs?: Record<string, string>;
}

/** Liste des indicateurs (un par produit) : { key, label } */
export function getMouvementBacsIndicateurOptions(): { key: string; label: string }[] {
  return MOUVEMENT_BACS_PRODUCTS.map((p) => ({ key: p, label: p }));
}

export function createInitialMouvementBacsData(): HourRow[] {
  const hourRows: HourRow[] = [];
  MOUVEMENT_BACS_HOURS.forEach((hour) => {
    const values: Record<string, string> = {};
    MOUVEMENT_BACS_PRODUCTS.forEach((prod) => {
      values[prod] = '';
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}

