import TableMouvementDesBacs from '../components/Tables/TableMouvementDesBacs';

const MouvementDesBacs = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <TableMouvementDesBacs />
      </div>
    </div>
  );
};

export default MouvementDesBacs;
