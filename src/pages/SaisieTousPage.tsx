import React from 'react';
import PageTitle from '../components/PageTitle';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useSaisieFilter } from '../context/SaisieFilterContext';
import { useSaisieVisibility } from '../context/SaisieVisibilityContext';

const FEUILLES_SORTED = [...FEUILLES_CONFIG].sort((a, b) =>
  a.title.localeCompare(b.title, 'fr'),
);

const SaisieTousPage: React.FC = () => {
  const { date, hour } = useSaisieFilter();
  const { isFeuilleVisible, isFieldVisible } = useSaisieVisibility();

  const visibleFeuilles = FEUILLES_SORTED
    .filter((f) => isFeuilleVisible(f.id))
    .map((f) => ({ ...f, fields: f.fields.filter((field) => isFieldVisible(f.id, field.key)) }));

  return (
    <>
      <PageTitle />
      <div className="flex flex-col gap-2 pt-6">
        {visibleFeuilles.map((feuille, index) => (
          <FormulaireSaisieFeuille key={feuille.id} feuille={feuille} externalDate={date} externalHour={hour} disableAutoFocus hideSeparator={index === 0} />
        ))}
      </div>
    </>
  );
};

export default SaisieTousPage;
