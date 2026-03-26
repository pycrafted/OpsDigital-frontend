import React from 'react';
import {
  type HourRow,
  PRODUCTION_CATEGORIES as categories,
  PRODUCTION_HOURS,
  productionHourLabels as hourLabels,
  type ProductionHourKey,
} from '../../data/production';
import { useProductionLabels } from '../../context/ProductionLabelsContext';
import { useRenommage } from '../../context/RenommageContext';
import { useProductionBounds } from '../../context/ProductionBoundsContext';
import { useTableView } from '../../context/TableViewContext';
import { fetchTableSettings, saveTableSettings } from '../../api/tableSettings';

const FEUILLE_ID = "production-valeur-electricite";

const hours = [...PRODUCTION_HOURS];
const allCategoryNames = categories.map((c) => c.category);
const allSubRowNames = [...new Set(categories.flatMap((c) => c.subRows).filter(Boolean))] as string[];

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

export interface TableProductionValeurElectriciteProps {
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

const TableProductionValeurElectricite = ({
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
}: TableProductionValeurElectriciteProps) => {
  const { getHourLabel } = useProductionLabels();
  const { getCategoryLabel: _getCat, getFieldLabel } = useRenommage();
  const getCategoryLabel = (cat: string) => _getCat('production-valeur-electricite', cat);
  const getMeasureLabel = (key: string, defaultLabel?: string) => getFieldLabel('production-valeur-electricite', key, defaultLabel ?? key);
  const { isOutOfBounds } = useProductionBounds();
  const { hideEmptyColumns, canEdit } = useTableView();

  // --- Drag & drop column order ---
  type DragState = { type: "category"; cat: string } | { type: "subrow"; cat: string; sub: string } | null;
  type DropTarget = { type: "category"; cat: string; side: "left" | "right" } | { type: "subrow"; cat: string; sub: string; side: "left" | "right" } | null;

  const defaultCatOrder = categories.map((c) => c.category);
  const defaultSubRowOrders: Record<string, string[]> = {};
  categories.forEach((c) => { defaultSubRowOrders[c.category] = [...c.subRows].filter(Boolean) as string[]; });

  const [categoryOrder, setCategoryOrder] = React.useState<string[]>(defaultCatOrder);
  const [subRowOrders, setSubRowOrders] = React.useState<Record<string, string[]>>(defaultSubRowOrders);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = React.useRef<DragState>(null);
  const [dropTarget, setDropTarget] = React.useState<DropTarget>(null);

  React.useEffect(() => {
    fetchTableSettings(FEUILLE_ID).then((s) => {
      if (Array.isArray(s["column_order"])) setCategoryOrder(s["column_order"] as string[]);
      else {
        try { const v = localStorage.getItem("production_column_order"); if (v) setCategoryOrder(JSON.parse(v) as string[]); } catch (_) {}
      }
      if (s["subrow_orders"] && typeof s["subrow_orders"] === "object" && !Array.isArray(s["subrow_orders"])) {
        setSubRowOrders(s["subrow_orders"] as Record<string, string[]>);
      } else {
        try { const v = localStorage.getItem("production_subrow_orders"); if (v) setSubRowOrders(JSON.parse(v) as Record<string, string[]>); } catch (_) {}
      }
    }).catch((_) => {
      try { const v = localStorage.getItem("production_column_order"); if (v) setCategoryOrder(JSON.parse(v) as string[]); } catch (_2) {}
      try { const v = localStorage.getItem("production_subrow_orders"); if (v) setSubRowOrders(JSON.parse(v) as Record<string, string[]>); } catch (_2) {}
    });
  }, []);

  function scheduleSave(colOrder: string[], subOrders: Record<string, string[]>) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("production_column_order", JSON.stringify(colOrder));
      localStorage.setItem("production_subrow_orders", JSON.stringify(subOrders));
      saveTableSettings(FEUILLE_ID, { column_order: colOrder, subrow_orders: subOrders }).catch((_) => {});
    }, 800);
  }

  function getSide(e: React.DragEvent<HTMLTableCellElement>): "left" | "right" {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? "left" : "right";
  }

  function handleCatDragStart(e: React.DragEvent<HTMLTableCellElement>, cat: string) {
    dragStateRef.current = { type: "category", cat };
    e.dataTransfer.effectAllowed = "move";
  }
  function handleCatDragOver(e: React.DragEvent<HTMLTableCellElement>, cat: string) {
    e.preventDefault();
    if (!dragStateRef.current || dragStateRef.current.type !== "category") return;
    setDropTarget({ type: "category", cat, side: getSide(e) });
  }
  function handleCatDrop(e: React.DragEvent<HTMLTableCellElement>, toCat: string) {
    e.preventDefault();
    const ds = dragStateRef.current;
    if (!ds || ds.type !== "category" || ds.cat === toCat) { setDropTarget(null); return; }
    const side = getSide(e);
    const arr = [...categoryOrder];
    const fromIdx = arr.indexOf(ds.cat);
    if (fromIdx === -1) { setDropTarget(null); return; }
    arr.splice(fromIdx, 1);
    let toIdx = arr.indexOf(toCat);
    if (toIdx === -1) { setDropTarget(null); return; }
    if (side === "right") toIdx += 1;
    arr.splice(toIdx, 0, ds.cat);
    setCategoryOrder(arr);
    scheduleSave(arr, subRowOrders);
    setDropTarget(null);
    dragStateRef.current = null;
  }

  function handleSubDragStart(e: React.DragEvent<HTMLTableCellElement>, cat: string, sub: string) {
    dragStateRef.current = { type: "subrow", cat, sub };
    e.dataTransfer.effectAllowed = "move";
  }
  function handleSubDragOver(e: React.DragEvent<HTMLTableCellElement>, cat: string, sub: string) {
    e.preventDefault();
    const ds = dragStateRef.current;
    if (!ds || ds.type !== "subrow" || ds.cat !== cat) return;
    setDropTarget({ type: "subrow", cat, sub, side: getSide(e) });
  }
  function handleSubDrop(e: React.DragEvent<HTMLTableCellElement>, cat: string, toSub: string) {
    e.preventDefault();
    const ds = dragStateRef.current;
    if (!ds || ds.type !== "subrow" || ds.cat !== cat || ds.sub === toSub) { setDropTarget(null); return; }
    const side = getSide(e);
    const base = subRowOrders[cat] ?? (categories.find((c) => c.category === cat)?.subRows.filter(Boolean) as string[]) ?? [];
    const arr = [...base];
    const fromIdx = arr.indexOf(ds.sub);
    if (fromIdx === -1) { setDropTarget(null); return; }
    arr.splice(fromIdx, 1);
    let toIdx = arr.indexOf(toSub);
    if (toIdx === -1) { setDropTarget(null); return; }
    if (side === "right") toIdx += 1;
    arr.splice(toIdx, 0, ds.sub);
    const newOrders = { ...subRowOrders, [cat]: arr };
    setSubRowOrders(newOrders);
    scheduleSave(categoryOrder, newOrders);
    setDropTarget(null);
    dragStateRef.current = null;
  }

  function clearDrag() {
    dragStateRef.current = null;
    setDropTarget(null);
  }
  // --- end drag & drop ---

  const [selectedHours, setSelectedHours] = React.useState<string[]>(() => [...hours]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(() => [...allCategoryNames]);
  const [selectedSubRows, setSelectedSubRows] = React.useState<string[]>(() => [...allSubRowNames]);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showSubRowDropdown, setShowSubRowDropdown] = React.useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const categoryTriggerRef = React.useRef<HTMLButtonElement>(null);
  const hourDropdownRef = React.useRef<HTMLDivElement>(null);
  const hourTriggerRef = React.useRef<HTMLButtonElement>(null);
  const subRowDropdownRef = React.useRef<HTMLDivElement>(null);
  const subRowTriggerRef = React.useRef<HTMLButtonElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  /** Cellule en cours d’édition : on affiche la valeur brute pour permettre de saisir "14.5" (le point). */
  const [focusedCell, setFocusedCell] = React.useState<{ hourIndex: number; key: string } | null>(null);

  /** Accepte uniquement vide ou nombre (entier/décimal, virgule ou point) pour les graphiques. */
  const handleChange = (hourIndex: number, categoryKey: string, value: string) => {
    if (value !== '' && !/^-?\d*[.,]?\d*$/.test(value)) return;
    const newData = [...data];
    newData[hourIndex] = {
      ...newData[hourIndex],
      values: { ...newData[hourIndex].values, [categoryKey]: value },
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

  React.useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target as Node) && !categoryTriggerRef.current?.contains(target as Node)) setShowCategoryDropdown(false);
      if (hourDropdownRef.current && !hourDropdownRef.current.contains(target as Node) && !hourTriggerRef.current?.contains(target as Node)) setShowHourDropdown(false);
      if (subRowDropdownRef.current && !subRowDropdownRef.current.contains(target as Node) && !subRowTriggerRef.current?.contains(target as Node)) setShowSubRowDropdown(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  const filteredHours = hours.filter((h) => selectedHours.includes(h));
  const currentCategories = categories
    .filter((cat) => selectedCategories.includes(cat.category))
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a.category);
      const bi = categoryOrder.indexOf(b.category);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    })
    .map((cat) => {
      const base = cat.subRows.filter(Boolean) as string[];
      const orderedSubs = (subRowOrders[cat.category] ?? base).filter((s) => base.includes(s) && selectedSubRows.includes(s));
      return { ...cat, subRows: orderedSubs };
    })
    .filter((cat) => cat.subRows.length > 0);

  const filteredData = filteredHours
    .map((h) => data.find((row) => row.hour === h))
    .filter((row): row is HourRow => row != null);
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

  const isEmptyState = hideEmptyColumns && visibleCategories.length === 0;

  const filterTriggerClass =
    'flex cursor-pointer items-center gap-2 rounded border border-primary bg-white px-2 py-1 text-xs font-bold text-primary shadow transition dark:border-[#313d4a] dark:bg-[#313d4a] dark:text-white';
  const dropdownPanelClass =
    'absolute left-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-stroke bg-white py-2 shadow-xl dark:border-strokedark dark:bg-boxdark';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6">
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80 dark:bg-boxdark/80">
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
          <div className="relative" ref={categoryDropdownRef}>
            <button type="button" ref={categoryTriggerRef} onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className={filterTriggerClass}>
              Catégories
              <span className={showCategoryDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showCategoryDropdown && (
              <div className={`${dropdownPanelClass} min-w-[14rem]`}>
                {allCategoryNames.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                        isSelected ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white' : 'text-bodydark2 hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4/60'
                      }`}
                    >
                      {isSelected && CHECK}
                      <span className={isSelected ? 'font-medium' : ''}>{getCategoryLabel(cat)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
                      {getHourLabel(hour as ProductionHourKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative" ref={subRowDropdownRef}>
            <button type="button" ref={subRowTriggerRef} onClick={() => setShowSubRowDropdown(!showSubRowDropdown)} className={filterTriggerClass}>
              Indicateurs
              <span className={showSubRowDropdown ? 'rotate-180' : ''}>{CHEVRON_DOWN}</span>
            </button>
            {showSubRowDropdown && (
              <div className={`${dropdownPanelClass} min-w-[18rem] max-h-72`}>
                {allSubRowNames.map((sub) => {
                  const isSelected = selectedSubRows.includes(sub);
                  // Find the composite key for this subRow (uses first matching category)
                  const cat = categories.find((c) => c.subRows.includes(sub));
                  const subLabel = cat ? getMeasureLabel(`${cat.category}_${sub}`, sub) : sub;
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
                      <span className={isSelected ? 'font-medium' : ''}>{subLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>}
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
        </div>
      </div>

      {hideEmptyColumns && visibleCategories.length === 0 ? (
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
                {visibleCategories.map((cat) => {
                  const isDraggingThis = dragStateRef.current?.type === "category" && dragStateRef.current.cat === cat.category;
                  const isDropHere = dropTarget?.type === "category" && dropTarget.cat === cat.category;
                  return (
                    <th
                      key={cat.category}
                      colSpan={cat.subRows.length}
                      draggable={canEdit}
                      onDragStart={(e) => handleCatDragStart(e, cat.category)}
                      onDragOver={(e) => handleCatDragOver(e, cat.category)}
                      onDrop={(e) => handleCatDrop(e, cat.category)}
                      onDragEnd={clearDrag}
                      onDragLeave={() => setDropTarget(null)}
                      className={`sticky top-0 z-10 min-w-0 border-b border-r border-stroke/70 py-1.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-white dark:border-strokedark select-none transition-colors ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${isDraggingThis ? "bg-[#0d1a47]" : "bg-primary"} ${isDropHere && dropTarget?.side === "left" ? "border-l-[3px] border-l-yellow-300" : ""} ${isDropHere && dropTarget?.side === "right" ? "border-r-[3px] border-r-yellow-300" : ""}`}
                    >
                      {getCategoryLabel(cat.category)}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {visibleCategories.flatMap((cat) =>
                  cat.subRows.map((subRow) => {
                    const measureKey = `${cat.category}_${subRow}`;
                    const measureLabel = getMeasureLabel(measureKey, subRow);
                    const isDraggingThis = dragStateRef.current?.type === "subrow" && dragStateRef.current.cat === cat.category && dragStateRef.current.sub === subRow;
                    const isDropHere = dropTarget?.type === "subrow" && dropTarget.cat === cat.category && dropTarget.sub === subRow;
                    return (
                      <th
                        key={measureKey}
                        draggable={canEdit}
                        onDragStart={(e) => handleSubDragStart(e, cat.category, subRow)}
                        onDragOver={(e) => handleSubDragOver(e, cat.category, subRow)}
                        onDrop={(e) => handleSubDrop(e, cat.category, subRow)}
                        onDragEnd={clearDrag}
                        onDragLeave={() => setDropTarget(null)}
                        className={`sticky top-7 z-10 w-[7rem] min-w-[7rem] max-w-[7rem] border-r border-b border-stroke/70 py-1 px-1 text-center text-[11px] font-medium text-white/95 dark:border-strokedark select-none transition-colors ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${isDraggingThis ? "bg-[#0d1a47]" : "bg-primary/90"} ${isDropHere && dropTarget?.side === "left" ? "border-l-[3px] border-l-yellow-300" : ""} ${isDropHere && dropTarget?.side === "right" ? "border-r-[3px] border-r-yellow-300" : ""}`}
                      >
                        <span className="block truncate" title={measureLabel}>{measureLabel}</span>
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
                        <span className="block truncate" title={getHourLabel(hourRow.hour as ProductionHourKey)}>{getHourLabel(hourRow.hour as ProductionHourKey)}</span>
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
                                inputMode="decimal"
                                value={isFocused ? value : formatDisplayValue(value)}
                                readOnly={!canEdit}
                                onFocus={() => setFocusedCell({ hourIndex: originalHourIndex, key })}
                                onBlur={() => setFocusedCell(null)}
                                onChange={(e) => handleChange(originalHourIndex, key, e.target.value)}
                                title={outOfBounds ? "Hors normes : valeur en dehors de l'intervalle min/max (paramètres)" : "Nombre (virgule ou point décimal)"}
                                data-cell="true"
                                data-row={rowIndex}
                                data-col={colIndex}
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

export default TableProductionValeurElectricite;
