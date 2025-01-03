import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import backgroundImage from './../assets/space_background_1.jpg'; // Ensure you have this image

function Starlink() {
  const [csvData, setCSVData] = useState([]);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Define column subsets for different screen sizes with highlighting
  const largeScreenColumns = [
    { name: 'Mission', highlight: 0 }, // Mission column, no highlight as it will have header style
    { name: 'Total Sats Launched', highlight: 1 },
    { name: 'Early Deorbit', highlight: 2 },
    { name: 'Disposal Complete', highlight: 2 },
    { name: 'Reentry after Fail', highlight: 2 },
    { name: 'Total Down', highlight: 1 },
    { name: 'Total In Orbit', highlight: 1 },
    { name: 'Failed in orbit', highlight: 2 },
    { name: 'Total Working', highlight: 1 },
    { name: 'Disposal underway', highlight: 2 },
    { name: 'Out of constellation', highlight: 2 },
    { name: 'Reserve, Relocating', highlight: 2 },
    { name: 'Drift', highlight: 2 },
    { name: 'Ascent', highlight: 2 },
    { name: 'Operational Orbit', highlight: 1 }
  ];
  const mediumScreenColumns = [
    { name: 'Mission', highlight: 0 }, // Mission column
    { name: 'Total Sats Launched', highlight: 1 },
    { name: 'Total Down', highlight: 1 },
    { name: 'Total In Orbit', highlight: 1 },
    { name: 'Total Working', highlight: 1 },
    { name: 'Operational Orbit', highlight: 1 }
  ];
  const smallScreenColumns = [
    { name: 'Mission', highlight: 0 }, // Mission column
    { name: 'Total Sats Launched', highlight: 1 },
    { name: 'Total Working', highlight: 1 },
    { name: 'Operational Orbit', highlight: 1 }
  ];

  // Determine which column set to use based on window width
  const getVisibleColumns = () => {
    if (windowWidth >= 1200) {
      return largeScreenColumns;
    } else if (windowWidth >= 600) {
      return mediumScreenColumns;
    } else {
      return smallScreenColumns;
    }
  };

  const columnConfigs = [
    { originalName: 'Mission', displayName: 'Mission' },
    { originalName: 'Total Sats Launched', displayName: 'Total Sats Launched' },
    { originalName: 'Early Deorbit', displayName: 'Early Deorbit' },
    { originalName: 'Disposal Complete', displayName: 'Disposal Complete' },
    { originalName: 'Reentry after Fail', displayName: 'Reentry after Fail' },
    { originalName: 'Total Down', displayName: 'Total Down' },
    { originalName: 'Total In Orbit', displayName: 'Total In Orbit' },
    { originalName: 'Failed in orbit', displayName: 'Failed in orbit' },
    { originalName: 'Total Working', displayName: 'Total Working' },
    { originalName: 'Disposal underway', displayName: 'Disposal underway' },
    { originalName: 'Out of constellation', displayName: 'Out of constellation' },
    { originalName: 'Reserve, Relocating', displayName: 'Reserve, Relocating' },
    { originalName: 'Drift', displayName: 'Drift' },
    { originalName: 'Ascent', displayName: 'Ascent' },
    { originalName: 'Operational Orbit', displayName: 'Operational Orbit' },
  ].map(config => {
    const visibleColumn = getVisibleColumns().find(col => col.name === config.originalName);
    return {
      ...config,
      visible: !!visibleColumn,
      highlight: visibleColumn ? visibleColumn.highlight : 0,
    };
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('data/starlink_totals.csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const cleanedData = results.data.filter(row => Object.values(row).some(value => value !== ''));
            setCSVData(cleanedData);
          },
          error: (error) => {
            setError(error.message);
          },
        });
      } catch (error) {
        setError(error.message);
      }
    //   console.log(csvData);
    };
    
    fetchData();
  }, []);


  // Filter columnConfigs based on visibility for the current screen size
  const visibleColumns = columnConfigs.filter(config => config.visible);
  const columnNames = visibleColumns.map(config => config.originalName);


  return (
    <div 
        className="pt-[70px] min-h-[calc(100vh-80px)] bg-cover bg-center bg-no-repeat bg-fixed text-white overflow-auto"
        style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${backgroundImage})`
        }}
    >
        <div className="container w-full px-4 mx-auto my-5">
            <div className="bg-white/60 rounded-3xl -mx-3 sm:mx-0 p-0.5 sm:p-1 md:p-2 lg:p-4 mb-5 shadow-md overflow-auto">
            <table className="w-full border border-gray-300 rounded-3xl overflow-hidden">
                <thead>
                <tr className="bg-gray-800 text-gray-300">
                    {columnConfigs.filter(config => config.visible).map((col, index) => (
                    <th 
                        key={index} 
                        className="border border-gray-300 p-2 text-left text-white text-xs sm:text-sm"
                    >
                        {col.displayName}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {csvData.map((row, index) => {
                    // Determine row highlight based on index
                    let rowHighlight = '';
                    let missionPadding = '';
                    let totalTextStyle = '';

                    switch (index + 1) {
                      case 1:
                        rowHighlight = 'bg-gray-700 text-white'; // Most highlighted row (Total)
                        missionPadding = 'pl-1'; // Padding for "Total" row
                        totalTextStyle = 'font-extrabold text-lg'; // Bolder and slightly larger text
                        break;
                      case 2:
                      case 8:
                        rowHighlight = 'bg-gray-600 text-white'; // Highlighted rows (Subtotals)
                        missionPadding = 'pl-2'; // More padding for "Subtotal" rows
                        totalTextStyle = 'font-bold text-base'; // Bolder and slightly larger text
                        break;
                      default:
                        rowHighlight = 'bg-gray-500 text-white'; // Default alternating rows
                        missionPadding = 'pl-4'; // Even more padding for other mission rows
                    }

                    return (
                        <tr key={index} className={`${rowHighlight}`}>
                          {columnNames.map((columnName) => {
                            const columnConfig = columnConfigs.find((config) => config.originalName === columnName);
                            const highlightClass = columnConfig?.highlight || 0;
                            let cellStyle = '';
                            let isMissionColumn = columnName === 'Mission';

                            // Column style
                            if (isMissionColumn) {
                              cellStyle = `bg-gray-800 text-white font-bold ${missionPadding}`;
                            } else {
                              switch (highlightClass) {
                                case 1: // Total columns
                                  cellStyle = `border border-gray-800 xl:bg-gray-700 text-white ${totalTextStyle}`;
                                  break;
                                case 2: // Other columns
                                  cellStyle = 'border border-gray-600 text-gray-200';
                                  break;
                                default:
                                  cellStyle = 'border border-gray-600 text-gray-200';
                              }
                            }
                            return (
                              <td
                                key={columnName}
                                className={`px-2 py-1 text-left text-xs sm:text-sm break-words whitespace-normal ${cellStyle}`}
                              >
                                <div className="w-full h-full">
                                  {row[columnName] || ''}
                                </div>
                              </td>
                            );
                        })}
                        </tr>
                    );
                    })}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );
}

export default Starlink;