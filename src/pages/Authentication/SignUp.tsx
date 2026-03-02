import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';

const SignUp: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-2 dark:bg-boxdark-2">
      {/* Bouton thème */}
      <div className="absolute top-4 right-4">
        <DarkModeSwitcher />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-default">

        {/* En-tête */}
        <div className="flex flex-col items-center px-8 pt-8 pb-6 border-b border-stroke dark:border-strokedark">
          <Link to="/login" aria-label="Retour à la connexion" className="mb-4">
            <img src={LogoIcon} alt="OpsDigital" className="h-12 w-12" />
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Accès restreint</h1>
          <p className="mt-1.5 text-sm text-bodydark2">Inscription non disponible en libre service</p>
        </div>

        {/* Corps */}
        <div className="px-8 py-8 flex flex-col items-center text-center">
          {/* Icône d'avertissement */}
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <svg
              className="text-warning"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-black dark:text-white">
            Compte sur invitation uniquement
          </h2>
          <p className="mb-2 text-sm text-bodydark2 leading-relaxed">
            L'accès à OpsDigital est réservé au personnel autorisé.
            La création de compte se fait exclusivement via un administrateur système.
          </p>
          <p className="mb-8 text-sm text-bodydark2 leading-relaxed">
            Si vous avez besoin d'un accès, veuillez contacter votre responsable ou l'équipe informatique.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-boxdark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour à la connexion
          </Link>
        </div>
      </div>

      {/* Pied de page */}
      <p className="mt-6 text-xs text-bodydark2">
        © {new Date().getFullYear()} OpsDigital — Accès réservé au personnel autorisé
      </p>
    </div>
  );
};

export default SignUp;
