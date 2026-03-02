import React from 'react';
import {
  COMPRESSEUR_K245_CATEGORIES as categories,
  COMPRESSEUR_K245_HOURS,
  compresseurK245HourLabels as hourLabels,
  type HourRow,
  type CompresseurK245HourKey,
} from '../../data/compresseurK245';
import { useCompresseurK245Labels } from '../../context/CompresseurK245LabelsContext';
import { useCompresseurK245Bounds } from '../../context/CompresseurK245BoundsContext';
import { useTableView } from '../../context/TableViewContext';

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


/** Pour l’affichage : "15.0" → "15", "15.2" → "15.2" (sans .0 inutile). */
function formatDisplayValue(val: string): string {
  if (val === '' || val == null) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  if (Number.isNaN(n)) return val;
  return Number.isInteger(n) ? String(n) : String(n);
}

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
  sectionTitle?: string;
  showInlineDate?: boolean;
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
  sectionTitle,
  showInlineDate = false,
}: TableCompresseurK245Props) => {
  const { getHourLabel, getCategoryLabel, getMeasureLabel } = useCompresseurK245Labels();
  const { isOutOfBounds } = useCompresseurK245Bounds();
  const { hideEmptyColumns } = useTableView();

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
  const tableRef = React.useRef<HTMLTableElement>(null);
  /** Cellule en cours d’édition : on affiche la valeur brute pour permettre de saisir "14.5" (le point). */
  const [focusedCell, setFocusedCell] = React.useState<{ hourIndex: number; key: string } | null>(null);

  const handleChange = (
    hourIndex: number,
    categoryKey: string,
    value: string
  ) => {
    if (value !== '' && !/^-?\d*[.,]?\d*$/.test(value)) return;
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

  const filteredData = data.filter((hourRow) => filteredHours.includes(hourRow.hour as (typeof hours)[number]));
  const totalRows = filteredData.length;
  const visibleCategories = hideEmptyColumns
    ? currentCategories
        .map((cat) => ({
          ...cat,
          subRows: cat.subRows.filter((subRow) =>
            filteredData.some((row) => {
              const val = row.values[`${cat.category}_${subRow}`];
              return val !== '' && val != null;
            }),
          ),
        }))
        .filter((cat) => cat.subRows.length > 0)
    : currentCategories;
  const totalCols = visibleCategories.reduce((s, cat) => s + cat.subRows.length, 0);

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (!canEdit) return;
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' || target.getAttribute('data-cell') !== 'true') return;
    const row = target.getAttribute('data-row');
    const col = target.getAttribute('data-col');
    if (row === null || col === null) return;
    const rowIndex = parseInt(row, 10);
    const colIndex = parseInt(col, 10);
    if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) return;
    let nextRow = rowIndex;
    let nextCol = colIndex;
    switch (e.key) {
      case 'ArrowLeft':
        if (colIndex > 0) nextCol = colIndex - 1;
        else return;
        break;
      case 'ArrowRight':
        if (colIndex < totalCols - 1) nextCol = colIndex + 1;
        else return;
        break;
      case 'ArrowUp':
        if (rowIndex > 0) nextRow = rowIndex - 1;
        else return;
        break;
      case 'ArrowDown':
        if (rowIndex < totalRows - 1) nextRow = rowIndex + 1;
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    const nextInput = tableRef.current?.querySelector<HTMLInputElement>(
      `input[data-cell="true"][data-row="${nextRow}"][data-col="${nextCol}"]`
    );
    if (nextInput) {
      nextInput.focus();
    }
  };

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded border border-primary bg-white px-2 py-1 text-xs font-bold text-primary shadow transition dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white';
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
        <div className="flex-1">{sectionTitle && <p className="text-sm font-semibold text-primary dark:text-white">{sectionTitle}</p>}</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {showInlineDate && (
            <>
              <div className="flex items-center rounded border border-primary bg-white px-2 py-1 shadow dark:border-[#313d4a] dark:bg-[#313d4a]">
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-[7.5rem] rounded border-0 bg-transparent py-0.5 text-xs font-bold text-primary outline-none dark:text-white"
                />
              </div>
              <span className="h-4 w-px bg-primary/30" />
            </>
          )}
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
                      <span className={isSelected ? 'font-medium' : ''}>{getCategoryLabel(cat.category)}</span>
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
                      {getHourLabel(hour as CompresseurK245HourKey)}
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
              className="rounded bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-70"
              aria-label="Enregistrer les modifications"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enregistrement…
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCanEdit((prev) => !prev)}
            className="flex shrink-0 items-center justify-center rounded border border-primary bg-white px-2 py-1 text-primary shadow transition dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white"
            aria-label="Modification directe"
          >
            {canEdit ? LOCK_OPEN : LOCK_CLOSED}
          </button>
        </div>
      </div>

      {hideEmptyColumns && visibleCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6M3 21h18M3 10l9-7 9 7M5 21V10" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Aucune donnée disponible</p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Aucune mesure n'a été enregistrée pour le{' '}
              <span className="font-medium text-primary">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>
      ) : (
      <div className="min-w-0 max-h-[calc(100vh-14rem)] overflow-auto">
        <div className={`min-h-full w-max${hideEmptyColumns ? ' mx-auto' : ''}`}>
          <table
            ref={tableRef}
            className="min-w-full table-fixed border-collapse"
            style={{ tableLayout: 'fixed' }}
            onKeyDown={handleTableKeyDown}
          >
            <colgroup>
              <col className="w-28 min-w-[6.5rem] max-w-[7rem]" />
              {visibleCategories.flatMap((cat) =>
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
                {visibleCategories.map((cat) => (
                  <th
                    key={cat.category}
                    colSpan={cat.subRows.length}
                    className="sticky top-0 z-10 min-w-0 border-b border-r border-stroke/70 bg-primary py-1.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-white dark:border-strokedark"
                  >
                    {getCategoryLabel(cat.category)}
                  </th>
                ))}
              </tr>
              <tr>
                {visibleCategories.flatMap((cat) =>
                  cat.subRows.map((subRow) => {
                    const mKey = `${cat.category}_${subRow}`;
                    const label = getMeasureLabel(mKey);
                    return (
                      <th
                        key={mKey}
                        className="sticky top-7 z-10 w-[7rem] min-w-[7rem] max-w-[7rem] border-r border-b border-stroke/70 bg-primary/90 py-1 px-1 text-center text-[11px] font-medium text-white/95 dark:border-strokedark"
                      >
                        <span className="block truncate" title={label}>{label}</span>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((hourRow, rowIndex) => {
                  const originalHourIndex = data.findIndex((hr) => hr.hour === hourRow.hour);
                  return (
                    <tr
                      key={hourRow.hour}
                      className={`group border-b border-stroke/50 odd:bg-slate-100 even:bg-white transition-colors dark:border-strokedark/70 dark:odd:bg-meta-4/30 dark:even:bg-boxdark ${canEdit ? 'hover:bg-slate-200 dark:hover:bg-meta-4/50' : ''}`}
                    >
                      <td className={`sticky left-0 z-10 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 bg-[#3c50e0] py-1 pl-2 pr-2 text-sm font-medium text-white dark:border-strokedark dark:bg-[#3c50e0] dark:text-white ${canEdit ? 'group-hover:bg-[#3c50e0]/90 dark:group-hover:bg-[#3c50e0]/90' : ''}`}>
                        <span className="block truncate" title={getHourLabel(hourRow.hour as CompresseurK245HourKey)}>{getHourLabel(hourRow.hour as CompresseurK245HourKey)}</span>
                      </td>
                      {visibleCategories.flatMap((cat, catIndex) =>
                        cat.subRows.map((subRow, subIndex) => {
                          const colIndex = visibleCategories.slice(0, catIndex).reduce((s, c) => s + c.subRows.length, 0) + subIndex;
                          const key = `${cat.category}_${subRow}`;
                          const value = hourRow.values[key] || '';
                          const savedHourRow = lastSavedData != null && lastSavedData.length > 0 ? lastSavedData[originalHourIndex] : null;
                          const savedValue = savedHourRow?.values?.[key];
                          const isModified = savedHourRow != null && savedValue !== value;
                          const isFocused = focusedCell != null && focusedCell.hourIndex === originalHourIndex && focusedCell.key === key;
                          const outOfBounds = isOutOfBounds(key, value);
                          return (
                            <td
                              key={key}
                              className={`w-[7rem] min-w-[7rem] max-w-[7rem] border-r border-stroke/50 py-0 px-1 dark:border-strokedark/70 ${outOfBounds ? '!bg-red-600 dark:!bg-red-600' : isModified ? 'bg-[#24303f] dark:bg-[#f1f5f9]' : 'bg-transparent'}`}
                            >
                              <input
                                type="text"
                                value={isFocused ? value : formatDisplayValue(value)}
                                readOnly={!canEdit}
                                onFocus={() => setFocusedCell({ hourIndex: originalHourIndex, key })}
                                onBlur={() => setFocusedCell(null)}
                                inputMode="decimal"
                                title={outOfBounds ? "Hors normes : valeur en dehors de l'intervalle min/max (paramètres)" : 'Nombre (virgule ou point décimal)'}
                                onChange={(e) => handleChange(originalHourIndex, key, e.target.value)}
                                data-cell="true"
                                data-row={rowIndex}
                                data-col={colIndex}
                                className={`w-full py-1 pr-2 text-right text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                                  outOfBounds
                                    ? '!bg-red-600 !text-white placeholder:!text-white/70 dark:!bg-red-600 dark:!text-white'
                                    : isModified
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
      )}
    </div>
  );
};

export default TableCompresseurK245;
