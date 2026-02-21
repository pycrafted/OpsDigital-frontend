import React from 'react';
import {
  COMPRESSEUR_K245_CATEGORIES as categories,
  COMPRESSEUR_K245_HOURS,
  compresseurK245HourLabels as hourLabels,
  type HourRow,
} from '../../data/compresseurK245';

const hours = [...COMPRESSEUR_K245_HOURS];
const allSubRowNames = [...new Set(categories.flatMap((c) => c.subRows))] as string[];

const CHEVRON_DOWN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="currentColor" />
  </svg>
);

const CHECK = (
  <svg className="h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const LOCK_CLOSED = (
  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const LOCK_OPEN = (
  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0010 5.5V9H3a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V5.5A4.5 4.5 0 0014.5 1zM12 9V5.5a2 2 0 10-4 0V9h4z" clipRule="evenodd" />
  </svg>
);

const VALIDATE_ICON = (
  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export interface TableCompresseurK245Props {
  data: HourRow[];
  onDataChange: (data: HourRow[]) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  loading?: boolean;
  onValidate?: () => void;
  saving?: boolean;
  showValidateButton?: boolean;
  lastSavedData?: HourRow[] | null;
}

const TableCompresseurK245 = ({
  data,
  onDataChange,
  selectedDate,
  onDateChange,
  loading = false,
  onValidate,
  saving = false,
  showValidateButton = false,
  lastSavedData = null,
}: TableCompresseurK245Props) => {
  const [selectedHours, setSelectedHours] = React.useState<string[]>(hours.map((h) => h));
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(categories.map(c => c.category));
  const [selectedSubRows, setSelectedSubRows] = React.useState<string[]>([...allSubRowNames]);
  const [canEdit, setCanEdit] = React.useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showSubRowDropdown, setShowSubRowDropdown] = React.useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const categoryTriggerRef = React.useRef<HTMLDivElement>(null);
  const hourDropdownRef = React.useRef<HTMLDivElement>(null);
  const hourTriggerRef = React.useRef<HTMLDivElement>(null);
  const subRowDropdownRef = React.useRef<HTMLDivElement>(null);
  const subRowTriggerRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (
    hourIndex: number,
    categoryKey: string,
    value: string
  ) => {
    const newData = [...data];
    newData[hourIndex] = {
      ...newData[hourIndex],
      values: {
        ...newData[hourIndex].values,
        [categoryKey]: value,
      },
    };
    onDataChange(newData);
  };

  const handleHourToggle = (hour: string) => {
    setSelectedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubRowToggle = (subRow: string) => {
    setSelectedSubRows((prev) =>
      prev.includes(subRow) ? prev.filter((s) => s !== subRow) : [...prev, subRow]
    );
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target as Node) &&
        !categoryTriggerRef.current?.contains(target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        hourDropdownRef.current &&
        !hourDropdownRef.current.contains(target as Node) &&
        !hourTriggerRef.current?.contains(target as Node)
      ) {
        setShowHourDropdown(false);
      }
      if (
        subRowDropdownRef.current &&
        !subRowDropdownRef.current.contains(target as Node) &&
        !subRowTriggerRef.current?.contains(target as Node)
      ) {
        setShowSubRowDropdown(false);
      }
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // Filter data based on selections
  const filteredHours = hours.filter((h) => selectedHours.includes(h));
  const filteredCategories = categories.filter((c) => selectedCategories.includes(c.category));
  const currentCategories = filteredCategories
    .map((cat) => ({
      ...cat,
      subRows: cat.subRows.filter((sub) => selectedSubRows.includes(sub)),
    }))
    .filter((cat) => cat.subRows.length > 0);

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-[#3c50e0] shadow-sm transition hover:border-primary/50 hover:bg-white hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80 dark:hover:text-white';
  const dropdownPanelClass =
    'absolute left-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-stroke bg-white py-2 shadow-xl dark:border-strokedark dark:bg-boxdark';

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80 dark:bg-boxdark/80">
          <p className="text-sm font-medium text-bodydark2">Chargement…</p>
        </div>
      )}
      {/* Barre de filtres (centrés) + bouton cadenas à droite */}
      <div className="flex w-full flex-shrink-0 items-center gap-2">
        <div className="flex-1" />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Catégories */}
          <div className="relative" ref={categoryDropdownRef}>
            <button type="button" ref={categoryTriggerRef} onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className={filterTriggerClass}>
              Catégories
              <span className={showCategoryDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showCategoryDropdown && (
              <div className={`${dropdownPanelClass} min-w-[14rem]`}>
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.category);
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.category)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      <span className={isSelected ? 'font-medium' : ''}>{cat.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Créneaux */}
          <div className="relative" ref={hourDropdownRef}>
            <button type="button" ref={hourTriggerRef} onClick={() => setShowHourDropdown(!showHourDropdown)} className={filterTriggerClass}>
              Créneaux
              <span className={showHourDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showHourDropdown && (
              <div className={`${dropdownPanelClass} min-w-[10rem]`}>
                {hours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleHourToggle(hour)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      {hourLabels[hour]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Indicateurs */}
          <div className="relative" ref={subRowDropdownRef}>
            <button type="button" ref={subRowTriggerRef} onClick={() => setShowSubRowDropdown(!showSubRowDropdown)} className={filterTriggerClass}>
              Indicateurs
              <span className={showSubRowDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showSubRowDropdown && (
              <div className={`${dropdownPanelClass} min-w-[18rem] max-h-72`}>
                {allSubRowNames.map((sub) => {
                  const isSelected = selectedSubRows.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubRowToggle(sub)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      <span className={isSelected ? 'font-medium' : ''}>{sub}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 justify-end items-center gap-2">
          {showValidateButton && (
            <button
              type="button"
              onClick={() => onValidate?.()}
              disabled={saving}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-3 text-green-600 transition hover:border-green-500 hover:bg-white hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:bg-boxdark dark:text-green-400 dark:hover:border-green-500 dark:hover:bg-meta-4/80 dark:hover:text-green-300"
              aria-label="Valider et sauvegarder les modifications"
            >
              {VALIDATE_ICON}
              <span className="text-sm font-medium text-inherit">{saving ? 'Sauvegarde…' : 'Valider'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCanEdit((prev) => !prev)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stroke/70 bg-white/90 text-primary transition hover:border-primary/50 hover:bg-white dark:border-strokedark dark:bg-boxdark dark:hover:border-primary dark:hover:bg-meta-4/80 dark:text-primary"
            aria-label="Modification directe"
          >
            {canEdit ? LOCK_OPEN : LOCK_CLOSED}
          </button>
        </div>
      </div>

      {/* Tableau — même design que les autres tableaux */}
      <div className="min-w-0 max-h-[calc(100vh-14rem)] overflow-auto">
        <div className="min-h-full w-max">
          <table className="min-w-full table-fixed border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col className="w-28 min-w-[6.5rem] max-w-[7rem]" />
              {currentCategories.flatMap((cat) =>
                cat.subRows.map((subRow) => (
                  <col key={`col-${cat.category}_${subRow}`} className="w-[7rem] min-w-[7rem] max-w-[7rem]" />
                ))
              )}
            </colgroup>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 border-t-0 border-l-0 bg-[#eff6ff] py-1.5 pl-2 pr-2 dark:border-strokedark dark:border-t-0 dark:border-l-0 dark:bg-[#273342]"
                  aria-label=""
                />
                {currentCategories.map((cat) => (
                  <th
                    key={cat.category}
                    colSpan={cat.subRows.length}
                    className="sticky top-0 z-10 min-w-0 border-b border-r border-stroke/70 bg-primary py-1.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-white dark:border-strokedark"
                  >
                    {cat.category}
                  </th>
                ))}
              </tr>
              <tr>
                {currentCategories.flatMap((cat) =>
                  cat.subRows.map((subRow) => (
                    <th
                      key={`${cat.category}_${subRow}`}
                      className="sticky top-7 z-10 w-[7rem] min-w-[7rem] max-w-[7rem] border-r border-b border-stroke/70 bg-primary/90 py-1 px-1 text-center text-[11px] font-medium text-white/95 dark:border-strokedark"
                    >
                      <span className="block truncate" title={subRow}>{subRow}</span>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {data
                .filter((hourRow) => filteredHours.includes(hourRow.hour))
                .map((hourRow) => {
                  const originalHourIndex = data.findIndex((hr) => hr.hour === hourRow.hour);
                  return (
                    <tr
                      key={hourRow.hour}
                      className={`group border-b border-stroke/50 odd:bg-slate-100 even:bg-white transition-colors dark:border-strokedark/70 dark:odd:bg-meta-4/30 dark:even:bg-boxdark ${canEdit ? 'hover:bg-slate-200 dark:hover:bg-meta-4/50' : ''}`}
                    >
                      <td className={`sticky left-0 z-10 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 bg-[#3c50e0] py-1 pl-2 pr-2 text-sm font-medium text-white dark:border-strokedark dark:bg-[#3c50e0] dark:text-white ${canEdit ? 'group-hover:bg-[#3c50e0]/90 dark:group-hover:bg-[#3c50e0]/90' : ''}`}>
                        <span className="block truncate" title={hourLabels[hourRow.hour as keyof typeof hourLabels]}>{hourLabels[hourRow.hour as keyof typeof hourLabels]}</span>
                      </td>
                      {currentCategories.flatMap((cat) =>
                        cat.subRows.map((subRow) => {
                          const key = `${cat.category}_${subRow}`;
                          const value = hourRow.values[key] || '';
                          const savedHourRow = lastSavedData != null && lastSavedData.length > 0 ? lastSavedData[originalHourIndex] : null;
                          const savedValue = savedHourRow?.values?.[key];
                          const isModified = savedHourRow != null && savedValue !== value;
                          return (
                            <td
                              key={key}
                              className={`w-[7rem] min-w-[7rem] max-w-[7rem] border-r border-stroke/50 py-0 px-1 dark:border-strokedark/70 ${isModified ? 'bg-[#24303f] dark:bg-[#f1f5f9]' : 'bg-transparent'}`}
                            >
                              <input
                                type="text"
                                value={value}
                                readOnly={!canEdit}
                                onChange={(e) => handleChange(originalHourIndex, key, e.target.value)}
                                className={`w-full py-1 pr-2 text-right text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                                  isModified
                                    ? 'bg-[#24303f] text-white placeholder:text-white/50 dark:bg-[#f1f5f9] dark:text-black dark:placeholder:text-black/50'
                                    : 'bg-transparent ' + (canEdit
                                      ? 'text-slate-800 focus:ring-2 focus:ring-primary/20 dark:text-slate-200'
                                      : 'cursor-default text-slate-800 dark:text-slate-200')
                                }`}
                                placeholder="—"
                              />
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableCompresseurK245;
