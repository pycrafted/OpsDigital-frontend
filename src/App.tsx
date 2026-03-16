import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import ProtectedRoute from './components/ProtectedRoute';
import SignUp from './pages/Authentication/SignUp';
import Login from './pages/Authentication/Login';
import Calendar from './pages/Calendar';
import ECommerce from './pages/Dashboard/ECommerce';
import AnalysesLaboratoire from './pages/AnalysesLaboratoire';
import AnalysesLaboratoireGraphique from './pages/AnalysesLaboratoireGraphique';
import SaisieFeuillePage from './pages/SaisieFeuillePage';
import SaisieTousPage from './pages/SaisieTousPage';
import ParametragePage from './pages/ParametragePage';
import Profile from './pages/Profile';
import DefaultLayout from './layout/DefaultLayout';
import { AnalysesLaboLabelsProvider } from './context/AnalysesLaboLabelsContext';
import { AnalysesLaboBoundsProvider } from './context/AnalysesLaboBoundsContext';
import { AtmMeroxLabelsProvider } from './context/AtmMeroxLabelsContext';
import { AtmMeroxBoundsProvider } from './context/AtmMeroxBoundsContext';
import { CompresseurK244LabelsProvider } from './context/CompresseurK244LabelsContext';
import { CompresseurK244BoundsProvider } from './context/CompresseurK244BoundsContext';
import { CompresseurK245LabelsProvider } from './context/CompresseurK245LabelsContext';
import { CompresseurK245BoundsProvider } from './context/CompresseurK245BoundsContext';
import { GazLabelsProvider } from './context/GazLabelsContext';
import { GazBoundsProvider } from './context/GazBoundsContext';
import { MouvementBacsLabelsProvider } from './context/MouvementBacsLabelsContext';
import { MouvementBacsBoundsProvider } from './context/MouvementBacsBoundsContext';
import { ProductionLabelsProvider } from './context/ProductionLabelsContext';
import { ProductionBoundsProvider } from './context/ProductionBoundsContext';
import { ReformateurLabelsProvider } from './context/ReformateurLabelsContext';
import { ReformateurBoundsProvider } from './context/ReformateurBoundsContext';
import { TableViewProvider } from './context/TableViewContext';
import { SaisieFilterProvider } from './context/SaisieFilterContext';
import { GraphiqueFilterProvider } from './context/GraphiqueFilterContext';
import { TableauxFilterProvider } from './context/TableauxFilterContext';
import { SaisieVisibilityProvider } from './context/SaisieVisibilityContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { RenommageProvider } from './context/RenommageContext';
import { TagsIp21Provider } from './context/TagsIp21Context';

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
          <AnalysesLaboLabelsProvider>
          <AnalysesLaboBoundsProvider>
          <AtmMeroxLabelsProvider>
          <AtmMeroxBoundsProvider>
          <CompresseurK244LabelsProvider>
          <CompresseurK244BoundsProvider>
          <CompresseurK245LabelsProvider>
          <CompresseurK245BoundsProvider>
          <GazLabelsProvider>
          <GazBoundsProvider>
          <MouvementBacsLabelsProvider>
          <MouvementBacsBoundsProvider>
          <ProductionLabelsProvider>
          <ProductionBoundsProvider>
          <ReformateurLabelsProvider>
          <ReformateurBoundsProvider>
          <TagsIp21Provider>
          <RenommageProvider>
          <DisplayModeProvider>
          <SaisieVisibilityProvider>
          <TableViewProvider>
          <SaisieFilterProvider>
          <GraphiqueFilterProvider>
          <TableauxFilterProvider>
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
        <Route path="/saisie" element={<Navigate to="/saisie/tous" replace />} />
        <Route path="/saisie/tous" element={<><PageTitle /><SaisieTousPage /></>} />
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
          path="/graphique/tous"
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
          path="/parametrage"
          element={<ParametragePage />}
        />
      </Routes>
          </DefaultLayout>
          </TableauxFilterProvider>
          </GraphiqueFilterProvider>
          </SaisieFilterProvider>
          </TableViewProvider>
          </SaisieVisibilityProvider>
          </DisplayModeProvider>
          </RenommageProvider>
          </TagsIp21Provider>
          </ReformateurBoundsProvider>
          </ReformateurLabelsProvider>
          </ProductionBoundsProvider>
          </ProductionLabelsProvider>
          </MouvementBacsBoundsProvider>
          </MouvementBacsLabelsProvider>
          </GazBoundsProvider>
          </GazLabelsProvider>
          </CompresseurK245BoundsProvider>
          </CompresseurK245LabelsProvider>
          </CompresseurK244BoundsProvider>
          </CompresseurK244LabelsProvider>
          </AtmMeroxBoundsProvider>
          </AtmMeroxLabelsProvider>
          </AnalysesLaboBoundsProvider>
          </AnalysesLaboLabelsProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
