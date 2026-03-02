import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 2000);
    }
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, [error]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-2 dark:bg-boxdark-2">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string })?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => { if (error) setError(null); };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-gray dark:bg-form-input py-3 pl-4 pr-12 text-sm text-black dark:text-white placeholder-bodydark2 outline-none transition focus:border-primary dark:focus:border-primary ${
      hasError
        ? 'border-danger dark:border-danger'
        : 'border-stroke dark:border-form-strokedark'
    }`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-2 dark:bg-boxdark-2">
      {/* Bouton thème */}
      <div className="absolute top-4 right-4">
        <DarkModeSwitcher />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-default">

        {/* En-tête de la card */}
        <div className="flex flex-col items-center px-8 pt-8 pb-6 border-b border-stroke dark:border-strokedark">
          <Link to="/" aria-label="Accueil OpsDigital" className="mb-4">
            <img src={LogoIcon} alt="OpsDigital" className="h-12 w-12" />
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Connexion</h1>
          <p className="mt-1.5 text-sm text-bodydark2">Accédez à votre espace OpsDigital</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-8 py-7" noValidate>

          {/* Message d'erreur global */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3"
            >
              <svg
                className="mt-0.5 shrink-0 text-danger"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              <p className="text-sm leading-snug text-danger">{error}</p>
            </div>
          )}

          {/* Champ e-mail */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              Adresse e-mail
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                className={inputClass(!!error)}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bodydark2">
                <svg className="fill-current" width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.5">
                    <path d="M19.2516 3.30005H2.75156C1.58281 3.30005 0.585938 4.26255 0.585938 5.46567V16.6032C0.585938 17.7719 1.54844 18.7688 2.75156 18.7688H19.2516C20.4203 18.7688 21.4172 17.8063 21.4172 16.6032V5.4313C21.4172 4.26255 20.4203 3.30005 19.2516 3.30005ZM19.2516 4.84692C19.2859 4.84692 19.3203 4.84692 19.3547 4.84692L11.0016 10.2094L2.64844 4.84692C2.68281 4.84692 2.71719 4.84692 2.75156 4.84692H19.2516ZM19.2516 17.1532H2.75156C2.40781 17.1532 2.13281 16.8782 2.13281 16.5344V6.35942L10.1766 11.5157C10.4172 11.6875 10.6922 11.7563 10.9672 11.7563C11.2422 11.7563 11.5172 11.6875 11.7578 11.5157L19.8016 6.35942V16.5688C19.8703 16.9125 19.5953 17.1532 19.2516 17.1532Z" fill="" />
                  </g>
                </svg>
              </span>
            </div>
          </div>

          {/* Champ mot de passe */}
          <div className="mb-7">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                className={inputClass(!!error)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-black dark:hover:text-white focus:outline-none"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg border border-primary bg-primary py-3.5 text-sm font-medium text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 dark:focus:ring-offset-boxdark"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connexion en cours…
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>

      {/* Pied de page */}
      <p className="mt-6 text-xs text-bodydark2">
        © {new Date().getFullYear()} OpsDigital — Accès réservé au personnel autorisé
      </p>
    </div>
  );
};

export default Login;
