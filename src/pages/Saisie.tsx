import React from 'react';

const Saisie: React.FC = () => {
  return (
    <div className="rounded-2xl border border-stroke bg-gradient-to-br from-sky-50 to-indigo-50 shadow-lg dark:border-strokedark dark:from-boxdark dark:to-meta-4">
      {/* En-tête aligné sur la page saisie reformateur */}
      <div className="border-b border-stroke/60 px-6 py-5 dark:border-strokedark/80">
        <p className="text-sm font-semibold text-primary dark:text-white">
          Saisie
        </p>
      </div>

      <div className="p-6">
        <p className="text-sm text-bodydark2 dark:text-bodydark1">
          Choisissez une feuille via le menu <strong>Saisie</strong> dans la barre de navigation.
        </p>
      </div>
    </div>
  );
};

export default Saisie;
