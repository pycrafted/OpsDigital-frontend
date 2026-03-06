import React from 'react';
import CardDataStats from '../../components/CardDataStats';

/** Mettre à true pour réafficher les cartes du tableau de bord. */
const SHOW_DASHBOARD_CARDS = false;

const ECommerce: React.FC = () => {
  return (
    <>
      {/* Cartes du tableau de bord : masquées, conservées pour réactivation ultérieure */}
      {SHOW_DASHBOARD_CARDS && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Analyses labo du jour" total="128 mesures" rate="+12 vs veille" levelUp>
            {/* Icône fiole / laboratoire */}
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.25 2.75C8.25 2.33579 8.58579 2 9 2H13C13.4142 2 13.75 2.33579 13.75 2.75C13.75 3.16421 13.4142 3.5 13 3.5H12.25V8.117L16.884 15.222C18.0474 16.9941 16.78 19.25 14.6775 19.25H7.32249C5.21997 19.25 3.95263 16.9941 5.11598 15.222L9.75 8.117V3.5H9C8.58579 3.5 8.25 3.16421 8.25 2.75Z"
                fill=""
              />
              <path
                d="M7 13.25C7.55228 13.25 8 13.6977 8 14.25C8 15.2165 8.7835 16 9.75 16H12.25C13.2165 16 14 15.2165 14 14.25C14 13.6977 14.4477 13.25 15 13.25C15.5523 13.25 16 13.6977 16 14.25C16 16.3211 14.3211 18 12.25 18H9.75C7.67893 18 6 16.3211 6 14.25C6 13.6977 6.44772 13.25 7 13.25Z"
                fill=""
              />
            </svg>
          </CardDataStats>
          <CardDataStats title="Charge reformateur" total="7 250 bbl/j" rate="+3,1 % vs objectif" levelUp>
            {/* Icône colonne de reformeur */}
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.25 2.5C8.25 1.94772 8.69772 1.5 9.25 1.5H12.75C13.3023 1.5 13.75 1.94772 13.75 2.5V3.75H15.25C15.8023 3.75 16.25 4.19772 16.25 4.75C16.25 5.30228 15.8023 5.75 15.25 5.75H13.75V7.25H15.5C16.0523 7.25 16.5 7.69772 16.5 8.25C16.5 8.80228 16.0523 9.25 15.5 9.25H13.75V18.5C13.75 19.6046 12.8546 20.5 11.75 20.5H10.25C9.14543 20.5 8.25 19.6046 8.25 18.5V2.5Z"
                fill=""
              />
              <path
                d="M5 18.25C5 17.6977 5.44772 17.25 6 17.25H16C16.5523 17.25 17 17.6977 17 18.25C17 18.8023 16.5523 19.25 16 19.25H6C5.44772 19.25 5 18.8023 5 18.25Z"
                fill=""
              />
            </svg>
          </CardDataStats>
          <CardDataStats title="Production électricité" total="42,8 MWh" rate="-1,4 % vs veille" levelDown>
            {/* Icône éclair / énergie */}
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.75 1.75C12.0887 1.75 12.4021 1.93156 12.5681 2.2267L17.4431 10.9642C17.7332 11.4864 17.3553 12.125 16.7531 12.125H12.9585L13.9585 18.4931C14.0617 19.1456 13.3945 19.6095 12.825 19.3016L4.57502 14.9016C4.13308 14.6667 3.96039 14.1153 4.1953 13.6733L8.3203 5.9233C8.46895 5.64244 8.76056 5.46875 9.07901 5.46875H12.0029L10.9519 2.19838C10.7923 1.70612 11.1974 1.75 11.75 1.75Z"
                fill=""
              />
            </svg>
          </CardDataStats>
          <CardDataStats title="Mouvement des bacs" total="18 opérations" rate="+5 vs veille" levelUp>
            {/* Icône bac de stockage */}
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 5.25C4.5 3.73122 7.18629 2.75 11 2.75C14.8137 2.75 17.5 3.73122 17.5 5.25C17.5 6.76878 14.8137 7.75 11 7.75C7.18629 7.75 4.5 6.76878 4.5 5.25Z"
                fill=""
              />
              <path
                d="M4.5 7.75V16.75C4.5 18.2688 7.18629 19.25 11 19.25C14.8137 19.25 17.5 18.2688 17.5 16.75V7.75C16.1774 8.63329 13.8694 9.125 11 9.125C8.13063 9.125 5.8226 8.63329 4.5 7.75Z"
                fill=""
              />
              <path
                d="M7.25 11.25C7.25 10.6977 7.69772 10.25 8.25 10.25H10.25C10.8023 10.25 11.25 10.6977 11.25 11.25C11.25 11.8023 10.8023 12.25 10.25 12.25H8.25C7.69772 12.25 7.25 11.8023 7.25 11.25Z"
                fill=""
              />
              <path
                d="M11.75 14.25C11.75 13.6977 12.1977 13.25 12.75 13.25H14.75C15.3023 13.25 15.75 13.6977 15.75 14.25C15.75 14.8023 15.3023 15.25 14.75 15.25H12.75C12.1977 15.25 11.75 14.8023 11.75 14.25Z"
                fill=""
              />
            </svg>
          </CardDataStats>
        </div>
      )}

      {/* Placeholder : cette page est destinée à accueillir le tableau de bord */}
      {!SHOW_DASHBOARD_CARDS && (
        <div className="rounded-xl border border-stroke bg-white px-6 py-12 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-10 sm:py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 dark:border-white/20 dark:bg-white/10">
              <svg
                className="h-8 w-8 text-primary dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-body dark:text-white sm:text-2xl">
              Tableau de bord
            </h2>
          </div>
        </div>
      )}
    </>
  );
};

export default ECommerce;
