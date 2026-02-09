import React from 'react';

const columns = [
  'naphta sesulf',
  'kero S merox',
  'brut injection',
  'brut',
  'butane',
  'essence',
  'naphta',
  'reform AT',
  'kéro',
  'naphta charge',
  'go',
  'go lourd',
  'résidu',
  'slop',
  'go de tete',
] as const;

const rows = ['8h', '12h', '16h', '20h', '00h', '04h'] as const;

type ColumnKey = (typeof columns)[number];
type RowKey = (typeof rows)[number];

const createInitialData = (): Record<RowKey, Record<ColumnKey, string>> => {
  const data = {} as Record<RowKey, Record<ColumnKey, string>>;
  rows.forEach((row) => {
    data[row] = {} as Record<ColumnKey, string>;
    columns.forEach((col) => {
      data[row][col] = '';
    });
  });
  return data;
};

const TableMouvementDesBacs = () => {
  const [data, setData] = React.useState(createInitialData);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const handleChange = (row: RowKey, col: ColumnKey, value: string) => {
    setData((prev) => ({
      ...prev,
      [row]: {
        ...prev[row],
        [col]: value,
      },
    }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border-0 bg-whiten px-5 pt-6 pb-2.5 dark:bg-white sm:px-7.5 xl:pb-1">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-black dark:text-white">Date :</label>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded border border-stroke bg-transparent py-1.5 pl-2 pr-2 text-xs text-black outline-none focus:border-primary dark:border-form-strokedark dark:text-white dark:focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed min-w-max">
          <thead>
            <tr className="text-left" style={{ backgroundColor: '#344256' }}>
              <th className="sticky left-0 z-20 w-16 min-w-0 border-r border-stroke bg-boxdark-2 py-2 px-2 text-xs font-medium leading-9 text-white dark:border-strokedark xl:pl-4" style={{ backgroundColor: '#344256' }}>
                Heure
              </th>
              {columns.map((col, index) => (
                <th
                  key={col}
                  className="sticky top-0 z-10 min-w-[7rem] border-r border-stroke py-2 px-2 text-center text-xs font-medium text-white dark:border-strokedark"
                  style={{
                    backgroundColor: '#344256',
                    borderRight: index < columns.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td
                  className="sticky left-0 z-10 min-w-0 border-b border-r border-stroke bg-gray-300 py-1.5 px-2 pl-3 text-xs font-medium dark:border-strokedark xl:pl-4"
                  style={{ backgroundColor: '#344256' }}
                >
                  <p className="truncate font-medium text-white">{row}</p>
                </td>
                {columns.map((col, colIndex) => {
                  const value = data[row][col];
                  const hasValue = value && value.trim() !== '';
                  const isLast = colIndex === columns.length - 1;
                  return (
                    <td
                      key={col}
                      className={`min-w-[7rem] border-b border-r border-stroke py-1 px-1 dark:border-strokedark ${
                        hasValue ? 'bg-gray-100 dark:bg-meta-4' : 'bg-white dark:bg-boxdark-2'
                      } ${isLast ? 'border-r-0' : ''}`}
                    >
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(row, col, e.target.value)}
                        className="w-full min-w-0 bg-transparent text-right text-xs font-semibold text-black focus:outline-none dark:text-white"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableMouvementDesBacs;
