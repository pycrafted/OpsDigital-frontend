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
export const COMPRESSEUR_K244_CATEGORY_OPTIONS = ['huile', 'eau', 'hydrogene', 'azote', 'air', 'moteur k244'] as const;

const REFORMATEUR_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'prétraitement', label: '20FI 011 Charge HDT', key: 'prétraitement_20FI 011 Charge HDT' },
  { category: 'prétraitement', label: '20FR 003 H --> D203', key: 'prétraitement_20FR 003 H --> D203' },
  { category: 'prétraitement', label: '20TI 004 Chauffe D203', key: 'prétraitement_20TI 004 Chauffe D203' },
  { category: 'prétraitement', label: 'Taux couverture D203', key: 'prétraitement_Taux couverture D203' },
  { category: 'prétraitement', label: '20FR 009 Strip c201', key: 'prétraitement_20FR 009 Strip c201' },
  { category: 'prétraitement', label: '20PDI 044 Δ P D203', key: 'prétraitement_20PDI 044 Δ P D203' },
  { category: 'prétraitement', label: 'Niveau D214 20LI 007', key: 'prétraitement_Niveau D214 20LI 007' },
  { category: 'réactionnelle', label: '20FR 002 Charge N Réforming', key: 'réactionnelle_20FR 002 Charge N Réforming' },
  { category: 'réactionnelle', label: '20FR 035 Débit Gaz recv', key: 'réactionnelle_20FR 035 Débit Gaz recv' },
  { category: 'réactionnelle', label: '20TC 002 Transfert F241', key: 'réactionnelle_20TC 002 Transfert F241' },
  { category: 'réactionnelle', label: '20PDI 106 Δ T D204', key: 'réactionnelle_20PDI 106 Δ T D204' },
  { category: 'réactionnelle', label: '20TC 001 Transfert F201', key: 'réactionnelle_20TC 001 Transfert F201' },
  { category: 'réactionnelle', label: '20TDI 107 Δ T D205', key: 'réactionnelle_20TDI 107 Δ T D205' },
  { category: 'réactionnelle', label: '20TC 092 Transfert F202', key: 'réactionnelle_20TC 092 Transfert F202' },
  { category: 'réactionnelle', label: '20TDI 108  Δ T D206', key: 'réactionnelle_20TDI 108  Δ T D206' },
  { category: 'réactionnelle', label: '20LI 003 Niv D241', key: 'réactionnelle_20LI 003 Niv D241' },
  { category: 'réactionnelle', label: 'Densité Shilling', key: 'réactionnelle_Densité Shilling' },
  { category: 'réactionnelle', label: '%H2', key: 'réactionnelle_%H2' },
  { category: 'réactionnelle', label: 'Taux H2/HC', key: 'réactionnelle_Taux H2/HC' },
  { category: 'réactionnelle', label: 'NO Réformat', key: 'réactionnelle_NO Réformat' },
  { category: 'réactionnelle', label: 'débit ccl4', key: 'réactionnelle_débit ccl4' },
  { category: 'réactionnelle', label: '20 TC 105 Transfert F 203', key: 'réactionnelle_20 TC 105 Transfert F 203' },
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
  { category: 'hydrogene', label: 'pi 101 press asp gaz', key: 'hydrogene_pi 101 press asp gaz' },
  { category: 'hydrogene', label: 'pi 102 press asp gaz', key: 'hydrogene_pi 102 press asp gaz' },
  { category: 'hydrogene', label: 't° 102 ref ligne nord', key: 'hydrogene_t° 102 ref ligne nord' },
  { category: 'hydrogene', label: 't° 103 ref ligne sud', key: 'hydrogene_t° 103 ref ligne sud' },
  { category: 'hydrogene', label: 't° 101 t° aspirat°', key: 'hydrogene_t° 101 t° aspirat°' },
  { category: 'hydrogene', label: 't° 104 temp palier carter', key: 'hydrogene_t° 104 temp palier carter' },
  { category: 'hydrogene', label: 'temp palier volant ti 105', key: 'hydrogene_temp palier volant ti 105' },
  { category: 'hydrogene', label: '%charge compress', key: 'hydrogene_%charge compress' },
  { category: 'azote', label: 'pr n2 av détendeur', key: 'azote_pr n2 av détendeur' },
  { category: 'azote', label: 'pr n2 ap détendeur', key: 'azote_pr n2 ap détendeur' },
  { category: 'azote', label: 'débit n2 rotametre', key: 'azote_débit n2 rotametre' },
  { category: 'azote', label: 'pression cadre n2', key: 'azote_pression cadre n2' },
  { category: 'air', label: 'pr air demarrage', key: 'air_pr air demarrage' },
  { category: 'air', label: 'pr --> clapets', key: 'air_pr --> clapets' },
  { category: 'moteur k244', label: 'vitesse', key: 'moteur k244_vitesse' },
  { category: 'moteur k244', label: 'pr-h-m', key: 'moteur k244_pr-h-m' },
  { category: 'moteur k244', label: 't°-h-m', key: 'moteur k244_t°-h-m' },
  { category: 'moteur k244', label: 't° eau Mot', key: 'moteur k244_t° eau Mot' },
  { category: 'moteur k244', label: 'Pr Air turb gauche', key: 'moteur k244_Pr Air turb gauche' },
  { category: 'moteur k244', label: 'Pr Air turb droite', key: 'moteur k244_Pr Air turb droite' },
  { category: 'moteur k244', label: 't° fumées vent turb echap apres turbo', key: 'moteur k244_t° fumées vent turb echap apres turbo' },
  { category: 'moteur k244', label: 't° echap gauche', key: 'moteur k244_t° echap gauche' },
  { category: 'moteur k244', label: 't° echap droite', key: 'moteur k244_t° echap droite' },
];

const COMPRESSEUR_K245_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'huile', label: 't.h 27 tt 146', key: 'huile_t.h 27 tt 146' },
  { category: 'huile', label: 'p.h 27 pt 136 a/b', key: 'huile_p.h 27 pt 136 a/b' },
  { category: 'huile', label: 'p.filtre 27 pdt 147', key: 'huile_p.filtre 27 pdt 147' },
  { category: 'eau', label: 'eau 24 ti 155', key: 'eau_eau 24 ti 155' },
  { category: 'eau', label: 'eau 27 pi 157', key: 'eau_eau 27 pi 157' },
  { category: 'hydrogene', label: 'p.asp 27 pt 100 a/b', key: 'hydrogene_p.asp 27 pt 100 a/b' },
  { category: 'hydrogene', label: 'p.ref 27 pt 101 a/b', key: 'hydrogene_p.ref 27 pt 101 a/b' },
  { category: 'hydrogene', label: 't° de ch b 27 ti 104 a/b', key: 'hydrogene_t° de ch b 27 ti 104 a/b' },
  { category: 'hydrogene', label: 't° de ch b 27 ti 105 a/b', key: 'hydrogene_t° de ch b 27 ti 105 a/b' },
  { category: 'hydrogene', label: '% charge comp', key: 'hydrogene_% charge comp' },
  { category: 'azote', label: 'n° cadre', key: 'azote_n° cadre' },
  { category: 'azote', label: 'p.n 27 pi 122', key: 'azote_p.n 27 pi 122' },
  { category: 'azote', label: 'p cadre', key: 'azote_p cadre' },
  { category: 'air', label: 'air ins 27 pi 180', key: 'air_air ins 27 pi 180' },
  { category: 'air', label: 'palier comp 27 ti 117', key: 'air_palier comp 27 ti 117' },
  { category: 'air', label: 'palier comp 27 ti 118', key: 'air_palier comp 27 ti 118' },
  { category: 'air', label: 't.palier cne 27 ti 116', key: 'air_t.palier cne 27 ti 116' },
  { category: 'air', label: 't.palier ce 27 ti 112', key: 'air_t.palier ce 27 ti 112' },
  { category: 'consommation', label: 'consom go d202', key: 'consommation_consom go d202' },
  { category: 'consommation', label: 'consom go d314b', key: 'consommation_consom go d314b' },
  { category: 'consommation', label: 'consom fo d349', key: 'consommation_consom fo d349' },
  { category: 'consommation', label: 'consom fo d362', key: 'consommation_consom fo d362' },
  { category: 'consommation', label: 'consom eb th', key: 'consommation_consom eb th' },
  { category: 'cotes', label: 'cote d 202', key: 'cotes_cote d 202' },
  { category: 'cotes', label: 'cote d350', key: 'cotes_cote d350' },
];

const ATM_MEROX_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'Charge brut', label: 'Pres° Entrée UNITE', key: 'Charge brut_Pres° Entrée UNITE' },
  { category: 'Charge brut', label: '17 FT 001 Débit charge', key: 'Charge brut_17 FT 001 Débit charge' },
  { category: 'I° Train Brut', label: '10 PC 022 Préssion D120', key: 'I° Train Brut_10 PC 022 Préssion D120' },
  { category: 'I° Train Brut', label: '10 TI 062 T° Entrée D120', key: 'I° Train Brut_10 TI 062 T° Entrée D120' },
  { category: 'D120', label: '10 KDI 029 Niv Eau D120', key: 'D120_10 KDI 029 Niv Eau D120' },
  { category: 'FOUR F171', label: '17 TC 025 Transfert F 171', key: 'FOUR F171_17 TC 025 Transfert F 171' },
  { category: 'FOUR F171', label: '17 TT 631 T° FUMEE F 171', key: 'FOUR F171_17 TT 631 T° FUMEE F 171' },
  { category: 'FOUR F141', label: '10 TI 055 T° Fumée HAUTRAD F 141', key: 'FOUR F141_10 TI 055 T° Fumée HAUTRAD F 141' },
  { category: 'FOUR F141', label: '10 TI 040 T° Transf F 141', key: 'FOUR F141_10 TI 040 T° Transf F 141' },
  { category: 'FOUR F 101', label: '10 TI 086 T° Entrée Brut F 101', key: 'FOUR F 101_10 TI 086 T° Entrée Brut F 101' },
  { category: 'FOUR F 101', label: '10 TI 001 T° Transf F101', key: 'FOUR F 101_10 TI 001 T° Transf F101' },
  { category: 'FOUR F 101', label: '10 FI 002 Fumée Rad F101', key: 'FOUR F 101_10 FI 002 Fumée Rad F101' },
  { category: 'FOUR F 101', label: '10 FI 027 A passe A', key: 'FOUR F 101_10 FI 027 A passe A' },
  { category: 'FOUR F 101', label: '10 FI 027 B passe B', key: 'FOUR F 101_10 FI 027 B passe B' },
  { category: 'FOUR F 101', label: '10 FI 027 C passe C', key: 'FOUR F 101_10 FI 027 C passe C' },
  { category: 'FOUR F 101', label: '10 FI 027 D passe D', key: 'FOUR F 101_10 FI 027 D passe D' },
  { category: 'C101', label: '10 PI 001 press Tete C101', key: 'C101_10 PI 001 press Tete C101' },
  { category: 'C101', label: '10 FI 002 Temp Tete C101', key: 'C101_10 FI 002 Temp Tete C101' },
  { category: 'C101', label: 'Amime Neut --> C101', key: 'C101_Amime Neut --> C101' },
  { category: 'C101', label: 'Amime Film --> C101', key: 'C101_Amime Film --> C101' },
  { category: 'C101', label: 'PH EAU D 102', key: 'C101_PH EAU D 102' },
  { category: 'C105', label: '10 PI 002 Press C105', key: 'C105_10 PI 002 Press C105' },
  { category: 'C105', label: 'Amime Film --> C105', key: 'C105_Amime Film --> C105' },
  { category: 'C 106', label: '10 PI 053 Press C106', key: 'C 106_10 PI 053 Press C106' },
  { category: 'C114', label: 'PH EAU D 141', key: 'C114_PH EAU D 141' },
  { category: 'C141', label: '10 PI 008 Vide Z Flash', key: 'C141_10 PI 008 Vide Z Flash' },
  { category: 'C141', label: 'Amime Neut --> C141', key: 'C141_Amime Neut --> C141' },
  { category: 'C141', label: 'Amime Film --> C141', key: 'C141_Amime Film --> C141' },
  { category: 'C171', label: 'Amime Film --> C171', key: 'C171_Amime Film --> C171' },
  { category: 'C171', label: 'Amime Neut --> C171', key: 'C171_Amime Neut --> C171' },
  { category: 'C171', label: '17 PC 022 Press Tete C171', key: 'C171_17 PC 022 Press Tete C171' },
  { category: 'C171', label: '17 TC 017 Temp Tete C171', key: 'C171_17 TC 017 Temp Tete C171' },
  { category: 'C171', label: 'PH EAU D 171', key: 'C171_PH EAU D 171' },
  { category: 'MEROX', label: '80 PI 006 Press Sortie MEROX', key: 'MEROX_80 PI 006 Press Sortie MEROX' },
  { category: 'MEROX', label: '% Pompe Sode 3°B', key: 'MEROX_% Pompe Sode 3°B' },
  { category: 'MEROX', label: '80 FI 002 DEBIT CHRGE MEROX', key: 'MEROX_80 FI 002 DEBIT CHRGE MEROX' },
  { category: 'DOPE', label: 'Injection Dope GO', key: 'DOPE_Injection Dope GO' },
  { category: 'DOPE', label: 'Injection Dope FO', key: 'DOPE_Injection Dope FO' },
  { category: 'Divers', label: 'DEBIT H20 G122', key: '__empty___DEBIT H20 G122' },
];

const PRODUCTION_ELECTRICITE_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'FO D349', label: '30LJ002', key: 'FO D349_30LJ002' },
  { category: 'FO D349', label: '30TC002', key: 'FO D349_30TC002' },
  { category: 'D362', label: '37 LI 018 NIVEAU  D362', key: 'D362_37 LI 018 NIVEAU  D362' },
  { category: 'H 341', label: '30F1012', key: 'H 341_30F1012' },
  { category: 'H 341', label: '30A1002 O2 Fumées Chem', key: 'H 341_30A1002 O2 Fumées Chem' },
  { category: 'Autres producteurs', label: '20FI1052 Débit Vap D242', key: 'Autres producteurs_20FI1052 Débit Vap D242' },
  { category: 'Autres producteurs', label: '10FI1052 Débit Vap E143', key: 'Autres producteurs_10FI1052 Débit Vap E143' },
  { category: 'valeur', label: '30PI027 Press Reseau 10B', key: 'valeur_30PI027 Press Reseau 10B' },
  { category: 'valeur', label: '30PI050 Press Reseau 6B', key: 'valeur_30PI050 Press Reseau 6B' },
  { category: 'valeur', label: '10TI193 T°Vap Sortie Surch F101', key: 'valeur_10TI193 T°Vap Sortie Surch F101' },
  { category: 'H302', label: '30FI005 Débit vap H 302', key: 'H302_30FI005 Débit vap H 302' },
  { category: 'H302', label: '30QI004 O2 Fumées Chen', key: 'H302_30QI004 O2 Fumées Chen' },
  { category: 'eau traitée', label: 'Débit Permo A', key: 'eau traitée_Débit Permo A' },
  { category: 'eau traitée', label: 'Débit Permo B', key: 'eau traitée_Débit Permo B' },
  { category: 'eau traitée', label: 'Niveau T341', key: 'eau traitée_Niveau T341' },
  { category: 'AIR/EAU REF', label: 'Press AIR instrum 30 PI 040', key: 'AIR/EAU REF_Press AIR instrum 30 PI 040' },
  { category: 'AIR/EAU REF', label: 'Lancement 30PI 068', key: 'AIR/EAU REF_Lancement 30PI 068' },
  { category: 'AIR/EAU REF', label: 'Débit eau refroidissement 30 FI 036', key: 'AIR/EAU REF_Débit eau refroidissement 30 FI 036' },
  { category: 'AIR/EAU REF', label: 'T° eau circulation retour 30 TI 014', key: 'AIR/EAU REF_T° eau circulation retour 30 TI 014' },
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

const MOUVEMENT_BACS_SAISIE_FIELDS: ChampSaisie[] = [
  { category: 'Produits', label: 'naphta sesulf', key: 'naphta sesulf' },
  { category: 'Produits', label: 'kero S merox', key: 'kero S merox' },
  { category: 'Produits', label: 'brut injection', key: 'brut injection' },
  { category: 'Produits', label: 'brut', key: 'brut' },
  { category: 'Produits', label: 'butane', key: 'butane' },
  { category: 'Produits', label: 'essence', key: 'essence' },
  { category: 'Produits', label: 'naphta', key: 'naphta' },
  { category: 'Produits', label: 'reform AT', key: 'reform AT' },
  { category: 'Produits', label: 'kéro', key: 'kéro' },
  { category: 'Produits', label: 'naphta charge', key: 'naphta charge' },
  { category: 'Produits', label: 'go', key: 'go' },
  { category: 'Produits', label: 'go lourd', key: 'go lourd' },
  { category: 'Produits', label: 'résidu', key: 'résidu' },
  { category: 'Produits', label: 'slop', key: 'slop' },
  { category: 'Produits', label: 'go de tete', key: 'go de tete' },
];

const ANALYSES_LABO_MEASURES = [
  'densité à 15°', 'tv', 'viscosité', 'flash', 'pi', '5%', '10%', '20%', '50%',
  '90%', '95%', 'pf', '%dist', 'résidu', 'congel', 'p° trouble', 'couleur', 'cétane',
];

const ANALYSES_LABO_PRODUCTS: Array<{ key: string; label: string }> = [
  { key: 'essenceLeger', label: 'essence leger' },
  { key: 'essenceTotale', label: 'essence totale' },
  { key: 'naphta', label: 'naphta' },
  { key: 'kerosene', label: 'kérosene' },
  { key: 'goAtm', label: 'go atm' },
  { key: 'goSv', label: 'go s/v' },
  { key: 'goTotal', label: 'go total' },
  { key: 'goDeTete', label: 'go de tete' },
  { key: 'goLourd', label: 'go lourd' },
  { key: 'residuSv', label: 'residu s/v' },
  { key: 'residuAtm', label: 'residu atm' },
  { key: 'reformat', label: 'reformat' },
  { key: 'g201', label: 'g201' },
  { key: 'g202', label: 'g202' },
];

/**
 * key format: "{measure}||{productKey}"
 * category = productLabel (pour l'onglet produit)
 * label = mesure
 */
const ANALYSES_LABO_SAISIE_FIELDS: ChampSaisie[] = ANALYSES_LABO_PRODUCTS.flatMap(
  ({ key: productKey, label: productLabel }) =>
    ANALYSES_LABO_MEASURES.map((measure) => ({
      category: productLabel,
      label: measure,
      key: `${measure}||${productKey}`,
    })),
);

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
  {
    id: 'mouvement-des-bacs',
    title: 'Mouvement des bacs',
    route: '/tableaux?tableau=MouvementDesBacs',
    hours: ['8h', '12h', '16h', '20h', '00h', '04h'],
    fields: MOUVEMENT_BACS_SAISIE_FIELDS,
  },
  {
    id: 'analyses-laboratoire',
    title: 'Analyses laboratoire',
    route: '/tableaux?tableau=AnalysesLaboratoire',
    hours: ['h7', 'h15', 'h23'],
    fields: ANALYSES_LABO_SAISIE_FIELDS,
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
