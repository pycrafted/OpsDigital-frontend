import React, { createContext, useContext, useMemo, useState } from 'react';

export const ALL_HOURS = ['h7', 'h11', 'h15', 'h19', 'h23', 'h3'] as const;
export type HourKey = typeof ALL_HOURS[number];

export const HOUR_LABELS: Record<HourKey, string> = {
  h7: '7h', h11: '11h', h15: '15h', h19: '19h', h23: '23h', h3: '3h',
};

function getCurrentHourSlot(): HourKey {
  const h = new Date().getHours();
  if (h >= 7 && h < 11) return 'h7';
  if (h >= 11 && h < 15) return 'h11';
  if (h >= 15 && h < 19) return 'h15';
  if (h >= 19 && h < 23) return 'h19';
  if (h >= 23 || h < 3) return 'h23';
  return 'h3';
}

interface SaisieFilterContextType {
  date: string;
  setDate: (d: string) => void;
  hour: HourKey;
  setHour: (h: HourKey) => void;
  today: string;
}

const SaisieFilterContext = createContext<SaisieFilterContextType>({
  date: new Date().toISOString().slice(0, 10),
  setDate: () => {},
  hour: getCurrentHourSlot(),
  setHour: () => {},
  today: new Date().toISOString().slice(0, 10),
});

export const SaisieFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState<HourKey>(getCurrentHourSlot);

  return (
    <SaisieFilterContext.Provider value={{ date, setDate, hour, setHour, today }}>
      {children}
    </SaisieFilterContext.Provider>
  );
};

export const useSaisieFilter = () => useContext(SaisieFilterContext);
