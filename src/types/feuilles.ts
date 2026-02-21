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

const ANALYSES_PROPERTIES = [
  'densité à 15°', 'tv', 'viscosité', 'flash', 'pi', '5%', '10%', '20%', '50%',
  '90%', '95%', 'pf', '%dist', 'résidu', 'congel', 'p° trouble',
];
const ANALYSES_PRODUCTS = [
  'essenceLeger', 'essenceTotale', 'naphta', 'kerosene', 'goAtm', 'goSv', 'goTotal',
  'goDeTete', 'goLourd', 'residuSv', 'residuAtm', 'reformat', 'g201', 'g202',
];

const analysesFields: ChampSaisie[] = [];
ANALYSES_PROPERTIES.forEach((prop) => {
  ANALYSES_PRODUCTS.forEach((product) => {
    analysesFields.push({
      category: prop,
      label: product,
      key: `${prop}_${product}`,
    });
  });
});

const buildCategoryFields = (categories: { category: string; subRows: string[] }[]): ChampSaisie[] =>
  categories.flatMap((cat) =>
    cat.subRows.map((sub) => ({
      category: cat.category || 'Divers',
      label: sub || '(sans nom)',
      key: `${cat.category || '__empty__'}_${sub}`,
    }))
  );

const REFORMATEUR_CATEGORIES = [
  { category: 'prétraitement', subRows: ['20FI 011 Charge HDT', '20FR 003 H --> D203', '20TI 004 Chauffe D203', 'Taux couverture D203', '20FR 009 Strip c201', '20PDI 044 Δ P D203', 'Niveau D214 20LI 007'] },
  { category: 'réactionnelle', subRows: ['20FR 002 Charge N Réforming', '20FR 035 Débit Gaz recv', '20TC 002 Transfert F241', '20PDI 106 Δ T D204', '20TC 001 Transfert F201', '20TDI 107 Δ T D205', '20TC 092 Transfert F202', '20TDI 108  Δ T D206', '20LI 003 Niv D241', 'Densité Shilling', '%H2', 'Taux H2/HC', 'NO Réformat', 'débit ccl4', '20 TC 105 Transfert F 203', 'niveau d213'] },
];

/** Champs saisis manuellement pour Réformateur catalytique ; le reste provient d'autres sources (ex. ip23). */
const REFORMATEUR_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'réactionnelle', label: 'Densité Shilling', key: 'réactionnelle_Densité Shilling' },
  { category: 'réactionnelle', label: 'débit ccl4', key: 'réactionnelle_débit ccl4' },
  { category: 'réactionnelle', label: 'niveau d213', key: 'réactionnelle_niveau d213' },
];

/** Ordre des catégories pour le formulaire Compresseur K 244 (choix alignés). */
export const COMPRESSEUR_K244_CATEGORY_OPTIONS = ['huile', 'eau', 'hydrogene', 'azote', 'moteur k244'] as const;

const COMPRESSEUR_K244_CATEGORIES = [
  { category: 'huile', subRows: ['pression hrefp', 'pi 104 h ph graissage', 'press diff filtres pdi 101', 't°h ref pompe'] },
  { category: 'eau', subRows: ['t° sortie certp', 't°eau refrig sud', 't°eau refrig nord'] },
  { category: 'hydrogene', subRows: ['pi 101 press asp gaz', 'pi 102 press asp gaz', 't° 102 ref ligne nord', 't° 103 ref ligne sud', 't° 101 t° aspirat°', 't° 104 temp palier carter', 'temp palier volant ti 105', '%charge compress'] },
  { category: 'azote', subRows: ['pr n2 av détendeur', 'pr n2 ap détendeur', 'débit n2 rotametre', 'pression cadre n2'] },
  { category: 'air', subRows: ['pr air demarrage', 'pr --> clapets'] },
  { category: 'moteur k244', subRows: ['vitesse', 'pr-h-m', 't°-h-m', 't° eau Mot', 'Pr Air turb gauche', 'Pr Air turb droite', 't° fumées vent turb echap apres turbo', 't° echap gauche', 't° echap droite'] },
];

/** Champs saisis manuellement pour Compresseur K 244 ; le reste provient d'autres sources. */
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

const COMPRESSEUR_K245_CATEGORIES = [
  { category: 'huile', subRows: ['pression hrefp', 'pi 104 h ph graissage', 'press diff filtres pdi 101', 't°h ref pompe'] },
  { category: 'eau', subRows: ['t° sortie certp', 't°eau refrig sud', 't°eau refrig nord'] },
  { category: 'hydrogene', subRows: ['pi 101 press asp gaz', 'pi 102 press asp gaz', 't° 102 ref ligne nord', 't° 103 ref ligne sud', 't° 101 t° aspirat°', 't° 104 temp palier carter', 'temp palier volant ti 105', '%charge compress'] },
  { category: 'azote', subRows: ['pr n2 av détendeur', 'pr n2 ap détendeur', 'débit n2 rotametre', 'pression cadre n2'] },
  { category: 'air', subRows: ['pr air demarrage', 'pr --> clapets'] },
  { category: 'moteur k245', subRows: ['vitesse', 'pr-h-m', 't°-h-m', 't° eau Mot', 'Pr Air turb gauche', 'Pr Air turb droite', 't° fumées vent turb echap apres turbo', 't° echap gauche', 't° echap droite'] },
];

/** Champs saisis manuellement pour Compresseur K 245 ; le reste provient d'autres sources. */
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

const ATM_MEROX_CATEGORIES = [
  { category: 'Charge brut', subRows: ['Pres° Entrée UNITE', '17 FT 001 Débit charge'] },
  { category: "I° Train Brut", subRows: ['10 PC 022 Préssion D120', '10 TI 062 T° Entrée D120'] },
  { category: 'D120', subRows: ['10 KDI 029 Niv Eau D120'] },
  { category: 'FOUR F171', subRows: ['17 TC 025 Transfert F 171', '17 TT 631 T° FUMEE F 171'] },
  { category: 'FOUR F141', subRows: ['10 TI 055 T° Fumée HAUTRAD F 141', '10 TI 040 T° Transf F 141'] },
  { category: 'FOUR F 101', subRows: ['10 TI 086 T° Entrée Brut F 101', '10 TI 001 T° Transf F101', '10 FI 002 Fumée Rad F101', '10 FI 027 A passe A', '10 FI 027 B passe B', '10 FI 027 C passe C', '10 FI 027 D passe D'] },
  { category: 'C101', subRows: ['10 PI 001 press Tete C101', '10 FI 002 Temp Tete C101', 'Amime Neut --> C101', 'Amime Film --> C101', 'PH EAU D 102'] },
  { category: 'C105', subRows: ['10 PI 002 Press C105', 'Amime Film --> C105'] },
  { category: 'C 106', subRows: ['10 PI 053 Press C106'] },
  { category: 'C114', subRows: ['PH EAU D 141'] },
  { category: 'C141', subRows: ['10 PI 008 Vide Z Flash', 'Amime Neut --> C141', 'Amime Film --> C141'] },
  { category: 'C171', subRows: ['Amime Film --> C171', 'Amime Neut --> C171', '17 PC 022 Press Tete C171', '17 TC 017 Temp Tete C171', 'PH EAU D 171'] },
  { category: 'MEROX', subRows: ['80 PI 006 Press Sortie MEROX', '% Pompe Sode 3°B', '80 FI 002 DEBIT CHRGE MEROX'] },
  { category: 'DOPE', subRows: ['Injection Dope GO', 'Injection Dope FO'] },
  { category: '', subRows: ['DEBIT H20 G122'] },
];

/** Champs saisis manuellement pour ATM/MEROX & Pre-Flash ; le reste est fourni par ip23 via API */
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

const PRODUCTION_ELECTRICITE_CATEGORIES = [
  { category: 'FO D349', subRows: ['30LJ002', '30TC002'] },
  { category: 'D362', subRows: ['37 LI 018 NIVEAU  D362'] },
  { category: 'H 341', subRows: ['30F1012', '30A1002 O2 Fumées Chem'] },
  { category: 'Autres producteurs', subRows: ['20FI1052 Débit Vap D242', '10FI1052 Débit Vap E143'] },
  { category: 'H302', subRows: ['30FI005 Débit vap H 302', '30QI004 O2 Fumées Chen'] },
  { category: 'eau traitée', subRows: ['Débit Permo A', 'Débit Permo B', 'Niveau T341'] },
  { category: 'AIR/EAU REF', subRows: ['Press AIR instrum 30 PI 040', 'Lancement 30PI 068', 'Débit eau refroidissement 30 FI 036', 'T° eau circulation retour 30 TI 014'] },
  { category: 'production electrique', subRows: ['', 'Charge', 'Intensité', 'Fréquence', 'S1', 'S2', 'S3', 'S4', 'S5', 'J351', 'J352', 'J355'] },
];

/** Champs saisis manuellement pour Production / Valeur / Électricité ; le reste provient d'autres sources. */
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

/** Champs saisis manuellement pour Gaz (tableau Gaz). */
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
