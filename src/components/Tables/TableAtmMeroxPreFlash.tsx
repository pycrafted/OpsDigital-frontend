import React from 'react';

interface CategoryData {
  category: string;
  subRows: string[];
}

const categories: CategoryData[] = [
  {
    category: 'Charge brut',
    subRows: ['Pres° Entrée UNITE', '17 FT 001 Débit charge'],
  },
  {
    category: "I° Train Brut",
    subRows: ['10 PC 022 Préssion D120', '10 TI 062 T° Entrée D120'],
  },
  {
    category: 'D120',
    subRows: ['10 KDI 029 Niv Eau D120'],
  },
  {
    category: 'FOUR F171',
    subRows: ['17 TC 025 Transfert F 171', '17 TT 631 T° FUMEE F 171'],
  },
  {
    category: 'FOUR F141',
    subRows: ['10 TI 055 T° Fumée HAUTRAD F 141', '10 TI 040 T° Transf F 141'],
  },
  {
    category: 'FOUR F 101',
    subRows: [
      '10 TI 086 T° Entrée Brut F 101',
      '10 TI 001 T° Transf F101',
      '10 FI 002 Fumée Rad F101',
      '10 FI 027 A passe A',
      '10 FI 027 B passe B',
      '10 FI 027 C passe C',
      '10 FI 027 D passe D',
    ],
  },
  {
    category: 'C101',
    subRows: [
      '10 PI 001 press Tete C101',
      '10 FI 002 Temp Tete C101',
      'Amime Neut --> C101',
      'Amime Film --> C101',
      'PH EAU D 102',
    ],
  },
  {
    category: 'C105',
    subRows: ['10 PI 002 Press C105', 'Amime Film --> C105'],
  },
  {
    category: 'C 106',
    subRows: ['10 PI 053 Press C106'],
  },
  {
    category: 'C114',
    subRows: ['PH EAU D 141'],
  },
  {
    category: 'C141',
    subRows: [
      '10 PI 008 Vide Z Flash',
      'Amime Neut --> C141',
      'Amime Film --> C141',
    ],
  },
  {
    category: 'C171',
    subRows: [
      'Amime Film --> C171',
      'Amime Neut --> C171',
      '17 PC 022 Press Tete C171',
      '17 TC 017 Temp Tete C171',
      'PH EAU D 171',
    ],
  },
  {
    category: 'MEROX',
    subRows: [
      '80 PI 006 Press Sortie MEROX',
      '% Pompe Sode 3°B',
      '80 FI 002 DEBIT CHRGE MEROX',
    ],
  },
  {
    category: 'DOPE',
    subRows: ['Injection Dope GO', 'Injection Dope FO'],
  },
  {
    category: '',
    subRows: ['DEBIT H20 G122'],
  },
];

// 3 tableaux : flux procédé + équilibre des sous-colonnes (~9, ~16, ~14)
const TABLE_GROUPS: string[][] = [
  // Tableau 1 — Entrée, D120 & Fours 171/141
  ['Charge brut', "I° Train Brut", 'D120', 'FOUR F171', 'FOUR F141'],
  // Tableau 2 — Four 101 & Colonnes 101 à 114
  ['FOUR F 101', 'C101', 'C105', 'C 106', 'C114'],
  // Tableau 3 — Colonnes 141/171, MEROX, DOPE & Débit
  ['C141', 'C171', 'MEROX', 'DOPE', ''],
];

const hours = ['7h', '11h', '15h', '19h', '23h', '3h'] as const;
type HourKey = (typeof hours)[number];

const allCategoryNames = categories.map((c) => c.category);
const allSubRowNames = [...new Set(categories.flatMap((c) => c.subRows))] as string[];

interface HourRow {
  hour: HourKey;
  values: Record<string, string>; // key: "category_subRow"
}

const getValueKey = (category: string, subRow: string) =>
  `${category || '__empty__'}_${subRow}`;

const createInitialData = (): HourRow[] => {
  return hours.map((hour) => {
    const values: Record<string, string> = {};
    categories.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        values[getValueKey(cat.category, subRow)] = '';
      });
    });
    return { hour, values };
  });
};

const subRowColors = ['#fff2db', '#e1f8f0', '#feeaea', '#e8f4f8', '#f0e8ff', '#fff8e1'];

const CATEGORIES_PER_PAGE = 5;

const TableAtmMeroxPreFlash = () => {
  const [data, setData] = React.useState<HourRow[]>(createInitialData());
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedHours, setSelectedHours] = React.useState<string[]>([...hours]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([...allCategoryNames]);
  const [selectedSubRows, setSelectedSubRows] = React.useState<string[]>([...allSubRowNames]);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showSubRowDropdown, setShowSubRowDropdown] = React.useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const categoryTriggerRef = React.useRef<HTMLDivElement>(null);
  const hourDropdownRef = React.useRef<HTMLDivElement>(null);
  const hourTriggerRef = React.useRef<HTMLDivElement>(null);
  const subRowDropdownRef = React.useRef<HTMLDivElement>(null);
  const subRowTriggerRef = React.useRef<HTMLDivElement>(null);

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

  const filteredData = data.filter((row) => selectedHours.includes(row.hour));
  const filteredCategoryNames = allCategoryNames.filter((c) => selectedCategories.includes(c));
  const categoryGroups: string[][] = [];
  for (let i = 0; i < filteredCategoryNames.length; i += CATEGORIES_PER_PAGE) {
    categoryGroups.push(filteredCategoryNames.slice(i, i + CATEGORIES_PER_PAGE));
  }
  const totalPages = Math.max(1, categoryGroups.length);
  const validPage = Math.min(Math.max(0, currentPage), totalPages - 1);
  const currentGroupCategories = categoryGroups[validPage] || [];
  const currentCategories = categories
    .filter((cat) => currentGroupCategories.includes(cat.category))
    .map((cat) => ({
      ...cat,
      subRows: cat.subRows.filter((sub) => selectedSubRows.includes(sub)),
    }))
    .filter((cat) => cat.subRows.length > 0);

  React.useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(0);
  }, [totalPages, currentPage]);

  const handleChange = (hourIndex: number, category: string, subRow: string, value: string) => {
    const key = getValueKey(category, subRow);
    const newData = [...data];
    newData[hourIndex] = {
      ...newData[hourIndex],
      values: { ...newData[hourIndex].values, [key]: value },
    };
    setData(newData);
  };

  return (
    <div className="rounded-sm border-0 bg-whiten px-5 pt-6 pb-2.5 dark:bg-boxdark-2 sm:px-7.5 xl:pb-1">
      {/* Filter Section */}
      <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {/* Filtrer par catégorie */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs text-black dark:text-white">
            Filtrer par catégorie
          </label>
          <div className="relative z-20" ref={categoryDropdownRef}>
            <div
              ref={categoryTriggerRef}
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="cursor-pointer"
            >
              <div className="mb-1 flex rounded border border-stroke bg-white py-1 pl-2 pr-2 dark:border-form-strokedark dark:bg-white">
                <div className="flex-1">
                  <input
                    placeholder={
                      selectedCategories.length > 0
                        ? `${selectedCategories.length} catégorie(s) sélectionnée(s)`
                        : 'Sélectionner des catégories'
                    }
                    className="h-full w-full appearance-none bg-transparent p-0.5 px-1 text-xs outline-none text-black dark:text-white"
                    readOnly
                  />
                </div>
                <div className="flex w-6 items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#637381" />
                  </svg>
                </div>
              </div>
            </div>
            {showCategoryDropdown && (
              <div className="absolute left-0 top-full z-40 max-h-60 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input">
                {allCategoryNames.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <div
                      key={cat || '__empty__'}
                      className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                        isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                      onClick={() => handleCategoryToggle(cat)}
                    >
                      {isSelected && (
                        <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                        {cat || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filtrer par heure */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs text-black dark:text-white">
            Filtrer par heure
          </label>
          <div className="relative z-20" ref={hourDropdownRef}>
            <div
              ref={hourTriggerRef}
              onClick={() => setShowHourDropdown(!showHourDropdown)}
              className="cursor-pointer"
            >
              <div className="mb-1 flex rounded border border-stroke bg-white py-1 pl-2 pr-2 dark:border-form-strokedark dark:bg-white">
                <div className="flex-1">
                  <input
                    placeholder={
                      selectedHours.length > 0
                        ? `${selectedHours.length} heure(s) sélectionnée(s)`
                        : 'Sélectionner des heures'
                    }
                    className="h-full w-full appearance-none bg-transparent p-0.5 px-1 text-xs outline-none text-black dark:text-white"
                    readOnly
                  />
                </div>
                <div className="flex w-6 items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#637381" />
                  </svg>
                </div>
              </div>
            </div>
            {showHourDropdown && (
              <div className="absolute left-0 top-full z-40 max-h-60 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input">
                {hours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);
                  return (
                    <div
                      key={hour}
                      className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                        isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                      onClick={() => handleHourToggle(hour)}
                    >
                      {isSelected && (
                        <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                        {hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filtrer par ligne */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs text-black dark:text-white">
            Filtrer par ligne
          </label>
          <div className="relative z-20" ref={subRowDropdownRef}>
            <div
              ref={subRowTriggerRef}
              onClick={() => setShowSubRowDropdown(!showSubRowDropdown)}
              className="cursor-pointer"
            >
              <div className="mb-1 flex rounded border border-stroke bg-white py-1 pl-2 pr-2 dark:border-form-strokedark dark:bg-white">
                <div className="flex-1">
                  <input
                    placeholder={
                      selectedSubRows.length > 0
                        ? `${selectedSubRows.length} ligne(s) sélectionnée(s)`
                        : 'Sélectionner des lignes'
                    }
                    className="h-full w-full appearance-none bg-transparent p-0.5 px-1 text-xs outline-none text-black dark:text-white"
                    readOnly
                  />
                </div>
                <div className="flex w-6 items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#637381" />
                  </svg>
                </div>
              </div>
            </div>
            {showSubRowDropdown && (
              <div className="absolute left-0 top-full z-40 max-h-60 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input">
                {allSubRowNames.map((sub) => {
                  const isSelected = selectedSubRows.includes(sub);
                  return (
                    <div
                      key={sub}
                      className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                        isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                      onClick={() => handleSubRowToggle(sub)}
                    >
                      {isSelected && (
                        <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                        {sub}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              <th
                className="w-[10%] min-w-0 bg-whiten py-2 px-2 text-xs font-medium text-black dark:bg-boxdark-2 dark:text-white xl:pl-4"
                rowSpan={2}
              >
                {''}
              </th>
              {currentCategories.map((cat, catIndex) => (
                <th
                  key={cat.category || '__empty__'}
                  colSpan={cat.subRows.length}
                  className={`min-w-0 py-2 px-2 text-center text-xs font-medium text-white dark:border-strokedark ${
                    catIndex < currentCategories.length - 1 ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                  }`}
                  style={{ backgroundColor: '#344256' }}
                >
                  {cat.category || '—'}
                </th>
              ))}
            </tr>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              {currentCategories.flatMap((cat, catIndex) =>
                cat.subRows.map((subRow, subIndex) => {
                  const isLastSubRowOfCategory = subIndex === cat.subRows.length - 1 && catIndex < currentCategories.length - 1;
                  return (
                    <th
                      key={getValueKey(cat.category, subRow)}
                      className={`min-w-0 py-1.5 px-2 text-center text-[10px] font-medium text-black dark:border-strokedark ${
                        isLastSubRowOfCategory ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                      }`}
                      style={{
                        backgroundColor: subRowColors[subIndex % subRowColors.length],
                        borderRight: '1px solid black',
                      }}
                    >
                      {subRow}
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((hourRow) => {
              const hourIndex = data.findIndex((r) => r.hour === hourRow.hour);
              return (
                <tr key={hourRow.hour}>
                  <td
                    className="min-w-0 overflow-hidden border-b border-r border-[#eee] py-1.5 px-2 pl-3 text-xs dark:border-strokedark xl:pl-4"
                    style={{ backgroundColor: '#d1d5db' }}
                  >
                    <p className="truncate font-medium text-black">{hourRow.hour}</p>
                  </td>
                  {currentCategories.flatMap((cat, catIndex) =>
                    cat.subRows.map((subRow, subIndex) => {
                      const key = getValueKey(cat.category, subRow);
                      const value = hourRow.values[key] || '';
                      const hasValue = value.trim() !== '';
                      const isLastSubRowOfCategory = subIndex === cat.subRows.length - 1 && catIndex < currentCategories.length - 1;
                      return (
                        <td
                          key={key}
                          className={`min-w-0 border-b border-r border-[#eee] py-1 px-1 dark:border-strokedark ${
                            hasValue ? 'bg-gray-100 dark:bg-meta-4' : 'bg-white'
                          } ${
                            isLastSubRowOfCategory ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handleChange(hourIndex, cat.category, subRow, e.target.value)
                            }
                            className="w-full min-w-0 bg-transparent text-right text-xs font-semibold text-black focus:outline-none dark:text-white"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={validPage === 0}
            className={`rounded px-3 py-1.5 text-xs font-medium transition !text-white ${
              validPage === 0
                ? 'cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            Précédent
          </button>
          <div className="flex gap-1">
            {categoryGroups.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                  validPage === index
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={validPage === totalPages - 1}
            className={`rounded px-3 py-1.5 text-xs font-medium transition !text-white ${
              validPage === totalPages - 1
                ? 'cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default TableAtmMeroxPreFlash;
