import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../Header/DarkModeSwitcher';
import DropdownUser from '../Header/DropdownUser';
import { useAuth } from '../../context/AuthContext';

const SecondaryNavbar = () => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const isDashboardPage = pathname === '/';
  const isSaisiePage = pathname === '/saisie' || pathname.startsWith('/saisie/');
  const isTableauxPage = pathname === '/tableaux' || pathname.startsWith('/tableaux/');
  const isGraphiquesPage = pathname.startsWith('/graphique');

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
                to="/tableaux?tableau=Analyses%20du%20laboratoire"
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
                to="/graphique"
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap rounded ${
                  isGraphiquesPage
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-primary hover:text-primary/90 dark:bg-[#313d4a] dark:text-white dark:hover:text-white/90'
                }`}
              >
                Graphique
              </Link>
            </li>
          </ul>
        </div>
        <div className="relative flex flex-shrink-0 items-center gap-3 overflow-visible">
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary dark:text-bodydark transition hover:bg-stroke hover:text-primary dark:hover:bg-meta-4/50 dark:hover:text-white"
            aria-label="Déconnexion"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          <Link
            to="/settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary dark:text-bodydark transition hover:bg-stroke hover:text-primary dark:hover:bg-meta-4/50 dark:hover:text-white"
            aria-label="Paramètres"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <DarkModeSwitcher />
          <DropdownUser />
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNavbar;
