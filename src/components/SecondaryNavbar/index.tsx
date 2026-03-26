import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../Header/DarkModeSwitcher';
import DropdownUser from '../Header/DropdownUser';
import { useAuth } from '../../context/AuthContext';
import { useDisplayMode } from '../../context/DisplayModeContext';

const SecondaryNavbar = () => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { tableauHref, graphiqueHref } = useDisplayMode();
  const isDashboardPage = pathname === '/';
  const isSaisiePage = pathname === '/saisie' || pathname.startsWith('/saisie/');
  const isTableauxPage = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isGraphiquesPage = pathname.startsWith('/graphique');
  const isParametragePage = pathname === '/parametrage' || pathname.startsWith('/parametrage/');

  const [mobileOpen, setMobileOpen] = useState(false);

  // Ferme le menu mobile lors d'un changement de route
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
      active
        ? 'bg-primary text-white dark:bg-primary dark:text-white'
        : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block w-full px-4 py-2.5 text-sm font-semibold rounded transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'text-primary dark:text-white hover:bg-stroke dark:hover:bg-meta-4/50'
    }`;

  return (
    <nav className="relative w-full flex-shrink-0 border-stroke bg-white dark:bg-[#23303e] dark:border-strokedark">
      {/* ── Barre principale ── */}
      <div className="flex min-h-[52px] w-full items-center px-4 py-2 md:px-6 2xl:px-11">
        {/* Logo */}
        <Link className="flex h-8 w-8 flex-shrink-0 items-center justify-center" to="/" aria-label="Accueil">
          <img src={LogoIcon} alt="Logo" className="h-8 w-8" />
        </Link>

        {/* Navigation desktop (md+) */}
        <div className="hidden md:flex flex-1 items-center justify-center overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-1">
            <li className="shrink-0 mr-2 pr-2 border-r border-stroke dark:border-strokedark">
              <Link to="/" className={linkClass(isDashboardPage)}>Dashboard</Link>
            </li>
            <li className="shrink-0 mr-2 pr-2 border-r border-stroke dark:border-strokedark">
              <Link to="/saisie/tous" className={linkClass(isSaisiePage)}>Saisie</Link>
            </li>
            <li className="shrink-0 relative">
              <Link to={tableauHref} className={linkClass(isTableauxPage)}>Tableau</Link>
            </li>
            <li className="shrink-0 ml-2 pl-2 border-l border-stroke dark:border-strokedark">
              <Link to={graphiqueHref} className={linkClass(isGraphiquesPage)}>Graphique</Link>
            </li>
            <li className="shrink-0 ml-2 pl-2 border-l border-stroke dark:border-strokedark">
              <Link to="/parametrage?section=mode-affichage" className={linkClass(isParametragePage)}>Paramétrage</Link>
            </li>
          </ul>
        </div>

        {/* Spacer mobile (pousse les icônes à droite) */}
        <div className="flex-1 md:hidden" />

        {/* Icônes droite + bouton hamburger */}
        <div className="relative flex flex-shrink-0 items-center gap-2 overflow-visible">
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary dark:text-white transition hover:bg-stroke hover:text-primary dark:hover:bg-meta-4/50 dark:hover:text-white"
            aria-label="Déconnexion"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          <DarkModeSwitcher />
          <DropdownUser />

          {/* Hamburger — mobile uniquement */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary dark:text-white transition hover:bg-stroke dark:hover:bg-meta-4/50"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              /* X */
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* ☰ */
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Menu déroulant mobile ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stroke dark:border-strokedark bg-white dark:bg-[#23303e] px-4 py-2 flex flex-col gap-1">
          <Link to="/" className={mobileLinkClass(isDashboardPage)}>Dashboard</Link>
          <Link to="/saisie/tous" className={mobileLinkClass(isSaisiePage)}>Saisie</Link>
          <Link to={tableauHref} className={mobileLinkClass(isTableauxPage)}>Tableau</Link>
          <Link to={graphiqueHref} className={mobileLinkClass(isGraphiquesPage)}>Graphique</Link>
          <Link to="/parametrage?section=mode-affichage" className={mobileLinkClass(isParametragePage)}>Paramétrage</Link>
        </div>
      )}
    </nav>
  );
};

export default SecondaryNavbar;
