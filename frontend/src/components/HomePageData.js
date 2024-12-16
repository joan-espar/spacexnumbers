import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const HomePageData = () => {

    const [homepageNumbers, setHomepageNumbers] = useState([]);
    const [homepageNumbersCY, setHomepageNumbersCY] = useState([]);
    const [homepageNumbersPY, setHomepageNumbersPY] = useState([]);
    const [data, setData] = useState([]);
    const [yearData, setYearData] = useState([]);
    const [filters, setFilters] = useState({
      'Falcon 9': true,
      'Falcon Heavy': true,
      'Starship': false,
      'Falcon 1': false
    });
  
    useEffect(() => {
      const fetchData = async () => {

        try {
          // Fetching data for totals
          const responseTotals = await fetch('/data/table_totals.csv');
          const textTotals = await responseTotals.text();
          const resultsTotals = Papa.parse(textTotals, { 
            header: true, 
            dynamicTyping: true,
            skipEmptyLines: true
          });
          setData(resultsTotals.data);
  
          // Fetching data for yearly totals
          const responseYear = await fetch('/data/table_year_totals.csv');
          const textYear = await responseYear.text();
          const resultsYear = Papa.parse(textYear, { 
            header: true, 
            dynamicTyping: true,
            skipEmptyLines: true
          });
          setYearData(resultsYear.data);
          
          // Update the stats according to the default values
          updateStats(resultsTotals.data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key)));
          updateStatsCY(resultsYear.data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key)));
          updateStatsPY(resultsYear.data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key)));

        } catch (error) {
          console.error("Error fetching or parsing CSV data: ", error);
        }
      };
  
      fetchData();
    }, []);

  // Helper function to sum only valid numbers
  const sumSafe = (sum, row, key) => {
    const value = Number(row[key]);
    return isNaN(value) ? sum : sum + value;
  };

  // Update stats based on current filter selection
  const updateStats = (filteredData = data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key))) => {

    const totalLaunches = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count'), 0);
    const totalLandings = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_count'), 0);
    const totalLaunchSuccess = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_success'), 0);
    const totalLandingAttempts = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_attempt'), 0);

    const transformedData = [
      { value: totalLaunches, label: "Total Launches" },
      { value: totalLandings, label: "Total Landings" },
      {
        value: `${((totalLaunchSuccess / totalLaunches * 100) || 0).toFixed(1)}% (${totalLaunchSuccess}/${totalLaunches})`,
        label: "Launch Success"
      },
      {
        value: `${((totalLandings / totalLandingAttempts * 100) || 0).toFixed(1)}% (${totalLandings}/${totalLandingAttempts})`,
        label: "Landing Success"
      },
    ];
    setHomepageNumbers(transformedData);
  };

  const updateStatsCY = (filteredData = yearData.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key))) => {

    const launchesCY = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count_cy'), 0);
    const launchesCYYoY = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count_cy_yoy'), 0);
  
    const growth = launchesCYYoY !== 0 ? ((launchesCY / launchesCYYoY) - 1) * 100 : 0;
    
    const daysOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const daysBetweenLaunches =  daysOfYear / launchesCY

    const transformedData = [
      {
        value: `${launchesCY} (${growth > 0 ? '+' : ''}${growth.toFixed(1)}%)`,
        label: 'Launches'
      },
      { value: daysBetweenLaunches.toFixed(2),
        label: 'Days Between Lauches'
      }
    ];

    setHomepageNumbersCY(transformedData);
  };

  const updateStatsPY = (filteredData = yearData.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key))) => {

    const launchesPY = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count_py'), 0);
    const launchesPYYoY = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count_py_yoy'), 0);
  
    const growth = launchesPYYoY !== 0 ? ((launchesPY / launchesPYYoY) - 1) * 100 : 0;
    
    const pastYear = (new Date()).getFullYear() - 1
    const daysBetweenLaunches = (pastYear % 4 === 0 ? 366 : 365) / launchesPY

    const transformedData =  [
      {
        value: `${launchesPY} (${growth > 0 ? '+' : ''}${growth.toFixed(1)}%)`,
        label: 'Launches'
      },
      { value: daysBetweenLaunches.toFixed(2),
        label: 'Days Between Lauches'
      }
    ];

    setHomepageNumbersPY(transformedData);
  };

  const toggleFilter = (name) => {
    setFilters(prev => {
      const newState = {...prev, [name]: !prev[name]};
      updateStats(data.filter(row => Object.keys(newState).some(key => newState[key] && row.configuration_name === key)));
      updateStatsCY(yearData.filter(row => Object.keys(newState).some(key => newState[key] && row.configuration_name === key)));
      updateStatsPY(yearData.filter(row => Object.keys(newState).some(key => newState[key] && row.configuration_name === key)));
      return newState;
    });
  };

  // Make buttons bigger
  const buttons = Object.keys(filters).map(name => (
    <button 
      key={name}
      onClick={() => toggleFilter(name)}
      className={`px-2 sm:px-4 py-1 m-1 rounded-full text-base sm:text-xl h-8 sm:h-12 items-center ${filters[name] ? 'bg-white text-black border border-white': 'bg-black text-white border border-white'}`}
    >
      {name}
    </button>
  ));

  return (
    <div>
    {/* Text above filter buttons */}
    <h3 className="text-3xl font-bold text-white mb-4">Filter by Rockets:</h3>

    {/* Filter Buttons with increased size */}
    <div className="flex flex-wrap mb-16">
      {buttons}
    </div>

    {/* Container for grids - now using CSS Grid with fixed column layout */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full">

        {/* Left Grid - 2024 */}
        <div className="col-span-1">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">2024</h2>
          <div className="w-full border-t border-white mb-4"></div>
          <div className="grid grid-cols-1 gap-8 text-white">
            {homepageNumbersCY.map((stat, index) => {
                const valueString = String(stat.value);
                const parts = valueString.split('(');
                const primaryValue = parts[0] || valueString;
                const secondaryValue = parts[1] ? `(${parts[1]}` : '';

                return (
                    <div key={index} className="bg-black/40 p-4 rounded-xl border border-white/10">
                    <h3 className="text-3xl xl:text-4xl font-bold mb-2">
                        {primaryValue}
                        <span className="text-sm xl:text-lg">{secondaryValue}</span>
                    </h3>
                    <p className="text-gray-300 text-sm xl:text-lg">{stat.label}</p>
                    </div>
                );
            })}
          </div>
        </div>

        {/* Middle Grid - 2023 */}
        <div className="col-span-1">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">2023</h2>
            <div className="w-full border-t border-white mb-4"></div>
            <div className="grid grid-cols-1 gap-8 text-white">
                {homepageNumbersPY.map((stat, index) => {
                    const valueString = String(stat.value);
                    const parts = valueString.split('(');
                    const primaryValue = parts[0] || valueString;
                    const secondaryValue = parts[1] ? `(${parts[1]}` : '';

                    return (
                        <div key={index} className="bg-black/40 p-4 rounded-xl border border-white/10">
                        <h3 className="text-3xl xl:text-4xl font-bold mb-2">
                            {primaryValue}
                            <span className="text-sm xl:text-lg">{secondaryValue}</span>
                        </h3>
                        <p className="text-gray-300 text-sm xl:text-lg">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Right Grid - Total Numbers */}
        <div className="col-span-2">
          <div className="mb-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">Total</h2>
          <div className="w-full border-t border-white"></div>
          </div>

          {/* Statistics - now showing 6 items in 2 rows */}
          <div className="grid grid-cols-2 gap-8 text-white">
          {homepageNumbers.map((item, index) => {
              const valueString = String(item.value);
              const parts = valueString.split('(');
              const percentage = parts[0] || valueString; // Use the whole value if there's no '('
              const numbersInParenthesis = parts[1] ? `(${parts[1]}` : '';

              return (
              <div key={index} className="bg-black/40 p-4 rounded-xl border border-white/10">
                  <h3 className="text-3xl xl:text-4xl font-bold mb-2">
                  {percentage}
                  <span className="text-sm xl:text-lg">{numbersInParenthesis}</span>
                  </h3>
                  <p className="text-gray-300 text-sm xl:text-lg">{item.label}</p>
              </div>
              );
          })}
          </div>
        </div>
    </div>
  </div>
  );
};

export default HomePageData;