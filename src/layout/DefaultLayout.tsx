import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SecondaryNavbar from '../components/SecondaryNavbar/index';
import { useAuth } from '../context/AuthContext';
import { FEUILLES_CONFIG } from '../types/feuilles';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAnalysesLaboratoire = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isSaisiePage = pathname === '/saisie' || pathname.startsWith('/saisie/');
  const isGraphiquesPage = pathname.startsWith('/graphique');
  const isTableauxPage = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isSettingsPage = pathname === '/settings' || pathname.startsWith('/settings');

  const SAISIE_IDS = [
    'reformateur-catalytique',
    'production-valeur-electricite',
    'gaz',
    'mouvement-des-bacs',
    'atm-merox-preflash',
    'compresseur-k245',
    'compresseur-k244',
  ];

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
  const settingsTableauSearch = isSettingsPage ? new URLSearchParams(search).get('tableau') : null;

  return (
    <div className="bg-[#f0f9ff] dark:bg-[#1a222c] dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen flex-col overflow-visible">
        {/* <!-- ===== Navbar ===== --> */}
        <div className="z-998 shrink-0 overflow-visible border-b border-stroke dark:border-strokedark">
          <SecondaryNavbar />
        </div>

        {/* <!-- ===== Content Area Start ===== --> */}
        <div
          className={`relative flex flex-1 flex-col overflow-x-hidden ${
            isAnalysesLaboratoire ? 'min-h-0 overflow-y-hidden' : 'overflow-y-auto'
          }`}
        >
          {/* <!-- ===== Main Content Start ===== --> */}
          <main className={isAnalysesLaboratoire ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''}>
            <div
              className={
                isAnalysesLaboratoire
                  ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pt-0.5 pb-4 md:px-6 md:pt-1 md:pb-6 2xl:px-10 2xl:pt-2 2xl:pb-10'
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
            <div className={`flex flex-wrap items-center gap-2 justify-center ${isSaisiePage || isGraphiquesPage || isTableauxPage || isSettingsPage ? 'md:flex-1' : ''}`}>
            {isSaisiePage && (
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

            {isTableauxPage && (
              <div className="inline-flex items-center rounded-md bg-whiter p-1 dark:bg-meta-4">
                {tableauOptionsOrdered.map((opt) => {
                  const isActive =
                    tableauSearch === opt.label ||
                    (!tableauSearch && opt.label === 'Analyses du laboratoire');
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
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary dark:text-bodydark transition hover:bg-stroke hover:text-primary dark:hover:bg-meta-4/50 dark:hover:text-white"
              aria-label="Déconnexion"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </footer>
        {/* ===== Footer End ===== */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;
