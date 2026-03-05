import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnalysesLaboLabels } from '../context/AnalysesLaboLabelsContext';
import {
  useAnalysesLaboBounds,
  getBoundsForProduct,
  type BoundsState,
} from '../context/AnalysesLaboBoundsContext';
import { useAtmMeroxLabels } from '../context/AtmMeroxLabelsContext';
import { useAtmMeroxBounds, type AtmMeroxBoundsState } from '../context/AtmMeroxBoundsContext';
import { useCompresseurK244Labels } from '../context/CompresseurK244LabelsContext';
import { useCompresseurK244Bounds, type CompresseurK244BoundsState } from '../context/CompresseurK244BoundsContext';
import { useCompresseurK245Labels } from '../context/CompresseurK245LabelsContext';
import { useCompresseurK245Bounds, type CompresseurK245BoundsState } from '../context/CompresseurK245BoundsContext';
import { useGazLabels } from '../context/GazLabelsContext';
import { useGazBounds, type GazBoundsState } from '../context/GazBoundsContext';
import { useMouvementBacsLabels } from '../context/MouvementBacsLabelsContext';
import { useMouvementBacsBounds, type MouvementBacsBoundsState } from '../context/MouvementBacsBoundsContext';
import { useProductionLabels } from '../context/ProductionLabelsContext';
import { useProductionBounds, type ProductionBoundsState } from '../context/ProductionBoundsContext';
import { useReformateurLabels } from '../context/ReformateurLabelsContext';
import { useReformateurBounds, type ReformateurBoundsState } from '../context/ReformateurBoundsContext';
import type { HourKey, ProductKey } from '../data/analysesLaboratoire';
import {
  ANALYSES_MEASURE_NAMES,
  hours,
  hourLabels,
  productLabels,
  products,
} from '../data/analysesLaboratoire';
import { ATM_MEROX_CATEGORIES, getValueKey } from '../data/atmMeroxPreFlash';
import {
  COMPRESSEUR_K244_CATEGORIES,
  compresseurK244HourLabels,
} from '../data/compresseurK244';
import {
  COMPRESSEUR_K245_CATEGORIES,
  compresseurK245HourLabels,
} from '../data/compresseurK245';
import { GAZ_COLUMNS, GAZ_HOURS } from '../data/gaz';
import { MOUVEMENT_BACS_PRODUCTS, MOUVEMENT_BACS_HOURS } from '../data/mouvementDesBacs';
import { PRODUCTION_CATEGORIES, productionHourLabels } from '../data/production';
import { REFORMATEUR_CATEGORIES, reformateurHourLabels } from '../data/reformateur';

const TABLEAU_ATM_MEROX = 'Atm/merox & pré flash';
const TABLEAU_K244 = 'Compresseur K 244';
const TABLEAU_K245 = 'Compresseur K 245';
const TABLEAU_GAZ = 'Gaz';
const TABLEAU_MOUVEMENT_BACS = 'Mouvement des bacs';
const TABLEAU_PRODUCTION = 'Production';
const TABLEAU_REFORMATEUR = 'Réformateur catalytique';

type SettingsTab = 'colonnes' | 'creneaux' | 'lignes';

const TAB_CONFIG: { id: SettingsTab; label: string }[] = [
  { id: 'colonnes', label: 'Produits' },
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'lignes', label: 'Mesures' },
];

type AtmMeroxSettingsTab = 'creneaux' | 'categories' | 'indicateurs';

const ATM_MEROX_TAB_CONFIG: { id: AtmMeroxSettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'categories', label: 'Catégories' },
  { id: 'indicateurs', label: 'Indicateurs' },
];

type K244SettingsTab = 'creneaux' | 'categories' | 'indicateurs';

const K244_TAB_CONFIG: { id: K244SettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'categories', label: 'Catégories' },
  { id: 'indicateurs', label: 'Indicateurs' },
];

type K245SettingsTab = 'creneaux' | 'categories' | 'indicateurs';

const K245_TAB_CONFIG: { id: K245SettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'categories', label: 'Catégories' },
  { id: 'indicateurs', label: 'Indicateurs' },
];

type GazSettingsTab = 'creneaux' | 'colonnes';

const GAZ_TAB_CONFIG: { id: GazSettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'colonnes', label: 'Colonnes' },
];

type MouvementBacsSettingsTab = 'creneaux' | 'produits';

const MOUVEMENT_BACS_TAB_CONFIG: { id: MouvementBacsSettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'produits', label: 'Produits' },
];

type ProductionSettingsTab = 'creneaux' | 'categories' | 'indicateurs';

const PRODUCTION_TAB_CONFIG: { id: ProductionSettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'categories', label: 'Catégories' },
  { id: 'indicateurs', label: 'Indicateurs' },
];

type ReformateurSettingsTab = 'creneaux' | 'categories' | 'indicateurs';

const REFORMATEUR_TAB_CONFIG: { id: ReformateurSettingsTab; label: string }[] = [
  { id: 'creneaux', label: 'Créneaux horaires' },
  { id: 'categories', label: 'Catégories' },
  { id: 'indicateurs', label: 'Indicateurs' },
];

type ActivePanel = 'libelles' | 'bornes';

const MENU_ITEMS = [
  {
    id: 'libelles',
    label: 'Libellés',
    description: 'Renommer les en-têtes, créneaux et mesures affichés dans les tableaux et graphiques',
    detail: 'Chaque onglet correspond à une catégorie de textes modifiables : colonnes du tableau, créneaux horaires ou noms des paramètres mesurés. Les modifications s\'appliquent immédiatement après enregistrement.',
  },
  {
    id: 'bornes',
    label: 'Bornes min/max',
    description: 'Définir les seuils d\'alerte pour chaque indicateur mesuré',
    detail: 'Les valeurs saisies dans les tableaux qui dépassent ces bornes sont mises en évidence en rouge sur les graphiques, permettant de repérer rapidement les anomalies.',
  },
] as const;

const menuBtnClass = (active: boolean) =>
  `w-full text-left px-4 py-3 text-sm font-medium transition-colors focus:outline-none ${
    active
      ? 'border-l-2 border-primary text-primary bg-gray/50 dark:bg-white/5'
      : 'text-bodydark2 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white'
  }`;

const tabBtnClass = (active: boolean) =>
  `flex-1 py-3 px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark ${
    active
      ? 'border-b-2 border-primary text-primary dark:text-primary'
      : 'text-bodydark2 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white'
  }`;

const categoryTabBtnClass = (active: boolean) =>
  `min-w-[14rem] shrink-0 py-3 px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark ${
    active
      ? 'border-b-2 border-primary text-primary dark:text-primary'
      : 'text-bodydark2 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white'
  }`;

const inputClass = 'w-full rounded border border-stroke bg-gray py-2 px-3 text-sm text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary';
const boundsInputClass = 'w-20 rounded border border-stroke bg-gray py-2 px-3 text-sm text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary placeholder:text-bodydark2 dark:placeholder:text-bodydark1';
const saveBtnClass = (saved: boolean) =>
  `rounded py-2 px-6 text-sm font-medium ${saved ? 'border border-success bg-success text-white' : 'bg-primary text-white hover:bg-primary/90'}`;

const Settings = () => {
  const [searchParams] = useSearchParams();
  const tableau = searchParams.get('tableau');
  const isAtmMeroxTableau = tableau === TABLEAU_ATM_MEROX;
  const isK244Tableau = tableau === TABLEAU_K244;
  const isK245Tableau = tableau === TABLEAU_K245;
  const isGazTableau = tableau === TABLEAU_GAZ;
  const isMouvementBacsTableau = tableau === TABLEAU_MOUVEMENT_BACS;
  const isProductionTableau = tableau === TABLEAU_PRODUCTION;
  const isReformateurTableau = tableau === TABLEAU_REFORMATEUR;

  // ── Analyses du laboratoire ──────────────────────────────────────────────
  const { customLabels, setCustomLabels, defaultMeasureNames } = useAnalysesLaboLabels();
  const { bounds, setBounds, products: boundsProducts } = useAnalysesLaboBounds();

  const [activePanel, setActivePanel] = useState<ActivePanel>('libelles');
  const [activeBoundsProduct, setActiveBoundsProduct] = useState<ProductKey>(products[0]);
  const [activeTab, setActiveTab] = useState<SettingsTab>('colonnes');
  const [productsState, setProductsState] = useState<Record<string, string>>({});
  const [hoursState, setHoursState] = useState<Record<string, string>>({});
  const [measuresState, setMeasuresState] = useState<Record<string, string>>({});
  const [boundsState, setBoundsState] = useState<BoundsState>({});
  const [saved, setSaved] = useState(false);
  const [savedBounds, setSavedBounds] = useState(false);

  // ── Atm/merox ────────────────────────────────────────────────────────────
  const {
    customLabels: atmMeroxLabels,
    setCustomLabels: setAtmMeroxLabels,
    defaultHourKeys: atmMeroxHours,
    defaultCategoryKeys: atmMeroxCategoryKeys,
    defaultCategoryLabels: atmMeroxDefaultCategoryLabels,
    defaultMeasureKeys: atmMeroxMeasureKeys,
    defaultMeasureLabels: atmMeroxDefaultMeasureLabels,
  } = useAtmMeroxLabels();
  const { bounds: atmMeroxBounds, setBounds: setAtmMeroxBoundsCtx } = useAtmMeroxBounds();

  const [atmMeroxTab, setAtmMeroxTab] = useState<AtmMeroxSettingsTab>('creneaux');
  const [atmMeroxHoursState, setAtmMeroxHoursState] = useState<Record<string, string>>({});
  const [atmMeroxCategoriesState, setAtmMeroxCategoriesState] = useState<Record<string, string>>({});
  const [atmMeroxMeasuresState, setAtmMeroxMeasuresState] = useState<Record<string, string>>({});
  const [atmMeroxSaved, setAtmMeroxSaved] = useState(false);
  const [activeAtmMeroxPanel, setActiveAtmMeroxPanel] = useState<ActivePanel>('libelles');
  const [atmMeroxBoundsState, setAtmMeroxBoundsState] = useState<AtmMeroxBoundsState>({});
  const [activeAtmMeroxBoundsCategory, setActiveAtmMeroxBoundsCategory] = useState<string>(() => ATM_MEROX_CATEGORIES[0]?.category ?? '');
  const [activeAtmMeroxIndicateursCategory, setActiveAtmMeroxIndicateursCategory] = useState<string>(() => ATM_MEROX_CATEGORIES[0]?.category ?? '');
  const [atmMeroxSavedBounds, setAtmMeroxSavedBounds] = useState(false);

  // ── Compresseur K 244 ────────────────────────────────────────────────────
  const {
    customLabels: k244Labels,
    setCustomLabels: setK244Labels,
    defaultHourKeys: k244Hours,
    defaultCategoryKeys: k244CategoryKeys,
    defaultCategoryLabels: k244DefaultCategoryLabels,
    defaultMeasureKeys: k244MeasureKeys,
    defaultMeasureLabels: k244DefaultMeasureLabels,
  } = useCompresseurK244Labels();
  const { bounds: k244Bounds, setBounds: setK244BoundsCtx } = useCompresseurK244Bounds();

  const [k244Tab, setK244Tab] = useState<K244SettingsTab>('creneaux');
  const [k244HoursState, setK244HoursState] = useState<Record<string, string>>({});
  const [k244CategoriesState, setK244CategoriesState] = useState<Record<string, string>>({});
  const [k244MeasuresState, setK244MeasuresState] = useState<Record<string, string>>({});
  const [k244Saved, setK244Saved] = useState(false);
  const [activeK244Panel, setActiveK244Panel] = useState<ActivePanel>('libelles');
  const [k244BoundsState, setK244BoundsState] = useState<CompresseurK244BoundsState>({});
  const [activeK244BoundsCategory, setActiveK244BoundsCategory] = useState<string>(() => COMPRESSEUR_K244_CATEGORIES[0]?.category ?? '');
  const [k244SavedBounds, setK244SavedBounds] = useState(false);

  // ── Compresseur K 245 ────────────────────────────────────────────────────
  const {
    customLabels: k245Labels,
    setCustomLabels: setK245Labels,
    defaultHourKeys: k245Hours,
    defaultCategoryKeys: k245CategoryKeys,
    defaultCategoryLabels: k245DefaultCategoryLabels,
    defaultMeasureKeys: k245MeasureKeys,
    defaultMeasureLabels: k245DefaultMeasureLabels,
  } = useCompresseurK245Labels();
  const { bounds: k245Bounds, setBounds: setK245BoundsCtx } = useCompresseurK245Bounds();

  const [k245Tab, setK245Tab] = useState<K245SettingsTab>('creneaux');
  const [k245HoursState, setK245HoursState] = useState<Record<string, string>>({});
  const [k245CategoriesState, setK245CategoriesState] = useState<Record<string, string>>({});
  const [k245MeasuresState, setK245MeasuresState] = useState<Record<string, string>>({});
  const [k245Saved, setK245Saved] = useState(false);
  const [activeK245Panel, setActiveK245Panel] = useState<ActivePanel>('libelles');
  const [k245BoundsState, setK245BoundsState] = useState<CompresseurK245BoundsState>({});
  const [activeK245BoundsCategory, setActiveK245BoundsCategory] = useState<string>(() => COMPRESSEUR_K245_CATEGORIES[0]?.category ?? '');
  const [k245SavedBounds, setK245SavedBounds] = useState(false);

  // ── Gaz ──────────────────────────────────────────────────────────────────
  const {
    customLabels: gazLabels,
    setCustomLabels: setGazLabels,
    defaultHourKeys: gazHours,
    defaultColumnKeys: gazColumnKeys,
    defaultHourLabels: gazDefaultHourLabels,
    defaultColumnTitles: gazDefaultColumnTitles,
    defaultColumnSubtitles: gazDefaultColumnSubtitles,
  } = useGazLabels();
  const { bounds: gazBounds, setBounds: setGazBoundsCtx } = useGazBounds();

  const [gazTab, setGazTab] = useState<GazSettingsTab>('creneaux');
  const [gazHoursState, setGazHoursState] = useState<Record<string, string>>({});
  const [gazColumnTitlesState, setGazColumnTitlesState] = useState<Record<string, string>>({});
  const [gazColumnSubtitlesState, setGazColumnSubtitlesState] = useState<Record<string, string>>({});
  const [gazSaved, setGazSaved] = useState(false);
  const [activeGazPanel, setActiveGazPanel] = useState<ActivePanel>('libelles');
  const [gazBoundsState, setGazBoundsState] = useState<GazBoundsState>({});
  const [gazSavedBounds, setGazSavedBounds] = useState(false);

  // ── Mouvement des bacs ───────────────────────────────────────────────────
  const {
    customLabels: mouvBacsLabels,
    setCustomLabels: setMouvBacsLabels,
    defaultHourKeys: mouvBacsHours,
    defaultProductKeys: mouvBacsProductKeys,
    defaultHourLabels: mouvBacsDefaultHourLabels,
    defaultProductLabels: mouvBacsDefaultProductLabels,
  } = useMouvementBacsLabels();
  const { bounds: mouvBacsBounds, setBounds: setMouvBacsBoundsCtx } = useMouvementBacsBounds();

  const [mouvBacsTab, setMouvBacsTab] = useState<MouvementBacsSettingsTab>('creneaux');
  const [mouvBacsHoursState, setMouvBacsHoursState] = useState<Record<string, string>>({});
  const [mouvBacsProductsState, setMouvBacsProductsState] = useState<Record<string, string>>({});
  const [mouvBacsSaved, setMouvBacsSaved] = useState(false);
  const [activeMouvBacsPanel, setActiveMouvBacsPanel] = useState<ActivePanel>('libelles');
  const [mouvBacsBoundsState, setMouvBacsBoundsState] = useState<MouvementBacsBoundsState>({});
  const [mouvBacsSavedBounds, setMouvBacsSavedBounds] = useState(false);

  // ── Production ────────────────────────────────────────────────────────────
  const {
    customLabels: productionLabels,
    setCustomLabels: setProductionLabels,
    defaultHourKeys: productionHours,
    defaultCategoryKeys: productionCategoryKeys,
    defaultCategoryLabels: productionDefaultCategoryLabels,
    defaultMeasureKeys: productionMeasureKeys,
    defaultMeasureLabels: productionDefaultMeasureLabels,
  } = useProductionLabels();
  const { bounds: productionBounds, setBounds: setProductionBoundsCtx } = useProductionBounds();

  const [productionTab, setProductionTab] = useState<ProductionSettingsTab>('creneaux');
  const [productionHoursState, setProductionHoursState] = useState<Record<string, string>>({});
  const [productionCategoriesState, setProductionCategoriesState] = useState<Record<string, string>>({});
  const [productionMeasuresState, setProductionMeasuresState] = useState<Record<string, string>>({});
  const [productionSaved, setProductionSaved] = useState(false);
  const [activeProductionPanel, setActiveProductionPanel] = useState<ActivePanel>('libelles');
  const [productionBoundsState, setProductionBoundsState] = useState<ProductionBoundsState>({});
  const [activeProductionBoundsCategory, setActiveProductionBoundsCategory] = useState<string>(() => PRODUCTION_CATEGORIES[0]?.category ?? '');
  const [productionSavedBounds, setProductionSavedBounds] = useState(false);

  // ── Réformateur catalytique ───────────────────────────────────────────────
  const {
    customLabels: reformateurLabels,
    setCustomLabels: setReformateurLabels,
    defaultHourKeys: reformateurHours,
    defaultCategoryKeys: reformateurCategoryKeys,
    defaultCategoryLabels: reformateurDefaultCategoryLabels,
    defaultMeasureKeys: reformateurMeasureKeys,
    defaultMeasureLabels: reformateurDefaultMeasureLabels,
  } = useReformateurLabels();
  const { bounds: reformateurBounds, setBounds: setReformateurBoundsCtx } = useReformateurBounds();

  const [reformateurTab, setReformateurTab] = useState<ReformateurSettingsTab>('creneaux');
  const [reformateurHoursState, setReformateurHoursState] = useState<Record<string, string>>({});
  const [reformateurCategoriesState, setReformateurCategoriesState] = useState<Record<string, string>>({});
  const [reformateurMeasuresState, setReformateurMeasuresState] = useState<Record<string, string>>({});
  const [reformateurSaved, setReformateurSaved] = useState(false);
  const [activeReformateurPanel, setActiveReformateurPanel] = useState<ActivePanel>('libelles');
  const [reformateurBoundsState, setReformateurBoundsState] = useState<ReformateurBoundsState>({});
  const [activeReformateurBoundsCategory, setActiveReformateurBoundsCategory] = useState<string>(() => REFORMATEUR_CATEGORIES[0]?.category ?? '');
  const [reformateurSavedBounds, setReformateurSavedBounds] = useState(false);

  // ── Effects — Analyses ───────────────────────────────────────────────────
  useEffect(() => {
    const p: Record<string, string> = {};
    products.forEach((key) => { p[key] = customLabels.products[key] ?? productLabels[key]; });
    setProductsState(p);
    const h: Record<string, string> = {};
    hours.forEach((key) => { h[key] = customLabels.hours[key] ?? hourLabels[key]; });
    setHoursState(h);
    const m: Record<string, string> = {};
    defaultMeasureNames.forEach((name) => { m[name] = customLabels.measures[name] ?? name; });
    setMeasuresState(m);
  }, [customLabels, defaultMeasureNames]);

  useEffect(() => {
    if (activePanel === 'bornes') setBoundsState(bounds);
  }, [activePanel, bounds]);

  // ── Effects — Atm/merox ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeAtmMeroxPanel === 'bornes') setAtmMeroxBoundsState(atmMeroxBounds);
  }, [activeAtmMeroxPanel, atmMeroxBounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    atmMeroxHours.forEach((key) => { h[key] = atmMeroxLabels.hours[key] ?? key; });
    setAtmMeroxHoursState(h);
    const c: Record<string, string> = {};
    atmMeroxCategoryKeys.forEach((key) => { c[key] = atmMeroxLabels.categories[key] ?? atmMeroxDefaultCategoryLabels[key] ?? (key || '—'); });
    setAtmMeroxCategoriesState(c);
    const m: Record<string, string> = {};
    atmMeroxMeasureKeys.forEach((key) => { m[key] = atmMeroxLabels.measures[key] ?? atmMeroxDefaultMeasureLabels[key] ?? key; });
    setAtmMeroxMeasuresState(m);
  }, [atmMeroxLabels, atmMeroxHours, atmMeroxCategoryKeys, atmMeroxDefaultCategoryLabels, atmMeroxMeasureKeys, atmMeroxDefaultMeasureLabels]);

  // ── Effects — K244 ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeK244Panel === 'bornes') setK244BoundsState(k244Bounds);
  }, [activeK244Panel, k244Bounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    k244Hours.forEach((key) => { h[key] = k244Labels.hours[key] ?? compresseurK244HourLabels[key] ?? key; });
    setK244HoursState(h);
    const c: Record<string, string> = {};
    k244CategoryKeys.forEach((key) => { c[key] = k244Labels.categories[key] ?? k244DefaultCategoryLabels[key] ?? key; });
    setK244CategoriesState(c);
    const m: Record<string, string> = {};
    k244MeasureKeys.forEach((key) => { m[key] = k244Labels.measures[key] ?? k244DefaultMeasureLabels[key] ?? key; });
    setK244MeasuresState(m);
  }, [k244Labels, k244Hours, k244CategoryKeys, k244DefaultCategoryLabels, k244MeasureKeys, k244DefaultMeasureLabels]);

  // ── Effects — K245 ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeK245Panel === 'bornes') setK245BoundsState(k245Bounds);
  }, [activeK245Panel, k245Bounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    k245Hours.forEach((key) => { h[key] = k245Labels.hours[key] ?? compresseurK245HourLabels[key] ?? key; });
    setK245HoursState(h);
    const c: Record<string, string> = {};
    k245CategoryKeys.forEach((key) => { c[key] = k245Labels.categories[key] ?? k245DefaultCategoryLabels[key] ?? key; });
    setK245CategoriesState(c);
    const m: Record<string, string> = {};
    k245MeasureKeys.forEach((key) => { m[key] = k245Labels.measures[key] ?? k245DefaultMeasureLabels[key] ?? key; });
    setK245MeasuresState(m);
  }, [k245Labels, k245Hours, k245CategoryKeys, k245DefaultCategoryLabels, k245MeasureKeys, k245DefaultMeasureLabels]);

  // ── Effects — Gaz ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeGazPanel === 'bornes') setGazBoundsState(gazBounds);
  }, [activeGazPanel, gazBounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    gazHours.forEach((key) => { h[key] = gazLabels.hours[key] ?? gazDefaultHourLabels[key] ?? key; });
    setGazHoursState(h);
    const t: Record<string, string> = {};
    gazColumnKeys.forEach((key) => { t[key] = gazLabels.columnTitles[key] ?? gazDefaultColumnTitles[key] ?? key; });
    setGazColumnTitlesState(t);
    const s: Record<string, string> = {};
    gazColumnKeys.forEach((key) => { s[key] = gazLabels.columnSubtitles[key] ?? gazDefaultColumnSubtitles[key] ?? key; });
    setGazColumnSubtitlesState(s);
  }, [gazLabels, gazHours, gazColumnKeys, gazDefaultHourLabels, gazDefaultColumnTitles, gazDefaultColumnSubtitles]);

  // ── Effects — Mouvement des bacs ─────────────────────────────────────────
  useEffect(() => {
    if (activeMouvBacsPanel === 'bornes') setMouvBacsBoundsState(mouvBacsBounds);
  }, [activeMouvBacsPanel, mouvBacsBounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    mouvBacsHours.forEach((key) => { h[key] = mouvBacsLabels.hours[key] ?? mouvBacsDefaultHourLabels[key] ?? key; });
    setMouvBacsHoursState(h);
    const p: Record<string, string> = {};
    mouvBacsProductKeys.forEach((key) => { p[key] = mouvBacsLabels.products[key] ?? mouvBacsDefaultProductLabels[key] ?? key; });
    setMouvBacsProductsState(p);
  }, [mouvBacsLabels, mouvBacsHours, mouvBacsProductKeys, mouvBacsDefaultHourLabels, mouvBacsDefaultProductLabels]);

  // ── Effects — Production ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeProductionPanel === 'bornes') setProductionBoundsState(productionBounds);
  }, [activeProductionPanel, productionBounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    productionHours.forEach((key) => { h[key] = productionLabels.hours[key] ?? productionHourLabels[key] ?? key; });
    setProductionHoursState(h);
    const c: Record<string, string> = {};
    productionCategoryKeys.forEach((key) => { c[key] = productionLabels.categories[key] ?? productionDefaultCategoryLabels[key] ?? key; });
    setProductionCategoriesState(c);
    const m: Record<string, string> = {};
    productionMeasureKeys.forEach((key) => { m[key] = productionLabels.measures[key] ?? productionDefaultMeasureLabels[key] ?? key; });
    setProductionMeasuresState(m);
  }, [productionLabels, productionHours, productionCategoryKeys, productionDefaultCategoryLabels, productionMeasureKeys, productionDefaultMeasureLabels]);

  // ── Effects — Réformateur catalytique ────────────────────────────────────
  useEffect(() => {
    if (activeReformateurPanel === 'bornes') setReformateurBoundsState(reformateurBounds);
  }, [activeReformateurPanel, reformateurBounds]);

  useEffect(() => {
    const h: Record<string, string> = {};
    reformateurHours.forEach((key) => { h[key] = reformateurLabels.hours[key] ?? reformateurHourLabels[key] ?? key; });
    setReformateurHoursState(h);
    const c: Record<string, string> = {};
    reformateurCategoryKeys.forEach((key) => { c[key] = reformateurLabels.categories[key] ?? reformateurDefaultCategoryLabels[key] ?? key; });
    setReformateurCategoriesState(c);
    const m: Record<string, string> = {};
    reformateurMeasureKeys.forEach((key) => { m[key] = reformateurLabels.measures[key] ?? reformateurDefaultMeasureLabels[key] ?? key; });
    setReformateurMeasuresState(m);
  }, [reformateurLabels, reformateurHours, reformateurCategoryKeys, reformateurDefaultCategoryLabels, reformateurMeasureKeys, reformateurDefaultMeasureLabels]);

  // ── Handlers — Analyses ──────────────────────────────────────────────────
  const handleSave = () => {
    setCustomLabels(() => ({
      products: productsState as Partial<Record<ProductKey, string>>,
      hours: hoursState as Partial<Record<HourKey, string>>,
      measures: measuresState,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBounds = () => {
    setBounds(() => boundsState);
    setSavedBounds(true);
    setTimeout(() => setSavedBounds(false), 2000);
  };

  const updateBoundsForProduct = (product: ProductKey, measure: string, field: 'min' | 'max', value: string) => {
    setBoundsState((prev) => {
      const next = { ...prev };
      const perProduct = { ...(next[product] ?? getBoundsForProduct(next, product)) };
      perProduct[measure] = { ...perProduct[measure], [field]: value };
      next[product] = perProduct;
      return next;
    });
  };

  const currentProductBounds = boundsState[activeBoundsProduct] ?? getBoundsForProduct(boundsState, activeBoundsProduct);

  // ── Handlers — Atm/merox ─────────────────────────────────────────────────
  const handleAtmMeroxSave = () => {
    setAtmMeroxLabels((prev) => ({
      ...prev,
      hours: atmMeroxHoursState as Partial<Record<typeof atmMeroxHours[number], string>>,
      categories: atmMeroxCategoriesState,
      measures: atmMeroxMeasuresState,
    }));
    setAtmMeroxSaved(true);
    setTimeout(() => setAtmMeroxSaved(false), 2000);
  };

  const updateAtmMeroxBounds = (measureKey: string, field: 'min' | 'max', value: string) => {
    setAtmMeroxBoundsState((prev) => {
      const next = { ...prev };
      next[measureKey] = { ...(next[measureKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleAtmMeroxSaveBounds = () => {
    setAtmMeroxBoundsCtx(() => atmMeroxBoundsState);
    setAtmMeroxSavedBounds(true);
    setTimeout(() => setAtmMeroxSavedBounds(false), 2000);
  };

  const currentAtmMeroxCategory = ATM_MEROX_CATEGORIES.find((c) => c.category === activeAtmMeroxBoundsCategory) ?? ATM_MEROX_CATEGORIES[0];
  const currentAtmMeroxCategoryBounds = currentAtmMeroxCategory
    ? Object.fromEntries(currentAtmMeroxCategory.subRows.map((subRow) => {
        const key = getValueKey(currentAtmMeroxCategory.category, subRow);
        return [subRow, atmMeroxBoundsState[key] ?? { min: '', max: '' }];
      }))
    : {};

  // ── Handlers — K244 ──────────────────────────────────────────────────────
  const handleK244Save = () => {
    setK244Labels((prev) => ({
      ...prev,
      hours: k244HoursState as Partial<Record<typeof k244Hours[number], string>>,
      categories: k244CategoriesState,
      measures: k244MeasuresState,
    }));
    setK244Saved(true);
    setTimeout(() => setK244Saved(false), 2000);
  };

  const updateK244Bounds = (measureKey: string, field: 'min' | 'max', value: string) => {
    setK244BoundsState((prev) => {
      const next = { ...prev };
      next[measureKey] = { ...(next[measureKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleK244SaveBounds = () => {
    setK244BoundsCtx(() => k244BoundsState);
    setK244SavedBounds(true);
    setTimeout(() => setK244SavedBounds(false), 2000);
  };

  const currentK244Category = COMPRESSEUR_K244_CATEGORIES.find((c) => c.category === activeK244BoundsCategory) ?? COMPRESSEUR_K244_CATEGORIES[0];
  const currentK244CategoryBounds = currentK244Category
    ? Object.fromEntries(currentK244Category.subRows.map((subRow) => {
        const key = `${currentK244Category.category}_${subRow}`;
        return [subRow, k244BoundsState[key] ?? { min: '', max: '' }];
      }))
    : {};

  // ── Handlers — K245 ──────────────────────────────────────────────────────
  const handleK245Save = () => {
    setK245Labels((prev) => ({
      ...prev,
      hours: k245HoursState as Partial<Record<typeof k245Hours[number], string>>,
      categories: k245CategoriesState,
      measures: k245MeasuresState,
    }));
    setK245Saved(true);
    setTimeout(() => setK245Saved(false), 2000);
  };

  const updateK245Bounds = (measureKey: string, field: 'min' | 'max', value: string) => {
    setK245BoundsState((prev) => {
      const next = { ...prev };
      next[measureKey] = { ...(next[measureKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleK245SaveBounds = () => {
    setK245BoundsCtx(() => k245BoundsState);
    setK245SavedBounds(true);
    setTimeout(() => setK245SavedBounds(false), 2000);
  };

  const currentK245Category = COMPRESSEUR_K245_CATEGORIES.find((c) => c.category === activeK245BoundsCategory) ?? COMPRESSEUR_K245_CATEGORIES[0];
  const currentK245CategoryBounds = currentK245Category
    ? Object.fromEntries(currentK245Category.subRows.map((subRow) => {
        const key = `${currentK245Category.category}_${subRow}`;
        return [subRow, k245BoundsState[key] ?? { min: '', max: '' }];
      }))
    : {};

  // ── Handlers — Gaz ───────────────────────────────────────────────────────
  const handleGazSave = () => {
    setGazLabels((prev) => ({
      ...prev,
      hours: gazHoursState as typeof prev.hours,
      columnTitles: gazColumnTitlesState as typeof prev.columnTitles,
      columnSubtitles: gazColumnSubtitlesState as typeof prev.columnSubtitles,
    }));
    setGazSaved(true);
    setTimeout(() => setGazSaved(false), 2000);
  };

  const updateGazBounds = (colKey: string, field: 'min' | 'max', value: string) => {
    setGazBoundsState((prev) => {
      const next = { ...prev };
      next[colKey] = { ...(next[colKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleGazSaveBounds = () => {
    setGazBoundsCtx(() => gazBoundsState);
    setGazSavedBounds(true);
    setTimeout(() => setGazSavedBounds(false), 2000);
  };

  // ── Handlers — Mouvement des bacs ────────────────────────────────────────
  const handleMouvBacsSave = () => {
    setMouvBacsLabels((prev) => ({
      ...prev,
      hours: mouvBacsHoursState as typeof prev.hours,
      products: mouvBacsProductsState,
    }));
    setMouvBacsSaved(true);
    setTimeout(() => setMouvBacsSaved(false), 2000);
  };

  const updateMouvBacsBounds = (product: string, field: 'min' | 'max', value: string) => {
    setMouvBacsBoundsState((prev) => {
      const next = { ...prev };
      next[product] = { ...(next[product] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleMouvBacsSaveBounds = () => {
    setMouvBacsBoundsCtx(() => mouvBacsBoundsState);
    setMouvBacsSavedBounds(true);
    setTimeout(() => setMouvBacsSavedBounds(false), 2000);
  };

  // ── Handlers — Production ─────────────────────────────────────────────────
  const handleProductionSave = () => {
    setProductionLabels((prev) => ({
      ...prev,
      hours: productionHoursState as Partial<Record<typeof productionHours[number], string>>,
      categories: productionCategoriesState,
      measures: productionMeasuresState,
    }));
    setProductionSaved(true);
    setTimeout(() => setProductionSaved(false), 2000);
  };

  const updateProductionBounds = (measureKey: string, field: 'min' | 'max', value: string) => {
    setProductionBoundsState((prev) => {
      const next = { ...prev };
      next[measureKey] = { ...(next[measureKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleProductionSaveBounds = () => {
    setProductionBoundsCtx(() => productionBoundsState);
    setProductionSavedBounds(true);
    setTimeout(() => setProductionSavedBounds(false), 2000);
  };

  const currentProductionCategory = PRODUCTION_CATEGORIES.find((c) => c.category === activeProductionBoundsCategory) ?? PRODUCTION_CATEGORIES[0];
  const currentProductionCategoryBounds = currentProductionCategory
    ? Object.fromEntries(currentProductionCategory.subRows.map((subRow) => {
        const key = `${currentProductionCategory.category}_${subRow}`;
        return [subRow, productionBoundsState[key] ?? { min: '', max: '' }];
      }))
    : {};

  // ── Handlers — Réformateur catalytique ────────────────────────────────────
  const handleReformateurSave = () => {
    setReformateurLabels((prev) => ({
      ...prev,
      hours: reformateurHoursState as Partial<Record<typeof reformateurHours[number], string>>,
      categories: reformateurCategoriesState,
      measures: reformateurMeasuresState,
    }));
    setReformateurSaved(true);
    setTimeout(() => setReformateurSaved(false), 2000);
  };

  const updateReformateurBounds = (measureKey: string, field: 'min' | 'max', value: string) => {
    setReformateurBoundsState((prev) => {
      const next = { ...prev };
      next[measureKey] = { ...(next[measureKey] ?? { min: '', max: '' }), [field]: value };
      return next;
    });
  };

  const handleReformateurSaveBounds = () => {
    setReformateurBoundsCtx(() => reformateurBoundsState);
    setReformateurSavedBounds(true);
    setTimeout(() => setReformateurSavedBounds(false), 2000);
  };

  const currentReformateurCategory = REFORMATEUR_CATEGORIES.find((c) => c.category === activeReformateurBoundsCategory) ?? REFORMATEUR_CATEGORIES[0];
  const currentReformateurCategoryBounds = currentReformateurCategory
    ? Object.fromEntries(currentReformateurCategory.subRows.map((subRow) => {
        const key = `${currentReformateurCategory.category}_${subRow}`;
        return [subRow, reformateurBoundsState[key] ?? { min: '', max: '' }];
      }))
    : {};

  // ── Render helpers ────────────────────────────────────────────────────────
  const MenuCard = ({ activeId, onSelect }: { activeId: string; onSelect: (id: 'libelles' | 'bornes') => void }) => {
    const activeItem = MENU_ITEMS.find((item) => item.id === activeId);
    return (
      <div className="w-56 shrink-0 flex flex-col gap-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <nav className="flex flex-col py-2">
            {MENU_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={menuBtnClass(activeId === item.id)}>
                <span className="block">{item.label}</span>
                <span className="block text-xs font-normal leading-snug mt-0.5 text-bodydark2 dark:text-bodydark1">{item.description}</span>
              </button>
            ))}
          </nav>
        </div>
        {activeItem && (
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <p className="text-xs font-medium text-primary mb-1">{activeItem.label}</p>
            <p className="text-xs text-bodydark2 leading-relaxed dark:text-bodydark1">{activeItem.detail}</p>
          </div>
        )}
      </div>
    );
  };

  // ── Réformateur catalytique page ──────────────────────────────────────────
  if (isReformateurTableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Réformateur catalytique
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeReformateurPanel} onSelect={setActiveReformateurPanel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeReformateurPanel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Réformateur catalytique">
                    {REFORMATEUR_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setReformateurTab(tab.id)} className={tabBtnClass(reformateurTab === tab.id)} aria-selected={reformateurTab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {reformateurTab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {reformateurHours.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{reformateurHourLabels[key] ?? key}</p>
                            <input id={`ref-hour-${key}`} type="text" value={reformateurHoursState[key] ?? ''} onChange={(e) => setReformateurHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {reformateurTab === 'categories' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {reformateurCategoryKeys.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{reformateurDefaultCategoryLabels[key] ?? key}</p>
                            <input id={`ref-cat-${key}`} type="text" value={reformateurCategoriesState[key] ?? ''} onChange={(e) => setReformateurCategoriesState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={reformateurDefaultCategoryLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {reformateurTab === 'indicateurs' && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                        {reformateurMeasureKeys.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{reformateurDefaultMeasureLabels[key] ?? key}</p>
                            <input id={`ref-meas-${key}`} type="text" value={reformateurMeasuresState[key] ?? ''} onChange={(e) => setReformateurMeasuresState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={reformateurDefaultMeasureLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleReformateurSave} className={saveBtnClass(reformateurSaved)}>
                        {reformateurSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeReformateurPanel === 'bornes' && (
                <>
                  <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Catégories Réformateur — bornes min/max">
                    <div className="flex min-w-0 shrink-0">
                      {REFORMATEUR_CATEGORIES.map((cat) => (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setActiveReformateurBoundsCategory(cat.category)}
                          className={categoryTabBtnClass(activeReformateurBoundsCategory === cat.category)}
                          aria-selected={activeReformateurBoundsCategory === cat.category}
                          role="tab"
                        >
                          {reformateurDefaultCategoryLabels[cat.category] ?? cat.category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-7" role="tabpanel">
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {currentReformateurCategory.subRows.map((subRow) => {
                        const measureKey = `${currentReformateurCategory.category}_${subRow}`;
                        const b = currentReformateurCategoryBounds[subRow] ?? { min: '', max: '' };
                        const label = reformateurDefaultMeasureLabels[measureKey] ?? subRow;
                        return (
                          <div key={measureKey} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                            <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateReformateurBounds(measureKey, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                            <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateReformateurBounds(measureKey, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleReformateurSaveBounds} className={saveBtnClass(reformateurSavedBounds)}>
                        {reformateurSavedBounds ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Production page ───────────────────────────────────────────────────────
  if (isProductionTableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Production
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeProductionPanel} onSelect={setActiveProductionPanel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeProductionPanel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Production">
                    {PRODUCTION_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setProductionTab(tab.id)} className={tabBtnClass(productionTab === tab.id)} aria-selected={productionTab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {productionTab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {productionHours.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{productionHourLabels[key] ?? key}</p>
                            <input id={`prod-hour-${key}`} type="text" value={productionHoursState[key] ?? ''} onChange={(e) => setProductionHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {productionTab === 'categories' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {productionCategoryKeys.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{productionDefaultCategoryLabels[key] ?? key}</p>
                            <input id={`prod-cat-${key}`} type="text" value={productionCategoriesState[key] ?? ''} onChange={(e) => setProductionCategoriesState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={productionDefaultCategoryLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {productionTab === 'indicateurs' && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                        {productionMeasureKeys.map((key) => (
                          <div key={key}>
                            <p className="mb-1 text-xs text-bodydark2">{productionDefaultMeasureLabels[key] ?? key}</p>
                            <input id={`prod-meas-${key}`} type="text" value={productionMeasuresState[key] ?? ''} onChange={(e) => setProductionMeasuresState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={productionDefaultMeasureLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleProductionSave} className={saveBtnClass(productionSaved)}>
                        {productionSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeProductionPanel === 'bornes' && (
                <>
                  <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Catégories Production — bornes min/max">
                    <div className="flex min-w-0 shrink-0">
                      {PRODUCTION_CATEGORIES.map((cat) => (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setActiveProductionBoundsCategory(cat.category)}
                          className={categoryTabBtnClass(activeProductionBoundsCategory === cat.category)}
                          aria-selected={activeProductionBoundsCategory === cat.category}
                          role="tab"
                        >
                          {productionDefaultCategoryLabels[cat.category] ?? cat.category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-7" role="tabpanel">
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {currentProductionCategory.subRows.map((subRow) => {
                        const measureKey = `${currentProductionCategory.category}_${subRow}`;
                        const b = currentProductionCategoryBounds[subRow] ?? { min: '', max: '' };
                        const label = productionDefaultMeasureLabels[measureKey] ?? subRow;
                        return (
                          <div key={measureKey} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                            <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateProductionBounds(measureKey, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                            <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateProductionBounds(measureKey, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleProductionSaveBounds} className={saveBtnClass(productionSavedBounds)}>
                        {productionSavedBounds ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── K244 page ─────────────────────────────────────────────────────────────
  if (isK244Tableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Compresseur K 244
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeK244Panel} onSelect={setActiveK244Panel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeK244Panel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Compresseur K 244">
                    {K244_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setK244Tab(tab.id)} className={tabBtnClass(k244Tab === tab.id)} aria-selected={k244Tab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {k244Tab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {k244Hours.map((key) => (
                          <div key={key}>
                            <input id={`k244-hour-${key}`} type="text" value={k244HoursState[key] ?? ''} onChange={(e) => setK244HoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {k244Tab === 'categories' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {k244CategoryKeys.map((key) => (
                          <div key={key}>
                            <input id={`k244-cat-${key}`} type="text" value={k244CategoriesState[key] ?? ''} onChange={(e) => setK244CategoriesState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={k244DefaultCategoryLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {k244Tab === 'indicateurs' && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                        {k244MeasureKeys.map((key) => (
                          <div key={key}>
                            <input id={`k244-meas-${key}`} type="text" value={k244MeasuresState[key] ?? ''} onChange={(e) => setK244MeasuresState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={k244DefaultMeasureLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleK244Save} className={saveBtnClass(k244Saved)}>
                        {k244Saved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeK244Panel === 'bornes' && (
                <>
                  <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Catégories K244 — bornes min/max">
                    <div className="flex min-w-0 shrink-0">
                      {COMPRESSEUR_K244_CATEGORIES.map((cat) => (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setActiveK244BoundsCategory(cat.category)}
                          className={categoryTabBtnClass(activeK244BoundsCategory === cat.category)}
                          aria-selected={activeK244BoundsCategory === cat.category}
                          role="tab"
                        >
                          {k244DefaultCategoryLabels[cat.category] ?? cat.category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-7" role="tabpanel">
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {currentK244Category.subRows.map((subRow) => {
                        const measureKey = `${currentK244Category.category}_${subRow}`;
                        const b = currentK244CategoryBounds[subRow] ?? { min: '', max: '' };
                        const label = k244DefaultMeasureLabels[measureKey] ?? subRow;
                        return (
                          <div key={measureKey} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                            <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateK244Bounds(measureKey, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                            <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateK244Bounds(measureKey, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleK244SaveBounds} className={saveBtnClass(k244SavedBounds)}>
                        {k244SavedBounds ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── K245 page ─────────────────────────────────────────────────────────────
  if (isK245Tableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Compresseur K 245
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeK245Panel} onSelect={setActiveK245Panel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeK245Panel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Compresseur K 245">
                    {K245_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setK245Tab(tab.id)} className={tabBtnClass(k245Tab === tab.id)} aria-selected={k245Tab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {k245Tab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {k245Hours.map((key) => (
                          <div key={key}>
                            <input id={`k245-hour-${key}`} type="text" value={k245HoursState[key] ?? ''} onChange={(e) => setK245HoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {k245Tab === 'categories' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {k245CategoryKeys.map((key) => (
                          <div key={key}>
                            <input id={`k245-cat-${key}`} type="text" value={k245CategoriesState[key] ?? ''} onChange={(e) => setK245CategoriesState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={k245DefaultCategoryLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {k245Tab === 'indicateurs' && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                        {k245MeasureKeys.map((key) => (
                          <div key={key}>
                            <input id={`k245-meas-${key}`} type="text" value={k245MeasuresState[key] ?? ''} onChange={(e) => setK245MeasuresState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={k245DefaultMeasureLabels[key] ?? key} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleK245Save} className={saveBtnClass(k245Saved)}>
                        {k245Saved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeK245Panel === 'bornes' && (
                <>
                  <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Catégories K245 — bornes min/max">
                    <div className="flex min-w-0 shrink-0">
                      {COMPRESSEUR_K245_CATEGORIES.map((cat) => (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setActiveK245BoundsCategory(cat.category)}
                          className={categoryTabBtnClass(activeK245BoundsCategory === cat.category)}
                          aria-selected={activeK245BoundsCategory === cat.category}
                          role="tab"
                        >
                          {k245DefaultCategoryLabels[cat.category] ?? cat.category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-7" role="tabpanel">
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {currentK245Category.subRows.map((subRow) => {
                        const measureKey = `${currentK245Category.category}_${subRow}`;
                        const b = currentK245CategoryBounds[subRow] ?? { min: '', max: '' };
                        const label = k245DefaultMeasureLabels[measureKey] ?? subRow;
                        return (
                          <div key={measureKey} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                            <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateK245Bounds(measureKey, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                            <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateK245Bounds(measureKey, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleK245SaveBounds} className={saveBtnClass(k245SavedBounds)}>
                        {k245SavedBounds ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Gaz page ──────────────────────────────────────────────────────────────
  if (isGazTableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Gaz
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeGazPanel} onSelect={setActiveGazPanel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeGazPanel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Gaz">
                    {GAZ_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setGazTab(tab.id)} className={tabBtnClass(gazTab === tab.id)} aria-selected={gazTab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {gazTab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {GAZ_HOURS.map((key) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs text-bodydark2">{gazDefaultHourLabels[key] ?? key}</label>
                            <input id={`gaz-hour-${key}`} type="text" value={gazHoursState[key] ?? ''} onChange={(e) => setGazHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {gazTab === 'colonnes' && (
                      <div className="flex flex-col gap-5">
                        {GAZ_COLUMNS.map((col) => (
                          <div key={col.key} className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs text-bodydark2">Titre — {gazDefaultColumnTitles[col.key]}</label>
                              <input id={`gaz-title-${col.key}`} type="text" value={gazColumnTitlesState[col.key] ?? ''} onChange={(e) => setGazColumnTitlesState((s) => ({ ...s, [col.key]: e.target.value }))} className={inputClass} aria-label={`Titre ${col.key}`} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-bodydark2">Sous-titre — {gazDefaultColumnSubtitles[col.key]}</label>
                              <input id={`gaz-subtitle-${col.key}`} type="text" value={gazColumnSubtitlesState[col.key] ?? ''} onChange={(e) => setGazColumnSubtitlesState((s) => ({ ...s, [col.key]: e.target.value }))} className={inputClass} aria-label={`Sous-titre ${col.key}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleGazSave} className={saveBtnClass(gazSaved)}>
                        {gazSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeGazPanel === 'bornes' && (
                <div className="p-7">
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {GAZ_COLUMNS.map((col) => {
                      const b = gazBoundsState[col.key] ?? { min: '', max: '' };
                      const label = `${gazDefaultColumnTitles[col.key] ?? col.key} — ${gazDefaultColumnSubtitles[col.key] ?? ''}`;
                      return (
                        <div key={col.key} className="flex flex-wrap items-center gap-3">
                          <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                          <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateGazBounds(col.key, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                          <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateGazBounds(col.key, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-6">
                    <button type="button" onClick={handleGazSaveBounds} className={saveBtnClass(gazSavedBounds)}>
                      {gazSavedBounds ? 'Enregistré' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Mouvement des bacs page ───────────────────────────────────────────────
  if (isMouvementBacsTableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Mouvement des bacs
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeMouvBacsPanel} onSelect={setActiveMouvBacsPanel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeMouvBacsPanel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Mouvement des bacs">
                    {MOUVEMENT_BACS_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setMouvBacsTab(tab.id)} className={tabBtnClass(mouvBacsTab === tab.id)} aria-selected={mouvBacsTab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {mouvBacsTab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {MOUVEMENT_BACS_HOURS.map((key) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs text-bodydark2">{mouvBacsDefaultHourLabels[key] ?? key}</label>
                            <input id={`mouv-hour-${key}`} type="text" value={mouvBacsHoursState[key] ?? ''} onChange={(e) => setMouvBacsHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {mouvBacsTab === 'produits' && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                        {MOUVEMENT_BACS_PRODUCTS.map((key) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs text-bodydark2">{mouvBacsDefaultProductLabels[key] ?? key}</label>
                            <input id={`mouv-prod-${key}`} type="text" value={mouvBacsProductsState[key] ?? ''} onChange={(e) => setMouvBacsProductsState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleMouvBacsSave} className={saveBtnClass(mouvBacsSaved)}>
                        {mouvBacsSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeMouvBacsPanel === 'bornes' && (
                <div className="p-7">
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                    {MOUVEMENT_BACS_PRODUCTS.map((product) => {
                      const b = mouvBacsBoundsState[product] ?? { min: '', max: '' };
                      const label = mouvBacsDefaultProductLabels[product] ?? product;
                      return (
                        <div key={product} className="flex flex-wrap items-center gap-3">
                          <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                          <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateMouvBacsBounds(product, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                          <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateMouvBacsBounds(product, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-6">
                    <button type="button" onClick={handleMouvBacsSaveBounds} className={saveBtnClass(mouvBacsSavedBounds)}>
                      {mouvBacsSavedBounds ? 'Enregistré' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Atm/merox page ────────────────────────────────────────────────────────
  if (isAtmMeroxTableau) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold text-primary dark:text-white">
              Paramètre — Atm/merox & pré flash
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-6 px-6">
          <MenuCard activeId={activeAtmMeroxPanel} onSelect={setActiveAtmMeroxPanel} />
          <div className="w-full max-w-2xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              {activeAtmMeroxPanel === 'libelles' && (
                <>
                  <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Atm/merox & pré flash">
                    {ATM_MEROX_TAB_CONFIG.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setAtmMeroxTab(tab.id)} className={tabBtnClass(atmMeroxTab === tab.id)} aria-selected={atmMeroxTab === tab.id} role="tab">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-7" role="tabpanel">
                    {atmMeroxTab === 'creneaux' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {atmMeroxHours.map((key) => (
                          <div key={key}>
                            <input id={`atm-hour-${key}`} type="text" value={atmMeroxHoursState[key] ?? ''} onChange={(e) => setAtmMeroxHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                          </div>
                        ))}
                      </div>
                    )}
                    {atmMeroxTab === 'categories' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {atmMeroxCategoryKeys.map((key) => (
                          <div key={key || '__empty__'}>
                            <input id={`atm-cat-${key || '__empty__'}`} type="text" value={atmMeroxCategoriesState[key] ?? ''} onChange={(e) => setAtmMeroxCategoriesState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={atmMeroxDefaultCategoryLabels[key] ?? (key || '—')} />
                          </div>
                        ))}
                      </div>
                    )}
                    {atmMeroxTab === 'indicateurs' && (
                      <>
                        <div className="no-scrollbar -mx-7 -mt-7 mb-5 border-b border-stroke dark:border-strokedark overflow-x-auto">
                          <div className="flex min-w-0 shrink-0">
                            {ATM_MEROX_CATEGORIES.map((cat) => (
                              <button
                                key={cat.category || '__empty__'}
                                type="button"
                                onClick={() => setActiveAtmMeroxIndicateursCategory(cat.category)}
                                className={categoryTabBtnClass(activeAtmMeroxIndicateursCategory === cat.category)}
                                aria-selected={activeAtmMeroxIndicateursCategory === cat.category}
                                role="tab"
                              >
                                {atmMeroxDefaultCategoryLabels[cat.category] ?? (cat.category || '—')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
                          {(ATM_MEROX_CATEGORIES.find((c) => c.category === activeAtmMeroxIndicateursCategory)?.subRows ?? []).map((subRow) => {
                            const key = getValueKey(activeAtmMeroxIndicateursCategory, subRow);
                            return (
                              <div key={key}>
                                <p className="mb-1 text-xs text-bodydark2">{atmMeroxDefaultMeasureLabels[key] ?? subRow}</p>
                                <input id={`atm-meas-${key}`} type="text" value={atmMeroxMeasuresState[key] ?? ''} onChange={(e) => setAtmMeroxMeasuresState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={atmMeroxDefaultMeasureLabels[key] ?? key} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleAtmMeroxSave} className={saveBtnClass(atmMeroxSaved)}>
                        {atmMeroxSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeAtmMeroxPanel === 'bornes' && (
                <>
                  <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Catégories Atm/merox — bornes min/max">
                    <div className="flex min-w-0 shrink-0">
                      {ATM_MEROX_CATEGORIES.map((cat) => (
                        <button
                          key={cat.category || '__empty__'}
                          type="button"
                          onClick={() => setActiveAtmMeroxBoundsCategory(cat.category)}
                          className={categoryTabBtnClass(activeAtmMeroxBoundsCategory === cat.category)}
                          aria-selected={activeAtmMeroxBoundsCategory === cat.category}
                          role="tab"
                        >
                          {atmMeroxDefaultCategoryLabels[cat.category] ?? (cat.category || '—')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-7" role="tabpanel">
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {currentAtmMeroxCategory.subRows.map((subRow) => {
                        const measureKey = getValueKey(currentAtmMeroxCategory.category, subRow);
                        const b = currentAtmMeroxCategoryBounds[subRow] ?? { min: '', max: '' };
                        const label = atmMeroxDefaultMeasureLabels[measureKey] ?? subRow;
                        return (
                          <div key={measureKey} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" title={label}>{label}</span>
                            <input type="text" inputMode="decimal" placeholder="Min" value={b.min} onChange={(e) => updateAtmMeroxBounds(measureKey, 'min', e.target.value)} className={boundsInputClass} aria-label={`${label} min`} />
                            <input type="text" inputMode="decimal" placeholder="Max" value={b.max} onChange={(e) => updateAtmMeroxBounds(measureKey, 'max', e.target.value)} className={boundsInputClass} aria-label={`${label} max`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={handleAtmMeroxSaveBounds} className={saveBtnClass(atmMeroxSavedBounds)}>
                        {atmMeroxSavedBounds ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Analyses du laboratoire page ──────────────────────────────────────────
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex-shrink-0 border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-2xl font-semibold text-primary dark:text-white">
            Paramètre — Analyses du laboratoire
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-6 pt-6 px-6">
        <MenuCard activeId={activePanel} onSelect={setActivePanel} />
        <div className="w-full max-w-2xl">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {activePanel === 'libelles' && (
              <>
                <div className="flex border-b border-stroke dark:border-strokedark" role="tablist" aria-label="Paramètres Analyses du laboratoire">
                  {TAB_CONFIG.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={tabBtnClass(activeTab === tab.id)} aria-selected={activeTab === tab.id} role="tab">
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="p-7" role="tabpanel">
                  {activeTab === 'colonnes' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {products.map((key) => (
                        <div key={key}>
                          <p className="mb-1 text-xs text-bodydark2">{productLabels[key] ?? key}</p>
                          <input id={`prod-${key}`} type="text" value={productsState[key] ?? ''} onChange={(e) => setProductsState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'creneaux' && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {hours.map((key) => (
                        <div key={key}>
                          <p className="mb-1 text-xs text-bodydark2">{hourLabels[key] ?? key}</p>
                          <input id={`hour-${key}`} type="text" value={hoursState[key] ?? ''} onChange={(e) => setHoursState((s) => ({ ...s, [key]: e.target.value }))} className={inputClass} aria-label={key} />
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'lignes' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ANALYSES_MEASURE_NAMES.map((name) => (
                        <div key={name}>
                          <p className="mb-1 text-xs text-bodydark2">{name}</p>
                          <input id={`meas-${name}`} type="text" value={measuresState[name] ?? name} onChange={(e) => setMeasuresState((s) => ({ ...s, [name]: e.target.value }))} className={inputClass} aria-label={name} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end pt-6">
                    <button type="button" onClick={handleSave} className={saveBtnClass(saved)}>
                      {saved ? 'Enregistré' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activePanel === 'bornes' && (
              <>
                <div className="no-scrollbar border-b border-stroke dark:border-strokedark overflow-x-auto" role="tablist" aria-label="Colonnes du tableau Analyses du laboratoire">
                  <div className="flex min-w-0 shrink-0">
                    {boundsProducts.map((product) => (
                      <button
                        key={product}
                        type="button"
                        onClick={() => setActiveBoundsProduct(product)}
                        className={categoryTabBtnClass(activeBoundsProduct === product)}
                        aria-selected={activeBoundsProduct === product}
                        role="tab"
                      >
                        {productLabels[product]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-7" role="tabpanel">
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {ANALYSES_MEASURE_NAMES.map((measure) => (
                      <div key={measure} className="flex flex-wrap items-center gap-3">
                        <label className="w-24 shrink-0 text-sm font-medium text-primary truncate dark:text-primary" htmlFor={`bounds-${activeBoundsProduct}-${measure}-min`} title={measure}>
                          {measure}
                        </label>
                        <input id={`bounds-${activeBoundsProduct}-${measure}-min`} type="text" inputMode="decimal" placeholder="Min" value={currentProductBounds[measure]?.min ?? ''} onChange={(e) => updateBoundsForProduct(activeBoundsProduct, measure, 'min', e.target.value)} className={boundsInputClass} aria-label={`${measure} min`} />
                        <input id={`bounds-${activeBoundsProduct}-${measure}-max`} type="text" inputMode="decimal" placeholder="Max" value={currentProductBounds[measure]?.max ?? ''} onChange={(e) => updateBoundsForProduct(activeBoundsProduct, measure, 'max', e.target.value)} className={boundsInputClass} aria-label={`${measure} max`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-6">
                    <button type="button" onClick={handleSaveBounds} className={saveBtnClass(savedBounds)}>
                      {savedBounds ? 'Enregistré' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
