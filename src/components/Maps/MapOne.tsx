import jsVectorMap from 'jsvectormap';
import 'jsvectormap/dist/css/jsvectormap.css';
import { useEffect } from 'react';

const MapOne = () => {
  useEffect(() => {
    (window as unknown as { jsVectorMap: typeof jsVectorMap }).jsVectorMap = jsVectorMap;
    import('jsvectormap/dist/maps/world.js').then(() => {
      const mapOne = new jsVectorMap({
        selector: '#mapOne',
        map: 'world',
        zoomButtons: true,
        focusOn: {
          region: 'SN',
          animate: true,
        },

        regionStyle: {
          initial: {
            fill: '#C8D0D8',
          },
          hover: {
            fillOpacity: 1,
            fill: '#3056D3',
          },
        },
        regionLabelStyle: {
          initial: {
            fontFamily: 'Satoshi',
            fontWeight: 'semibold',
            fill: '#fff',
          },
          hover: {
            cursor: 'pointer',
          },
        },

        labels: {
          regions: {
            render(code: string) {
              const names: Record<string, string> = {
                SN: 'Sénégal',
                GM: 'Gambie',
                GN: 'Guinée',
                ML: 'Mali',
                MR: 'Mauritanie',
              };
              return names[code] || code;
            },
          },
        },
      });
      mapOne;
    });
  });

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-7">
      <h4 className="mb-2 text-xl font-semibold text-black dark:text-white">
        Sénégal
      </h4>
      <div id="mapOne" className="mapOne map-btn h-90"></div>
    </div>
  );
};

export default MapOne;
