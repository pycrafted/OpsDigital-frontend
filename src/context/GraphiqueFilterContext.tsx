import React, { createContext, useContext, useState } from 'react';
import { type DurationFilter } from '../components/Charts/ChartAnalysesLaboratoire';

function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

interface GraphiqueFilterContextType {
  duration: DurationFilter;
  setDuration: (d: DurationFilter) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedWeek: string;
  setSelectedWeek: (w: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
}

const GraphiqueFilterContext = createContext<GraphiqueFilterContextType>({
  duration: 'day',
  setDuration: () => {},
  selectedDate: new Date().toISOString().slice(0, 10),
  setSelectedDate: () => {},
  selectedWeek: getISOWeekString(new Date()),
  setSelectedWeek: () => {},
  selectedMonth: new Date().toISOString().slice(0, 7),
  setSelectedMonth: () => {},
});

export const GraphiqueFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [duration, setDuration] = useState<DurationFilter>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState(() => getISOWeekString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  return (
    <GraphiqueFilterContext.Provider value={{ duration, setDuration, selectedDate, setSelectedDate, selectedWeek, setSelectedWeek, selectedMonth, setSelectedMonth }}>
      {children}
    </GraphiqueFilterContext.Provider>
  );
};

export const useGraphiqueFilter = () => useContext(GraphiqueFilterContext);
