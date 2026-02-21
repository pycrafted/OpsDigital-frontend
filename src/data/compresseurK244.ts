/** Données partagées pour Compresseur K 244 (tableau + graphique). */

export interface CategoryData {
  category: string;
  subRows: string[];
}

export interface HourRow {
  hour: string;
  values: Record<string, string>;
}

export const COMPRESSEUR_K244_CATEGORIES: CategoryData[] = [
  {
    category: 'huile',
    subRows: ['pression hrefp', 'pi 104 h ph graissage', 'press diff filtres pdi 101', 't°h ref pompe'],
  },
  {
    category: 'eau',
    subRows: ['t° sortie certp', 't°eau refrig sud', 't°eau refrig nord'],
  },
  {
    category: 'hydrogene',
    subRows: ['pi 101 press asp gaz', 'pi 102 press asp gaz', 't° 102 ref ligne nord', 't° 103 ref ligne sud', 't° 101 t° aspirat°', 't° 104 temp palier carter', 'temp palier volant ti 105', '%charge compress'],
  },
  {
    category: 'azote',
    subRows: ['pr n2 av détendeur', 'pr n2 ap détendeur', 'débit n2 rotametre', 'pression cadre n2'],
  },
  {
    category: 'air',
    subRows: ['pr air demarrage', 'pr --> clapets'],
  },
  {
    category: 'moteur k244',
    subRows: ['vitesse', 'pr-h-m', 't°-h-m', 't° eau Mot', 'Pr Air turb gauche', 'Pr Air turb droite', 't° fumées vent turb echap apres turbo', 't° echap gauche', 't° echap droite'],
  },
];

export const COMPRESSEUR_K244_HOURS = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
export type CompresseurK244HourKey = (typeof COMPRESSEUR_K244_HOURS)[number];

export const compresseurK244HourLabels: Record<CompresseurK244HourKey, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

/** Liste des indicateurs pour le graphique : { key (category_subRow), label } */
export function getCompresseurK244IndicateurOptions(): { key: string; label: string }[] {
  const list: { key: string; label: string }[] = [];
  COMPRESSEUR_K244_CATEGORIES.forEach((cat) => {
    cat.subRows.forEach((subRow) => {
      list.push({ key: `${cat.category}_${subRow}`, label: subRow });
    });
  });
  return list;
}

export function createInitialCompresseurK244Data(): HourRow[] {
  const hourRows: HourRow[] = [];
  COMPRESSEUR_K244_HOURS.forEach((hour) => {
    const values: Record<string, string> = {};
    COMPRESSEUR_K244_CATEGORIES.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        values[`${cat.category}_${subRow}`] = '';
      });
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}
