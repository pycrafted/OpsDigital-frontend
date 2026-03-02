/**
 * Configuration des feuilles de relevés pour le formulaire de saisie intelligent.
 * Chaque feuille correspond à un tableau d'une page.
 */
export interface ChampSaisie {
  category: string;
  label: string;
  key: string;
}

export interface FeuilleConfig {
  id: string;
  title: string;
  route: string;
  hours: string[];
  fields: ChampSaisie[];
}

/** Ordre des catégories pour le formulaire Compresseur K 244 (choix alignés). */
export const COMPRESSEUR_K244_CATEGORY_OPTIONS = ['huile', 'eau', 'hydrogene', 'azote', 'moteur k244'] as const;

const REFORMATEUR_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'réactionnelle', label: 'Densité Shilling', key: 'réactionnelle_Densité Shilling' },
  { category: 'réactionnelle', label: 'débit ccl4', key: 'réactionnelle_débit ccl4' },
  { category: 'réactionnelle', label: 'niveau d213', key: 'réactionnelle_niveau d213' },
];

const COMPRESSEUR_K244_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'huile', label: 'pression hrefp', key: 'huile_pression hrefp' },
  { category: 'huile', label: 'pi 104 h ph graissage', key: 'huile_pi 104 h ph graissage' },
  { category: 'huile', label: 'press diff filtres pdi 101', key: 'huile_press diff filtres pdi 101' },
  { category: 'huile', label: 't°h ref pompe', key: 'huile_t°h ref pompe' },
  { category: 'eau', label: 't° sortie certp', key: 'eau_t° sortie certp' },
  { category: 'eau', label: 't°eau refrig sud', key: 'eau_t°eau refrig sud' },
  { category: 'eau', label: 't°eau refrig nord', key: 'eau_t°eau refrig nord' },
  { category: 'hydrogene', label: 't° 101 t° aspirat°', key: 'hydrogene_t° 101 t° aspirat°' },
  { category: 'hydrogene', label: 't° 104 temp palier carter', key: 'hydrogene_t° 104 temp palier carter' },
  { category: 'hydrogene', label: 'temp palier volant ti 105', key: 'hydrogene_temp palier volant ti 105' },
  { category: 'azote', label: 'pr n2 av détendeur', key: 'azote_pr n2 av détendeur' },
  { category: 'azote', label: 'pr n2 ap détendeur', key: 'azote_pr n2 ap détendeur' },
  { category: 'azote', label: 'débit n2 rotametre', key: 'azote_débit n2 rotametre' },
  { category: 'azote', label: 'pression cadre n2', key: 'azote_pression cadre n2' },
  { category: 'moteur k244', label: 't°-h-m', key: 'moteur k244_t°-h-m' },
  { category: 'moteur k244', label: 'Pr Air turb gauche', key: 'moteur k244_Pr Air turb gauche' },
  { category: 'moteur k244', label: 'Pr Air turb droite', key: 'moteur k244_Pr Air turb droite' },
  { category: 'moteur k244', label: 't° fumées vent turb echap apres turbo', key: 'moteur k244_t° fumées vent turb echap apres turbo' },
  { category: 'moteur k244', label: 't° echap gauche', key: 'moteur k244_t° echap gauche' },
  { category: 'moteur k244', label: 't° echap droite', key: 'moteur k244_t° echap droite' },
];

const COMPRESSEUR_K245_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'relevé', label: 'n° cadre', key: 'relevé_n° cadre' },
  { category: 'relevé', label: 'p cadre', key: 'relevé_p cadre' },
  { category: 'relevé', label: 'consom go d202', key: 'relevé_consom go d202' },
  { category: 'relevé', label: 'consom go d314b', key: 'relevé_consom go d314b' },
  { category: 'relevé', label: 'consom fo d349', key: 'relevé_consom fo d349' },
  { category: 'relevé', label: 'consom fo d362', key: 'relevé_consom fo d362' },
  { category: 'relevé', label: 'consom eb th', key: 'relevé_consom eb th' },
  { category: 'relevé', label: 'cote d 202', key: 'relevé_cote d 202' },
];

const ATM_MEROX_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'Charge brut', label: 'Pres° Entrée UNITE', key: 'Charge brut_Pres° Entrée UNITE' },
  { category: 'C101', label: 'Amime Neut --> C101', key: 'C101_Amime Neut --> C101' },
  { category: 'C101', label: 'Amime Film --> C101', key: 'C101_Amime Film --> C101' },
  { category: 'C105', label: 'Amime Film --> C105', key: 'C105_Amime Film --> C105' },
  { category: 'C141', label: 'Amime Neut --> C141', key: 'C141_Amime Neut --> C141' },
  { category: 'C141', label: 'Amime Film --> C141', key: 'C141_Amime Film --> C141' },
  { category: 'C171', label: 'Amime Film --> C171', key: 'C171_Amime Film --> C171' },
  { category: 'C171', label: 'Amime Neut --> C171', key: 'C171_Amime Neut --> C171' },
  { category: 'MEROX', label: '% Pompe Sode 3°B', key: 'MEROX_% Pompe Sode 3°B' },
  { category: 'DOPE', label: 'Injection Dope GO', key: 'DOPE_Injection Dope GO' },
  { category: 'DOPE', label: 'Injection Dope FO', key: 'DOPE_Injection Dope FO' },
];

const PRODUCTION_ELECTRICITE_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'eau traitée', label: 'Débit Permo A', key: 'eau traitée_Débit Permo A' },
  { category: 'eau traitée', label: 'Débit Permo B', key: 'eau traitée_Débit Permo B' },
  { category: 'production electrique', label: 'Charge', key: 'production electrique_Charge' },
  { category: 'production electrique', label: 'Intensité', key: 'production electrique_Intensité' },
  { category: 'production electrique', label: 'Fréquence', key: 'production electrique_Fréquence' },
  { category: 'production electrique', label: 'S1', key: 'production electrique_S1' },
  { category: 'production electrique', label: 'S2', key: 'production electrique_S2' },
  { category: 'production electrique', label: 'S3', key: 'production electrique_S3' },
  { category: 'production electrique', label: 'S4', key: 'production electrique_S4' },
  { category: 'production electrique', label: 'S5', key: 'production electrique_S5' },
  { category: 'production electrique', label: 'J351', key: 'production electrique_J351' },
  { category: 'production electrique', label: 'J352', key: 'production electrique_J352' },
  { category: 'production electrique', label: 'J355', key: 'production electrique_J355' },
];

const GAZ_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'Gaz', label: 'C 105 (LPG C 105)', key: 'gaz_c105' },
  { category: 'Gaz', label: 'C 261 (LPG C 261)', key: 'gaz_c261' },
  { category: 'Gaz', label: 'C 106 (C4 C 106)', key: 'gaz_c106' },
];

export const FEUILLES_CONFIG: FeuilleConfig[] = [
  {
    id: 'reformateur-catalytique',
    title: 'Réformateur catalytique',
    route: '/tableaux',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: REFORMATEUR_SAISIE_FIELDS,
  },
  {
    id: 'compresseur-k244',
    title: 'Compresseur K 244',
    route: '/tableaux',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: COMPRESSEUR_K244_SAISIE_FIELDS,
  },
  {
    id: 'compresseur-k245',
    title: 'Compresseur K 245',
    route: '/tableaux',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: COMPRESSEUR_K245_SAISIE_FIELDS,
  },
  {
    id: 'atm-merox-preflash',
    title: 'Atm/merox & pré flash',
    route: '/tableaux',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: ATM_MEROX_SAISIE_FIELDS,
  },
  {
    id: 'production-valeur-electricite',
    title: 'Production',
    route: '/production-valeur-electricite',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: PRODUCTION_ELECTRICITE_SAISIE_FIELDS,
  },
  {
    id: 'gaz',
    title: 'Gaz',
    route: '/tableaux?tableau=Gaz',
    hours: ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'],
    fields: GAZ_SAISIE_FIELDS,
  },
];

export const getFeuilleById = (id: string): FeuilleConfig | undefined =>
  FEUILLES_CONFIG.find((f) => f.id === id);

export const STORAGE_KEY_PREFIX = 'saisie_releves';

export function getStorageKey(feuilleId: string, date: string, hour: string): string {
  return `${STORAGE_KEY_PREFIX}_${feuilleId}_${date}_${hour}`;
}

export function loadSaisieFromStorage(feuilleId: string, date: string, hour: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(feuilleId, date, hour));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSaisieToStorage(feuilleId: string, date: string, hour: string, values: Record<string, string>): void {
  localStorage.setItem(getStorageKey(feuilleId, date, hour), JSON.stringify(values));
}
