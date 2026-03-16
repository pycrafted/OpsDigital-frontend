import React, { createContext, useContext, useState } from 'react';

interface TableViewContextType {
  hideEmptyColumns: boolean;
  toggleHideEmptyColumns: () => void;
  canEdit: boolean;
  toggleCanEdit: () => void;
}

const TableViewContext = createContext<TableViewContextType>({
  hideEmptyColumns: false,
  toggleHideEmptyColumns: () => {},
  canEdit: false,
  toggleCanEdit: () => {},
});

export const TableViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
  const toggleHideEmptyColumns = () => setHideEmptyColumns((prev) => !prev);
  const [canEdit, setCanEdit] = useState(false);
  const toggleCanEdit = () => setCanEdit((prev) => !prev);

  return (
    <TableViewContext.Provider value={{ hideEmptyColumns, toggleHideEmptyColumns, canEdit, toggleCanEdit }}>
      {children}
    </TableViewContext.Provider>
  );
};

export const useTableView = () => useContext(TableViewContext);
