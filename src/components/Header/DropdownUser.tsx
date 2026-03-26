import { Link } from 'react-router-dom';

const DropdownUser = () => {
  return (
    <Link
      to="/profile"
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
      aria-label="Mon profil"
    >
      <svg className="h-5 w-5 shrink-0 text-primary dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </Link>
  );
};

export default DropdownUser;
