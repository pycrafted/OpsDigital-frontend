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
    category: 'prétraitement',
    subRows: [
      '20FI 011 Charge HDT',
      '20FR 003 H --> D203',
      '20TI 004 Chauffe D203',
      'Taux couverture D203',
      '20FR 009 Strip c201',
      '20PDI 044 Δ P D203',
      'Niveau D214 20LI 007',
    ],
  },
  {
    category: 'réactionnelle',
    subRows: [
      '20FR 002 Charge N Réforming',
      '20FR 035 Débit Gaz recv',
      '20TC 002 Transfert F241',
      '20PDI 106 Δ T D204',
      '20TC 001 Transfert F201',
      '20TDI 107 Δ T D205',
      '20TC 092 Transfert F202',
      '20TDI 108  Δ T D206',
      '20LI 003 Niv D241',
      'Densité Shilling',
      '%H2',
      'Taux H2/HC',
      'NO Réformat',
      'débit ccl4',
      '20 TC 105 Transfert F 203',
      'niveau d213',
    ],
  },
];

const hours = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
const hourLabels = { h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '3h' };
const hourColors = { h7: '#fff2db', h11: '#e1f8f0', h15: '#feeaea', h19: '#fff2db', h23: '#e1f8f0', h3: '#feeaea' };

// Colors to differentiate subRows within the same category
const subRowColors = ['#fff2db', '#e1f8f0', '#feeaea', '#e8f4f8', '#f0e8ff', '#fff8e1'];

const allSubRowNames = [...new Set(categories.flatMap((c) => c.subRows))] as string[];

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

const TableReformateurCatalytique = () => {
  const [data, setData] = React.useState<HourRow[]>(createInitialData());
  const [selectedHours, setSelectedHours] = React.useState<string[]>(hours.map(h => h));
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(categories.map(c => c.category));
  const [selectedSubRows, setSelectedSubRows] = React.useState<string[]>([...allSubRowNames]);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showSubRowDropdown, setShowSubRowDropdown] = React.useState(false);
  const [showDateDropdown, setShowDateDropdown] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const categoryTriggerRef = React.useRef<HTMLDivElement>(null);
  const hourDropdownRef = React.useRef<HTMLDivElement>(null);
  const hourTriggerRef = React.useRef<HTMLDivElement>(null);
  const subRowDropdownRef = React.useRef<HTMLDivElement>(null);
  const subRowTriggerRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateTriggerRef = React.useRef<HTMLDivElement>(null);

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
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(target as Node) &&
        !dateTriggerRef.current?.contains(target as Node)
      ) {
        setShowDateDropdown(false);
      }
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
  
  // Deux tableaux : prétraitement + réactionnelle (pleine largeur)
  const pretraitementCat = filteredCategories.find(c => c.category === 'prétraitement');
  const reactionnelleCat = filteredCategories.find(c => c.category === 'réactionnelle');
  
  const tableGroups: CategoryData[][] = [];
  if (pretraitementCat) {
    tableGroups.push([pretraitementCat]);
  }
  if (reactionnelleCat) {
    tableGroups.push([reactionnelleCat]);
  }
  
  // Ensure currentPage is valid
  const totalPages = Math.max(1, tableGroups.length);
  React.useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);
  
  const validPage = Math.min(currentPage, totalPages - 1);
  const currentCategories = (tableGroups[validPage] || [])
    .map((cat) => ({
      ...cat,
      subRows: cat.subRows.filter((sub) => selectedSubRows.includes(sub)),
    }))
    .filter((cat) => cat.subRows.length > 0);

  const totalSubColumns = currentCategories.reduce((sum, cat) => sum + cat.subRows.length, 0);

  return (
    <div className="rounded-sm border-0 bg-whiten px-5 pt-6 pb-2.5 dark:bg-boxdark-2 sm:px-7.5 xl:pb-1">
      {/* Filter Section - même design que Analyses du laboratoire */}
      <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        {/* Filtrer par date */}
        <div className="relative w-full sm:w-auto" ref={dateDropdownRef}>
          <div
            ref={dateTriggerRef}
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-white"
          >
            <span>Date</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showDateDropdown && (
            <div className="absolute left-0 top-full z-40 mt-1 rounded border border-stroke bg-white p-2 shadow dark:border-strokedark dark:bg-form-input">
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full min-w-40 rounded border border-stroke bg-transparent py-1.5 pl-2 pr-2 text-xs text-black outline-none focus:border-primary dark:border-form-strokedark dark:text-white dark:focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          )}
        </div>

        {/* Filtrer par catégorie */}
        <div className="relative w-full sm:w-auto" ref={categoryDropdownRef}>
          <div
            ref={categoryTriggerRef}
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-white"
          >
            <span>Filtrer par catégorie</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showCategoryDropdown && (
            <div className="absolute left-0 top-full z-40 min-w-52 max-h-60 overflow-y-auto rounded bg-white shadow dark:bg-form-input">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.category);
                return (
                  <div
                    key={cat.category}
                    className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                      isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                    onClick={() => handleCategoryToggle(cat.category)}
                  >
                    {isSelected && (
                      <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                      {cat.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtrer par heure */}
        <div className="relative w-full sm:w-auto" ref={hourDropdownRef}>
          <div
            ref={hourTriggerRef}
            onClick={() => setShowHourDropdown(!showHourDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-white"
          >
            <span>Filtrer par heure</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showHourDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showHourDropdown && (
            <div className="absolute left-0 top-full z-40 min-w-52 max-h-60 overflow-y-auto rounded bg-white shadow dark:bg-form-input">
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
                      {hourLabels[hour]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtrer par ligne */}
        <div className="relative w-full sm:w-auto" ref={subRowDropdownRef}>
          <div
            ref={subRowTriggerRef}
            onClick={() => setShowSubRowDropdown(!showSubRowDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-white"
          >
            <span>Filtrer par ligne</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showSubRowDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showSubRowDropdown && (
            <div className="absolute left-0 top-full z-40 min-w-52 max-h-60 overflow-y-auto rounded bg-white shadow dark:bg-form-input">
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

      <div className="w-full overflow-y-auto overflow-x-hidden" style={{ maxHeight: '70vh' }}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              <th className="w-[8%] min-w-0 bg-whiten py-2 px-2 text-xs font-medium text-black dark:bg-boxdark-2 dark:text-white xl:pl-4" rowSpan={2}>
              </th>
              {currentCategories.map((cat, index) => (
                <th
                  key={`${cat.category}-${index}`}
                  colSpan={cat.subRows.length}
                  className="min-w-0 py-2 px-2 text-xs text-center font-medium text-white dark:border-strokedark"
                  style={{
                    borderRight: index < currentCategories.length - 1 ? '1px solid white' : 'none'
                  }}
                >
                  {cat.category}
                </th>
              ))}
            </tr>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              {currentCategories.flatMap((cat) =>
                cat.subRows.map((subRow, subIndex) => ({
                  category: cat.category,
                  subRow,
                  subIndex,
                }))
              ).map((item, index, array) => (
                <th
                  key={`${item.category}_${item.subRow}`}
                  className="min-w-0 py-1.5 px-2 text-center text-[10px] font-medium text-black dark:border-strokedark"
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
                      className="min-w-0 overflow-hidden border-b border-r border-[#eee] py-1.5 px-2 pl-3 text-xs dark:border-strokedark xl:pl-4 relative before:content-[''] before:absolute before:bottom-0 before:left-1 before:right-1 before:h-px before:bg-white"
                      style={{ backgroundColor: '#344256' }}
                    >
                      <p className="truncate font-medium text-white">{hourLabels[hourRow.hour as keyof typeof hourLabels]}</p>
                    </td>
                    {currentCategories.map((cat) =>
                      cat.subRows.map((subRow) => {
                        const key = `${cat.category}_${subRow}`;
                        const value = hourRow.values[key] || '';
                        const hasValue = value && value.trim() !== '';
                        return (
                          <td
                            key={key}
                            className={`min-w-0 border-b border-r border-[#eee] py-1 px-1 dark:border-strokedark relative before:content-[''] before:absolute before:bottom-0 before:left-1 before:right-1 before:h-px before:bg-white ${
                              hasValue ? 'bg-gray-100 dark:bg-meta-4' : 'bg-white'
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
      {tableGroups.length > 1 && (
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
            {tableGroups.map((_, index) => (
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

export default TableReformateurCatalytique;
