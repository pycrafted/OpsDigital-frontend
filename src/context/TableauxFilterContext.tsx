import React, { createContext, useContext, useState } from 'react';

interface TableauxFilterContextType {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  today: string;
}

const today = new Date().toISOString().slice(0, 10);

const TableauxFilterContext = createContext<TableauxFilterContextType>({
  selectedDate: today,
  setSelectedDate: () => {},
  today,
});

export const TableauxFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayVal = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayVal);

  return (
    <TableauxFilterContext.Provider value={{ selectedDate, setSelectedDate, today: todayVal }}>
      {children}
    </TableauxFilterContext.Provider>
  );
};

export const useTableauxFilter = () => useContext(TableauxFilterContext);
