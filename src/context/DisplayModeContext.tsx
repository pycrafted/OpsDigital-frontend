import React, { createContext, useContext, useState } from 'react';

export type DisplayMode = 'synthese' | 'detail';

const STORAGE_KEY = 'display_mode';

const load = (): DisplayMode => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'synthese' || raw === 'detail') return raw;
  } catch {}
  return 'detail';
};

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (m: DisplayMode) => void;
  tableauHref: string;
  graphiqueHref: string;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

export const DisplayModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<DisplayMode>(load);

  const setMode = (m: DisplayMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  const tableauHref =
    mode === 'synthese' ? '/tableaux?tableau=Tout' : '/tableaux?tableau=Analyses%20du%20laboratoire';
  const graphiqueHref = mode === 'synthese' ? '/graphique/tous' : '/graphique';

  return (
    <DisplayModeContext.Provider value={{ mode, setMode, tableauHref, graphiqueHref }}>
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = () => {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) throw new Error('useDisplayMode must be used within DisplayModeProvider');
  return ctx;
};
