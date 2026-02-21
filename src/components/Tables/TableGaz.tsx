import React from 'react';
import {
  GAZ_COLUMNS as columns,
  GAZ_HOURS as rows,
  type HourRow,
  type GazColumnKey,
  type GazHourKey,
} from '../../data/gaz';

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

export interface TableGazProps {
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

const TableGaz = ({
  data,
  onDataChange,
  selectedDate: _selectedDate,
  onDateChange: _onDateChange,
  loading = false,
  onValidate,
  saving = false,
  showValidateButton = false,
  lastSavedData = null,
}: TableGazProps) => {
  const [selectedRows, setSelectedRows] = React.useState<GazHourKey[]>(() => [...rows]);
  const [selectedColumnKeys, setSelectedColumnKeys] = React.useState<GazColumnKey[]>(() => columns.map((c) => c.key));
  const [canEdit, setCanEdit] = React.useState(false);
  const [showRowDropdown, setShowRowDropdown] = React.useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = React.useState(false);
  const rowDropdownRef = React.useRef<HTMLDivElement>(null);
  const rowTriggerRef = React.useRef<HTMLButtonElement>(null);
  const columnDropdownRef = React.useRef<HTMLDivElement>(null);
  const columnTriggerRef = React.useRef<HTMLButtonElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const handleChange = (rowHour: GazHourKey, col: GazColumnKey, value: string) => {
    const idx = data.findIndex((r) => r.hour === rowHour);
    if (idx === -1) return;
    const newData = [...data];
    newData[idx] = {
      ...newData[idx],
      values: { ...newData[idx].values, [col]: value },
    };
    onDataChange(newData);
  };

  const handleRowToggle = (row: GazHourKey) => {
    setSelectedRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]
    );
  };
  const handleColumnToggle = (col: GazColumnKey) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const filteredRows = rows.filter((r) => selectedRows.includes(r));
  const filteredColumns = columns.filter((c) => selectedColumnKeys.includes(c.key));

  const totalRows = filteredRows.length;
  const totalCols = filteredColumns.length;

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

  React.useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(target as Node) && !rowTriggerRef.current?.contains(target as Node)) setShowRowDropdown(false);
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(target as Node) && !columnTriggerRef.current?.contains(target as Node)) setShowColumnDropdown(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded-xl border border-stroke/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-[#3c50e0] shadow-sm transition hover:border-primary/50 hover:bg-white hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:border-primary dark:hover:bg-meta-4/80 dark:hover:text-white';
  const dropdownPanelClass =
    'absolute left-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-stroke bg-white py-2 shadow-xl dark:border-strokedark dark:bg-boxdark';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80 dark:bg-boxdark/80">
          <span className="text-sm font-medium text-bodydark2">Chargement…</span>
        </div>
      )}
      <div className="flex w-full flex-shrink-0 items-center gap-2">
        <div className="flex-1" />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="relative" ref={rowDropdownRef}>
            <button type="button" ref={rowTriggerRef} onClick={() => setShowRowDropdown(!showRowDropdown)} className={filterTriggerClass}>
              Créneaux
              <span className={showRowDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showRowDropdown && (
              <div className={`${dropdownPanelClass} min-w-[10rem]`}>
                {rows.map((row) => {
                  const isSelected = selectedRows.includes(row);
                  return (
                    <button
                      key={row}
                      type="button"
                      onClick={() => handleRowToggle(row)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      {row}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative" ref={columnDropdownRef}>
            <button type="button" ref={columnTriggerRef} onClick={() => setShowColumnDropdown(!showColumnDropdown)} className={filterTriggerClass}>
              Colonnes
              <span className={showColumnDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showColumnDropdown && (
              <div className={`${dropdownPanelClass} min-w-[12rem]`}>
                {columns.map((col) => {
                  const isSelected = selectedColumnKeys.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => handleColumnToggle(col.key)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      <span className={isSelected ? 'font-medium' : ''}>{col.title} — {col.subtitle}</span>
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
      <div className="inline-block max-h-[calc(100vh-14rem)] w-full max-w-full overflow-auto">
        <div className="min-h-full w-max">
          <table
            ref={tableRef}
            className="min-w-full border-collapse table-auto"
            onKeyDown={handleTableKeyDown}
          >
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-20 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 border-t-0 border-l-0 bg-[#eff6ff] py-1.5 pl-2 pr-2 dark:border-strokedark dark:border-t-0 dark:border-l-0 dark:bg-[#273342]"
                  aria-label=""
                />
                {filteredColumns.map((col) => (
                  <th
                    key={col.key}
                    className="sticky top-0 z-10 min-w-[6rem] border-b border-r border-stroke/70 bg-primary py-1.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-white dark:border-strokedark"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  className="sticky left-0 z-20 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 border-t-0 border-l-0 bg-[#eff6ff] py-1 pl-2 pr-2 text-xs font-medium text-bodydark2 dark:border-strokedark dark:border-t-0 dark:border-l-0 dark:bg-[#273342] dark:text-bodydark1"
                  aria-label=""
                >
                  {''}
                </th>
                {filteredColumns.map((col) => (
                  <th
                    key={col.key}
                    className="sticky top-7 z-10 min-w-[6rem] border-b border-r border-stroke/70 bg-primary/95 py-1 px-1.5 text-center text-[11px] font-medium text-white/95 dark:border-strokedark"
                  >
                    <span className="block truncate" title={col.subtitle}>
                      {col.subtitle}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((rowHour, rowIndex) => {
                const originalIndex = data.findIndex((r) => r.hour === rowHour);
                const rowData = data.find((r) => r.hour === rowHour);
                const values = rowData?.values ?? ({} as Record<GazColumnKey, string>);
                return (
                  <tr
                    key={rowHour}
                    className={`group border-b border-stroke/50 odd:bg-slate-100 even:bg-white transition-colors dark:border-strokedark/70 dark:odd:bg-meta-4/30 dark:even:bg-boxdark ${canEdit ? 'hover:bg-slate-200 dark:hover:bg-meta-4/50' : ''}`}
                  >
                    <td className={`sticky left-0 z-10 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 bg-[#3c50e0] py-1 pl-2 pr-2 text-sm font-medium text-white dark:border-strokedark dark:bg-[#3c50e0] dark:text-white ${canEdit ? 'group-hover:bg-[#3c50e0]/90 dark:group-hover:bg-[#3c50e0]/90' : ''}`}>
                      <span className="block truncate" title={rowHour}>
                        {rowHour}
                      </span>
                    </td>
                    {filteredColumns.map((col, colIndex) => {
                      const value = values[col.key] ?? '';
                      const savedRow = lastSavedData != null && lastSavedData.length > 0 && originalIndex >= 0 ? lastSavedData[originalIndex] : null;
                      const savedValue = savedRow?.values?.[col.key];
                      const isModified = savedRow != null && savedValue !== value;
                      return (
                        <td
                          key={col.key}
                          className={`min-w-[4rem] w-[4rem] border-r border-stroke/50 py-0 px-1 dark:border-strokedark/70 ${isModified ? 'bg-[#24303f] dark:bg-[#f1f5f9]' : 'bg-transparent'}`}
                        >
                          <input
                            type="text"
                            value={value}
                            readOnly={!canEdit}
                            onChange={(e) => handleChange(rowHour, col.key, e.target.value)}
                            data-cell="true"
                            data-row={rowIndex}
                            data-col={colIndex}
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
                    })}
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

export default TableGaz;
