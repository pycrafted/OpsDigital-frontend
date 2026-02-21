import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const USER_ICON = (
  <svg className="h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DropdownUser = () => {
  const { user } = useAuth();

  return (
    <Link
      to="/profile"
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${user?.avatarUrl ? 'border-2 border-stroke dark:border-strokedark hover:border-primary dark:hover:border-primary' : 'border-2 border-transparent'}`}
      aria-label="Mon profil"
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user?.fullName ?? 'Utilisateur'}
          className="h-full w-full object-cover"
        />
      ) : (
        USER_ICON
      )}
    </Link>
  );
};

export default DropdownUser;
