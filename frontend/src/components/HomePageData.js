import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import apiClient from './../apiClient';


const StatCard = ({ value, label }) => {
  const [primaryValue, secondaryValue] = String(value).split(/(?=\()/);
  
  return (
    <div className="bg-black/40 p-4 rounded-xl border border-white/10 flex flex-col justify-between h-full">
      <h3 className="text-3xl xl:text-4xl font-bold mb-2">
        {primaryValue}
        <span className="text-sm xl:text-lg">{secondaryValue}</span>
      </h3>
      <p className="text-gray-300 text-sm xl:text-lg">{label}</p>
    </div>
  );
};

const GridSection = ({ title, data }) => (
  <div className={`${title === 'Total' ? 'col-span-2' : 'col-span-1'} grid-section`}>
    <div className="mb-4">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">{title}</h2>
      <div className="w-full border-t border-white" />
    </div>
    <div className={`grid ${title === 'Total' ? 'grid-cols-2' : 'grid-cols-1'} gap-8 text-white`}>
      {data.map((stat, index) => (
        <StatCard key={index} value={stat.value} label={stat.label} />
      ))}
    </div>
  </div>
);

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
        const responseTotals = await apiClient.get('/totals'); 
        const totalsData = responseTotals.data; 
        setData(totalsData);
        console.log('Totals Data: ', totalsData);

        // Fetching data for yearly totals
        const responseYear = await apiClient.get('/year_totals'); 
        const yearData = responseYear.data;
        setYearData(yearData);
        console.log('Year Totals Data: ', yearData);

        // Update the stats according to the default values
        const filteredTotals = totalsData.filter(row =>
          Object.keys(filters).some(key => filters[key] && row.configuration_name === key)
        );
        const filteredYearTotals = yearData.filter(row =>
          Object.keys(filters).some(key => filters[key] && row.configuration_name === key)
        );

        updateStats(filteredTotals);
        updateStatsCY(filteredYearTotals);
        updateStatsPY(filteredYearTotals);
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

  // Update stats based on current filter selection
  const updateStats = (filteredData = data.filter(row => Object.keys(filters).some(key => filters[key] && row.configuration_name === key))) => {

    const totalLaunches = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_count'), 0);
    const totalLandings = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_count'), 0);
    const totalLaunchSuccess = filteredData.reduce((sum, row) => sumSafe(sum, row, 'launch_success'), 0);
    const totalLandingAttempts = filteredData.reduce((sum, row) => sumSafe(sum, row, 'landing_attempt'), 0);

    const transformedData = [
      { value: totalLaunchSuccess, label: "Total Launches" },
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
    
    // const daysOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const daysOfYear = (new Date()).getFullYear() % 4 === 0 ? 366 : 365
    const daysBetweenLaunches =  daysOfYear / launchesCY

    const transformedData = [
      {
        value: `${launchesCY} (${growth > 0 ? '+' : ''}${growth.toFixed(1)}%)`,
        label: 'Launches'
      },
      { value: daysBetweenLaunches.toFixed(2),
        label: 'Days Between Launches'
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
      const newState = { ...prev, [name]: !prev[name] };
      const filteredData = data.filter(row => 
        Object.keys(newState).some(key => newState[key] && row.configuration_name === key)
      );
      const filteredYearData = yearData.filter(row =>
        Object.keys(newState).some(key => newState[key] && row.configuration_name === key)
      );
      
      updateStats(filteredData);
      updateStatsCY(filteredYearData);
      updateStatsPY(filteredYearData);
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full auto-cols-fr">
        <GridSection title="2024" data={homepageNumbersCY} />
        <GridSection title="2023" data={homepageNumbersPY} />
        <GridSection title="Total" data={homepageNumbers} />
      </div>
    </div>
  );
};

export default HomePageData;