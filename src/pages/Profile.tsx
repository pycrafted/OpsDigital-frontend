import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import type { AdminUser } from '../api/auth';

const ADMIN_ONLY_PROFILE_SECTIONS = ['utilisateurs'];

// ── Icônes réutilisables ──────────────────────────────────────────────────

const IconEye = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEyeOff = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

// ── Composant principal ────────────────────────────────────────────────────

const Profile = () => {
  const { isAdmin } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const section = new URLSearchParams(search).get('section') ?? 'profil';

  // Rediriger les simples utilisateurs hors des sections admin
  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_PROFILE_SECTIONS.includes(section)) {
      navigate('/profile?section=profil', { replace: true });
    }
  }, [section, isAdmin, navigate]);

  return (
    <div className="mx-auto max-w-270 pt-6 pb-10">
      {section === 'profil' && <PersonalInfoCard />}
      {section === 'utilisateurs' && isAdmin && <UserManagementCard />}
    </div>
  );
};

// ── Carte : informations personnelles ─────────────────────────────────────

const PersonalInfoCard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setSubmitting(true);

    const wantPasswordChange = newPassword.trim() !== '' || newPasswordConfirm.trim() !== '';
    if (wantPasswordChange) {
      if (newPassword.length < 8) {
        setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        setSubmitting(false);
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setPasswordError('Les deux mots de passe ne correspondent pas.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await updateUser({ fullName, email });
      if (wantPasswordChange) {
        await authApi.changePassword(newPassword);
        setNewPassword('');
        setNewPasswordConfirm('');
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">Informations personnelles</h3>
      </div>
      <div className="p-7">
        {error && (
          <div className="mb-4 rounded border border-danger/30 bg-danger/10 py-2.5 px-4 text-sm text-danger">{error}</div>
        )}
        <form id="profile-form" onSubmit={handleSubmit}>
          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="fullName">
                Nom complet
              </label>
              <div className="relative">
                <span className="absolute left-4.5 top-4">
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.8">
                      <path fillRule="evenodd" clipRule="evenodd" d="M3.72039 12.887C4.50179 12.1056 5.5616 11.6666 6.66667 11.6666H13.3333C14.4384 11.6666 15.4982 12.1056 16.2796 12.887C17.061 13.6684 17.5 14.7282 17.5 15.8333V17.5C17.5 17.9602 17.1269 18.3333 16.6667 18.3333C16.2064 18.3333 15.8333 17.9602 15.8333 17.5V15.8333C15.8333 15.1703 15.5699 14.5344 15.1011 14.0655C14.6323 13.5967 13.9964 13.3333 13.3333 13.3333H6.66667C6.00363 13.3333 5.36774 13.5967 4.8989 14.0655C4.43006 14.5344 4.16667 15.1703 4.16667 15.8333V17.5C4.16667 17.9602 3.79357 18.3333 3.33333 18.3333C2.8731 18.3333 2.5 17.9602 2.5 17.5V15.8333C2.5 14.7282 2.93899 13.6684 3.72039 12.887Z" fill="" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.99967 3.33329C8.61896 3.33329 7.49967 4.45258 7.49967 5.83329C7.49967 7.214 8.61896 8.33329 9.99967 8.33329C11.3804 8.33329 12.4997 7.214 12.4997 5.83329C12.4997 4.45258 11.3804 3.33329 9.99967 3.33329ZM5.83301 5.83329C5.83301 3.53211 7.69849 1.66663 9.99967 1.66663C12.3009 1.66663 14.1663 3.53211 14.1663 5.83329C14.1663 8.13448 12.3009 9.99996 9.99967 9.99996C7.69849 9.99996 5.83301 8.13448 5.83301 5.83329Z" fill="" />
                    </g>
                  </svg>
                </span>
                <input
                  className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  type="text" name="fullName" id="fullName" placeholder="Nom complet"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="emailAddress">
                Adresse e-mail
              </label>
              <div className="relative">
                <span className="absolute left-4.5 top-4">
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.8">
                      <path fillRule="evenodd" clipRule="evenodd" d="M3.33301 4.16667C2.87658 4.16667 2.49967 4.54357 2.49967 5V15C2.49967 15.4564 2.87658 15.8333 3.33301 15.8333H16.6663C17.1228 15.8333 17.4997 15.4564 17.4997 15V5C17.4997 4.54357 17.1228 4.16667 16.6663 4.16667H3.33301ZM0.833008 5C0.833008 3.6231 1.9561 2.5 3.33301 2.5H16.6663C18.0432 2.5 19.1663 3.6231 19.1663 5V15C19.1663 16.3769 18.0432 17.5 16.6663 17.5H3.33301C1.9561 17.5 0.833008 16.3769 0.833008 15V5Z" fill="" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M0.983719 4.52215C1.24765 4.1451 1.76726 4.05341 2.1443 4.31734L9.99975 9.81615L17.8552 4.31734C18.2322 4.05341 18.7518 4.1451 19.0158 4.52215C19.2797 4.89919 19.188 5.4188 18.811 5.68272L10.4776 11.5161C10.1907 11.7169 9.80879 11.7169 9.52186 11.5161L1.18853 5.68272C0.811486 5.4188 0.719791 4.89919 0.983719 4.52215Z" fill="" />
                    </g>
                  </svg>
                </span>
                <input
                  className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  type="email" name="emailAddress" id="emailAddress" placeholder="votre@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="mt-2 pt-2">
          {passwordError && (
            <div className="mb-4 rounded border border-danger/30 bg-danger/10 py-2.5 px-4 text-sm text-danger">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="mb-4 rounded border border-success/30 bg-success/10 py-2.5 px-4 text-sm text-success">Mot de passe modifié avec succès.</div>
          )}
          <div className="mb-5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white" htmlFor="newPassword">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-12 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  placeholder="••••••••" required minLength={8}
                />
                <button type="button" onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-black dark:hover:text-white">
                  {showNewPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <p className="mt-1 text-xs text-bodydark2">Minimum 8 caractères</p>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white" htmlFor="newPasswordConfirm">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPasswordConfirm" type={showNewPasswordConfirm ? 'text' : 'password'} autoComplete="new-password"
                  value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-12 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  placeholder="••••••••" required minLength={8}
                />
                <button type="button" onClick={() => setShowNewPasswordConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-black dark:hover:text-white">
                  {showNewPasswordConfirm ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4.5">
          <button
            className={`flex justify-center rounded py-2 px-6 font-medium ${saved ? 'border border-success bg-success text-white' : 'bg-primary text-gray hover:bg-opacity-90'}`}
            type="submit" form="profile-form" disabled={submitting}
          >
            {saved ? 'Enregistré' : submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Carte : gestion des utilisateurs ──────────────────────────────────────

const UserManagementCard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'simple_user'>('simple_user');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [toggleStates, setToggleStates] = useState<Record<number, string>>({});

  const loadUsers = useCallback(async () => {
    try {
      const data = await authApi.adminGetUsers();
      setUsers(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await authApi.adminCreateUser({ email: newEmail, role: newRole });
      setNewEmail('');
      setNewRole('simple_user');
      setShowCreateForm(false);
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId: number) => {
    setToggleStates((s) => ({ ...s, [userId]: 'loading' }));
    try {
      const updated = await authApi.adminToggleUserActive(userId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setToggleStates((s) => ({ ...s, [userId]: 'idle' }));
    } catch {
      setToggleStates((s) => ({ ...s, [userId]: 'error' }));
      setTimeout(() => setToggleStates((s) => ({ ...s, [userId]: 'idle' })), 3000);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-7 dark:border-strokedark flex items-center justify-between">
        <h3 className="font-medium text-black dark:text-white">Gestion des utilisateurs</h3>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateError(null); }}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          {showCreateForm ? 'Annuler' : '+ Ajouter un utilisateur'}
        </button>
      </div>
      <div className="p-7">
        {loadError && (
          <div className="mb-4 rounded border border-danger/30 bg-danger/10 py-2.5 px-4 text-sm text-danger">{loadError}</div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded border border-stroke p-5 dark:border-strokedark bg-gray dark:bg-meta-4">
            <h4 className="mb-4 text-sm font-semibold text-black dark:text-white">Nouveau compte</h4>
            {createError && (
              <div className="mb-3 rounded border border-danger/30 bg-danger/10 py-2 px-3 text-sm text-danger">{createError}</div>
            )}
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-black dark:text-white">
                  E-mail <span className="text-danger">*</span>
                </label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded border border-stroke bg-white py-2.5 px-3 text-sm text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                  placeholder="utilisateur@exemple.com" />
              </div>
              <div className="w-full sm:w-44">
                <label className="mb-1.5 block text-xs font-medium text-black dark:text-white">Rôle</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'simple_user')}
                  className="w-full rounded border border-stroke bg-white py-2.5 px-3 text-sm text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white">
                  <option value="simple_user">Simple utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <p className="mb-3 text-xs text-bodydark2">
              L'utilisateur recevra un code OTP par e-mail pour créer son mot de passe à sa première connexion.
            </p>
            <button type="submit" disabled={creating}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60">
              {creating ? 'Création…' : 'Créer le compte'}
            </button>
          </form>
        )}

        {users.length === 0 && !loadError ? (
          <p className="text-sm text-bodydark2">Aucun utilisateur.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark text-left text-xs text-bodydark2 uppercase">
                  <th className="pb-3 pr-4 font-medium">Nom / E-mail</th>
                  <th className="pb-3 pr-4 font-medium">Rôle</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const ts = toggleStates[u.id] ?? 'idle';
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className={`border-b border-stroke/50 dark:border-strokedark/50 last:border-0 ${!u.is_active ? 'opacity-60' : ''}`}>
                      <td className="py-3 pr-4">
                        <span className="block font-medium text-black dark:text-white">{u.fullName}</span>
                        <span className="text-xs text-bodydark2">{u.email}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-stroke/60 text-bodydark2 dark:bg-meta-4 dark:text-bodydark'}`}>
                          {u.role === 'admin' ? 'Administrateur' : 'Simple utilisateur'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          {u.mustChangePassword && (
                            <span className="inline-flex rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                              1ère connexion
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleActive(u.id)}
                              disabled={ts === 'loading'}
                              title={u.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                              className={`flex h-7 w-7 items-center justify-center rounded transition disabled:opacity-50 ${
                                u.is_active ? 'text-danger hover:bg-danger/10' : 'text-success hover:bg-success/10'
                              }`}
                            >
                              {u.is_active ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
