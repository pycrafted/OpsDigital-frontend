import React, { createContext, useContext, useState } from 'react';

interface TableViewContextType {
  hideEmptyColumns: boolean;
  toggleHideEmptyColumns: () => void;
}

const TableViewContext = createContext<TableViewContextType>({
  hideEmptyColumns: false,
  toggleHideEmptyColumns: () => {},
});

export const TableViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
  const toggleHideEmptyColumns = () => setHideEmptyColumns((prev) => !prev);

  return (
    <TableViewContext.Provider value={{ hideEmptyColumns, toggleHideEmptyColumns }}>
      {children}
    </TableViewContext.Provider>
  );
};

export const useTableView = () => useContext(TableViewContext);
