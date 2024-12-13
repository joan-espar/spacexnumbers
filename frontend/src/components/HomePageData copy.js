import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const HomePageData = () => {

    const [homepageNumbers, setHomepageNumbers] = useState([]);
    const [data, setData] = useState([]);
    const [yearData, setYearData] = useState([]); // New state for year data
    const [filters, setFilters] = useState({
      'Falcon 9': true,
      'Falcon Heavy': false,
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
          setYearData(resultsYear.data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key))); // Set the new data state
          updateStats(resultsTotals.data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key)));
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

  const toggleFilter = (name) => {
    setFilters(prev => {
      const newState = {...prev, [name]: !prev[name]};
      updateStats(data.filter(row => Object.keys(newState).some(key => newState[key] && row.configuration_name === key)));
      return newState;
    });
  };

  // Make buttons bigger
  const buttons = Object.keys(filters).map(name => (
    <button 
      key={name}
      onClick={() => toggleFilter(name)}
      className={`px-4 py-2 m-1 rounded-full text-xl ${filters[name] ? 'bg-white text-black' : 'bg-black text-white border border-white'}`}
    >
      {name}
    </button>
  ));

  const getYearData = (year) => {
    const yearStats = yearData.filter(row => row.year === year);
    const lastYearStats = yearData.filter(row => row.year === year - 1);
  
    const launchesThisYear = yearStats.reduce((sum, row) => sumSafe(sum, row, 'launch_count_cy'), 0);
    const launchesLastYear = lastYearStats.reduce((sum, row) => sumSafe(sum, row, 'launch_count_cy'), 0);
  
    const growth = launchesLastYear !== 0 ? ((launchesThisYear / launchesLastYear) - 1) * 100 : 0;
  
    return [
      {
        value: `${launchesThisYear} (${growth.toFixed(1)}%)`,
        label: 'Launches'
      },
      // Placeholder for the second stat if needed
      { value: '', label: '' }
    ];
  };

  return (
    <div>
    {/* Text above filter buttons */}
    <h3 className="text-3xl font-bold text-white mb-4">Filter by Rocket:</h3>

    {/* Filter Buttons with increased size */}
    <div className="flex flex-wrap mb-16">
      {buttons}
    </div>

    {/* Container for grids - now using CSS Grid with fixed column layout */}
    <div className="grid grid-cols-4 gap-8 w-full">
        {/* Left Grid - Total Numbers */}
        <div className="col-span-2">
            <div className="mb-4">
            <h2 className="text-5xl font-bold text-white mb-2">Total Numbers</h2>
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
                <div key={index} className="bg-black/40 p-6 rounded-xl border border-white/10">
                    <h3 className="text-4xl font-bold mb-2">
                    {percentage}
                    <span className="text-base">{numbersInParenthesis}</span>
                    </h3>
                    <p className="text-gray-300">{item.label}</p>
                </div>
                );
            })}
            </div>
        </div>

        {/* Middle Grid - 2024 */}
        <div className="col-span-1">
          <h2 className="text-5xl font-bold text-white mb-2">2024</h2>
          <div className="w-full border-t border-white mb-4"></div>
          <div className="grid grid-rows-2 gap-8 text-white">
            {getYearData(2024).map((stat, index) => (
              <div key={index} className="bg-black/40 p-6 rounded-xl border border-white/10">
                <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                <p className="text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Grid - 2023 */}
        <div className="col-span-1">
            <h2 className="text-5xl font-bold text-white mb-2">2023</h2>
            <div className="w-full border-t border-white mb-4"></div>
            <div className="grid grid-rows-2 gap-8 text-white">
            {[1, 2].map((_, index) => (
                <div key={index} className="bg-black/40 p-6 rounded-xl border border-white/10">
                <h3 className="text-4xl font-bold mb-2">Sample Value</h3>
                <p className="text-gray-300">Sample Label</p>
                </div>
            ))}
            </div>
        </div>
    </div>
  </div>
  );
};

export default HomePageData;