import React from 'react';
import { useMouvementBacsLabels } from '../../context/MouvementBacsLabelsContext';
import { useRenommage } from '../../context/RenommageContext';
import { useMouvementBacsBounds } from '../../context/MouvementBacsBoundsContext';
import { useTableView } from '../../context/TableViewContext';
import type { MouvementBacsHourKey } from '../../data/mouvementDesBacs';
import { fetchTableSettings, saveTableSettings } from '../../api/tableSettings';

const FEUILLE_ID = "mouvement-des-bacs";

const columns = [
  'naphta sesulf',
  'kero S merox',
  'brut injection',
  'brut',
  'butane',
  'essence',
  'naphta',
  'reform AT',
  'kéro',
  'naphta charge',
  'go',
  'go lourd',
  'résidu',
  'slop',
  'go de tete',
] as const;

const rows = ['04h', '8h', '12h', '16h', '20h', '00h'] as const;

/** Types de bac pour le stockage (sélection par produit) */
const BAC_TYPES = ['—', 'T 543', 'T 544'] as const;

type ColumnKey = (typeof columns)[number];
type RowKey = (typeof rows)[number];

const createInitialData = (): Record<RowKey, Record<ColumnKey, string>> => {
  const data = {} as Record<RowKey, Record<ColumnKey, string>>;
  rows.forEach((row) => {
    data[row] = {} as Record<ColumnKey, string>;
    columns.forEach((col) => {
      data[row][col] = '';
    });
  });
  return data;
};

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



/** Pour l’affichage : "15.0" → "15", "15.2" → "15.2" (sans .0 inutile). */
function formatDisplayValue(val: string): string {
  if (val === '' || val == null) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  if (Number.isNaN(n)) return val;
  return Number.isInteger(n) ? String(n) : String(n);
}

export interface BacTypeOption {
  id: number;
  name: string;
  order: number;
}

interface TableMouvementDesBacsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  /** Données en mode contrôlé : [heure][produit] = valeur */
  data?: Record<RowKey, Record<ColumnKey, string>>;
  /** Callback (données tableau, bacs par produit) */
  onDataChange?: (newData: Record<RowKey, Record<ColumnKey, string>>, newBacs: Record<ColumnKey, string>) => void;
  /** Type de bac par produit (mode contrôlé) */
  bacTypeByProduct?: Record<ColumnKey, string>;
  loading?: boolean;
  onValidate?: () => void;
  saving?: boolean;
  showValidateButton?: boolean;
  bacTypesOptions?: BacTypeOption[];
  /** Dernières données sauvegardées (pour surligner les cellules modifiées) */
  lastSavedData?: { hour: string; values: Record<string, string> }[] | null;
  sectionTitle?: string;
  showInlineDate?: boolean;
}

const createInitialBacTypes = (): Record<ColumnKey, string> => {
  const init = {} as Record<ColumnKey, string>;
  columns.forEach((col) => {
    init[col] = BAC_TYPES[0]; // '—' par défaut
  });
  return init;
};

const TableMouvementDesBacs = ({
  selectedDate,
  onDateChange,
  data: controlledData,
  onDataChange,
  bacTypeByProduct: controlledBacs,
  loading = false,
  onValidate,
  saving = false,
  showValidateButton = false,
  bacTypesOptions,
  lastSavedData = null,
  sectionTitle,
  showInlineDate = false,
}: TableMouvementDesBacsProps) => {
  const { getHourLabel, getProductLabel: _getProduct } = useMouvementBacsLabels();
  const { getFieldLabel } = useRenommage();
  const getProductLabel = (product: string) => getFieldLabel('mouvement-des-bacs', product, _getProduct(product));
  const { isOutOfBounds } = useMouvementBacsBounds();
  const { hideEmptyColumns, canEdit } = useTableView();

  // --- Drag & drop column order ---
  type DragState = { key: string } | null;
  type DropTarget = { key: string; side: "left" | "right" } | null;

  const defaultColOrder = [...columns] as string[];
  const [columnOrder, setColumnOrder] = React.useState<string[]>(defaultColOrder);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = React.useRef<DragState>(null);
  const [dropTarget, setDropTarget] = React.useState<DropTarget>(null);

  React.useEffect(() => {
    fetchTableSettings(FEUILLE_ID).then((s) => {
      if (Array.isArray(s["column_order"])) setColumnOrder(s["column_order"] as string[]);
      else {
        try { const v = localStorage.getItem("bacs_column_order"); if (v) setColumnOrder(JSON.parse(v) as string[]); } catch (_) {}
      }
    }).catch((_) => {
      try { const v = localStorage.getItem("bacs_column_order"); if (v) setColumnOrder(JSON.parse(v) as string[]); } catch (_2) {}
    });
  }, []);

  function scheduleSave(order: string[]) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("bacs_column_order", JSON.stringify(order));
      saveTableSettings(FEUILLE_ID, { column_order: order }).catch((_) => {});
    }, 800);
  }

  function getSide(e: React.DragEvent<HTMLTableCellElement>): "left" | "right" {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? "left" : "right";
  }

  function handleColDragStart(e: React.DragEvent<HTMLTableCellElement>, key: string) {
    dragStateRef.current = { key };
    e.dataTransfer.effectAllowed = "move";
  }
  function handleColDragOver(e: React.DragEvent<HTMLTableCellElement>, key: string) {
    e.preventDefault();
    if (!dragStateRef.current) return;
    setDropTarget({ key, side: getSide(e) });
  }
  function handleColDrop(e: React.DragEvent<HTMLTableCellElement>, toKey: string) {
    e.preventDefault();
    const ds = dragStateRef.current;
    if (!ds || ds.key === toKey) { setDropTarget(null); return; }
    const side = getSide(e);
    const arr = [...columnOrder];
    const fromIdx = arr.indexOf(ds.key);
    if (fromIdx === -1) { setDropTarget(null); return; }
    arr.splice(fromIdx, 1);
    let toIdx = arr.indexOf(toKey);
    if (toIdx === -1) { setDropTarget(null); return; }
    if (side === "right") toIdx += 1;
    arr.splice(toIdx, 0, ds.key);
    setColumnOrder(arr);
    scheduleSave(arr);
    setDropTarget(null);
    dragStateRef.current = null;
  }

  function clearDrag() {
    dragStateRef.current = null;
    setDropTarget(null);
  }
  // --- end drag & drop ---

  const [internalData, setInternalData] = React.useState(createInitialData);
  const [internalBacs, setInternalBacs] = React.useState<Record<ColumnKey, string>>(createInitialBacTypes);
  const [selectedRows, setSelectedRows] = React.useState<RowKey[]>(() => [...rows]);
  const [selectedColumns, setSelectedColumns] = React.useState<ColumnKey[]>(() => [...columns]);
  const [showRowDropdown, setShowRowDropdown] = React.useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = React.useState(false);
  const rowDropdownRef = React.useRef<HTMLDivElement>(null);
  const rowTriggerRef = React.useRef<HTMLButtonElement>(null);
  const columnDropdownRef = React.useRef<HTMLDivElement>(null);
  const columnTriggerRef = React.useRef<HTMLButtonElement>(null);
  /** Cellule en cours d’édition : on affiche la valeur brute pour permettre de saisir "14.5" (le point). */
  const [focusedCell, setFocusedCell] = React.useState<{ row: RowKey; col: ColumnKey } | null>(null);

  const isControlled = controlledData != null && onDataChange != null;
  const data = isControlled ? controlledData : internalData;
  const bacTypeByProduct = controlledBacs != null ? controlledBacs : internalBacs;

  const handleBacTypeChange = (col: ColumnKey, value: string) => {
    const newBacs = { ...bacTypeByProduct, [col]: value };
    if (isControlled) {
      onDataChange(data, newBacs);
    } else {
      setInternalBacs(newBacs);
    }
  };

  const handleChange = (row: RowKey, col: ColumnKey, value: string) => {
    if (value !== '' && !/^-?\d*[.,]?\d*$/.test(value)) return;
    const newData = {
      ...data,
      [row]: { ...(data[row] ?? {}), [col]: value },
    };
    if (isControlled) {
      onDataChange(newData, bacTypeByProduct);
    } else {
      setInternalData(newData);
    }
  };

  const handleRowToggle = (row: RowKey) => {
    setSelectedRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]
    );
  };
  const handleColumnToggle = (col: ColumnKey) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const filteredRows = rows.filter((r) => selectedRows.includes(r));
  const filteredColumns = ([...columns] as ColumnKey[])
    .filter((c) => selectedColumns.includes(c))
    .sort((a, b) => {
      const ai = columnOrder.indexOf(a);
      const bi = columnOrder.indexOf(b);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    });
  const visibleColumns = hideEmptyColumns
    ? filteredColumns.filter((col) =>
        filteredRows.some((row) => {
          const val = (data[row] ?? {})[col];
          return val !== '' && val != null;
        })
      )
    : filteredColumns;
  const tableRef = React.useRef<HTMLTableElement>(null);
  const totalRows = filteredRows.length;
  const totalCols = visibleColumns.length;

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
      case 'Enter':
        if (showValidateButton) {
          e.preventDefault();
          e.stopPropagation();
          onValidate?.();
        }
        return;
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

  const bacTypeOptions = React.useMemo(() => {
    if (bacTypesOptions && bacTypesOptions.length > 0) {
      return ['—', ...bacTypesOptions.map((b) => b.name)];
    }
    return [...BAC_TYPES];
  }, [bacTypesOptions]);

  React.useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(target as Node) && !rowTriggerRef.current?.contains(target as Node)) setShowRowDropdown(false);
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(target as Node) && !columnTriggerRef.current?.contains(target as Node)) setShowColumnDropdown(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  const isEmptyState = hideEmptyColumns && visibleColumns.length === 0;

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded border border-primary bg-white px-2 py-1 text-xs font-bold text-primary shadow transition dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white';
  const dropdownPanelClass =
    'absolute left-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-stroke bg-white py-2 shadow-xl dark:border-strokedark dark:bg-boxdark';

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80 dark:bg-boxdark/80" aria-busy>
          <span className="text-sm font-medium text-primary">Chargement…</span>
        </div>
      )}
      <div className="flex w-full flex-shrink-0 items-center gap-2">
        <div className="flex-1">{sectionTitle && <p className="text-sm font-semibold text-primary dark:text-white">{sectionTitle}</p>}</div>
        {!isEmptyState && <div className="flex flex-wrap items-center justify-center gap-2">
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
          {/* Créneaux */}
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
                      {getHourLabel(row as MouvementBacsHourKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Colonnes */}
          <div className="relative" ref={columnDropdownRef}>
            <button type="button" ref={columnTriggerRef} onClick={() => setShowColumnDropdown(!showColumnDropdown)} className={filterTriggerClass}>
              Produits
              <span className={showColumnDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showColumnDropdown && (
              <div className={`${dropdownPanelClass} min-w-[14rem] max-h-72`}>
                {columns.map((col) => {
                  const isSelected = selectedColumns.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleColumnToggle(col)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      <span className={isSelected ? 'font-medium' : ''}>{getProductLabel(col)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>}
        <div className="flex flex-1 justify-end items-center gap-2">
          {showValidateButton && onValidate && (
            <button
              type="button"
              onClick={() => onValidate()}
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
        </div>
      </div>

      {hideEmptyColumns && visibleColumns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <svg className="h-8 w-8 text-primary dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6M3 21h18M3 10l9-7 9 7M5 21V10" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Aucune donnée disponible</p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Aucune mesure n'a été enregistrée pour le{' '}
              <span className="font-medium text-primary dark:text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>
      ) : (
      <div className="inline-block max-h-[calc(100vh-14rem)] w-full max-w-full overflow-auto">
        <div className={`min-h-full w-max${hideEmptyColumns ? ' mx-auto' : ''}`}>
          <table
            ref={tableRef}
            className="w-max min-w-full border-collapse table-auto"
            onKeyDown={handleTableKeyDown}
          >
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-20 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 border-t-0 border-l-0 bg-[#eff6ff] py-1.5 pl-2 pr-2 dark:border-strokedark dark:border-t-0 dark:border-l-0 dark:bg-[#273342]"
                  aria-label=""
                />
                {visibleColumns.map((col) => {
                  const isDraggingThis = dragStateRef.current?.key === col;
                  const isDropHere = dropTarget?.key === col;
                  return (
                    <th
                      key={col}
                      draggable={canEdit}
                      onDragStart={(e) => handleColDragStart(e, col)}
                      onDragOver={(e) => handleColDragOver(e, col)}
                      onDrop={(e) => handleColDrop(e, col)}
                      onDragEnd={clearDrag}
                      onDragLeave={() => setDropTarget(null)}
                      className={`sticky top-0 z-10 min-w-[5.5rem] border-b border-r border-stroke/70 py-1.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-white dark:border-strokedark select-none transition-colors ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${isDraggingThis ? "bg-[#0d1a47]" : "bg-primary"} ${isDropHere && dropTarget?.side === "left" ? "border-l-[3px] border-l-yellow-300" : ""} ${isDropHere && dropTarget?.side === "right" ? "border-r-[3px] border-r-yellow-300" : ""}`}
                    >
                      {getProductLabel(col)}
                    </th>
                  );
                })}
              </tr>
              <tr>
                <th
                  className="sticky left-0 z-20 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 border-t-0 border-l-0 bg-[#eff6ff] py-1 pl-2 pr-2 text-xs font-medium text-bodydark2 dark:border-strokedark dark:border-t-0 dark:border-l-0 dark:bg-[#273342] dark:text-bodydark1"
                >
                  Type de bac
                </th>
                {visibleColumns.map((col) => {
                  const isDraggingThis = dragStateRef.current?.key === col;
                  const isDropHere = dropTarget?.key === col;
                  return (
                    <th
                      key={col}
                      draggable={canEdit}
                      onDragStart={(e) => handleColDragStart(e, col)}
                      onDragOver={(e) => handleColDragOver(e, col)}
                      onDrop={(e) => handleColDrop(e, col)}
                      onDragEnd={clearDrag}
                      onDragLeave={() => setDropTarget(null)}
                      className={`sticky top-0 z-10 min-w-[6rem] border-b border-r border-stroke/70 py-1 px-1.5 dark:border-strokedark transition-colors ${isDraggingThis ? "bg-[#0d1a47]" : "bg-primary/95"} ${isDropHere && dropTarget?.side === "left" ? "border-l-[3px] border-l-yellow-300" : ""} ${isDropHere && dropTarget?.side === "right" ? "border-r-[3px] border-r-yellow-300" : ""}`}
                    >
                      <select
                        value={bacTypeByProduct[col] ?? bacTypeOptions[0]}
                        disabled={!canEdit}
                        onChange={(e) => handleBacTypeChange(col, e.target.value)}
                        className="w-full rounded border-0 bg-white/95 py-1.5 pl-2 pr-6 text-left text-xs font-medium text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-default disabled:opacity-90 dark:bg-meta-4 dark:text-white dark:focus:ring-white/30"
                        title={`Type de bac pour ${col}`}
                      >
                        {bacTypeOptions.map((bac) => (
                          <option key={bac} value={bac}>
                            {bac}
                          </option>
                        ))}
                      </select>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr
                  key={row}
                  className={`group border-b border-stroke/50 odd:bg-slate-100 even:bg-white transition-colors dark:border-strokedark/70 dark:odd:bg-meta-4/30 dark:even:bg-boxdark ${canEdit ? 'hover:bg-slate-200 dark:hover:bg-meta-4/50' : ''}`}
                >
                  <td className={`sticky left-0 z-10 w-28 min-w-[6.5rem] max-w-[7rem] border-r border-stroke/70 bg-[#3c50e0] py-1 pl-2 pr-2 text-sm font-medium text-white dark:border-strokedark dark:bg-[#3c50e0] dark:text-white ${canEdit ? 'group-hover:bg-[#3c50e0]/90 dark:group-hover:bg-[#3c50e0]/90' : ''}`}>
                    <span className="block truncate" title={getHourLabel(row as MouvementBacsHourKey)}>{getHourLabel(row as MouvementBacsHourKey)}</span>
                  </td>
                  {visibleColumns.map((col, colIndex) => {
                    const value = (data[row] ?? {})[col] ?? '';
                    const savedRow = lastSavedData?.find((r) => r.hour === row);
                    const savedValue = savedRow?.values?.[col] ?? '';
                    const isModified = savedRow != null && savedValue !== value;
                    const isFocused = focusedCell != null && focusedCell.row === row && focusedCell.col === col;
                    const outOfBounds = isOutOfBounds(col, value);
                    return (
                      <td
                        key={col}
                        className={`min-w-[3.25rem] w-[3.25rem] border-r border-stroke/50 py-0 px-1 dark:border-strokedark/70 ${outOfBounds ? '!bg-red-600 dark:!bg-red-600' : isModified ? 'bg-[#24303f] dark:bg-[#f1f5f9]' : 'bg-transparent'}`}
                      >
                        <input
                          type="text"
                          value={isFocused ? value : formatDisplayValue(value)}
                          readOnly={!canEdit}
                          onFocus={() => setFocusedCell({ row, col })}
                          onBlur={() => setFocusedCell(null)}
                          data-cell="true"
                          data-row={rowIndex}
                          data-col={colIndex}
                          inputMode="decimal"
                          title={outOfBounds ? "Hors normes : valeur en dehors de l'intervalle min/max (paramètres)" : "Nombre (virgule ou point décimal)"}
                          onChange={(e) => handleChange(row, col, e.target.value)}
                          className={`w-full py-1 pr-2 text-right text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                            outOfBounds
                              ? '!bg-red-600 !text-white placeholder:!text-white/70 focus:ring-red-400'
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
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default TableMouvementDesBacs;
