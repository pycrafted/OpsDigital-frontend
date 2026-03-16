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

  return (
    <nav className="flex min-h-[52px] w-full flex-shrink-0 items-center border-stroke bg-white dark:bg-[#23303e] dark:border-strokedark">
      <div className="flex w-full items-center px-4 py-2 md:px-6 2xl:px-11">
        <Link className="flex h-8 w-8 flex-shrink-0 items-center justify-center" to="/" aria-label="Accueil">
          <img src={LogoIcon} alt="Logo" className="h-8 w-8" />
        </Link>
        <div className="flex flex-1 items-center justify-center overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-1">
            <li className="shrink-0 mr-2 pr-2 border-r border-stroke dark:border-strokedark">
              <Link
                to="/"
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isDashboardPage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Dashboard
              </Link>
            </li>
            <li className="shrink-0 mr-2 pr-2 border-r border-stroke dark:border-strokedark">
              <Link
                to="/saisie/tous"
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isSaisiePage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Saisie
              </Link>
            </li>
            <li className="shrink-0 relative">
              <Link
                to={tableauHref}
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isTableauxPage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Tableau
              </Link>
            </li>
            <li className="shrink-0 ml-2 pl-2 border-l border-stroke dark:border-strokedark">
              <Link
                to={graphiqueHref}
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isGraphiquesPage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Graphique
              </Link>
            </li>
            <li className="shrink-0 ml-2 pl-2 border-l border-stroke dark:border-strokedark">
              <Link
                to="/parametrage"
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isParametragePage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Paramétrage
              </Link>
            </li>
          </ul>
        </div>
        <div className="relative flex flex-shrink-0 items-center gap-3 overflow-visible">
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
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNavbar;
