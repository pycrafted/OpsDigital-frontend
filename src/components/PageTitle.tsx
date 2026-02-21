import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'OpsDigital | feuille de saisie';

const PageTitle: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = SITE_NAME;
  }, [location]);

  return null;
};

export default PageTitle;
