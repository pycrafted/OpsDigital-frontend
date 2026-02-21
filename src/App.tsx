import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import ProtectedRoute from './components/ProtectedRoute';
import SignUp from './pages/Authentication/SignUp';
import Login from './pages/Authentication/Login';
import Calendar from './pages/Calendar';
import ECommerce from './pages/Dashboard/ECommerce';
import Settings from './pages/Settings';
import AnalysesLaboratoire from './pages/AnalysesLaboratoire';
import AnalysesLaboratoireGraphique from './pages/AnalysesLaboratoireGraphique';
import Saisie from './pages/Saisie';
import SaisieFeuillePage from './pages/SaisieFeuillePage';
import Profile from './pages/Profile';
import DefaultLayout from './layout/DefaultLayout';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <Routes>
      {/* Pages sans layout (login plein écran) */}
      <Route
        path="/login"
        element={
          <>
            <PageTitle />
            <Login />
          </>
        }
      />
      <Route
        path="/auth/signin"
        element={
          <>
            <PageTitle />
            <Login />
          </>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <>
            <PageTitle />
            <SignUp />
          </>
        }
      />
      {/* Pages protégées : connexion requise */}
      <Route path="/*" element={
        <ProtectedRoute>
          <DefaultLayout>
            <Routes>
        <Route
          index
          element={
            <>
              <PageTitle />
              <ECommerce />
            </>
          }
        />
        <Route path="/tableau-de-bord" element={<Navigate to="/" replace />} />
        <Route
          path="/calendar"
          element={
            <>
              <PageTitle />
              <Calendar />
            </>
          }
        />
        <Route path="/saisie" element={<Navigate to="/saisie/reformateur-catalytique" replace />} />
        <Route
          path="/saisie/:feuilleId"
          element={<SaisieFeuillePage />}
        />
        <Route
          path="/tableaux"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoire />
            </>
          }
        />
        <Route
          path="/graphique"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/reformateur-catalytique"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/production"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/mouvement-des-bacs"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/compresseur-k245"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/compresseur-k244"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/atm-merox-pre-flash"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/graphique/gaz"
          element={
            <>
              <PageTitle />
              <AnalysesLaboratoireGraphique />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <PageTitle />
              <Profile />
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <PageTitle />
              <Settings />
            </>
          }
        />
      </Routes>
          </DefaultLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
