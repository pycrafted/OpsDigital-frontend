import React from 'react';

interface CategoryData {
  category: string;
  subRows: string[];
}

interface HourRow {
  hour: string;
  values: Record<string, string>; // key: "category_subRow", value: cell value
}

const categories: CategoryData[] = [
  {
    category: 'huile',
    subRows: ['pression hrefp', 'pi 104 h ph graissage', 'press diff filtres pdi 101', 't°h ref pompe'],
  },
  {
    category: 'eau',
    subRows: ['t° sortie certp', 't°eau refrig sud', 't°eau refrig nord'],
  },
  {
    category: 'hydrogene',
    subRows: ['pi 101 press asp gaz', 'pi 102 press asp gaz', 't° 102 ref ligne nord', 't° 103 ref ligne sud', 't° 101 t° aspirat°', 't° 104 temp palier carter', 'temp palier volant ti 105', '%charge compress'],
  },
  {
    category: 'azote',
    subRows: ['pr n2 av détendeur', 'pr n2 ap détendeur', 'débit n2 rotametre', 'pression cadre n2'],
  },
  {
    category: 'air',
    subRows: ['pr air demarrage', 'pr --> clapets'],
  },
  {
    category: 'moteur k244',
    subRows: ['vitesse', 'pr-h-m', 't°-h-m', 't° eau Mot', 'Pr Air turb gauche', 'Pr Air turb droite', 't° fumées vent turb echap apres turbo', 't° echap gauche', 't° echap droite'],
  },
];

const hours = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
const hourLabels = { h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '3h' };
const hourColors = { h7: '#fff2db', h11: '#e1f8f0', h15: '#feeaea', h19: '#fff2db', h23: '#e1f8f0', h3: '#feeaea' };

const allSubRowNames = [...new Set(categories.flatMap((c) => c.subRows))] as string[];

// Colors to differentiate subRows within the same category
const subRowColors = ['#fff2db', '#e1f8f0', '#feeaea', '#e8f4f8', '#f0e8ff', '#fff8e1'];

// Create initial data structure
const createInitialData = (): HourRow[] => {
  const hourRows: HourRow[] = [];
  hours.forEach((hour) => {
    const values: Record<string, string> = {};
    categories.forEach((cat) => {
      cat.subRows.forEach((subRow) => {
        const key = `${cat.category}_${subRow}`;
        values[key] = '';
      });
    });
    hourRows.push({ hour, values });
  });
  return hourRows;
};

const TableCompresseurK244 = () => {
  const [data, setData] = React.useState<HourRow[]>(createInitialData());
  const [selectedHours, setSelectedHours] = React.useState<string[]>(hours.map(h => h));
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(categories.map(c => c.category));
  const [selectedSubRows, setSelectedSubRows] = React.useState<string[]>([...allSubRowNames]);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showSubRowDropdown, setShowSubRowDropdown] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);
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
    setData(newData);
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
      if (categoryDropdownRef.current) {
        if (
          !showCategoryDropdown ||
          categoryDropdownRef.current.contains(target as Node) ||
          categoryTriggerRef.current?.contains(target as Node)
        ) {
          // Do nothing
        } else {
          setShowCategoryDropdown(false);
        }
      }
      if (hourDropdownRef.current) {
        if (
          !showHourDropdown ||
          hourDropdownRef.current.contains(target as Node) ||
          hourTriggerRef.current?.contains(target as Node)
        ) {
          // Do nothing
        } else {
          setShowHourDropdown(false);
        }
      }
      if (subRowDropdownRef.current) {
        if (
          !showSubRowDropdown ||
          subRowDropdownRef.current.contains(target as Node) ||
          subRowTriggerRef.current?.contains(target as Node)
        ) {
          // Do nothing
        } else {
          setShowSubRowDropdown(false);
        }
      }
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // Filter data based on selections
  const filteredHours = hours.filter((h) => selectedHours.includes(h));
  const filteredCategories = categories.filter((c) => selectedCategories.includes(c.category));
  
  // 2 tableaux équilibrés (~15 sous-colonnes chacun) pour éviter le scroll horizontal
  const tableGroups: string[][] = [
    ['hydrogene', 'huile', 'eau'],           // 8+4+3 = 15 sous-colonnes
    ['azote', 'air', 'moteur k244'],         // 4+2+9 = 15 sous-colonnes
  ];
  
  // Filter table groups to only include categories that are selected
  const availableGroups = tableGroups
    .map(group => group.filter(cat => filteredCategories.some(fc => fc.category === cat)))
    .filter(group => group.length > 0);
  
  // Ensure currentPage is valid
  const totalPages = Math.max(1, availableGroups.length);
  React.useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);
  
  const validPage = Math.min(currentPage, totalPages - 1);
  const currentGroupCategories = availableGroups[validPage] || [];
  const currentCategories = filteredCategories
    .filter((cat) => currentGroupCategories.includes(cat.category))
    .map((cat) => ({
      ...cat,
      subRows: cat.subRows.filter((sub) => selectedSubRows.includes(sub)),
    }))
    .filter((cat) => cat.subRows.length > 0);

  const totalSubColumns = currentCategories.reduce((sum, cat) => sum + cat.subRows.length, 0);

  return (
    <div className="rounded-sm border-0 bg-whiten px-5 pt-6 pb-2.5 dark:bg-boxdark-2 sm:px-7.5 xl:pb-1">
      {/* Filter Section */}
      <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {/* Category Filter */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs text-black dark:text-white">
            Filtrer par catégorie
          </label>
          <div className="relative z-20">
            <div className="relative flex flex-col items-center">
              <div
                ref={categoryTriggerRef}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full cursor-pointer"
              >
                <div className="mb-1 flex rounded border border-stroke bg-white py-1 pl-2 pr-2 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-white">
                  <div className="flex flex-auto flex-wrap gap-2">
                    <div className="flex-1">
                      <input
                        placeholder={
                          selectedCategories.length > 0
                            ? `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''} sélectionnée${selectedCategories.length > 1 ? 's' : ''}`
                            : 'Sélectionner des catégories'
                        }
                        className="h-full w-full appearance-none bg-transparent p-0.5 px-1 text-xs outline-none text-black dark:text-white"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex w-6 items-center py-0.5 pl-0.5 pr-0.5">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="h-4 w-4 cursor-pointer outline-none focus:outline-none"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                            fill="#637381"
                          ></path>
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full px-4">
                <div
                  className={`max-h-select absolute top-full left-0 z-40 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input ${
                    showCategoryDropdown ? '' : 'hidden'
                  }`}
                  ref={categoryDropdownRef}
                >
                  <div className="flex w-full flex-col">
                    {categories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.category);
                      return (
                        <div key={cat.category}>
                          <div
                            className={`w-full cursor-pointer rounded-t border-b border-stroke hover:bg-primary/5 dark:border-form-strokedark ${
                              isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                            }`}
                            onClick={() => handleCategoryToggle(cat.category)}
                          >
                            <div
                              className={`relative flex w-full items-center border-l-2 p-1 pl-1.5 ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
                              }`}
                            >
                              <div className="flex w-full items-center">
                                {isSelected && (
                                  <svg
                                    className="mr-1.5 h-3 w-3 text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <div
                                  className={`text-xs leading-4 ${
                                    isSelected
                                      ? 'font-semibold text-primary dark:text-white'
                                      : 'text-black dark:text-white'
                                  }`}
                                >
                                  {cat.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hour Filter */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs text-black dark:text-white">
            Filtrer par heure
          </label>
          <div className="relative z-20">
            <div className="relative flex flex-col items-center">
              <div
                ref={hourTriggerRef}
                onClick={() => setShowHourDropdown(!showHourDropdown)}
                className="w-full cursor-pointer"
              >
                <div className="mb-1 flex rounded border border-stroke bg-white py-1 pl-2 pr-2 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-white">
                  <div className="flex flex-auto flex-wrap gap-2">
                    <div className="flex-1">
                      <input
                        placeholder={
                          selectedHours.length > 0
                            ? `${selectedHours.length} heure${selectedHours.length > 1 ? 's' : ''} sélectionnée${selectedHours.length > 1 ? 's' : ''}`
                            : 'Sélectionner des heures'
                        }
                        className="h-full w-full appearance-none bg-transparent p-0.5 px-1 text-xs outline-none text-black dark:text-white"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex w-6 items-center py-0.5 pl-0.5 pr-0.5">
                    <button
                      type="button"
                      onClick={() => setShowHourDropdown(!showHourDropdown)}
                      className="h-4 w-4 cursor-pointer outline-none focus:outline-none"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                            fill="#637381"
                          ></path>
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full px-4">
                <div
                  className={`max-h-select absolute top-full left-0 z-40 w-full overflow-y-auto rounded bg-white shadow dark:bg-form-input ${
                    showHourDropdown ? '' : 'hidden'
                  }`}
                  ref={hourDropdownRef}
                >
                  <div className="flex w-full flex-col">
                    {hours.map((hour) => {
                      const isSelected = selectedHours.includes(hour);
                      return (
                        <div key={hour}>
                          <div
                            className={`w-full cursor-pointer rounded-t border-b border-stroke hover:bg-primary/5 dark:border-form-strokedark ${
                              isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                            }`}
                            onClick={() => handleHourToggle(hour)}
                          >
                            <div
                              className={`relative flex w-full items-center border-l-2 p-1 pl-1.5 ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
                              }`}
                            >
                              <div className="flex w-full items-center">
                                {isSelected && (
                                  <svg
                                    className="mr-1.5 h-3 w-3 text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <div
                                  className={`text-xs leading-4 ${
                                    isSelected
                                      ? 'font-semibold text-primary dark:text-white'
                                      : 'text-black dark:text-white'
                                  }`}
                                >
                                  {hourLabels[hour]}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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

      <div className="w-full overflow-y-auto overflow-x-hidden" style={{ maxHeight: '70vh' }}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              <th className="w-[8%] min-w-0 bg-whiten py-2 px-2 text-xs font-medium text-black dark:bg-boxdark-2 dark:text-white xl:pl-4" rowSpan={2}>
              </th>
              {currentCategories.map((cat, index) => (
                <th
                  key={cat.category}
                  colSpan={cat.subRows.length}
                  className={`min-w-0 py-2 px-2 text-xs text-center font-medium text-white dark:border-strokedark ${
                    index < currentCategories.length - 1 ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                  }`}
                  style={{ backgroundColor: '#344256' }}
                >
                  {cat.category}
                </th>
              ))}
            </tr>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              {currentCategories.flatMap((cat, catIndex) =>
                cat.subRows.map((subRow, subIndex) => ({
                  category: cat.category,
                  subRow,
                  subIndex,
                  catIndex,
                  isLastSubRowOfCategory: subIndex === cat.subRows.length - 1 && catIndex < currentCategories.length - 1,
                }))
              ).map((item, index, array) => (
                <th
                  key={`${item.category}_${item.subRow}`}
                  className={`min-w-0 py-1.5 px-2 text-center text-[10px] font-medium text-black dark:border-strokedark ${
                    item.isLastSubRowOfCategory ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                  }`}
                  style={{ 
                    backgroundColor: subRowColors[item.subIndex % subRowColors.length],
                    borderRight: index < array.length - 1 ? '1px solid black' : 'none'
                  }}
                >
                  {item.subRow}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data
              .filter((hourRow) => filteredHours.includes(hourRow.hour))
              .map((hourRow, hourIndex) => {
                const originalHourIndex = data.findIndex((hr) => hr.hour === hourRow.hour);
                return (
                  <tr key={hourRow.hour}>
                    <td
                      className="min-w-0 overflow-hidden border-b border-r border-[#eee] py-1.5 px-2 pl-3 text-xs dark:border-strokedark xl:pl-4"
                      style={{ backgroundColor: '#d1d5db' }}
                    >
                      <p className="truncate font-medium text-black">{hourLabels[hourRow.hour as keyof typeof hourLabels]}</p>
                    </td>
                    {currentCategories.map((cat, catIndex) =>
                      cat.subRows.map((subRow, subIndex) => {
                        const key = `${cat.category}_${subRow}`;
                        const value = hourRow.values[key] || '';
                        const hasValue = value && value.trim() !== '';
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
                              onChange={(e) => handleChange(originalHourIndex, key, e.target.value)}
                              className="w-full min-w-0 bg-transparent text-right text-xs font-semibold text-black focus:outline-none dark:text-white"
                              style={{
                                backgroundColor: 'transparent',
                              }}
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

      {/* Pagination Controls */}
      {availableGroups.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, validPage - 1))}
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
            {availableGroups.map((_, index) => (
              <button
                key={index}
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
            onClick={() => setCurrentPage(Math.min(totalPages - 1, validPage + 1))}
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

export default TableCompresseurK244;
