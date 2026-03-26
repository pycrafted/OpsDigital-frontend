import React, { useState } from 'react';
import PageTitle from '../components/PageTitle';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useSaisieFilter } from '../context/SaisieFilterContext';
import { useSaisieVisibility } from '../context/SaisieVisibilityContext';
import { useAuth } from '../context/AuthContext';

const FEUILLES_SORTED = [...FEUILLES_CONFIG].sort((a, b) =>
  a.title.localeCompare(b.title, 'fr'),
);

const SaisieTousPage: React.FC = () => {
  const { date, hour } = useSaisieFilter();
  const { isFeuilleVisible, toggleFeuille, isFieldVisible, toggleField } = useSaisieVisibility();
  const { isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);

  // En mode édition : afficher tous les tableaux (y compris masqués) avec tous les champs
  const feuillesToRender = editMode
    ? FEUILLES_SORTED
    : FEUILLES_SORTED
        .filter((f) => isFeuilleVisible(f.id))
        .map((f) => ({ ...f, fields: f.fields.filter((field) => isFieldVisible(f.id, field.key)) }));

  return (
    <>
      <PageTitle />
      {isAdmin && (
        <div className="flex justify-end px-6 pt-4">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition ${
              editMode
                ? 'border-warning bg-warning/10 text-warning dark:border-warning dark:text-warning'
                : 'border-stroke/70 bg-white/90 text-primary hover:border-primary/50 dark:border-strokedark dark:bg-boxdark dark:text-white'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {editMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
            {editMode ? 'Terminer' : 'Gérer la visibilité'}
          </button>
        </div>
      )}
      {editMode && (
        <p className="px-6 pt-2 text-xs text-warning">
          Mode édition — cliquez sur l'icône <svg className="inline h-3 w-3 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> pour masquer ou afficher un tableau ou un champ.
        </p>
      )}
      <div className="flex flex-col gap-2 pt-6">
        {feuillesToRender.map((feuille, index) => (
          <FormulaireSaisieFeuille
            key={feuille.id}
            feuille={feuille}
            externalDate={date}
            externalHour={hour}
            disableAutoFocus
            hideSeparator={index === 0}
            editMode={editMode}
            feuilleVisible={isFeuilleVisible(feuille.id)}
            onToggleFeuille={() => toggleFeuille(feuille.id)}
            isFieldVisibleFn={(key) => isFieldVisible(feuille.id, key)}
            onToggleField={(key) => toggleField(feuille.id, key)}
          />
        ))}
      </div>
    </>
  );
};

export default SaisieTousPage;
