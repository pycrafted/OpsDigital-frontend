import React from 'react';
import {
  AnalyseRow,
  createInitialAnalysesData,
  hourLabels,
  hours,
  productLabels,
  products,
  type HourKey,
  type ProductKey,
} from '../../data/analysesLaboratoire';

const hourColors = { h7: '#fff2db', h15: '#e1f8f0', h23: '#feeaea' };

export interface TableAnalysesLaboratoireProps {
  data: AnalyseRow[];
  onDataChange: (data: AnalyseRow[]) => void;
}

const TableAnalysesLaboratoire: React.FC<TableAnalysesLaboratoireProps> = ({ data, onDataChange }) => {
  const measures = React.useMemo(() => data.map((row) => row.property), [data]);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [selectedHours, setSelectedHours] = React.useState<string[]>(['h7', 'h15', 'h23']);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>(() => [...products]);
  const [selectedMeasures, setSelectedMeasures] = React.useState<string[]>(() => measures);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);

  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  const [showProductDropdown, setShowProductDropdown] = React.useState(false);
  const [showMeasureDropdown, setShowMeasureDropdown] = React.useState(false);
  const [showHourDropdown, setShowHourDropdown] = React.useState(false);
  const [showDateDropdown, setShowDateDropdown] = React.useState(false);
  const productDropdownRef = React.useRef<HTMLDivElement>(null);
  const productTriggerRef = React.useRef<HTMLDivElement>(null);
  const measureDropdownRef = React.useRef<HTMLDivElement>(null);
  const measureTriggerRef = React.useRef<HTMLDivElement>(null);
  const hourDropdownRef = React.useRef<HTMLDivElement>(null);
  const hourTriggerRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateTriggerRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (
    rowIndex: number,
    product: ProductKey,
    hour: HourKey,
    value: string
  ) => {
    const newData = [...data];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [product]: {
        ...newData[rowIndex][product],
        [hour]: value,
      },
    };
    onDataChange(newData);
  };

  const handleHourToggle = (hour: string) => {
    setSelectedHours((prev) => {
      if (prev.includes(hour)) {
        // Remove hour if already selected
        return prev.filter((h) => h !== hour);
      } else {
        // Add hour if not selected
        return [...prev, hour];
      }
    });
  };

  const handleProductToggle = (product: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        // Remove product if already selected
        return prev.filter((p) => p !== product);
      } else {
        // Add product if not selected
        return [...prev, product];
      }
    });
  };

  const removeProduct = (product: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p !== product));
  };

  const handleMeasureToggle = (measure: string) => {
    setSelectedMeasures((prev) => {
      if (prev.includes(measure)) {
        // Remove measure if already selected
        return prev.filter((m) => m !== measure);
      } else {
        // Add measure if not selected
        return [...prev, measure];
      }
    });
  };

  // Filter hours based on selection
  const filteredHours = hours.filter((h) => selectedHours.includes(h));
  // Filter products based on selection
  const filteredProducts = products.filter((p) => selectedProducts.includes(p));
  
  // Deux tableaux (pages) pour mieux utiliser l'espace pleine largeur
  const PRODUCTS_PER_PAGE = 7;
  const productGroups: typeof filteredProducts[] = [];
  for (let i = 0; i < filteredProducts.length; i += PRODUCTS_PER_PAGE) {
    productGroups.push(filteredProducts.slice(i, i + PRODUCTS_PER_PAGE));
  }
  
  // Ensure currentPage is valid and reset if needed
  const totalPages = Math.max(1, productGroups.length);
  React.useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);
  
  const validPage = Math.min(currentPage, totalPages - 1);
  const currentProducts = productGroups[validPage] || [];
  
  // Filter data based on selected measures
  const filteredData = data.filter((row) => selectedMeasures.includes(row.property));

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (
        measureDropdownRef.current &&
        !measureDropdownRef.current.contains(target as Node) &&
        !measureTriggerRef.current?.contains(target as Node)
      ) {
        setShowMeasureDropdown(false);
      }
      if (
        hourDropdownRef.current &&
        !hourDropdownRef.current.contains(target as Node) &&
        !hourTriggerRef.current?.contains(target as Node)
      ) {
        setShowHourDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(target as Node) &&
        !productTriggerRef.current?.contains(target as Node)
      ) {
        setShowProductDropdown(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(target as Node) &&
        !dateTriggerRef.current?.contains(target as Node)
      ) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-sm border-0 bg-whiten px-5 pt-6 pb-2.5 dark:bg-white sm:px-7.5 xl:pb-1">
      {/* Filter Section */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        {/* Filtrer par date */}
        <div className="relative w-full sm:w-auto" ref={dateDropdownRef}>
          <div
            ref={dateTriggerRef}
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-[#344256]"
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

        {/* Filtrer par mesure */}
        <div className="relative w-full sm:w-auto" ref={measureDropdownRef}>
          <div
            ref={measureTriggerRef}
            onClick={() => setShowMeasureDropdown(!showMeasureDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-[#344256]"
          >
            <span>Filtrer par mesure</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showMeasureDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showMeasureDropdown && (
              <div className="absolute left-0 top-full z-40 min-w-52 max-h-60 overflow-y-auto rounded bg-white shadow dark:bg-form-input">
                {measures.map((measure) => {
                  const isSelected = selectedMeasures.includes(measure);
                  return (
                    <div
                      key={measure}
                      className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                        isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                      onClick={() => handleMeasureToggle(measure)}
                    >
                      {isSelected && (
                        <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                        {measure}
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
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-[#344256]"
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

        {/* Filtrer par produit */}
        <div className="relative w-full sm:w-auto" ref={productDropdownRef}>
          <div
            ref={productTriggerRef}
            onClick={() => setShowProductDropdown(!showProductDropdown)}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-black dark:text-[#344256]"
          >
            <span>Filtrer par produit</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {showProductDropdown && (
              <div className="absolute left-0 top-full z-40 min-w-52 max-h-60 overflow-y-auto rounded bg-white shadow dark:bg-form-input">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product);
                  return (
                    <div
                      key={product}
                      className={`cursor-pointer border-b border-stroke p-1.5 pl-2 text-xs hover:bg-primary/5 dark:border-form-strokedark ${
                        isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                      onClick={() => handleProductToggle(product)}
                    >
                      {isSelected && (
                        <svg className="mr-1.5 inline h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={isSelected ? 'font-semibold text-primary dark:text-white' : 'text-black dark:text-white'}>
                        {productLabels[product]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <div className="min-h-0 w-full flex-1 overflow-auto">
        <table className="w-full table-fixed min-w-max">
          <thead>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              <th className="sticky top-0 z-20 h-9 w-[10%] min-w-0 border-r border-stroke bg-boxdark-2 py-0 px-2 text-xs font-medium leading-9 text-white dark:border-strokedark xl:pl-4" style={{ backgroundColor: '#344256' }} rowSpan={2}>
              </th>
              {currentProducts.map((product, productIndex) => (
                <th
                  key={product}
                  colSpan={filteredHours.length}
                  className={`sticky top-0 z-20 h-9 min-w-0 py-0 px-2 text-center text-xs font-medium leading-9 text-white dark:border-strokedark ${
                    productIndex < currentProducts.length - 1 ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white' : ''
                  }`}
                  style={{ backgroundColor: '#344256' }}
                >
                  {productLabels[product]}
                </th>
              ))}
            </tr>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              {currentProducts.map((product, productIndex) =>
                filteredHours.map((hour, hourIndex) => (
                  <th
                    key={`${product}-${hour}`}
                    className={`sticky top-9 z-10 min-w-0 border-r border-stroke py-1 px-1 text-center text-[10px] font-medium text-black dark:border-strokedark ${
                      productIndex === currentProducts.length - 1 && hourIndex === filteredHours.length - 1 ? 'border-r-0' : ''
                    } ${
                      hourIndex === filteredHours.length - 1 && productIndex < currentProducts.length - 1
                        ? 'relative after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white'
                        : ''
                    }`}
                    style={{ backgroundColor: hourColors[hour] }}
                  >
                    {hourLabels[hour]}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => {
              // Find original index for handleChange
              const originalIndex = data.findIndex((r) => r.property === row.property);
              return (
              <tr key={rowIndex}>
                <td 
                  className="min-w-0 overflow-hidden border-b border-r border-stroke bg-gray-300 py-1.5 px-2 pl-3 text-xs dark:border-strokedark xl:pl-4 relative before:content-[''] before:absolute before:bottom-0 before:left-1 before:right-1 before:h-px before:bg-white"
                  style={isDarkMode ? { backgroundColor: '#344256' } : {}}
                >
                  <p className="truncate font-medium text-white">{row.property}</p>
                </td>
                {currentProducts.map((product, productIndex) =>
                  filteredHours.map((hour, hourIndex) => {
                    const value = row[product][hour];
                    const hasValue = value && value.trim() !== '';
                    const isLastCell = productIndex === currentProducts.length - 1 && hourIndex === filteredHours.length - 1;
                    return (
                      <td
                        key={`${product}-${hour}`}
                        className={`min-w-0 border-b border-r border-stroke py-1 px-1 dark:border-strokedark relative before:content-[''] before:absolute before:bottom-0 before:left-1 before:right-1 before:h-px before:bg-white ${
                          hasValue ? 'bg-gray-100 dark:bg-meta-4' : 'bg-white'
                        } ${isLastCell ? 'border-r-0' : ''} ${
                          hourIndex === filteredHours.length - 1 && productIndex < currentProducts.length - 1
                            ? 'after:content-[""] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-white'
                            : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(originalIndex, product, hour, e.target.value)}
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
      {productGroups.length > 1 && (
        <div className="mt-4 flex shrink-0 items-center justify-center gap-2">
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
            {productGroups.map((_, index) => (
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

export default TableAnalysesLaboratoire;
