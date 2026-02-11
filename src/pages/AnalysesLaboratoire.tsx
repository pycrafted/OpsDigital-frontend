import { useState } from 'react';
import ChartAnalysesLaboratoire from '../components/Charts/ChartAnalysesLaboratoire';
import TableAnalysesLaboratoire from '../components/Tables/TableAnalysesLaboratoire';
import { createInitialAnalysesData, type AnalyseRow } from '../data/analysesLaboratoire';

const AnalysesLaboratoire = () => {
  const [showChart, setShowChart] = useState(false);
  const [data, setData] = useState<AnalyseRow[]>(() => createInitialAnalysesData());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="sticky top-0 z-10 flex flex-shrink-0 justify-end py-1">
        <button
          type="button"
          onClick={() => setShowChart((v) => !v)}
          className="min-w-[11rem] rounded border border-stroke bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
        >
          {showChart ? 'Afficher le tableau' : 'Afficher le graphique'}
        </button>
      </div>
      <div
        key={showChart ? 'chart' : 'table'}
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden transition-opacity duration-300 ease-in-out"
      >
        {showChart ? (
          <div className="w-full rounded-sm border border-stroke bg-white px-5 pt-6 pb-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            {/* Graphique dans une card blanche (mode clair) comme sur le tableau de bord */}
            <ChartAnalysesLaboratoire data={data} embedded={false} />
          </div>
        ) : (
          <TableAnalysesLaboratoire data={data} onDataChange={setData} />
        )}
      </div>
    </div>
  );
};

export default AnalysesLaboratoire;
