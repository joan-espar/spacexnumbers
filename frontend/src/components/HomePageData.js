import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const HomePageData = () => {

  const [homepageNumbers, setHomepageNumbers] = useState({
    CY: [],
    PY: [],
    PPY: [],
    TOTAL: []
  });
  const [data, setData] = useState([]);
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
        const responseTotals = await apiClient.get('/homepage_totals'); 
        const totalsData = responseTotals.data; 
        setData(totalsData);
        console.log('Totals Data: ', totalsData);


        // Update the stats according to the default values
        const filteredTotals = totalsData.filter(row =>
          Object.keys(filters).some(key => filters[key] && row.configuration_name === key)
        );

        updateStats(filteredTotals);
      } catch (error) {
        console.error('Error fetching data from the API: ', error);
      }
    };

    fetchData();
  }, []);

  // Helper function to sum only valid numbers
  const sumSafe = (sum, row, key) => {
    const value = Number(row[key]);
    return isNaN(value) ? sum : sum + value;
  };

  const updateStats = (filteredData = data.filter(row => filters[row.configuration_name])) => {
    const launch_attempt_total = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_total'), 0);
    const launch_success_total = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_success_total'), 0);
    const landing_attempt_total = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_attempt_total'), 0);
    const landing_success_total = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_success_total'), 0);
    
    const launch_attempt_cy = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_cy'), 0);
    const launch_attempt_cy_yoy = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_cy_yoy'), 0);
    const launch_attempt_py = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_py'), 0);
    const launch_attempt_py_yoy = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_py_yoy'), 0);
    const launch_attempt_ppy = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_ppy'), 0);
    const launch_attempt_ppy_yoy = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_attempt_ppy_yoy'), 0);
    
    const growthCY = launch_attempt_cy_yoy !== 0 ? ((launch_attempt_cy / launch_attempt_cy_yoy) - 1) * 100 : 0;
    const growthPY = launch_attempt_py_yoy !== 0 ? ((launch_attempt_py / launch_attempt_py_yoy) - 1) * 100 : 0;
    const growthPPY = launch_attempt_ppy_yoy !== 0 ? ((launch_attempt_ppy / launch_attempt_ppy_yoy) - 1) * 100 : 0;
    
    const daysOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

    const transformedStats = {
      CY: [
        { value: `${launch_attempt_cy} (${growthCY > 0 ? '+' : ''}${growthCY.toFixed(1)}%)`, label: 'Current Launches' },
        { value: `${(launch_attempt_cy * 365 / daysOfYear).toFixed(0)}`, label: 'Projected Launches' },
        { value: (daysOfYear / launch_attempt_cy).toFixed(2), label: 'Days Between Launches' }
      ],
      PY: [
        { value: `${launch_attempt_py} (${growthPY > 0 ? '+' : ''}${growthPY.toFixed(1)}%)`, label: 'Launches' },
        { value: (366 / launch_attempt_py).toFixed(2), label: 'Days Between Launches' }
      ],
      PPY: [
        { value: `${launch_attempt_ppy} (${growthPPY > 0 ? '+' : ''}${growthPPY.toFixed(1)}%)`, label: 'Launches' },
        { value: (365 / launch_attempt_ppy).toFixed(2), label: 'Days Between Launches' }
      ],
      TOTAL: [
        { value: launch_success_total, label: "Launches" },
        { value: landing_success_total, label: "Landings" },
        { value: `${((launch_success_total / launch_attempt_total * 100) || 0).toFixed(1)}% (${launch_success_total}/${launch_attempt_total})`, label: "Launch Success" },
        { value: `${((landing_success_total / landing_attempt_total * 100) || 0).toFixed(1)}% (${landing_success_total}/${landing_attempt_total})`, label: "Landing Success" }
      ]
    };
    setHomepageNumbers(transformedStats);
  };

  const toggleFilter = (name) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: !prev[name] };
      const filteredData = data.filter(row => 
        Object.keys(newState).some(key => newState[key] && row.configuration_name === key)
      );
      
      updateStats(filteredData);
      return newState;
    });
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-white mb-4">Filter by Rockets:</h3>
      <div className="flex flex-wrap mb-16">
        {Object.keys(filters).map(name => (
          <button 
            key={name}
            onClick={() => toggleFilter(name)}
            className={`px-2 sm:px-4 py-1 m-1 rounded-full text-base sm:text-xl h-8 sm:h-12 items-center ${
              filters[name] ? 'bg-white text-black border border-white' : 'bg-black text-white border border-white'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 2025 (Current Year) Box */}
          <div className="bg-black bg-opacity-50 p-4 sm:p-6 rounded-2xl text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-2">2025</h3>
            <div className="space-y-1 sm:space-y-2">
              {homepageNumbers.CY.map((item, index) => (
                <div 
                  key={index} 
                  className="transition-all duration-300 p-2 sm:p-3 rounded-lg 
                            hover:bg-white/10 hover:scale-105 transform"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-gray-300 flex-shrink-0">{item.label}</span>
                    <span className="text-sm sm:text-lg font-bold text-white text-right break-words w-2/3 pl-2">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Years Box */}
          <div className="bg-black bg-opacity-50 p-4 sm:p-6 rounded-2xl text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-1">2024</h3>
            <div className="space-y-1 sm:space-y-2 mb-2">
              {homepageNumbers.PY.map((item, index) => (
                <div 
                  key={index} 
                  className="transition-all duration-300 p-2 sm:p-3 rounded-lg 
                            hover:bg-white/10 hover:scale-105 transform"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-gray-300 flex-shrink-0">{item.label}</span>
                    <span className="text-sm sm:text-lg font-bold text-white text-right break-words w-2/3 pl-2">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg sm:text-xl font-bold mb-1">2023</h3>
            <div className="space-y-1 sm:space-y-2">
              {homepageNumbers.PPY.map((item, index) => (
                <div 
                  key={index} 
                  className="transition-all duration-300 p-2 sm:p-3 rounded-lg 
                            hover:bg-white/10 hover:scale-105 transform"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-gray-300 flex-shrink-0">{item.label}</span>
                    <span className="text-sm sm:text-lg font-bold text-white text-right break-words w-2/3 pl-2">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Box */}
          <div className="sm:col-span-2 lg:col-span-1 bg-black bg-opacity-50 p-4 sm:p-6 rounded-2xl text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Total</h3>
            <div className="space-y-1 sm:space-y-2">
              {homepageNumbers.TOTAL.map((item, index) => (
                <div 
                  key={index} 
                  className="transition-all duration-300 p-2 sm:p-3 rounded-lg 
                            hover:bg-white/10 hover:scale-105 transform"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-gray-300 flex-shrink-0">{item.label}</span>
                    <span className="text-sm sm:text-lg font-bold text-white text-right break-words w-2/3 pl-2">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageData;