import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../Header/DarkModeSwitcher';
import DropdownUser from '../Header/DropdownUser';

const SecondaryNavbar = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap underline underline-offset-2 decoration-gray-400 dark:decoration-white ${
      isActive
        ? 'bg-primary text-white dark:bg-primary dark:text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-black dark:text-bodydark1 dark:hover:bg-meta-4 dark:hover:text-white'
    }`;

  const dashboardLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap border-2 ${
      isActive
        ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white'
        : 'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary dark:border-primary dark:bg-primary/10 dark:text-white dark:hover:bg-primary/20'
    }`;

  return (
    <nav
      className="flex min-h-[52px] w-full flex-shrink-0 items-center border-stroke bg-white dark:bg-boxdark dark:border-strokedark"
    >
      <div className="flex w-full items-center px-4 py-2 md:px-6 2xl:px-11">
        <Link className="flex h-8 w-8 flex-shrink-0 items-center justify-center" to="/" aria-label="Accueil">
          <img src={LogoIcon} alt="Logo" className="h-8 w-8" />
        </Link>
        <div className="flex flex-1 items-center justify-center overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-1">
          <li className="shrink-0 mr-2 pr-2 border-r border-stroke dark:border-strokedark">
            <NavLink to="/" className={dashboardLinkClass}>Saisie</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/analyses-laboratoire" className={linkClass}>Analyses du laboratoire</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/reformateur-catalytique" className={linkClass}>Réformateur catalytique</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/mouvement-des-bacs" className={linkClass}>Mouvement des bacs</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/production-valeur-electricite" className={linkClass}>valeur/electricité</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/compresseur-k245" className={linkClass}>Compresseur K 245</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/compresseur-k244" className={linkClass}>Compresseur K 244</NavLink>
          </li>
          <li className="shrink-0">
            <NavLink to="/atm-merox-preflash" className={linkClass}>ATM/MEROX & PRE-FLASH</NavLink>
          </li>
          <li className="shrink-0 ml-2 pl-2 border-l border-stroke dark:border-strokedark">
            <NavLink to="/tableau-de-bord" className={dashboardLinkClass}>Tableau de bord</NavLink>
          </li>
        </ul>
        </div>
        <div className="relative flex flex-shrink-0 items-center gap-3 overflow-visible">
          <DarkModeSwitcher />
          <DropdownUser />
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNavbar;
