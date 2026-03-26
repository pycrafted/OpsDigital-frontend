import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SecondaryNavbar from '../components/SecondaryNavbar/index';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useTableView } from '../context/TableViewContext';
import { ALL_HOURS, HOUR_LABELS, useSaisieFilter } from '../context/SaisieFilterContext';
import { useGraphiqueFilter } from '../context/GraphiqueFilterContext';
import { useTableauxFilter } from '../context/TableauxFilterContext';
import { useRenommage } from '../context/RenommageContext';
import { useAuth } from '../context/AuthContext';
import { usePrefetch } from '../hooks/usePrefetch';
import { exportProductionExcel } from '../api/production';
import { exportReformateurExcel } from '../api/reformateur';
import { exportAtmMeroxExcel } from '../api/atmMerox';
import { exportCompresseurK244Excel } from '../api/compresseurK244';
import { exportCompresseurK245Excel } from '../api/compresseurK245';
import { exportGazExcel } from '../api/gaz';
import { exportAnalysesLaboratoireExcel } from '../api/analysesLaboratoire';
import { exportMouvementDesBacsExcel } from '../api/mouvementDesBacs';

const EXPORTABLE_TABLEAUX: { feuilleId: string; label: string; fn: (s: string, e: string) => Promise<void> }[] = [
  { feuilleId: 'analyses-laboratoire',       label: 'Analyses du laboratoire',  fn: exportAnalysesLaboratoireExcel },
  { feuilleId: 'production-valeur-electricite', label: 'Production',            fn: exportProductionExcel },
  { feuilleId: 'reformateur-catalytique',    label: 'Réformateur catalytique',  fn: exportReformateurExcel },
  { feuilleId: 'atm-merox-preflash',         label: 'Atm/merox & pré flash',    fn: exportAtmMeroxExcel },
  { feuilleId: 'compresseur-k244',           label: 'Compresseur K 244',        fn: exportCompresseurK244Excel },
  { feuilleId: 'compresseur-k245',           label: 'Compresseur K 245',        fn: exportCompresseurK245Excel },
  { feuilleId: 'gaz',                        label: 'Gaz',                      fn: exportGazExcel },
  { feuilleId: 'mouvement-des-bacs',         label: 'Mouvement des bacs',       fn: exportMouvementDesBacsExcel },
];

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  usePrefetch();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportSelectedTableaux, setExportSelectedTableaux] = useState<Set<string>>(new Set());
  const { pathname, search } = useLocation();
  const { isAdmin } = useAuth();
  const { hideEmptyColumns, toggleHideEmptyColumns, canEdit, toggleCanEdit } = useTableView();
  const { date, setDate, hour, setHour, today } = useSaisieFilter();
  const hourIndex = ALL_HOURS.indexOf(hour);
  const previousHour = ALL_HOURS[hourIndex > 0 ? hourIndex - 1 : ALL_HOURS.length - 1];
  const nextHour = ALL_HOURS[hourIndex < ALL_HOURS.length - 1 ? hourIndex + 1 : 0];
  const { duration, setDuration, selectedDate, setSelectedDate, selectedWeek, setSelectedWeek, selectedMonth, setSelectedMonth } = useGraphiqueFilter();
  const _gDurations = ['day', 'week', 'month'] as const;
  const _gDurationLabels: Record<string, string> = { day: 'Jour', week: 'Semaine', month: 'Mois' };
  const _gIdx = _gDurations.indexOf(duration as 'day' | 'week' | 'month');
  const _gPrevDur = _gDurations[_gIdx > 0 ? _gIdx - 1 : _gDurations.length - 1];
  const _gNextDur = _gDurations[_gIdx < _gDurations.length - 1 ? _gIdx + 1 : 0];
  const { selectedDate: tableauxDate, setSelectedDate: setTableauxDate, today: tableauxToday } = useTableauxFilter();
  const { getFeuilleTitle } = useRenommage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const isAnalysesLaboratoire = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isSaisiePage = pathname === '/saisie' || pathname.startsWith('/saisie/');
  const isSaisieTousPage = pathname === '/saisie/tous';
  const isGraphiquesPage = pathname.startsWith('/graphique');
  const isTableauxPage = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isParametragePage = pathname === '/parametrage';
  const isProfilePage = pathname === '/profile';

  const PARAMETRAGE_SECTIONS_ALL = [
    { id: 'mode-affichage', label: "Mode d'affichage", adminOnly: false },
    { id: 'renommage', label: 'Renommage', adminOnly: true },
    { id: 'visibilite-saisie', label: 'Visibilité Saisie', adminOnly: true },
    { id: 'tags-ip21', label: 'Tags IP21', adminOnly: true },
    { id: 'bornes', label: 'Bornes min/max', adminOnly: true },
  ];
  const PARAMETRAGE_SECTIONS = PARAMETRAGE_SECTIONS_ALL.filter((s) => !s.adminOnly || isAdmin);

  const PROFILE_SECTIONS_ALL = [
    { id: 'profil', label: 'Mon profil', adminOnly: false },
    { id: 'utilisateurs', label: 'Utilisateurs', adminOnly: true },
  ];
  const PROFILE_SECTIONS = PROFILE_SECTIONS_ALL.filter((s) => !s.adminOnly || isAdmin);

  const parametrageSection = new URLSearchParams(search).get('section') ?? 'mode-affichage';
  const profileSection = new URLSearchParams(search).get('section') ?? 'profil';

  const SAISIE_IDS: string[] = [];

  const saisieFeuillesOrdered = FEUILLES_CONFIG.filter((f) => SAISIE_IDS.includes(f.id)).sort(
    (a, b) => a.title.localeCompare(b.title, 'fr'),
  );

  const GRAPHIQUE_ROUTES: { path: string; label: string; feuilleId: string }[] = [
    { path: '/graphique', label: 'Analyses du laboratoire', feuilleId: 'analyses-laboratoire' },
    { path: '/graphique/reformateur-catalytique', label: 'Réformateur catalytique', feuilleId: 'reformateur-catalytique' },
    { path: '/graphique/production', label: 'Production', feuilleId: 'production-valeur-electricite' },
    { path: '/graphique/mouvement-des-bacs', label: 'Mouvement des bacs', feuilleId: 'mouvement-des-bacs' },
    { path: '/graphique/compresseur-k245', label: 'Compresseur K 245', feuilleId: 'compresseur-k245' },
    { path: '/graphique/compresseur-k244', label: 'Compresseur K 244', feuilleId: 'compresseur-k244' },
    { path: '/graphique/atm-merox-pre-flash', label: 'Atm/merox & pré flash', feuilleId: 'atm-merox-preflash' },
    { path: '/graphique/gaz', label: 'Gaz', feuilleId: 'gaz' },
  ];

  const graphiqueRoutesOrdered = [...GRAPHIQUE_ROUTES].sort((a, b) =>
    a.label.localeCompare(b.label, 'fr'),
  );

  const TABLEAU_OPTIONS: { label: string; feuilleId: string }[] = [
    { label: 'Analyses du laboratoire', feuilleId: 'analyses-laboratoire' },
    { label: 'Réformateur catalytique', feuilleId: 'reformateur-catalytique' },
    { label: 'Production', feuilleId: 'production-valeur-electricite' },
    { label: 'Gaz', feuilleId: 'gaz' },
    { label: 'Mouvement des bacs', feuilleId: 'mouvement-des-bacs' },
    { label: 'Atm/merox & pré flash', feuilleId: 'atm-merox-preflash' },
    { label: 'Compresseur K 245', feuilleId: 'compresseur-k245' },
    { label: 'Compresseur K 244', feuilleId: 'compresseur-k244' },
  ];

  const tableauOptionsOrdered = [...TABLEAU_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label, 'fr'),
  );

  const tableauSearch = new URLSearchParams(search).get('tableau');
  const isShowAllTablesPage = isTableauxPage && tableauSearch === 'Tout';
  const activeTableauLabel = tableauSearch && tableauOptionsOrdered.some(o => o.label === tableauSearch)
    ? tableauSearch
    : 'Analyses du laboratoire';
  const activeFeuilleId = tableauOptionsOrdered.find(o => o.label === activeTableauLabel)?.feuilleId ?? '';
  const isShowAllGraphsPage = pathname === '/graphique/tous';

  return (
    <div className="bg-[#f0f9ff] dark:bg-[#1a222c] dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen flex-col overflow-visible">
        {/* <!-- ===== Navbar ===== --> */}
        <div className="z-998 shrink-0 overflow-visible border-b border-stroke dark:border-strokedark">
          <SecondaryNavbar />
        </div>

        {/* <!-- ===== Filtre date/heure (saisie/tous) ===== --> */}
        {isSaisieTousPage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-3 items-center gap-4 px-4 py-2 md:px-6 2xl:px-11">
              <div />
              <div className="flex justify-center gap-3">
                {/* Filtre date */}
                <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                  <label className="sr-only" htmlFor="layout-saisie-date">Date</label>
                  <input
                    id="layout-saisie-date"
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                  />
                </div>
                {/* Filtre heure */}
                <div
                  className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]"
                  role="group"
                  aria-label="Créneau"
                >
                  <button
                    type="button"
                    onClick={() => setHour(previousHour)}
                    className="rounded-l px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    title={`Créneau précédent (${HOUR_LABELS[previousHour]})`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="min-w-[2.5rem] py-0.5 text-center text-xs font-bold text-primary dark:text-white">
                    {HOUR_LABELS[hour]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHour(nextHour)}
                    className="rounded-r px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    title={`Créneau suivant (${HOUR_LABELS[nextHour]})`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div />
            </div>
          </div>
        )}

        {/* <!-- ===== Filtre période/date (graphique/tous) ===== --> */}
        {isShowAllGraphsPage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center gap-3 px-4 py-2 md:px-6 2xl:px-11">
              {/* Sélecteur Jour/Semaine/Mois */}
              <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]" role="group" aria-label="Période">
                <button
                  type="button"
                  onClick={() => setDuration(_gPrevDur)}
                  className="rounded-l px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                  title={`Période précédente (${_gDurationLabels[_gPrevDur]})`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="min-w-[4rem] py-0.5 text-center text-xs font-bold text-primary dark:text-white">
                  {_gDurationLabels[duration] ?? duration}
                </span>
                <button
                  type="button"
                  onClick={() => setDuration(_gNextDur)}
                  className="rounded-r px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                  title={`Période suivante (${_gDurationLabels[_gNextDur]})`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* Input date/semaine/mois */}
              <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                {duration === 'day' && (
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />
                )}
                {duration === 'week' && (
                  <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-[8rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />
                )}
                {duration === 'month' && (
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[6.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* <!-- ===== Navbar secondaire Tableaux ===== --> */}
        {isTableauxPage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-3 items-center gap-2 px-4 py-2 md:px-6 2xl:px-11">
              <div />
              {/* Centre : menu + navigateur + oeil (non-Tout) ou date + oeil (Tout) */}
              <div className="flex justify-center">
                {!isShowAllTablesPage ? (() => {
                  const activeLabel = tableauSearch && tableauOptionsOrdered.some(o => o.label === tableauSearch)
                    ? tableauSearch
                    : 'Analyses du laboratoire';
                  const activeIdx = tableauOptionsOrdered.findIndex(o => o.label === activeLabel);
                  const activeOpt = tableauOptionsOrdered[activeIdx];
                  const prevOpt = tableauOptionsOrdered[activeIdx > 0 ? activeIdx - 1 : tableauOptionsOrdered.length - 1];
                  const nextOpt = tableauOptionsOrdered[activeIdx < tableauOptionsOrdered.length - 1 ? activeIdx + 1 : 0];
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleHideEmptyColumns}
                        className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                          hideEmptyColumns
                            ? 'border-primary bg-primary text-white hover:bg-primary/90'
                            : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                        }`}
                        aria-label={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes vides'}
                        title={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes sans données'}
                      >
                        {hideEmptyColumns ? (
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" strokeWidth={2} />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth={2} />
                          </svg>
                        )}
                      </button>
                      <div
                        className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]"
                        role="group"
                        aria-label="Tableau"
                      >
                        <Link
                          to={`/tableaux?tableau=${encodeURIComponent(prevOpt.label)}`}
                          className="rounded-l px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                          title={getFeuilleTitle(prevOpt.feuilleId)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Link>
                        <span className="min-w-[11rem] py-0.5 text-center text-xs font-bold text-primary dark:text-white">
                          {getFeuilleTitle(activeOpt.feuilleId)}
                        </span>
                        <Link
                          to={`/tableaux?tableau=${encodeURIComponent(nextOpt.label)}`}
                          className="rounded-r px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                          title={getFeuilleTitle(nextOpt.feuilleId)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={toggleCanEdit}
                        className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                          canEdit
                            ? 'border-primary bg-primary text-white hover:bg-primary/90'
                            : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                        }`}
                        aria-label={canEdit ? 'Verrouiller' : 'Déverrouiller'}
                        title={canEdit ? 'Verrouiller la modification' : 'Autoriser la modification'}
                      >
                        {canEdit ? (
                          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0010 5.5V9H3a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V5.5A4.5 4.5 0 0014.5 1zM12 9V5.5a2 2 0 10-4 0V9h4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      {(activeOpt.feuilleId === 'production-valeur-electricite' || activeOpt.feuilleId === 'reformateur-catalytique' || activeOpt.feuilleId === 'atm-merox-preflash' || activeOpt.feuilleId === 'compresseur-k244' || activeOpt.feuilleId === 'compresseur-k245' || activeOpt.feuilleId === 'gaz' || activeOpt.feuilleId === 'analyses-laboratoire' || activeOpt.feuilleId === 'mouvement-des-bacs') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!showExportPanel) {
                              setExportStart(tableauxDate);
                              setExportEnd(tableauxDate);
                            }
                            setShowExportPanel(prev => !prev);
                          }}
                          className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                            showExportPanel
                              ? 'border-primary bg-primary text-white hover:bg-primary/90'
                              : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                          }`}
                          aria-label="Exporter en Excel"
                          title="Exporter en Excel (.xlsx)"
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })() : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleHideEmptyColumns}
                      className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                        hideEmptyColumns
                          ? 'border-primary bg-primary text-white hover:bg-primary/90'
                          : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                      }`}
                      aria-label={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes vides'}
                      title={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes sans données'}
                    >
                      {hideEmptyColumns ? (
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" strokeWidth={2} />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth={2} />
                        </svg>
                      )}
                    </button>
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <input
                        type="date"
                        value={tableauxDate}
                        max={tableauxToday}
                        onChange={(e) => setTableauxDate(e.target.value)}
                        className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={toggleCanEdit}
                      className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                        canEdit
                          ? 'border-primary bg-primary text-white hover:bg-primary/90'
                          : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                      }`}
                      aria-label={canEdit ? 'Verrouiller' : 'Déverrouiller'}
                      title={canEdit ? 'Verrouiller la modification' : 'Autoriser la modification'}
                    >
                      {canEdit ? (
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0010 5.5V9H3a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V5.5A4.5 4.5 0 0014.5 1zM12 9V5.5a2 2 0 10-4 0V9h4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showExportPanel) {
                          setExportStart(tableauxDate);
                          setExportEnd(tableauxDate);
                        }
                        setShowExportPanel(prev => !prev);
                      }}
                      className={`flex shrink-0 items-center justify-center rounded border px-2 py-1 shadow transition ${
                        showExportPanel
                          ? 'border-primary bg-primary text-white hover:bg-primary/90'
                          : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                      }`}
                      aria-label="Exporter en Excel"
                      title="Exporter en Excel (.xlsx)"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div />
            </div>
            {/* Panel export Excel — collé sous la barre */}
            {/* Panel export Excel — page Tout */}
            {showExportPanel && isShowAllTablesPage && (
              <div className="border-t border-stroke bg-white px-4 py-3 dark:border-strokedark dark:bg-[#1e2d3d]">
                <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-primary dark:text-white">Tableaux à exporter (.xlsx)</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {EXPORTABLE_TABLEAUX.map(t => (
                        <label key={t.feuilleId} className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-bodydark2 dark:text-bodydark hover:text-primary dark:hover:text-white">
                          <input
                            type="checkbox"
                            checked={exportSelectedTableaux.has(t.feuilleId)}
                            onChange={(e) => {
                              setExportSelectedTableaux(prev => {
                                const next = new Set(prev);
                                e.target.checked ? next.add(t.feuilleId) : next.delete(t.feuilleId);
                                return next;
                              });
                            }}
                            className="accent-primary"
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-bodydark2 dark:text-bodydark">Du</label>
                      <div className="flex items-center rounded border border-primary bg-[#f0f9ff] px-2 py-1 dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <input
                          type="date"
                          value={exportStart}
                          max={tableauxToday}
                          onChange={(e) => setExportStart(e.target.value)}
                          className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-bodydark2 dark:text-bodydark">Au</label>
                      <div className="flex items-center rounded border border-primary bg-[#f0f9ff] px-2 py-1 dark:border-[#313d4a] dark:bg-[#313d4a]">
                        <input
                          type="date"
                          value={exportEnd}
                          min={exportStart}
                          max={tableauxToday}
                          onChange={(e) => setExportEnd(e.target.value)}
                          className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isExporting || !exportStart || !exportEnd || exportSelectedTableaux.size === 0}
                      onClick={() => {
                        const selected = EXPORTABLE_TABLEAUX.filter(t => exportSelectedTableaux.has(t.feuilleId));
                        setIsExporting(true);
                        selected.reduce(
                          (chain, t) => chain.then(() => t.fn(exportStart, exportEnd)),
                          Promise.resolve()
                        ).then(() => setShowExportPanel(false)).finally(() => setIsExporting(false));
                      }}
                      className="flex items-center gap-1.5 rounded border border-primary bg-primary px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExporting ? (
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      )}
                      {isExporting ? 'Export en cours…' : `Télécharger${exportSelectedTableaux.size > 0 ? ` (${exportSelectedTableaux.size})` : ''}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExportPanel(false)}
                      className="flex items-center justify-center rounded border border-stroke bg-white px-2 py-1 text-xs text-bodydark2 shadow transition hover:bg-black/5 dark:border-strokedark dark:bg-[#313d4a] dark:text-bodydark dark:hover:bg-white/10"
                      title="Fermer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Panel export Excel — page tableau individuel */}
            {showExportPanel && !isShowAllTablesPage && (activeFeuilleId === 'production-valeur-electricite' || activeFeuilleId === 'reformateur-catalytique' || activeFeuilleId === 'atm-merox-preflash' || activeFeuilleId === 'compresseur-k244' || activeFeuilleId === 'compresseur-k245' || activeFeuilleId === 'gaz' || activeFeuilleId === 'analyses-laboratoire' || activeFeuilleId === 'mouvement-des-bacs') && (
              <div className="border-t border-stroke bg-white px-4 py-3 dark:border-strokedark dark:bg-[#1e2d3d]">
                <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-primary dark:text-white">Exporter Production (.xlsx)</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-bodydark2 dark:text-bodydark">Du</label>
                    <div className="flex items-center rounded border border-primary bg-[#f0f9ff] px-2 py-1 dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <input
                        type="date"
                        value={exportStart}
                        max={tableauxToday}
                        onChange={(e) => setExportStart(e.target.value)}
                        className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-bodydark2 dark:text-bodydark">Au</label>
                    <div className="flex items-center rounded border border-primary bg-[#f0f9ff] px-2 py-1 dark:border-[#313d4a] dark:bg-[#313d4a]">
                      <input
                        type="date"
                        value={exportEnd}
                        min={exportStart}
                        max={tableauxToday}
                        onChange={(e) => setExportEnd(e.target.value)}
                        className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isExporting || !exportStart || !exportEnd}
                    onClick={() => {
                      setIsExporting(true);
                      const fn = activeFeuilleId === 'reformateur-catalytique'
                        ? exportReformateurExcel(exportStart, exportEnd)
                        : activeFeuilleId === 'atm-merox-preflash'
                          ? exportAtmMeroxExcel(exportStart, exportEnd)
                          : activeFeuilleId === 'compresseur-k244'
                            ? exportCompresseurK244Excel(exportStart, exportEnd)
                            : activeFeuilleId === 'compresseur-k245'
                              ? exportCompresseurK245Excel(exportStart, exportEnd)
                              : activeFeuilleId === 'gaz'
                                ? exportGazExcel(exportStart, exportEnd)
                                : activeFeuilleId === 'analyses-laboratoire'
                                  ? exportAnalysesLaboratoireExcel(exportStart, exportEnd)
                                  : activeFeuilleId === 'mouvement-des-bacs'
                                    ? exportMouvementDesBacsExcel(exportStart, exportEnd)
                                    : exportProductionExcel(exportStart, exportEnd);
                      fn.then(() => setShowExportPanel(false)).finally(() => setIsExporting(false));
                    }}
                    className="flex items-center gap-1.5 rounded border border-primary bg-primary px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isExporting ? (
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {isExporting ? 'Export en cours…' : 'Télécharger'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExportPanel(false)}
                    className="flex items-center justify-center rounded border border-stroke bg-white px-2 py-1 text-xs text-bodydark2 shadow transition hover:bg-black/5 dark:border-strokedark dark:bg-[#313d4a] dark:text-bodydark dark:hover:bg-white/10"
                    title="Fermer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* <!-- ===== Navbar secondaire Graphiques ===== --> */}
        {isGraphiquesPage && !isShowAllGraphsPage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-3 items-center gap-2 px-4 py-2 md:px-6 2xl:px-11">
              <div />
              <div className="flex justify-center">
                {(() => {
                  const activeRoute = graphiqueRoutesOrdered.find(r => r.path === pathname) ?? graphiqueRoutesOrdered[0];
                  const activeIdx = graphiqueRoutesOrdered.indexOf(activeRoute);
                  const prevRoute = graphiqueRoutesOrdered[activeIdx > 0 ? activeIdx - 1 : graphiqueRoutesOrdered.length - 1];
                  const nextRoute = graphiqueRoutesOrdered[activeIdx < graphiqueRoutesOrdered.length - 1 ? activeIdx + 1 : 0];
                  return (
                    <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]" role="group" aria-label="Graphique">
                      <Link
                        to={prevRoute.path}
                        className="rounded-l px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                        title={getFeuilleTitle(prevRoute.feuilleId)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Link>
                      <span className="min-w-[11rem] py-0.5 text-center text-xs font-bold text-primary dark:text-white">
                        {getFeuilleTitle(activeRoute.feuilleId)}
                      </span>
                      <Link
                        to={nextRoute.path}
                        className="rounded-r px-2 py-0.5 text-primary hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                        title={getFeuilleTitle(nextRoute.feuilleId)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  );
                })()}
              </div>
              <div />
            </div>
          </div>
        )}

        {/* <!-- ===== Navbar secondaire Paramétrage ===== --> */}
        {isParametragePage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center px-4 py-2 md:px-6 2xl:px-11">
              <div className="flex items-center gap-2">
                {PARAMETRAGE_SECTIONS.map((section) => (
                  <Link
                    key={section.id}
                    to={`/parametrage?section=${section.id}`}
                    className={`rounded border px-3 py-1 text-xs font-bold shadow transition ${
                      parametrageSection === section.id
                        ? 'border-primary bg-primary text-white hover:bg-primary/90'
                        : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* <!-- ===== Navbar secondaire Profil ===== --> */}
        {isProfilePage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center px-4 py-2 md:px-6 2xl:px-11">
              <div className="flex items-center gap-2">
                {PROFILE_SECTIONS.map((section) => (
                  <Link
                    key={section.id}
                    to={`/profile?section=${section.id}`}
                    className={`rounded border px-3 py-1 text-xs font-bold shadow transition ${
                      profileSection === section.id
                        ? 'border-primary bg-primary text-white hover:bg-primary/90'
                        : 'border-primary bg-white text-primary dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white hover:bg-primary/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div
          ref={scrollContainerRef}
          className={`relative flex flex-1 flex-col overflow-x-hidden ${
            isAnalysesLaboratoire && !isShowAllTablesPage ? 'min-h-0 overflow-y-hidden' : 'overflow-y-auto'
          }`}
        >
          {/* <!-- ===== Main Content Start ===== --> */}
          <main className={isAnalysesLaboratoire && !isShowAllTablesPage ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''}>
            <div
              className={
                isAnalysesLaboratoire && !isShowAllTablesPage
                  ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pt-0.5 pb-4 md:px-6 md:pt-1 md:pb-6 2xl:px-10 2xl:pt-2 2xl:pb-10'
                  : isAnalysesLaboratoire && isShowAllTablesPage
                    ? 'w-full px-4 pt-0 pb-4 md:px-6 md:pb-6 2xl:px-10 2xl:pb-10'
                    : isGraphiquesPage && isShowAllGraphsPage
                      ? 'mx-auto max-w-screen-2xl px-4 pt-0 pb-4 md:px-6 md:pb-6 2xl:px-10 2xl:pb-10'
                      : isGraphiquesPage
                        ? 'mx-auto max-w-screen-2xl px-4 pt-0.5 pb-1 md:px-6 md:pt-1 md:pb-2 2xl:px-10 2xl:pt-2 2xl:pb-3'
                        : 'mx-auto max-w-screen-2xl px-4 pt-0.5 pb-4 md:px-6 md:pt-1 md:pb-6 2xl:px-10 2xl:pt-2 2xl:pb-10'
              }
            >
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}

        {/* ===== Footer Start ===== */}
        {!isSaisieTousPage && !isTableauxPage && !isShowAllGraphsPage && !isGraphiquesPage && <footer className="shrink-0 border-t border-stroke bg-[#f0f9ff] px-4 py-3 dark:border-strokedark dark:bg-[#1a222c]">
          <div className="mx-auto flex max-w-screen-2xl w-full flex-row flex-wrap items-center justify-center gap-2 md:justify-between">
            {(isGraphiquesPage || isSaisiePage) && (
              <div className="flex items-center gap-1 md:order-first">
                {isSaisiePage && !isSaisieTousPage && (
                  <Link
                    to="/saisie/tous"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      pathname === '/saisie/tous'
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'text-primary dark:text-bodydark hover:bg-stroke dark:hover:bg-meta-4/50 dark:hover:text-white'
                    }`}
                    aria-label="Afficher toutes les feuilles de saisie"
                    title="Afficher toutes les feuilles de saisie"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </Link>
                )}
                {isGraphiquesPage && (
                  <Link
                    to="/graphique/tous"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      pathname === '/graphique/tous'
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'text-primary dark:text-bodydark hover:bg-stroke dark:hover:bg-meta-4/50 dark:hover:text-white'
                    }`}
                    aria-label="Afficher tous les graphiques"
                    title="Afficher tous les graphiques"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
            <div className={`flex flex-wrap items-center gap-2 justify-center ${isSaisiePage || isGraphiquesPage ? 'md:flex-1' : ''}`}>
            {isSaisiePage && !isSaisieTousPage && (
              <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                {saisieFeuillesOrdered.map((feuille) => {
                  const isActive = pathname === `/saisie/${feuille.id}`;
                  return (
                    <Link
                      key={feuille.id}
                      to={`/saisie/${feuille.id}`}
                      className={`rounded py-1 px-3 text-xs font-medium text-[#3c50e0] dark:text-white ${
                        isActive
                          ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                          : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                      }`}
                    >
                      {feuille.title}
                    </Link>
                  );
                })}
              </div>
            )}
            {isGraphiquesPage && (
              <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                {graphiqueRoutesOrdered.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded py-1 px-3 text-xs font-medium text-[#3c50e0] dark:text-white ${
                        isActive
                          ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                          : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </footer>}
        {/* ===== Footer End ===== */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;
