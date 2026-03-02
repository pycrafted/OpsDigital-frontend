import React, { ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SecondaryNavbar from '../components/SecondaryNavbar/index';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useTableView } from '../context/TableViewContext';
import { ALL_HOURS, HOUR_LABELS, useSaisieFilter } from '../context/SaisieFilterContext';
import { useGraphiqueFilter } from '../context/GraphiqueFilterContext';
import { useTableauxFilter } from '../context/TableauxFilterContext';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname, search } = useLocation();
  const { hideEmptyColumns, toggleHideEmptyColumns } = useTableView();
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
  const isSettingsPage = pathname === '/settings' || pathname.startsWith('/settings');

  const SAISIE_IDS: string[] = [];

  const saisieFeuillesOrdered = FEUILLES_CONFIG.filter((f) => SAISIE_IDS.includes(f.id)).sort(
    (a, b) => a.title.localeCompare(b.title, 'fr'),
  );

  const GRAPHIQUE_ROUTES: { path: string; label: string }[] = [
    { path: '/graphique', label: 'Analyses du laboratoire' },
    { path: '/graphique/reformateur-catalytique', label: 'Réformateur catalytique' },
    { path: '/graphique/production', label: 'Production' },
    { path: '/graphique/mouvement-des-bacs', label: 'Mouvement des bacs' },
    { path: '/graphique/compresseur-k245', label: 'Compresseur K 245' },
    { path: '/graphique/compresseur-k244', label: 'Compresseur K 244' },
    { path: '/graphique/atm-merox-pre-flash', label: 'Atm/merox & pré flash' },
    { path: '/graphique/gaz', label: 'Gaz' },
  ];

  const graphiqueRoutesOrdered = [...GRAPHIQUE_ROUTES].sort((a, b) =>
    a.label.localeCompare(b.label, 'fr'),
  );

  const TABLEAU_OPTIONS: { label: string }[] = [
    { label: 'Analyses du laboratoire' },
    { label: 'Réformateur catalytique' },
    { label: 'Production' },
    { label: 'Gaz' },
    { label: 'Mouvement des bacs' },
    { label: 'Atm/merox & pré flash' },
    { label: 'Compresseur K 245' },
    { label: 'Compresseur K 244' },
  ];

  const tableauOptionsOrdered = [...TABLEAU_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label, 'fr'),
  );

  const tableauSearch = new URLSearchParams(search).get('tableau');
  const isShowAllTablesPage = isTableauxPage && tableauSearch === 'Tout';
  const isShowAllGraphsPage = pathname === '/graphique/tous';
  const settingsTableauSearch = isSettingsPage ? new URLSearchParams(search).get('tableau') : null;

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
                    className="w-[7rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />
                )}
                {duration === 'month' && (
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[6.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* <!-- ===== Filtre date (tableaux/tous) ===== --> */}
        {isShowAllTablesPage && (
          <div className="z-40 shrink-0 border-b border-stroke bg-[#f0f9ff] dark:border-strokedark dark:bg-[#23303e]">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center px-4 py-2 md:px-6 2xl:px-11">
              <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                <input
                  type="date"
                  value={tableauxDate}
                  max={tableauxToday}
                  onChange={(e) => setTableauxDate(e.target.value)}
                  className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                />
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
                      ? 'w-full px-4 pt-0 pb-4 md:px-6 md:pb-6 2xl:px-10 2xl:pb-10'
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
        <footer className="shrink-0 border-t border-stroke bg-[#f0f9ff] px-4 py-3 dark:border-strokedark dark:bg-[#1a222c]">
          <div className="mx-auto flex max-w-screen-2xl w-full flex-row flex-wrap items-center justify-center gap-2 md:justify-between">
            {(isTableauxPage || isGraphiquesPage || isSaisiePage) && (
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
                {(isTableauxPage || isSaisieTousPage) && (
                  <Link
                    to="/tableaux?tableau=Tout"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      tableauSearch === 'Tout'
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'text-primary dark:text-bodydark hover:bg-stroke dark:hover:bg-meta-4/50 dark:hover:text-white'
                    }`}
                    aria-label="Afficher tous les tableaux"
                    title="Afficher tous les tableaux"
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
            <div className={`flex flex-wrap items-center gap-2 justify-center ${isSaisiePage || isGraphiquesPage || isTableauxPage || isSettingsPage ? 'md:flex-1' : ''}`}>
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

            {(isTableauxPage || isSaisieTousPage) && (
              <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                {tableauOptionsOrdered.map((opt) => {
                  const isActive =
                    tableauSearch === opt.label ||
                    (!tableauSearch && !isSaisieTousPage && opt.label === 'Analyses du laboratoire');
                  const to = `/tableaux?tableau=${encodeURIComponent(opt.label)}`;
                  return (
                    <Link
                      key={opt.label}
                      to={to}
                      className={`rounded py-1 px-3 text-xs font-medium text-[#3c50e0] dark:text-white ${
                        isActive
                          ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                          : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                      }`}
                    >
                      {opt.label}
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

            {isSettingsPage && (
              <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                {tableauOptionsOrdered.map((opt) => {
                  const isActive =
                    settingsTableauSearch === opt.label ||
                    (!settingsTableauSearch && opt.label === 'Analyses du laboratoire');
                  const to = `/settings?tableau=${encodeURIComponent(opt.label)}`;
                  return (
                    <Link
                      key={opt.label}
                      to={to}
                      className={`rounded py-1 px-3 text-xs font-medium text-[#3c50e0] dark:text-white ${
                        isActive
                          ? 'bg-white shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:hover:bg-boxdark'
                          : 'hover:bg-white hover:shadow-card dark:hover:bg-boxdark'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            )}
            </div>
            {isTableauxPage && (
              <div className="flex items-center gap-1 md:order-last">
                <button
                  type="button"
                  onClick={toggleHideEmptyColumns}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    hideEmptyColumns
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'text-primary dark:text-bodydark hover:bg-stroke dark:hover:bg-meta-4/50 dark:hover:text-white'
                  }`}
                  aria-label={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes vides'}
                  title={hideEmptyColumns ? 'Afficher toutes les colonnes' : 'Masquer les colonnes sans données'}
                >
                  {hideEmptyColumns ? (
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth={2} />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </footer>
        {/* ===== Footer End ===== */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;
