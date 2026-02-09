import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import SecondaryNavbar from '../components/SecondaryNavbar/index';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const isAnalysesLaboratoire = pathname === '/analyses-laboratoire';

  return (
    <div className="dark:bg-white dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen flex-col overflow-visible">
        {/* <!-- ===== Navbar ===== --> */}
        <div className="z-998 shrink-0 overflow-visible border-b border-stroke dark:border-strokedark">
          <SecondaryNavbar />
        </div>

        {/* <!-- ===== Content Area Start ===== --> */}
        <div
          className={`relative flex flex-1 flex-col overflow-x-hidden ${
            isAnalysesLaboratoire ? 'min-h-0 overflow-y-hidden' : 'overflow-y-auto'
          }`}
        >
          {/* <!-- ===== Main Content Start ===== --> */}
          <main className={isAnalysesLaboratoire ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''}>
            <div
              className={`max-w-screen-2xl px-4 pt-0.5 pb-4 md:px-6 md:pt-1 md:pb-6 2xl:px-10 2xl:pt-2 2xl:pb-10 ${
                isAnalysesLaboratoire
                  ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden'
                  : 'mx-auto'
              }`}
            >
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;
