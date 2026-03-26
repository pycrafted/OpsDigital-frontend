import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageTitle from '../components/PageTitle';
import { FEUILLES_CONFIG } from '../types/feuilles';
import { useSaisieVisibility } from '../context/SaisieVisibilityContext';
import { useDisplayMode, DisplayMode } from '../context/DisplayModeContext';
import { useRenommage } from '../context/RenommageContext';
import { useTagsIp21, FieldSource } from '../context/TagsIp21Context';
import { testIp21Tag, bulkUpdateTagsIp21Config, type TagsIp21ConfigItem } from '../api/tagsIp21';
import { useAtmMeroxBounds } from '../context/AtmMeroxBoundsContext';
import { useCompresseurK244Bounds } from '../context/CompresseurK244BoundsContext';
import { useCompresseurK245Bounds } from '../context/CompresseurK245BoundsContext';
import { useProductionBounds } from '../context/ProductionBoundsContext';
import { useReformateurBounds } from '../context/ReformateurBoundsContext';
import { useGazBounds } from '../context/GazBoundsContext';
import { useMouvementBacsBounds } from '../context/MouvementBacsBoundsContext';
import { useAnalysesLaboBounds } from '../context/AnalysesLaboBoundsContext';
import { useAnalysesLaboLabels } from '../context/AnalysesLaboLabelsContext';
import { products as analysesLaboProductKeys, productLabels as analysesLaboProductLabels } from '../data/analysesLaboratoire';

/** Feuilles dont les tags IP21 sont réellement synchronisés par le backend */
const IP21_SUPPORTED_FEUILLES = new Set([
  'production-valeur-electricite',
  'atm-merox-preflash',
  'reformateur-catalytique',
  'compresseur-k244',
  'compresseur-k245',
  'gaz',
  'mouvement-des-bacs',
  'analyses-laboratoire',
]);

const FEUILLES_SORTED = [...FEUILLES_CONFIG].sort((a, b) => a.title.localeCompare(b.title, 'fr'));

const VisibiliteSaisieSection: React.FC = () => {
  const { isFeuilleVisible, toggleFeuille, isFieldVisible, toggleField, setBulkFieldsVisibility } =
    useSaisieVisibility();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Header */}
      <div className="border-b border-stroke px-5 py-3 dark:border-strokedark">
        <h4 className="text-sm font-semibold text-black dark:text-white">Visibilité des champs</h4>
        <p className="mt-0.5 text-xs text-bodydark dark:text-bodydark2">
          Masquez les tableaux ou les champs que vous ne souhaitez pas afficher dans l'application. Les champs masqués restent en base de données.
        </p>
      </div>
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
      {/* Header */}
      <div className="border-b border-stroke px-5 py-3 dark:border-strokedark">
        <h4 className="text-sm font-semibold text-black dark:text-white">Mode d'affichage</h4>
        <p className="mt-0.5 text-xs text-bodydark dark:text-bodydark2">
          Choisissez comment les données sont présentées par défaut dans les tableaux de l'application.
        </p>
      </div>
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

  const analysesLaboLabels = useAnalysesLaboLabels();

  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isAnalysesLabo = selectedFeuilleId === 'analyses-laboratoire';

  const selectedFeuille = selectedFeuilleId
    ? FEUILLES_CONFIG.find((f) => f.id === selectedFeuilleId) ?? null
    : null;

  const categories = selectedFeuille
    ? Array.from(new Map(selectedFeuille.fields.map((f) => [f.category, true])).keys())
    : [];

  // Pour analyses-labo : déduplique les mesures (une entrée par mesure, peu importe le produit)
  const fields = selectedFeuille && selectedCategory !== null
    ? isAnalysesLabo
      ? Array.from(
          new Map(
            selectedFeuille.fields
              .filter((f) => f.category === selectedCategory)
              .map((f) => [f.label, f])
          ).values()
        )
      : selectedFeuille.fields.filter((f) => f.category === selectedCategory)
    : [];

  const selectFeuille = (id: string) => {
    setSelectedFeuilleId(id);
    setSelectedCategory(null);
  };

  // ── Helpers analyses-labo : productLabel → productKey ──────────────────
  const findProductKey = (productLabel: string) =>
    analysesLaboProductKeys.find((k) => analysesLaboProductLabels[k] === productLabel) ?? null;

  // ── Label affiché en panel 2 ────────────────────────────────────────────
  const getCatLabel = (cat: string): string => {
    if (isAnalysesLabo) {
      const pk = findProductKey(cat);
      return pk ? analysesLaboLabels.getProductLabel(pk) : cat;
    }
    return getCategoryLabel(selectedFeuille!.id, cat);
  };

  const isCatModified = (cat: string): boolean => {
    if (isAnalysesLabo) {
      const pk = findProductKey(cat);
      return pk ? !!analysesLaboLabels.customLabels.products[pk] : false;
    }
    return !!config.categoryNames?.[selectedFeuille!.id]?.[cat];
  };

  const handleSaveCategory = (cat: string, name: string) => {
    if (isAnalysesLabo) {
      const pk = findProductKey(cat);
      if (pk) analysesLaboLabels.setCustomLabels((prev) => ({ ...prev, products: { ...prev.products, [pk]: name } }));
    } else {
      renameCategory(selectedFeuille!.id, cat, name);
    }
  };

  const handleResetCategory = (cat: string) => {
    if (isAnalysesLabo) {
      const pk = findProductKey(cat);
      if (pk) analysesLaboLabels.setCustomLabels((prev) => {
        const next = { ...prev.products };
        delete next[pk];
        return { ...prev, products: next };
      });
    } else {
      resetCategory(selectedFeuille!.id, cat);
    }
  };

  // ── Label affiché en panel 3 ────────────────────────────────────────────
  const getFieldLabelDisplay = (fieldKey: string, fieldLabel: string): string => {
    if (isAnalysesLabo) return analysesLaboLabels.getMeasureLabel(fieldLabel);
    return getFieldLabel(selectedFeuille!.id, fieldKey, fieldLabel);
  };

  const isFieldModifiedFn = (fieldKey: string, fieldLabel: string): boolean => {
    if (isAnalysesLabo) return !!analysesLaboLabels.customLabels.measures[fieldLabel];
    return !!config.fieldNames?.[selectedFeuille!.id]?.[fieldKey];
  };

  const handleSaveField = (fieldKey: string, fieldLabel: string, name: string) => {
    if (isAnalysesLabo) {
      analysesLaboLabels.setCustomLabels((prev) => ({ ...prev, measures: { ...prev.measures, [fieldLabel]: name } }));
    } else {
      renameField(selectedFeuille!.id, fieldKey, name);
    }
  };

  const handleResetField = (fieldKey: string, fieldLabel: string) => {
    if (isAnalysesLabo) {
      analysesLaboLabels.setCustomLabels((prev) => {
        const next = { ...prev.measures };
        delete next[fieldLabel];
        return { ...prev, measures: next };
      });
    } else {
      resetField(selectedFeuille!.id, fieldKey);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Header */}
      <div className="border-b border-stroke px-5 py-3 dark:border-strokedark">
        <h4 className="text-sm font-semibold text-black dark:text-white">Renommage des libellés</h4>
        <p className="mt-0.5 text-xs text-bodydark dark:text-bodydark2">
          Personnalisez les noms affichés pour les tableaux, catégories et champs. Les modifications sont appliquées immédiatement dans toute l'application.
        </p>
      </div>
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

        {/* Panel 2 — Lignes (analyses-labo) ou Colonnes (autres) */}
        <div className="flex flex-col">
          <PanelHeader label={isAnalysesLabo ? 'Ligne' : 'Colonne'} />
          {selectedFeuille ? (
            <div className="flex flex-col overflow-y-auto">
              {categories.map((cat) => {
                const displayCat = cat.startsWith('__empty__') ? cat.slice(9) : cat || 'Général';
                return (
                  <PanelItem
                    key={cat}
                    label={getCatLabel(displayCat)}
                    isModified={isCatModified(displayCat)}
                    isSelected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    onSave={(name) => handleSaveCategory(displayCat, name)}
                    onReset={() => handleResetCategory(displayCat)}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyHint text="Sélectionnez un tableau" />
          )}
        </div>

        {/* Panel 3 — Colonnes (analyses-labo) ou Sous-colonnes (autres) */}
        <div className="flex flex-col">
          <PanelHeader label={isAnalysesLabo ? 'Colonne' : 'Sous-colonne'} />
          {selectedFeuille && selectedCategory !== null ? (
            <div className="flex flex-col overflow-y-auto">
              {fields.map((field) => (
                <PanelItem
                  key={field.key}
                  label={getFieldLabelDisplay(field.key, field.label)}
                  isModified={isFieldModifiedFn(field.key, field.label)}
                  isSelected={false}
                  onClick={() => {}}
                  onSave={(name) => handleSaveField(field.key, field.label, name)}
                  onReset={() => handleResetField(field.key, field.label)}
                />
              ))}
            </div>
          ) : (
            <EmptyHint text={selectedFeuille ? `Sélectionnez une ${isAnalysesLabo ? 'ligne' : 'colonne'}` : `Sélectionnez un tableau puis une ${isAnalysesLabo ? 'ligne' : 'colonne'}`} />
          )}
        </div>

      </div>
    </div>
  );
};

/* ───────────── Inline rename label (Tags IP21) ───────────── */

interface InlineRenameLabelProps {
  label: string;
  isModified: boolean;
  onSave: (name: string) => void;
  onReset: () => void;
  className?: string;
}

const InlineRenameLabel: React.FC<InlineRenameLabelProps> = ({ label, isModified, onSave, onReset, className }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const startEdit = (e: React.MouseEvent) => { e.stopPropagation(); setDraft(label); setEditing(true); };
  const confirm  = (e: React.MouseEvent) => { e.stopPropagation(); onSave(draft); setEditing(false); };
  const cancel   = (e: React.MouseEvent) => { e.stopPropagation(); setEditing(false); };

  if (editing) {
    return (
      <div className={`flex items-center gap-1 ${className ?? ''}`} onClick={(e) => e.stopPropagation()}>
        <input
          type="text" value={draft} autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { onSave(draft); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
          className="min-w-0 flex-1 rounded border border-primary px-2 py-0.5 text-xs text-black dark:text-white bg-white dark:bg-boxdark outline-none"
        />
        <button type="button" onClick={confirm} title="Valider"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-primary hover:bg-primary/10 dark:text-white dark:hover:bg-white/10 transition">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button type="button" onClick={cancel} title="Annuler"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-bodydark hover:bg-stroke dark:text-bodydark2 dark:hover:bg-meta-4 transition">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`group/irl flex items-center gap-1 ${className ?? ''}`} onClick={(e) => e.stopPropagation()}>
      <span className="truncate text-xs text-black dark:text-white">
        {label}{isModified && <span className="ml-1 text-primary opacity-70">✱</span>}
      </span>
      <button type="button" onClick={startEdit} title="Renommer"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover/irl:opacity-100 text-bodydark hover:bg-stroke dark:text-bodydark2 dark:hover:bg-meta-4 transition">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {isModified && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onReset(); }} title="Réinitialiser"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover/irl:opacity-100 text-danger hover:bg-danger/10 transition">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

/* ───────────── Tags IP21 ───────────── */

const SOURCE_OPTIONS: { id: FieldSource; label: string }[] = [
  { id: 'manual', label: 'Manuel' },
  { id: 'sap', label: 'SAP' },
  { id: 'ip21', label: 'IP21' },
];

type TestState = { status: 'idle' | 'loading' | 'ok' | 'error'; message: string };

const TagsIp21Section: React.FC = () => {
  const { config, loading, getFieldConfig, reload } = useTagsIp21();
  const { getFeuilleTitle, getFieldLabel, renameField, resetField, config: renommageConfig } = useRenommage();
  const analysesLaboLabels = useAnalysesLaboLabels();
  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const isAnalysesLabo = selectedFeuilleId === 'analyses-laboratoire';
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Modifications locales non encore enregistrées : { feuilleId: { fieldKey: { source, ip21Tag } } }
  type LocalFieldConfig = { source: FieldSource; ip21Tag: string };
  const [localConfig, setLocalConfig] = useState<Record<string, Record<string, LocalFieldConfig>>>({});
  // Résultats des tests : clé = fieldKey, valeur = état du test
  const [testStates, setTestStates] = useState<Record<string, TestState>>({});

  const selectedFeuille = selectedFeuilleId
    ? FEUILLES_CONFIG.find((f) => f.id === selectedFeuilleId) ?? null
    : null;

  const isSupported = selectedFeuilleId ? IP21_SUPPORTED_FEUILLES.has(selectedFeuilleId) : true;

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
    setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const isCatExpanded = (cat: string) => expandedCats[cat] !== false;

  // Lit la config effective pour un champ : local en priorité, sinon DB
  const getEffectiveConfig = (feuilleId: string, fieldKey: string) => {
    const local = localConfig[feuilleId]?.[fieldKey];
    if (local) return local;
    return getFieldConfig(feuilleId, fieldKey);
  };

  const setLocalSource = (feuilleId: string, fieldKey: string, source: FieldSource) => {
    setLocalConfig((prev) => {
      const current = prev[feuilleId]?.[fieldKey] ?? getFieldConfig(feuilleId, fieldKey);
      return { ...prev, [feuilleId]: { ...prev[feuilleId], [fieldKey]: { ...current, source } } };
    });
  };

  const setLocalTag = (feuilleId: string, fieldKey: string, tag: string) => {
    setLocalConfig((prev) => {
      const current = prev[feuilleId]?.[fieldKey] ?? getFieldConfig(feuilleId, fieldKey);
      return { ...prev, [feuilleId]: { ...prev[feuilleId], [fieldKey]: { ...current, ip21Tag: tag } } };
    });
  };

  const dirtyCount = Object.values(localConfig).reduce((sum, fields) => sum + Object.keys(fields).length, 0);

  const handleSave = async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const items: TagsIp21ConfigItem[] = [];
      for (const [feuilleId, fields] of Object.entries(localConfig)) {
        for (const [fieldKey, fc] of Object.entries(fields)) {
          items.push({ feuille_id: feuilleId, field_key: fieldKey, source: fc.source, ip21_tag: fc.ip21Tag });
        }
      }
      console.debug('[TagsIp21] Sauvegarde :', items);
      await bulkUpdateTagsIp21Config(items);
      await reload();
      setLocalConfig({});
      window.dispatchEvent(new CustomEvent('ip21-tags-updated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('TagsIp21: échec de la sauvegarde', err);
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTag = async (fieldKey: string, tag: string) => {
    if (!tag.trim()) return;
    setTestStates((prev) => ({ ...prev, [fieldKey]: { status: 'loading', message: 'Connexion en cours…' } }));
    try {
      const result = await testIp21Tag(tag.trim());
      setTestStates((prev) => ({
        ...prev,
        [fieldKey]: { status: result.ok ? 'ok' : 'error', message: result.message },
      }));
    } catch {
      setTestStates((prev) => ({
        ...prev,
        [fieldKey]: { status: 'error', message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-sm border border-stroke bg-white p-16 shadow-default dark:border-strokedark dark:bg-boxdark">
        <span className="text-sm text-bodydark dark:text-bodydark2">Chargement des tags IP21…</span>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Erreur sauvegarde */}
      {saveError && (
        <div className="flex items-start justify-between gap-2 border-b border-danger/30 bg-danger/10 px-5 py-3 dark:bg-danger/20">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-danger">
              <span className="font-semibold">Échec de la sauvegarde :</span> {saveError}
            </p>
          </div>
          <button type="button" onClick={() => setSaveError(null)} className="shrink-0 text-danger hover:opacity-70 transition">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-stroke px-5 py-3 dark:border-strokedark">
        <p className="text-xs text-bodydark dark:text-bodydark2">
          Configurez la source de chaque champ : <span className="font-semibold text-black dark:text-white">Manuel</span>, <span className="font-semibold text-black dark:text-white">SAP</span> ou <span className="font-semibold text-primary">IP21</span> (avec tag).
        </p>
        {(dirtyCount > 0 || saving || saved) && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold shadow transition disabled:cursor-not-allowed disabled:opacity-50 ${
              saved
                ? 'border-success bg-success text-white'
                : 'border-primary bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {saved ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Enregistré
              </>
            ) : saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Enregistrer ({dirtyCount})
              </>
            )}
          </button>
        )}
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
            const supported = IP21_SUPPORTED_FEUILLES.has(feuille.id);
            return (
              <button
                key={feuille.id}
                type="button"
                onClick={() => { setSelectedFeuilleId(feuille.id); setExpandedCats({}); setTestStates({}); }}
                className={`flex items-center justify-between gap-2 border-b border-stroke px-4 py-2.5 text-left transition last:border-b-0 dark:border-strokedark ${
                  isSelected ? 'bg-primary/10 dark:bg-white/10' : 'hover:bg-stroke dark:hover:bg-meta-4'
                }`}
              >
                <span className={`truncate text-xs font-semibold ${isSelected ? 'text-primary dark:text-white' : 'text-black dark:text-white'}`}>
                  {getFeuilleTitle(feuille.id)}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {!supported && (
                    <span className="rounded bg-stroke px-1.5 py-0.5 text-[9px] font-bold uppercase text-bodydark dark:bg-meta-4 dark:text-bodydark2">
                      lecture seule
                    </span>
                  )}
                  {count > 0 && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
                      {count}
                    </span>
                  )}
                </div>
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

              {/* Avertissement feuille non synchronisée */}
              {!isSupported && (
                <div className="flex items-start gap-2 border-b border-stroke bg-warning/5 px-5 py-3 dark:border-strokedark">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-bodydark dark:text-bodydark2">
                    <span className="font-semibold text-black dark:text-white">Ce tableau ne supporte pas encore la synchronisation IP21 automatique.</span>
                    {' '}Les tags saisis ici sont enregistrés, mais les valeurs ne seront pas remplies automatiquement depuis IP21. Seuls les tableaux <span className="font-semibold text-black dark:text-white">Production</span>, <span className="font-semibold text-black dark:text-white">Atm/Merox</span>, <span className="font-semibold text-black dark:text-white">Réformateur catalytique</span>, <span className="font-semibold text-black dark:text-white">Compresseur K 244</span> et <span className="font-semibold text-black dark:text-white">Compresseur K 245</span> bénéficient de cette fonctionnalité.
                  </p>
                </div>
              )}

              {categoryGroups.map(([cat, fields]) => {
                const displayCat = cat.startsWith('__empty__') ? cat.slice(9) : cat || 'Général';
                const expanded = isCatExpanded(cat);
                const ip21InCat = fields.filter(
                  (f) => getFieldConfig(selectedFeuille.id, f.key).source === 'ip21',
                ).length;
                // For analyses-labo: product (row) rename
                const productKey = isAnalysesLabo
                  ? (analysesLaboProductKeys.find((k) => analysesLaboProductLabels[k] === cat) ?? null)
                  : null;
                const catLabel = isAnalysesLabo && productKey
                  ? analysesLaboLabels.getProductLabel(productKey)
                  : displayCat;
                const isCatModified = isAnalysesLabo && productKey
                  ? !!analysesLaboLabels.customLabels.products[productKey]
                  : false;
                return (
                  <div key={cat} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                    {/* Category header */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleCat(cat)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCat(cat); }}
                      className="flex w-full items-center gap-2 bg-stroke/30 px-4 py-2 text-left transition hover:bg-stroke dark:bg-meta-4/20 dark:hover:bg-meta-4 cursor-pointer"
                    >
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 text-bodydark transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {isAnalysesLabo ? (
                        <InlineRenameLabel
                          className="flex-1"
                          label={catLabel}
                          isModified={isCatModified}
                          onSave={(newLabel) => productKey && analysesLaboLabels.setCustomLabels((prev) => ({
                            ...prev,
                            products: { ...prev.products, [productKey]: newLabel },
                          }))}
                          onReset={() => {
                            if (!productKey) return;
                            analysesLaboLabels.setCustomLabels((prev) => {
                              const { [productKey]: _removed, ...rest } = prev.products;
                              return { ...prev, products: rest };
                            });
                          }}
                        />
                      ) : (
                        <span className="flex-1 text-xs font-bold uppercase tracking-wide text-black dark:text-white">
                          {displayCat}
                        </span>
                      )}
                      <span className="text-xs text-bodydark dark:text-bodydark2">{fields.length} champs</span>
                      {ip21InCat > 0 && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
                          {ip21InCat} IP21
                        </span>
                      )}
                    </div>

                    {/* Fields */}
                    {expanded && (
                      <div className="divide-y divide-stroke dark:divide-strokedark">
                        {fields.map((field) => {
                          const label = getFieldLabel(selectedFeuille.id, field.key, field.label);
                          const fc = getEffectiveConfig(selectedFeuille.id, field.key);
                          const ts = testStates[field.key];
                          // For analyses-labo: measure (column) rename
                          const measureName = isAnalysesLabo ? field.key.split('||')[0] : '';
                          const measureLabel = isAnalysesLabo ? analysesLaboLabels.getMeasureLabel(measureName) : label;
                          const isMeasureModified = isAnalysesLabo ? !!analysesLaboLabels.customLabels.measures[measureName] : false;
                          return (
                            <div key={field.key} className="flex flex-col gap-1.5 px-5 py-2.5">
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Field name */}
                                {isAnalysesLabo ? (
                                  <InlineRenameLabel
                                    className="min-w-[10rem] flex-1"
                                    label={measureLabel}
                                    isModified={isMeasureModified}
                                    onSave={(newLabel) => analysesLaboLabels.setCustomLabels((prev) => ({
                                      ...prev,
                                      measures: { ...prev.measures, [measureName]: newLabel },
                                    }))}
                                    onReset={() => analysesLaboLabels.setCustomLabels((prev) => {
                                      const { [measureName]: _removed, ...rest } = prev.measures;
                                      return { ...prev, measures: rest };
                                    })}
                                  />
                                ) : (
                                  <InlineRenameLabel
                                    className="min-w-[10rem] flex-1"
                                    label={label}
                                    isModified={!!renommageConfig.fieldNames[selectedFeuille.id]?.[field.key]}
                                    onSave={(newLabel) => renameField(selectedFeuille.id, field.key, newLabel)}
                                    onReset={() => resetField(selectedFeuille.id, field.key)}
                                  />
                                )}

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
                                        onClick={() => {
                                          setLocalSource(selectedFeuille.id, field.key, src.id);
                                          setTestStates((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                                        }}
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

                                {/* IP21 tag input + bouton Tester */}
                                {fc.source === 'ip21' && (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={fc.ip21Tag}
                                      onChange={(e) => {
                                        setLocalTag(selectedFeuille.id, field.key, e.target.value);
                                        setTestStates((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                                      }}
                                      placeholder="Ex : 17FC001.MEAS"
                                      className="w-36 rounded border border-primary bg-white px-2 py-0.5 font-mono text-xs text-black outline-none dark:bg-boxdark dark:text-white"
                                    />
                                    <button
                                      type="button"
                                      disabled={!fc.ip21Tag.trim() || ts?.status === 'loading'}
                                      onClick={() => handleTestTag(field.key, fc.ip21Tag)}
                                      className="flex items-center gap-1 rounded border border-stroke bg-white px-2 py-0.5 text-[10px] font-bold text-bodydark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-bodydark2 dark:hover:border-white dark:hover:text-white"
                                    >
                                      {ts?.status === 'loading' ? (
                                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                      ) : (
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                      Tester
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Résultat du test */}
                              {fc.source === 'ip21' && ts && ts.status !== 'loading' && (
                                <div className={`ml-0 flex items-start gap-1.5 rounded px-2 py-1.5 text-xs ${
                                  ts.status === 'ok'
                                    ? 'bg-success/10 text-success dark:bg-success/20'
                                    : 'bg-danger/10 text-danger dark:bg-danger/20'
                                }`}>
                                  {ts.status === 'ok' ? (
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                  )}
                                  <span>{ts.message}</span>
                                </div>
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

type BoundsCtx = { bounds: Record<string, { min: string; max: string }>; setBounds: (u: (p: Record<string, { min: string; max: string }>) => Record<string, { min: string; max: string }>) => void };

const BornesSection: React.FC = () => {
  const atmMerox       = useAtmMeroxBounds();
  const k244           = useCompresseurK244Bounds();
  const k245           = useCompresseurK245Bounds();
  const production     = useProductionBounds();
  const reformateur    = useReformateurBounds();
  const gaz            = useGazBounds();
  const mouvement      = useMouvementBacsBounds();
  const analyses       = useAnalysesLaboBounds();

  // Adaptateur : convertit la structure 2-niveaux de AnalysesLaboBounds en BoundsCtx plat
  // clé : "{measure}||{productKey}" → { min, max }
  const analysesCtxBounds = React.useMemo<Record<string, { min: string; max: string }>>(() => {
    const flat: Record<string, { min: string; max: string }> = {};
    for (const [pk, pp] of Object.entries(analyses.bounds)) {
      if (pp) {
        for (const [m, mm] of Object.entries(pp)) {
          flat[`${m}||${pk}`] = mm;
        }
      }
    }
    return flat;
  }, [analyses.bounds]);

  const analysesSetBounds = React.useCallback(
    (updater: (p: Record<string, { min: string; max: string }>) => Record<string, { min: string; max: string }>) => {
      analyses.setBounds((prev) => {
        const flatPrev: Record<string, { min: string; max: string }> = {};
        for (const [pk, pp] of Object.entries(prev)) {
          if (pp) for (const [m, mm] of Object.entries(pp)) flatPrev[`${m}||${pk}`] = mm;
        }
        const flatNext = updater(flatPrev);
        const next: Record<string, Record<string, { min: string; max: string }>> = {};
        for (const [key, mm] of Object.entries(flatNext)) {
          const idx = key.indexOf('||');
          if (idx !== -1) {
            const measure = key.slice(0, idx);
            const pk = key.slice(idx + 2);
            next[pk] = { ...next[pk], [measure]: mm };
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return next as any;
      });
    },
    [analyses.setBounds],
  );

  const boundsMap: Record<string, BoundsCtx> = {
    'atm-merox-preflash':          atmMerox,
    'compresseur-k244':            k244,
    'compresseur-k245':            k245,
    'production-valeur-electricite': production,
    'reformateur-catalytique':     reformateur,
    'gaz':                         gaz,
    'mouvement-des-bacs':          mouvement,
    'analyses-laboratoire':        { bounds: analysesCtxBounds, setBounds: analysesSetBounds },
  };

  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [draftBounds, setDraftBounds] = useState<Record<string, { min: string; max: string }>>({});
  const [boundsErrors, setBoundsErrors] = useState<Record<string, string>>({});

  // Réinitialiser les brouillons et erreurs lors du changement de feuille
  React.useEffect(() => { setDraftBounds({}); setBoundsErrors({}); }, [selectedFeuilleId]);

  const selectedFeuille  = FEUILLES_CONFIG.find((f) => f.id === selectedFeuilleId) ?? null;
  const selectedCtx      = selectedFeuilleId ? (boundsMap[selectedFeuilleId] ?? null) : null;

  // Certains tableaux utilisent des clés de bornes différentes des clés FEUILLES_CONFIG.
  // Ex: Gaz stocke 'c105' dans le contexte, mais FEUILLES_CONFIG expose 'gaz_c105'.
  const toBoundsKey = (feuilleId: string, fieldKey: string): string => {
    if (feuilleId === 'gaz') return fieldKey.replace(/^gaz_/, '');
    return fieldKey;
  };

  const boundsCount = (feuilleId: string) => {
    const ctx = boundsMap[feuilleId];
    const feuille = FEUILLES_CONFIG.find((f) => f.id === feuilleId);
    if (!ctx || !feuille) return 0;
    return feuille.fields.filter((f) => {
      const b = ctx.bounds[toBoundsKey(feuilleId, f.key)];
      return b && (b.min !== '' || b.max !== '');
    }).length;
  };

  const toggleCat = (cat: string) =>
    setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Écrit dans le brouillon uniquement — rien n'est sauvegardé tant que l'utilisateur n'a pas validé
  const handleChange = (fieldKey: string, type: 'min' | 'max', value: string) => {
    if (!selectedCtx || !selectedFeuilleId) return;
    const bKey = toBoundsKey(selectedFeuilleId, fieldKey);
    const saved = selectedCtx.bounds[bKey] ?? { min: '', max: '' };
    setDraftBounds((prev) => ({
      ...prev,
      [bKey]: { ...(prev[bKey] ?? saved), [type]: value },
    }));
    setBoundsErrors((prev) => { const n = { ...prev }; delete n[bKey]; return n; });
  };

  // Valide le brouillon : vérifie min < max puis sauvegarde dans le contexte
  const handleValidate = (fieldKey: string) => {
    if (!selectedCtx || !selectedFeuilleId) return;
    const bKey = toBoundsKey(selectedFeuilleId, fieldKey);
    const draft = draftBounds[bKey];
    if (!draft) return;
    const minVal = draft.min !== '' ? parseFloat(draft.min) : null;
    const maxVal = draft.max !== '' ? parseFloat(draft.max) : null;
    if (minVal !== null && maxVal !== null && minVal >= maxVal) {
      setBoundsErrors((prev) => ({ ...prev, [bKey]: 'La valeur min doit être inférieure au max.' }));
      return;
    }
    setBoundsErrors((prev) => { const n = { ...prev }; delete n[bKey]; return n; });
    selectedCtx.setBounds((prev) => ({ ...prev, [bKey]: draft }));
    setDraftBounds((prev) => { const n = { ...prev }; delete n[bKey]; return n; });
  };

  const handleClear = (fieldKey: string) => {
    if (!selectedCtx || !selectedFeuilleId) return;
    const bKey = toBoundsKey(selectedFeuilleId, fieldKey);
    setDraftBounds((prev) => { const n = { ...prev }; delete n[bKey]; return n; });
    selectedCtx.setBounds((prev) => {
      const next = { ...prev };
      delete next[bKey];
      return next;
    });
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Header */}
      <div className="border-b border-stroke px-5 py-3 dark:border-strokedark">
        <h4 className="text-sm font-semibold text-black dark:text-white">Bornes min / max</h4>
        <p className="mt-0.5 text-xs text-bodydark dark:text-bodydark2">
          Les valeurs en dehors des bornes sont affichées en rouge dans les tableaux et graphiques. Confirmez chaque borne avec ✓.
        </p>
      </div>

      {/* 2-column layout */}
      <div
        className="grid grid-cols-1 md:grid-cols-[200px_1fr] divide-y divide-stroke dark:divide-strokedark md:divide-x md:divide-y-0"
        style={{ minHeight: '480px' }}
      >
        {/* Left — liste des tableaux */}
        <div className="flex flex-col">
          <div className="border-b border-stroke bg-[#f0f9ff] px-4 py-2 dark:border-strokedark dark:bg-[#1a222c]">
            <span className="text-xs font-bold uppercase tracking-wide text-bodydark dark:text-bodydark2">Tableau</span>
          </div>
          {FEUILLES_SORTED.map((feuille) => {
            const count      = boundsCount(feuille.id);
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
                  {feuille.title}
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

        {/* Right — champs avec min/max */}
        <div className="flex flex-col overflow-y-auto">
          {selectedFeuille && selectedCtx ? (
            <>
              {/* Sous-header */}
              <div className="border-b border-stroke bg-[#f0f9ff] px-4 py-2 dark:border-strokedark dark:bg-[#1a222c]">
                <span className="text-xs font-bold uppercase tracking-wide text-bodydark dark:text-bodydark2">
                  {selectedFeuille.title} — {selectedFeuille.fields.length} champs
                </span>
              </div>

              {/* En-têtes colonnes */}
              <div className="sticky top-0 z-10 grid grid-cols-[1fr_88px_88px_28px_28px] gap-2 border-b border-stroke bg-[#f8f9fa] px-4 py-1.5 dark:border-strokedark dark:bg-[#1c2631]">
                <span className="text-[10px] font-bold uppercase text-bodydark dark:text-bodydark2">Champ</span>
                <span className="text-center text-[10px] font-bold uppercase text-bodydark dark:text-bodydark2">Min</span>
                <span className="text-center text-[10px] font-bold uppercase text-bodydark dark:text-bodydark2">Max</span>
                <span />
                <span />
              </div>

              {/* Catégories */}
              {(() => {
                const catMap = new Map<string, typeof selectedFeuille.fields>();
                for (const field of selectedFeuille.fields) {
                  const cat = field.category ?? '';
                  if (!catMap.has(cat)) catMap.set(cat, []);
                  catMap.get(cat)!.push(field);
                }
                return Array.from(catMap.entries()).map(([cat, fields]) => {
                  const displayCat     = cat.startsWith('__empty__') ? cat.slice(9) : cat || 'Général';
                  const isExpanded     = expandedCats[cat] === true;
                  const configuredInCat = fields.filter((f) => {
                    const b = selectedCtx.bounds[toBoundsKey(selectedFeuilleId!, f.key)];
                    return b && (b.min !== '' || b.max !== '');
                  }).length;

                  return (
                    <div key={cat} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                      {/* Header catégorie */}
                      <button
                        type="button"
                        onClick={() => toggleCat(cat)}
                        className="flex w-full items-center gap-2 bg-stroke/30 px-4 py-2 text-left transition hover:bg-stroke dark:bg-meta-4/20 dark:hover:bg-meta-4"
                      >
                        <svg
                          className={`h-3.5 w-3.5 shrink-0 text-bodydark transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="flex-1 text-xs font-bold uppercase tracking-wide text-black dark:text-white">
                          {displayCat}
                        </span>
                        <span className="text-xs text-bodydark dark:text-bodydark2">{fields.length} champs</span>
                        {configuredInCat > 0 && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
                            {configuredInCat}
                          </span>
                        )}
                      </button>

                      {/* Lignes champs */}
                      {isExpanded && (
                        <div className="divide-y divide-stroke dark:divide-strokedark">
                          {fields.map((field) => {
                            const bKey       = toBoundsKey(selectedFeuilleId!, field.key);
                            const saved      = selectedCtx.bounds[bKey] ?? { min: '', max: '' };
                            const pending    = draftBounds[bKey];
                            const displayB   = pending ?? saved;
                            const isDraft    = pending !== undefined && (pending.min !== saved.min || pending.max !== saved.max);
                            const hasAny     = saved.min !== '' || saved.max !== '';
                            const fieldError = boundsErrors[bKey] ?? null;
                            return (
                              <div
                                key={field.key}
                                className={`px-4 py-2 transition ${hasAny ? 'bg-primary/5 dark:bg-white/5' : ''}`}
                              >
                                <div className="grid grid-cols-[1fr_88px_88px_28px_28px] items-center gap-2">
                                  <span className="truncate text-xs text-black dark:text-white" title={field.label}>
                                    {field.label}
                                  </span>
                                  <input
                                    type="number"
                                    value={displayB.min}
                                    onChange={(e) => handleChange(field.key, 'min', e.target.value)}
                                    placeholder="—"
                                    className={`w-full rounded border px-2 py-1 text-center text-xs outline-none transition focus:border-primary dark:bg-[#1c2631] dark:text-white ${
                                      fieldError
                                        ? 'border-danger dark:border-danger'
                                        : isDraft && displayB.min !== saved.min
                                          ? 'border-amber-400 dark:border-amber-500'
                                          : saved.min !== ''
                                            ? 'border-primary/60 dark:border-primary/60'
                                            : 'border-stroke dark:border-strokedark'
                                    }`}
                                  />
                                  <input
                                    type="number"
                                    value={displayB.max}
                                    onChange={(e) => handleChange(field.key, 'max', e.target.value)}
                                    placeholder="—"
                                    className={`w-full rounded border px-2 py-1 text-center text-xs outline-none transition focus:border-primary dark:bg-[#1c2631] dark:text-white ${
                                      fieldError
                                        ? 'border-danger dark:border-danger'
                                        : isDraft && displayB.max !== saved.max
                                          ? 'border-amber-400 dark:border-amber-500'
                                          : saved.max !== ''
                                            ? 'border-primary/60 dark:border-primary/60'
                                            : 'border-stroke dark:border-strokedark'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleValidate(field.key)}
                                    disabled={!isDraft}
                                    className={`flex h-5 w-5 items-center justify-center rounded transition ${
                                      isDraft
                                        ? 'text-success hover:bg-success/10 dark:hover:bg-success/20'
                                        : 'cursor-default text-stroke dark:text-strokedark'
                                    }`}
                                    title={isDraft ? 'Valider les bornes' : 'Saisir une valeur puis valider'}
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  {hasAny ? (
                                    <button
                                      type="button"
                                      onClick={() => handleClear(field.key)}
                                      className="flex h-5 w-5 items-center justify-center rounded text-bodydark transition hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20"
                                      title="Effacer les bornes"
                                    >
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <div />
                                  )}
                                </div>
                                {fieldError && (
                                  <p className="mt-1 text-[10px] text-danger">{fieldError}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <span className="text-xs text-bodydark dark:text-bodydark2">
                Sélectionnez un tableau pour configurer ses bornes
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ADMIN_ONLY_SECTIONS = ['renommage', 'visibilite-saisie', 'tags-ip21', 'bornes'];

const ParametragePage: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const section = new URLSearchParams(search).get('section') ?? 'mode-affichage';

  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_SECTIONS.includes(section)) {
      navigate('/parametrage?section=mode-affichage', { replace: true });
    }
  }, [section, isAdmin, navigate]);

  return (
    <>
      <PageTitle />
      <div className="pt-4 pb-6">
        {section === 'visibilite-saisie' && <VisibiliteSaisieSection />}
        {section === 'mode-affichage' && <ModeAffichageSection />}
        {section === 'renommage' && <RenommageSection />}
        {section === 'tags-ip21' && <TagsIp21Section />}
        {section === 'bornes' && <BornesSection />}
      </div>
    </>
  );
};

export default ParametragePage;
