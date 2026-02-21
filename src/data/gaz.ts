/** Données partagées pour Gaz (tableau + graphique). */

export const GAZ_COLUMNS = [
  { key: 'c105', title: 'C 105', subtitle: 'LPG C 105' },
  { key: 'c261', title: 'C 261', subtitle: 'LPG C 261' },
  { key: 'c106', title: 'C 106', subtitle: 'C4 C 106' },
] as const;

export type GazColumnKey = (typeof GAZ_COLUMNS)[number]['key'];

export const GAZ_HOURS = ['7h', '11h', '15h', '19h', '23h', '03h'] as const;
export type GazHourKey = (typeof GAZ_HOURS)[number];

export interface HourRow {
  hour: GazHourKey;
  values: Record<GazColumnKey, string>;
}

/** Liste des indicateurs pour le graphique : { key, label } (sous-titre comme label) */
export function getGazIndicateurOptions(): { key: string; label: string }[] {
  return GAZ_COLUMNS.map((col) => ({ key: col.key, label: col.subtitle }));
}

export function createInitialGazData(): HourRow[] {
  const hourRows: HourRow[] = [];
  GAZ_HOURS.forEach((hour) => {
    const values = {} as Record<GazColumnKey, string>;
    GAZ_COLUMNS.forEach((col) => {
      values[col.key] = '';
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
}
