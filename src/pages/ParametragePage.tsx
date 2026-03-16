import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useSaisieVisibility } from '../context/SaisieVisibilityContext';
import { useDisplayMode, DisplayMode } from '../context/DisplayModeContext';
import { useRenommage } from '../context/RenommageContext';
import { useTagsIp21, FieldSource } from '../context/TagsIp21Context';

const FEUILLES_SORTED = [...FEUILLES_CONFIG].sort((a, b) => a.title.localeCompare(b.title, 'fr'));

const VisibiliteSaisieSection: React.FC = () => {
  const { isFeuilleVisible, toggleFeuille, isFieldVisible, toggleField, setBulkFieldsVisibility } =
    useSaisieVisibility();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {FEUILLES_SORTED.map((feuille, index) => {
        const feuilleVisible = isFeuilleVisible(feuille.id);
        const isExpanded = expanded === feuille.id;

        const categoryMap = new Map<string, typeof feuille.fields>();
        for (const field of feuille.fields) {
          const cat = field.category ?? '';
          if (!categoryMap.has(cat)) categoryMap.set(cat, []);
          categoryMap.get(cat)!.push(field);
        }
        const categories = Array.from(categoryMap.entries());

        const totalFields = feuille.fields.length;
        const hiddenCount = feuille.fields.filter((f) => !isFieldVisible(feuille.id, f.key)).length;
        const visibleFieldCount = totalFields - hiddenCount;

        return (
          <div key={feuille.id} className={index > 0 ? 'border-t border-stroke dark:border-strokedark' : ''}>
            {/* Row */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleFeuille(feuille.id)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  feuilleVisible ? 'bg-primary' : 'bg-stroke dark:bg-meta-4'
                }`}
                aria-label={feuilleVisible ? 'Masquer le tableau' : 'Afficher le tableau'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    feuilleVisible ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              {/* Name */}
              <span
                className={`flex-1 text-sm font-semibold ${
                  feuilleVisible
                    ? 'text-black dark:text-white'
                    : 'text-bodydark dark:text-bodydark2 line-through'
                }`}
              >
                {feuille.title}
              </span>

              {/* Field count badge */}
              <span className="text-xs text-bodydark dark:text-bodydark2">
                {feuilleVisible
                  ? hiddenCount > 0
                    ? `${visibleFieldCount} / ${totalFields} champs`
                    : `${totalFields} champs`
                  : 'masqué'}
              </span>

              {/* Expand button */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : feuille.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-bodydark hover:bg-stroke dark:hover:bg-meta-4 transition"
                aria-label={isExpanded ? 'Réduire' : 'Voir les champs'}
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Fields accordion */}
            {isExpanded && (
              <div className="border-t border-stroke dark:border-strokedark bg-[#f0f9ff] dark:bg-[#1a222c] px-5 py-4">
                <div className="flex flex-col gap-5">
                  {categories.map(([cat, fields]) => {
                    const catLabel = cat.startsWith('__empty__') ? cat.slice(9) : cat;
                    const allCatVisible = fields.every((f) => isFieldVisible(feuille.id, f.key));
                    const fieldKeys = fields.map((f) => f.key);

                    return (
                      <div key={cat}>
                        {/* Category header */}
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-primary dark:text-white">
                            {catLabel || 'Général'}
                          </span>
                          <div className="flex-1 border-t border-stroke dark:border-strokedark" />
                          <button
                            type="button"
                            onClick={() =>
                              setBulkFieldsVisibility(feuille.id, fieldKeys, !allCatVisible)
                            }
                            className={`text-xs transition ${
                              feuilleVisible
                                ? 'text-bodydark hover:text-primary dark:text-bodydark2 dark:hover:text-white'
                                : 'pointer-events-none opacity-40 text-bodydark dark:text-bodydark2'
                            }`}
                          >
                            {allCatVisible ? 'Tout masquer' : 'Tout afficher'}
                          </button>
                        </div>

                        {/* Fields grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3 lg:grid-cols-4">
                          {fields.map((field) => {
                            const fieldVisible = isFieldVisible(feuille.id, field.key);
                            return (
                              <label
                                key={field.key}
                                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition hover:bg-stroke dark:hover:bg-meta-4 ${
                                  !feuilleVisible ? 'pointer-events-none opacity-40' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={fieldVisible}
                                  onChange={() => toggleField(feuille.id, field.key)}
                                  className="h-3.5 w-3.5 cursor-pointer accent-primary"
                                />
                                <span
                                  className={`text-xs ${
                                    fieldVisible
                                      ? 'text-black dark:text-white'
                                      : 'text-bodydark dark:text-bodydark2 line-through'
                                  }`}
                                >
                                  {field.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MODES: { id: DisplayMode; label: string; description: string; tableau: string; graphique: string }[] = [
  {
    id: 'synthese',
    label: 'Vue Synthèse',
    description: 'Affiche tous les tableaux et graphiques en une seule page.',
    tableau: '/tableaux?tableau=Tout',
    graphique: '/graphique/tous',
  },
  {
    id: 'detail',
    label: 'Vue Détail',
    description: 'Affiche un tableau ou graphique à la fois, avec navigation individuelle.',
    tableau: '/tableaux?tableau=Analyses du laboratoire',
    graphique: '/graphique',
  },
];

const ModeAffichageSection: React.FC = () => {
  const { mode, setMode } = useDisplayMode();

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-stroke dark:divide-strokedark md:grid-cols-2 md:divide-x md:divide-y-0">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex flex-col gap-4 px-8 py-8 text-left transition hover:bg-primary/5 dark:hover:bg-white/5 ${
                isActive ? 'bg-primary/5 dark:bg-white/5' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className={`text-base font-bold ${isActive ? 'text-primary dark:text-white' : 'text-black dark:text-white'}`}>
                  {m.label}
                </span>
                {/* Radio indicator */}
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                    isActive
                      ? 'border-primary bg-primary'
                      : 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark'
                  }`}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-bodydark dark:text-bodydark2">{m.description}</p>

              {/* Active badge */}
              {isActive && (
                <span className="self-start rounded border border-primary px-2 py-0.5 text-xs font-bold text-primary dark:text-white dark:border-white/30">
                  Actif
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────── Renommage ───────────── */

interface PanelItemProps {
  label: string;
  isModified: boolean;
  isSelected: boolean;
  onClick: () => void;
  onSave: (name: string) => void;
  onReset: () => void;
}

const PanelItem: React.FC<PanelItemProps> = ({ label, isModified, isSelected, onClick, onSave, onReset }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(label);
    setEditing(true);
  };

  const confirm = () => { onSave(draft); setEditing(false); };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 border-b border-stroke dark:border-strokedark last:border-b-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
          className="flex-1 rounded border border-primary px-2 py-0.5 text-xs text-black dark:text-white bg-white dark:bg-boxdark outline-none"
          autoFocus
        />
        <button type="button" onClick={confirm} title="Confirmer"
          className="flex h-6 w-6 items-center justify-center rounded text-primary hover:bg-primary/10 dark:text-white dark:hover:bg-white/10 transition">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button type="button" onClick={cancel} title="Annuler"
          className="flex h-6 w-6 items-center justify-center rounded text-bodydark hover:bg-stroke dark:text-bodydark2 dark:hover:bg-meta-4 transition">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group flex cursor-pointer items-center gap-2 px-3 py-2.5 border-b border-stroke dark:border-strokedark last:border-b-0 transition ${
        isSelected ? 'bg-primary/10 dark:bg-white/10' : 'hover:bg-stroke dark:hover:bg-meta-4'
      }`}
    >
      <span className={`flex-1 truncate text-xs ${
        isSelected ? 'font-bold text-primary dark:text-white' : 'text-black dark:text-white'
      }`}>
        {label}
        {isModified && <span className="ml-1 text-primary dark:text-bodydark2 opacity-70">✱</span>}
      </span>
      <button type="button" onClick={startEdit} title="Renommer"
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 text-bodydark hover:bg-stroke dark:text-bodydark2 dark:hover:bg-meta-4 transition">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {isModified && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onReset(); }} title="Réinitialiser"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 text-danger hover:bg-danger/10 transition">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

const PanelHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="border-b border-stroke bg-[#f0f9ff] px-4 py-2 dark:border-strokedark dark:bg-[#1a222c]">
    <span className="text-xs font-bold uppercase tracking-wide text-bodydark dark:text-bodydark2">{label}</span>
  </div>
);

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-1 items-center justify-center p-8">
    <span className="text-xs text-bodydark dark:text-bodydark2">{text}</span>
  </div>
);

const RenommageSection: React.FC = () => {
  const {
    config, getFeuilleTitle, getCategoryLabel, getFieldLabel,
    renameFeuille, renameCategory, renameField,
    resetFeuille, resetCategory, resetField,
  } = useRenommage();

  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedFeuille = selectedFeuilleId
    ? FEUILLES_CONFIG.find((f) => f.id === selectedFeuilleId) ?? null
    : null;

  const categories = selectedFeuille
    ? Array.from(new Map(selectedFeuille.fields.map((f) => [f.category, true])).keys())
    : [];

  const fields = selectedFeuille && selectedCategory !== null
    ? selectedFeuille.fields.filter((f) => f.category === selectedCategory)
    : [];

  const selectFeuille = (id: string) => {
    setSelectedFeuilleId(id);
    setSelectedCategory(null);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-stroke dark:divide-strokedark md:divide-x md:divide-y-0" style={{ minHeight: '420px' }}>

        {/* Panel 1 — Tableaux */}
        <div className="flex flex-col">
          <PanelHeader label="Tableau" />
          <div className="flex flex-col overflow-y-auto">
            {FEUILLES_SORTED.map((feuille) => (
              <PanelItem
                key={feuille.id}
                label={getFeuilleTitle(feuille.id)}
                isModified={!!config.feuilleNames[feuille.id]}
                isSelected={selectedFeuilleId === feuille.id}
                onClick={() => selectFeuille(feuille.id)}
                onSave={(name) => renameFeuille(feuille.id, name)}
                onReset={() => resetFeuille(feuille.id)}
              />
            ))}
          </div>
        </div>

        {/* Panel 2 — Colonnes / Catégories */}
        <div className="flex flex-col">
          <PanelHeader label="Colonne" />
          {selectedFeuille ? (
            <div className="flex flex-col overflow-y-auto">
              {categories.map((cat) => {
                const displayCat = cat.startsWith('__empty__') ? cat.slice(9) : cat || 'Général';
                const customCat = getCategoryLabel(selectedFeuille.id, displayCat);
                const isModified = !!config.categoryNames?.[selectedFeuille.id]?.[displayCat];
                return (
                  <PanelItem
                    key={cat}
                    label={customCat}
                    isModified={isModified}
                    isSelected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    onSave={(name) => renameCategory(selectedFeuille.id, displayCat, name)}
                    onReset={() => resetCategory(selectedFeuille.id, displayCat)}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyHint text="Sélectionnez un tableau" />
          )}
        </div>

        {/* Panel 3 — Sous-colonnes / Champs */}
        <div className="flex flex-col">
          <PanelHeader label="Sous-colonne" />
          {selectedFeuille && selectedCategory !== null ? (
            <div className="flex flex-col overflow-y-auto">
              {fields.map((field) => {
                const currentLabel = getFieldLabel(selectedFeuille.id, field.key, field.label);
                const isModified = !!config.fieldNames?.[selectedFeuille.id]?.[field.key];
                return (
                  <PanelItem
                    key={field.key}
                    label={currentLabel}
                    isModified={isModified}
                    isSelected={false}
                    onClick={() => {}}
                    onSave={(name) => renameField(selectedFeuille.id, field.key, name)}
                    onReset={() => resetField(selectedFeuille.id, field.key)}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyHint text={selectedFeuille ? 'Sélectionnez une colonne' : 'Sélectionnez un tableau puis une colonne'} />
          )}
        </div>

      </div>
    </div>
  );
};

/* ───────────── Tags IP21 ───────────── */

const SOURCE_OPTIONS: { id: FieldSource; label: string }[] = [
  { id: 'manual', label: 'Manuel' },
  { id: 'sap', label: 'SAP' },
  { id: 'ip21', label: 'IP21' },
];

const TagsIp21Section: React.FC = () => {
  const { config, getFieldConfig, setFieldSource, setFieldTag } = useTagsIp21();
  const { getFeuilleTitle, getFieldLabel } = useRenommage();
  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [refreshed, setRefreshed] = useState(false);

  const selectedFeuille = selectedFeuilleId
    ? FEUILLES_CONFIG.find((f) => f.id === selectedFeuilleId) ?? null
    : null;

  const categoryGroups = selectedFeuille
    ? Array.from(
        selectedFeuille.fields.reduce((map, field) => {
          const cat = field.category || '';
          if (!map.has(cat)) map.set(cat, []);
          map.get(cat)!.push(field);
          return map;
        }, new Map<string, typeof selectedFeuille.fields>()),
      )
    : [];

  const ip21CountForFeuille = (feuilleId: string) =>
    Object.values(config[feuilleId] ?? {}).filter((v) => v.source === 'ip21').length;

  const toggleCat = (cat: string) =>
    setExpandedCats((prev) => ({ ...prev, [cat]: prev[cat] === false ? true : false }));

  const isCatExpanded = (cat: string) => expandedCats[cat] !== false;

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('ip21-tags-updated'));
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-stroke px-5 py-3 dark:border-strokedark">
        <p className="text-xs text-bodydark dark:text-bodydark2">
          Configurez la source de chaque champ : <span className="font-semibold text-black dark:text-white">Manuel</span>, <span className="font-semibold text-black dark:text-white">SAP</span> ou <span className="font-semibold text-primary">IP21</span> (avec tag).
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className={`flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold shadow transition ${
            refreshed
              ? 'border-success bg-success text-white'
              : 'border-primary bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {refreshed ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Appliqué
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* 2-column layout */}
      <div
        className="grid grid-cols-1 md:grid-cols-[200px_1fr] divide-y divide-stroke dark:divide-strokedark md:divide-x md:divide-y-0"
        style={{ minHeight: '480px' }}
      >
        {/* Left — Tableau list */}
        <div className="flex flex-col">
          <div className="border-b border-stroke bg-[#f0f9ff] px-4 py-2 dark:border-strokedark dark:bg-[#1a222c]">
            <span className="text-xs font-bold uppercase tracking-wide text-bodydark dark:text-bodydark2">Tableau</span>
          </div>
          {FEUILLES_SORTED.map((feuille) => {
            const count = ip21CountForFeuille(feuille.id);
            const isSelected = selectedFeuilleId === feuille.id;
            return (
              <button
                key={feuille.id}
                type="button"
                onClick={() => { setSelectedFeuilleId(feuille.id); setExpandedCats({}); }}
                className={`flex items-center justify-between gap-2 border-b border-stroke px-4 py-2.5 text-left transition last:border-b-0 dark:border-strokedark ${
                  isSelected ? 'bg-primary/10 dark:bg-white/10' : 'hover:bg-stroke dark:hover:bg-meta-4'
                }`}
              >
                <span className={`truncate text-xs font-semibold ${isSelected ? 'text-primary dark:text-white' : 'text-black dark:text-white'}`}>
                  {getFeuilleTitle(feuille.id)}
                </span>
                {count > 0 && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right — Field list */}
        <div className="flex flex-col overflow-y-auto">
          {selectedFeuille ? (
            <>
              <div className="border-b border-stroke bg-[#f0f9ff] px-4 py-2 dark:border-strokedark dark:bg-[#1a222c]">
                <span className="text-xs font-bold uppercase tracking-wide text-bodydark dark:text-bodydark2">
                  {getFeuilleTitle(selectedFeuille.id)} — {selectedFeuille.fields.length} champs
                </span>
              </div>
              {categoryGroups.map(([cat, fields]) => {
                const displayCat = cat.startsWith('__empty__') ? cat.slice(9) : cat || 'Général';
                const expanded = isCatExpanded(cat);
                const ip21InCat = fields.filter(
                  (f) => getFieldConfig(selectedFeuille.id, f.key).source === 'ip21',
                ).length;
                return (
                  <div key={cat} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                    {/* Category header */}
                    <button
                      type="button"
                      onClick={() => toggleCat(cat)}
                      className="flex w-full items-center gap-2 bg-stroke/30 px-4 py-2 text-left transition hover:bg-stroke dark:bg-meta-4/20 dark:hover:bg-meta-4"
                    >
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 text-bodydark transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="flex-1 text-xs font-bold uppercase tracking-wide text-black dark:text-white">
                        {displayCat}
                      </span>
                      <span className="text-xs text-bodydark dark:text-bodydark2">{fields.length} champs</span>
                      {ip21InCat > 0 && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
                          {ip21InCat} IP21
                        </span>
                      )}
                    </button>

                    {/* Fields */}
                    {expanded && (
                      <div className="divide-y divide-stroke dark:divide-strokedark">
                        {fields.map((field) => {
                          const label = getFieldLabel(selectedFeuille.id, field.key, field.label);
                          const fc = getFieldConfig(selectedFeuille.id, field.key);
                          return (
                            <div key={field.key} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                              {/* Field name */}
                              <span className="min-w-[10rem] flex-1 text-xs text-black dark:text-white">{label}</span>

                              {/* Source buttons */}
                              <div className="flex items-center gap-1">
                                {SOURCE_OPTIONS.map((src) => {
                                  const isActive = fc.source === src.id;
                                  const activeClass =
                                    src.id === 'ip21'
                                      ? 'border-primary bg-primary text-white'
                                      : src.id === 'sap'
                                        ? 'border-[#e5a000] bg-[#e5a000] text-white'
                                        : 'border-[#64748b] bg-[#64748b] text-white';
                                  return (
                                    <button
                                      key={src.id}
                                      type="button"
                                      onClick={() => setFieldSource(selectedFeuille.id, field.key, src.id)}
                                      className={`rounded border px-2 py-0.5 text-[10px] font-bold transition ${
                                        isActive
                                          ? activeClass
                                          : 'border-stroke bg-white text-bodydark hover:border-primary hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-bodydark2 dark:hover:border-white dark:hover:text-white'
                                      }`}
                                    >
                                      {src.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* IP21 tag input */}
                              {fc.source === 'ip21' && (
                                <input
                                  type="text"
                                  value={fc.ip21Tag}
                                  onChange={(e) => setFieldTag(selectedFeuille.id, field.key, e.target.value)}
                                  placeholder="Ex : 17FC001.MEAS"
                                  className="w-40 rounded border border-primary bg-white px-2 py-0.5 font-mono text-xs text-black outline-none dark:bg-boxdark dark:text-white"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <span className="text-xs text-bodydark dark:text-bodydark2">
                Sélectionnez un tableau pour configurer ses champs
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ParametragePage: React.FC = () => {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section') ?? 'visibilite-saisie';

  return (
    <>
      <PageTitle />
      <div className="pt-4 pb-6">
        {section === 'visibilite-saisie' && <VisibiliteSaisieSection />}
        {section === 'mode-affichage' && <ModeAffichageSection />}
        {section === 'renommage' && <RenommageSection />}
        {section === 'tags-ip21' && <TagsIp21Section />}
      </div>
    </>
  );
};

export default ParametragePage;
