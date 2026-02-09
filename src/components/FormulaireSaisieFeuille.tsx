import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FeuilleConfig,
  loadSaisieFromStorage,
  saveSaisieToStorage,
} from '../types/feuilles';

const HOUR_LABELS: Record<string, string> = {
  h7: '7h',
  h11: '11h',
  h15: '15h',
  h19: '19h',
  h23: '23h',
  h3: '3h',
};

interface FormulaireSaisieFeuilleProps {
  feuille: FeuilleConfig;
  onClose?: () => void;
}

const FormulaireSaisieFeuille: React.FC<FormulaireSaisieFeuilleProps> = ({
  feuille,
  onClose,
}) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(feuille.hours[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const hourIndex = feuille.hours.indexOf(hour);
  const previousHour =
    hourIndex > 0 ? feuille.hours[hourIndex - 1] : feuille.hours[feuille.hours.length - 1];

  useEffect(() => {
    const stored = loadSaisieFromStorage(feuille.id, date, hour);
    setValues(stored);
  }, [feuille.id, date, hour]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSaisieToStorage(feuille.id, date, hour, values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDupliquerCreneauPrecedent = () => {
    const prevValues = loadSaisieFromStorage(feuille.id, date, previousHour);
    setValues(prevValues);
    setSaved(false);
  };

  const fieldsByCategory = useMemo(() => {
    const map = new Map<string, { label: string; key: string }[]>();
    feuille.fields.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push({ label: f.label, key: f.key });
      map.set(f.category, list);
    });
    return map;
  }, [feuille.fields]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-6 dark:border-strokedark flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Saisie — {feuille.title}
          </h3>
          <p className="mt-0.5 text-sm text-bodydark2">{feuille.description}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            Changer de feuille
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Barre intelligente : date + créneau + raccourcis */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-stroke bg-gray-2/50 p-4 dark:border-strokedark dark:bg-meta-4/20">
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
              Date du relevé
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-stroke bg-white py-2.5 px-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
              Créneau
            </label>
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full rounded border border-stroke bg-white py-2.5 px-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            >
              {feuille.hours.map((h) => (
                <option key={h} value={h}>
                  {HOUR_LABELS[h] ?? h}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleDupliquerCreneauPrecedent}
            className="rounded border border-stroke bg-white py-2.5 px-4 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-meta-4/80"
          >
            Dupliquer {HOUR_LABELS[previousHour] ?? previousHour}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-primary py-2.5 px-5 text-sm font-medium text-white hover:bg-primary/90"
          >
            {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
          <Link
            to={feuille.route}
            className="rounded border border-primary bg-transparent py-2.5 px-4 text-sm font-medium text-primary hover:bg-primary hover:text-white dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-white"
          >
            Voir le tableau →
          </Link>
        </div>

        {/* Champs groupés par catégorie */}
        <div className="space-y-6">
          {Array.from(fieldsByCategory.entries()).map(([category, champs]) => (
            <div
              key={category}
              className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden"
            >
              <div className="bg-gray-2 px-4 py-2 dark:bg-meta-4/30">
                <h4 className="text-sm font-semibold text-black dark:text-white">
                  {category}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {champs.map(({ label, key }) => (
                  <div key={key}>
                    <label
                      htmlFor={key}
                      className="mb-1 block text-xs font-medium text-bodydark2"
                    >
                      {label}
                    </label>
                    <input
                      id={key}
                      type="text"
                      value={values[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="—"
                      className="w-full rounded border border-stroke bg-white py-2 px-3 text-sm text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-primary py-2.5 px-6 text-sm font-medium text-white hover:bg-primary/90"
          >
            {saved ? 'Enregistré ✓' : 'Enregistrer la saisie'}
          </button>
          <Link
            to={feuille.route}
            className="rounded border border-stroke bg-white py-2.5 px-6 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-meta-4/80"
          >
            Ouvrir le tableau
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FormulaireSaisieFeuille;
