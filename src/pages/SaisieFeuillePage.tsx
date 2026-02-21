import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { getFeuilleById } from '../types/feuilles';

const SaisieFeuillePage: React.FC = () => {
  const { feuilleId } = useParams<{ feuilleId: string }>();
  const feuille = feuilleId ? getFeuilleById(feuilleId) : undefined;

  if (!feuille) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-bodydark2 dark:text-bodydark1">Feuille introuvable.</p>
        <Link to="/saisie" className="mt-4 inline-block text-primary hover:underline">
          ← Retour à la saisie
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageTitle />
      <FormulaireSaisieFeuille feuille={feuille} />
    </>
  );
};

export default SaisieFeuillePage;
