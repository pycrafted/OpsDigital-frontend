import React from 'react';
import PageTitle from '../components/PageTitle';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useSaisieFilter } from '../context/SaisieFilterContext';

const FEUILLES_SORTED = [...FEUILLES_CONFIG].sort((a, b) =>
  a.title.localeCompare(b.title, 'fr'),
);

const SaisieTousPage: React.FC = () => {
  const { date, hour } = useSaisieFilter();

  return (
    <>
      <PageTitle />
      <div className="flex flex-col gap-2 pt-6">
        {FEUILLES_SORTED.map((feuille, index) => (
          <FormulaireSaisieFeuille key={feuille.id} feuille={feuille} externalDate={date} externalHour={hour} disableAutoFocus hideSeparator={index === 0} />
        ))}
      </div>
    </>
  );
};

export default SaisieTousPage;
