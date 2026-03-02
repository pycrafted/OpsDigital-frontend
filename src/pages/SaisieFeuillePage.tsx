import React, { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import FormulaireSaisieFeuille from '../components/FormulaireSaisieFeuille';
import { getFeuilleById } from '../types/feuilles';

const HOUR_LABELS: Record<string, string> = {
  h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '3h',
};

function getCurrentHourSlot(hours: string[]): string {
  const h = new Date().getHours();
  let slot: string;
  if (h >= 7 && h < 11) slot = 'h7';
  else if (h >= 11 && h < 15) slot = 'h11';
  else if (h >= 15 && h < 19) slot = 'h15';
  else if (h >= 19 && h < 23) slot = 'h19';
  else if (h >= 23 || h < 3) slot = 'h23';
  else slot = 'h3';
  return hours.includes(slot) ? slot : hours[0];
}

const SaisieFeuillePage: React.FC = () => {
  const { feuilleId } = useParams<{ feuilleId: string }>();
  const feuille = feuilleId ? getFeuilleById(feuilleId) : undefined;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(() =>
    feuille ? getCurrentHourSlot(feuille.hours) : 'h7',
  );

  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.focus();
    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    }
  };

  if (!feuille) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-bodydark2 dark:text-bodydark1">Feuille introuvable.</p>
        <Link to="/saisie" className="mt-4 inline-block text-primary hover:underline">
          ← Retour à la saisie
        </Link>
      </div>
    );
  }

  const hourIndex = feuille.hours.indexOf(hour);
  const previousHour = feuille.hours[hourIndex > 0 ? hourIndex - 1 : feuille.hours.length - 1];
  const nextHour = feuille.hours[hourIndex < feuille.hours.length - 1 ? hourIndex + 1 : 0];

  return (
    <>
      <PageTitle />

      {/* Navbar secondaire sticky — cohérente avec le reste du site */}
      <nav
        className="sticky top-0 z-20 flex min-h-[56px] w-screen max-w-none flex-shrink-0 items-center border-b border-stroke bg-white/95 backdrop-blur-sm dark:border-strokedark dark:bg-boxdark/95 ml-[calc(50%-50vw)] shadow-sm"
        aria-label="Filtres saisie"
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-2.5 md:px-6 2xl:px-11">

          <p className="hidden text-sm font-semibold text-primary dark:text-white sm:block">
            Saisie — {feuille.title}
          </p>

          <div className="ml-auto flex items-center gap-3">

            {/* Filtre date */}
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="absolute bottom-0 left-0 h-0 w-0 opacity-0 pointer-events-none"
                aria-hidden
              />
              <button
                type="button"
                onClick={openDatePicker}
                className="flex items-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:border-primary/50 hover:bg-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {date}
              </button>
            </div>

            {/* Filtre heure — prev/next */}
            <div
              className="flex items-center rounded-xl border border-stroke/70 bg-white/90 shadow-sm dark:border-strokedark dark:bg-meta-4"
              role="group"
              aria-label="Créneau horaire"
            >
              <button
                type="button"
                onClick={() => setHour(previousHour)}
                className="rounded-l-xl px-3 py-2 text-bodydark2 transition hover:bg-black/5 hover:text-primary dark:text-bodydark dark:hover:bg-white/10 dark:hover:text-white"
                title={`Créneau précédent (${HOUR_LABELS[previousHour] ?? previousHour})`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="min-w-[3rem] py-2 text-center text-sm font-semibold text-primary dark:text-white">
                {HOUR_LABELS[hour] ?? hour}
              </span>
              <button
                type="button"
                onClick={() => setHour(nextHour)}
                className="rounded-r-xl px-3 py-2 text-bodydark2 transition hover:bg-black/5 hover:text-primary dark:text-bodydark dark:hover:bg-white/10 dark:hover:text-white"
                title={`Créneau suivant (${HOUR_LABELS[nextHour] ?? nextHour})`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      <div className="pt-6">
        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <FormulaireSaisieFeuille feuille={feuille} externalDate={date} externalHour={hour} />
        </div>
      </div>
    </>
  );
};

export default SaisieFeuillePage;
