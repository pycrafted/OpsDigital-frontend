import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignUp from './pages/Authentication/SignUp';
import Login from './pages/Authentication/Login';
import Calendar from './pages/Calendar';
import ECommerce from './pages/Dashboard/ECommerce';
import Settings from './pages/Settings';
import AnalysesLaboratoire from './pages/AnalysesLaboratoire';
import ReformateurCatalytique from './pages/ReformateurCatalytique';
import CompresseurK245 from './pages/CompresseurK245';
import CompresseurK244 from './pages/CompresseurK244';
import AtmMeroxPreFlash from './pages/AtmMeroxPreFlash';
import ProductionValeurElectricite from './pages/ProductionValeurElectricite';
import MouvementDesBacs from './pages/MouvementDesBacs';
import Saisie from './pages/Saisie';
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
            <PageTitle title="Connexion | OpsDigital" />
            <Login />
          </>
        }
      />
      <Route
        path="/auth/signin"
        element={
          <>
            <PageTitle title="Connexion | OpsDigital" />
            <Login />
          </>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <>
            <PageTitle title="Inscription | OpsDigital - Tailwind CSS Admin Dashboard Template" />
            <SignUp />
          </>
        }
      />
      {/* Pages avec layout (navbar, etc.) */}
      <Route path="/*" element={
        <DefaultLayout>
          <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="Saisie | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <Saisie />
            </>
          }
        />
        <Route
          path="/tableau-de-bord"
          element={
            <>
              <PageTitle title="Tableau de bord | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <ECommerce />
            </>
          }
        />
        <Route
          path="/calendar"
          element={
            <>
              <PageTitle title="Calendar | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <Calendar />
            </>
          }
        />
        <Route
          path="/saisie"
          element={
            <>
              <PageTitle title="Saisie | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <Saisie />
            </>
          }
        />
        <Route
          path="/analyses-laboratoire"
          element={
            <>
              <PageTitle title="Analyses du laboratoire | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <AnalysesLaboratoire />
            </>
          }
        />
        <Route
          path="/reformateur-catalytique"
          element={
            <>
              <PageTitle title="Réformateur catalytique | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <ReformateurCatalytique />
            </>
          }
        />
        <Route
          path="/compresseur-k245"
          element={
            <>
              <PageTitle title="Compresseur K 245 | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <CompresseurK245 />
            </>
          }
        />
        <Route
          path="/compresseur-k244"
          element={
            <>
              <PageTitle title="Compresseur K 244 | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <CompresseurK244 />
            </>
          }
        />
        <Route
          path="/atm-merox-preflash"
          element={
            <>
              <PageTitle title="ATM/MEROX & PRE-FLASH | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <AtmMeroxPreFlash />
            </>
          }
        />
        <Route
          path="/mouvement-des-bacs"
          element={
            <>
              <PageTitle title="Mouvement des bacs | OpsDigital" />
              <MouvementDesBacs />
            </>
          }
        />
        <Route
          path="/production-valeur-electricite"
          element={
            <>
              <PageTitle title="Valeur / Électricité | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <ProductionValeurElectricite />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <PageTitle title="Mon profil | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <Profile />
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <PageTitle title="Paramètres | OpsDigital - Tailwind CSS Admin Dashboard Template" />
              <Settings />
            </>
          }
        />
      </Routes>
        </DefaultLayout>
      } />
    </Routes>
  );
}

export default App;
