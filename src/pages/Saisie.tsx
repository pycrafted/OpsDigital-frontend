import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { FEUILLES_CONFIG, FeuilleConfig } from '../types/feuilles';

const ICONS: Record<string, React.ReactNode> = {
  'analyses-laboratoire': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill=""/>
      <path d="M9 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill=""/>
    </svg>
  ),
  'reformateur-catalytique': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" fill=""/>
    </svg>
  ),
  'compresseur-k244': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill=""/>
    </svg>
  ),
  'compresseur-k245': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill=""/>
    </svg>
  ),
  'atm-merox-preflash': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill=""/>
    </svg>
  ),
  'production-valeur-electricite': (
    <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" fill=""/>
    </svg>
  ),
};

const Saisie: React.FC = () => {
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleConfig | null>(null);

  return (
    <>
      <div className="mb-6 border-b border-stroke pb-4 dark:border-strokedark">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Saisie opérationnelle</span>
        </div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Saisie des relevés
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-bodydark2 dark:text-white/90">
          Choisissez une feuille pour saisir les données du tableau correspondant. Un seul créneau à la fois, avec
          duplication possible depuis le créneau précédent.
        </p>
      </div>

      {selectedFeuille ? (
        <div className="space-y-4">
          <FormulaireSaisieFeuille
            feuille={selectedFeuille}
            onClose={() => setSelectedFeuille(null)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEUILLES_CONFIG.map((feuille) => (
            <div
              key={feuille.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedFeuille(feuille)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedFeuille(feuille);
                }
              }}
              className="group flex flex-col rounded-lg border border-stroke bg-white p-6 shadow-default transition hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-strokedark dark:bg-boxdark dark:hover:border-primary"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30">
                {ICONS[feuille.id] ?? (
                  <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                )}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                {feuille.title}
              </h3>
              <p className="mb-4 flex-1 text-sm text-bodydark2">
                {feuille.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded bg-meta-2 px-2.5 py-0.5 text-xs font-medium text-bodydark2 dark:bg-meta-4 dark:text-bodydark1">
                  Saisir
                </span>
                <Link
                  to={feuille.route}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Voir le tableau →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Saisie;
