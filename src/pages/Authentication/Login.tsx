import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword, verifyOTP, resetPassword } from '../../api/auth';

/* ─── Modal récupération mot de passe (3 étapes) ─────────────────────────── */

type FpStep = 'email' | 'otp' | 'newpwd' | 'done';
type FpMode = 'forgot' | 'first';

const FP_CONFIG: Record<FpMode, { title: string; subtitle: string; emailHint: string; doneMsg: string }> = {
  forgot: {
    title: 'Mot de passe oublié',
    subtitle: 'Saisissez votre adresse e-mail. Vous recevrez un code à 6 chiffres pour réinitialiser votre mot de passe.',
    emailHint: 'Saisissez votre adresse e-mail professionnelle.',
    doneMsg: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  },
  first: {
    title: 'Première connexion',
    subtitle: 'Bienvenue ! Saisissez votre adresse e-mail professionnelle pour recevoir un code et créer votre mot de passe.',
    emailHint: 'Saisissez l\'adresse e-mail fournie par votre administrateur.',
    doneMsg: 'Votre mot de passe a été créé. Vous pouvez maintenant vous connecter.',
  },
};

const ForgotPasswordModal: React.FC<{ mode: FpMode; onClose: () => void }> = ({ mode, onClose }) => {
  const cfg = FP_CONFIG[mode];
  const [step, setStep] = useState<FpStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls = 'w-full rounded-lg border border-stroke dark:border-form-strokedark bg-gray dark:bg-form-input py-3 pl-4 pr-4 text-sm text-black dark:text-white placeholder-bodydark2 outline-none transition focus:border-primary dark:focus:border-primary';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur inconnue'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const token = await verifyOTP(email, otp);
      setResetToken(token);
      setStep('newpwd');
    } catch (err) { setError(err instanceof Error ? err.message : 'Code invalide ou expiré.'); }
    finally { setLoading(false); }
  };

  const handleResetPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return; }
    setError(null); setLoading(true);
    try {
      await resetPassword(resetToken, newPwd);
      setStep('done');
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur inconnue'); }
    finally { setLoading(false); }
  };

  const stepTitles: Record<FpStep, string> = {
    email: 'Mot de passe oublié',
    otp: 'Code de vérification',
    newpwd: 'Nouveau mot de passe',
    done: 'Mot de passe réinitialisé',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
          <h2 className="text-base font-semibold text-black dark:text-white">{step === 'email' ? cfg.title : stepTitles[step]}</h2>
          <button type="button" onClick={onClose} className="text-bodydark2 hover:text-black dark:hover:text-white transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Erreur */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {/* Étape 1 — Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} noValidate>
              <p className="mb-4 text-sm text-bodydark dark:text-bodydark2">{cfg.subtitle}</p>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Adresse e-mail
              </label>
              <input
                type="email" required autoFocus
                value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="votre@sar.sn"
                className={`${inputCls} mb-5`}
              />
              <button type="submit" disabled={loading || !email.trim()}
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/></span> : 'Envoyer le code'}
              </button>
            </form>
          )}

          {/* Étape 2 — OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <p className="mb-4 text-sm text-bodydark dark:text-bodydark2">
                Un code a été envoyé à <span className="font-semibold text-black dark:text-white">{email}</span>. Saisissez-le ci-dessous (valable 10 min).
              </p>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Code à 6 chiffres
              </label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus
                value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
                placeholder="_ _ _ _ _ _"
                className={`${inputCls} mb-2 text-center tracking-[0.5em] text-xl font-bold`}
              />
              <button type="button" onClick={() => { setError(null); handleSendOtp({ preventDefault: () => {} } as React.FormEvent); }}
                className="mb-5 text-xs text-primary hover:underline">
                Renvoyer le code
              </button>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/></span> : 'Vérifier le code'}
              </button>
            </form>
          )}

          {/* Étape 3 — Nouveau mot de passe */}
          {step === 'newpwd' && (
            <form onSubmit={handleResetPwd} noValidate>
              <p className="mb-4 text-sm text-bodydark dark:text-bodydark2">
                Choisissez un nouveau mot de passe (8 caractères minimum).
              </p>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Nouveau mot de passe</label>
              <div className="relative mb-3">
                <input
                  type={showNewPwd ? 'text' : 'password'} required autoFocus
                  value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-black dark:hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showNewPwd
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></>}
                  </svg>
                </button>
              </div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Confirmer le mot de passe</label>
              <input
                type={showNewPwd ? 'text' : 'password'} required
                value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setError(null); }}
                placeholder="••••••••"
                className={`${inputCls} mb-5`}
              />
              <button type="submit" disabled={loading || newPwd.length < 8 || !confirmPwd}
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/></span> : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}

          {/* Étape 4 — Succès */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-1 text-sm font-semibold text-black dark:text-white">
                {mode === 'first' ? 'Mot de passe créé !' : 'Mot de passe réinitialisé !'}
              </p>
              <p className="mb-6 text-xs text-bodydark dark:text-bodydark2">{cfg.doneMsg}</p>
              <button type="button" onClick={onClose}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition">
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fpMode, setFpMode] = useState<FpMode | null>(null);
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
      {fpMode && <ForgotPasswordModal mode={fpMode} onClose={() => setFpMode(null)} />}
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
          <div className="mb-4">
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

          {/* Liens première connexion / mot de passe oublié */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setFpMode('first')}
              className="text-xs text-bodydark hover:text-primary dark:text-bodydark2 dark:hover:text-white hover:underline focus:outline-none transition">
              Première connexion
            </button>
            <button type="button" onClick={() => setFpMode('forgot')}
              className="text-xs text-primary hover:underline focus:outline-none">
              Mot de passe oublié ?
            </button>
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
