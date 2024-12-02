// src/Tab1.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Slider } from '@mui/material';

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Tab3() {

  const dimensionOptions = ['year', 'year_month'];

  const chartViewOptions = [
    { value: 'total', label: 'Total' },
    { value: 'pad', label: 'Launch Pad' },
    { value: 'orbit', label: 'Orbit' }
  ];

  const [selectedChartView, setSelectedChartView] = useState(chartViewOptions[0].value);
  const [showDropdownChartView, setShowDropdownChartView] = useState(false);

  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  
  const [showDropdownDimension, setShowDropdownDimension] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(dimensionOptions[0]);

  const [minYear, setMinYear] = useState(0);
  const [maxYear, setMaxYear] = useState(0);
  const [sliderValue, setSliderValue] = useState([0, 0]); // Range for the slider

  const [showDropdownFilter1, setShowDropdownFilter1] = useState(false);
  const [selectedFilter1, setSelectedFilter1] = useState([]);
  const [isAllSelected1, setIsAllSelected1] = useState(true); // Track if "All" is selected

  const [showDropdownFilterOrbit, setShowDropdownFilterOrbit] = useState(false);
  const [selectedFilterOrbit, setSelectedFilterOrbit] = useState([]);
  const [isAllSelectedOrbit, setIsAllSelectedOrbit] = useState(true);

  const [showDropdownFilterPad, setShowDropdownFilterPad] = useState(false);
  const [selectedFilterPad, setSelectedFilterPad] = useState([]);
  const [isAllSelectedPad, setIsAllSelectedPad] = useState(true);

  const columnConfigs = [
    { originalName: 'net', displayName: 'Date and Time', visible: true },
    { originalName: 'configuration_name', displayName: 'Rocket', visible: true },
    { originalName: 'status_abbrev', displayName: 'Status', visible: true },
    { originalName: 'pad_name', displayName: 'Pad', visible: true },
    { originalName: 'mission_name', displayName: 'Mission', visible: true },
    { originalName: 'mission_orbit_abbrev', displayName: 'Orbit', visible: true },
    { originalName: 'launcher_serial_number', displayName: 'Booster', visible: true },
    { originalName: 'landing_location_abbrev', displayName: 'Landing Location', visible: true },
    { originalName: 'landing_type_abbrev', displayName: 'Landing Type', visible: true },
    { originalName: 'landing_attempt', displayName: 'Landing Attempt', visible: false },
    { originalName: 'landing_success', displayName: 'Landing Success', visible: false },
  ];

  // Read data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('data/table_launch_1.csv'); // Replace with the path to your CSV file
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const cleanedData = results.data.filter(row => Object.values(row).some(value => value !== ''));
            setCsvData(cleanedData);
            setFilteredData(cleanedData);
            
            // Determine min and max years from the data
            const years = cleanedData.map(row => new Date(row.net).getFullYear());
            const min = Math.min(...years);
            const max = Math.max(...years);

            setMinYear(min);
            setMaxYear(max);
            setSliderValue([min, max]); // Initialize slider value

            setSelectedFilter1([...new Set(cleanedData.map(row => row.configuration_name))]); // Set all rockets as selected by default
            setSelectedFilterOrbit([...new Set(cleanedData.map(row => row.mission_orbit_abbrev))]);
            setSelectedFilterPad([...new Set(cleanedData.map(row => row.pad_name))]);
          },
          error: (error) => {
            setError(error.message);
          },
        });
      } catch (error) {
        setError(error.message);
      }
    };
    fetchData();
  }, []);


  const visibleColumns = columnConfigs.filter(config => config.visible);
  const columnNames = visibleColumns.map(config => config.originalName);

  // Get unique values for different filters
  const uniqueRockets = [...new Set(csvData.map(row => row.configuration_name))];
  const uniquePads = [...new Set(csvData.map(row => row.pad_name))];
  const uniqueOrbits = [...new Set(csvData.map(row => row.mission_orbit_abbrev))];
  
  const handleFilterRocket = (rocket) => {
    let newSelectedFilter;
    let newIsAllSelected;
    console.log(rocket)
    if (rocket === 'All') {
      if (isAllSelected1) {
        newSelectedFilter = []; // Deselect all rockets
        newIsAllSelected = false;
      } else {
        newSelectedFilter = uniqueRockets; // Select all rockets
        newIsAllSelected = true;
      }
    } else {
      newSelectedFilter = [...selectedFilter1];
      if (newSelectedFilter.includes(rocket)) {
        newSelectedFilter.splice(newSelectedFilter.indexOf(rocket), 1); // Deselect the rocket
      } else {
        newSelectedFilter.push(rocket); // Select the rocket
      }

      // Update "All" selection status based on individual selections
      newIsAllSelected = newSelectedFilter.length === uniqueRockets.length;
    }

    // Update state
    setSelectedFilter1(newSelectedFilter);
    setIsAllSelected1(newIsAllSelected);

    // Perform filtering based on the new state
    filterData(newSelectedFilter, newIsAllSelected, 'rocket');
  };


  const handleFilterPad = (pad) => {
    let newSelectedFilter;
    let newIsAllSelected;
    
    if (pad === 'All') {
      if (isAllSelectedPad) {
        newSelectedFilter = []; // Deselect all 
        newIsAllSelected = false;
      } else {
        newSelectedFilter = uniquePads; // Select all
        newIsAllSelected = true;
      }
    } else {
      newSelectedFilter = [...selectedFilterPad];
      if (newSelectedFilter.includes(pad)) {
        newSelectedFilter.splice(newSelectedFilter.indexOf(pad), 1); // Deselect
      } else {
        newSelectedFilter.push(pad); // Select
      }

      // Update "All" selection status based on individual selections
      newIsAllSelected = newSelectedFilter.length === uniquePads.length;
    }

    // Update state
    setSelectedFilterPad(newSelectedFilter);
    setIsAllSelectedPad(newIsAllSelected);

    // Perform filtering based on the new state
    filterData(newSelectedFilter, newIsAllSelected, 'pad');
  };

  const handleFilterOrbit = (orbit) => {
    let newSelectedFilter;
    let newIsAllSelected;
    
    if (orbit === 'All') {
      if (isAllSelectedOrbit) {
        newSelectedFilter = []; // Deselect all 
        newIsAllSelected = false;
      } else {
        newSelectedFilter = uniqueOrbits; // Select all
        newIsAllSelected = true;
      }
    } else {
      newSelectedFilter = [...selectedFilterOrbit];
      if (newSelectedFilter.includes(orbit)) {
        newSelectedFilter.splice(newSelectedFilter.indexOf(orbit), 1); // Deselect
      } else {
        newSelectedFilter.push(orbit); // Select
      }

      // Update "All" selection status based on individual selections
      newIsAllSelected = newSelectedFilter.length === uniqueOrbits.length;
    }

    // Update state
    setSelectedFilterOrbit(newSelectedFilter);
    setIsAllSelectedOrbit(newIsAllSelected);

    // Perform filtering based on the new state
    filterData(newSelectedFilter, newIsAllSelected, 'orbit');
  };

  // Modify filtering logic to include new filters
  const filterData = (newFilter, isAllSelected, filterType) => {
    // Determine which filter was changed and update its state
    let updatedRocketFilter = selectedFilter1;
    let updatedOrbitFilter = selectedFilterOrbit;
    let updatedPadFilter = selectedFilterPad;
    let updatedRocketAllSelected = isAllSelected1;
    let updatedOrbitAllSelected = isAllSelectedOrbit;
    let updatedPadAllSelected = isAllSelectedPad;

    switch(filterType) {
      case 'rocket':
        updatedRocketFilter = newFilter;
        updatedRocketAllSelected = isAllSelected;
        break;
      case 'orbit':
        updatedOrbitFilter = newFilter;
        updatedOrbitAllSelected = isAllSelected;
        break;
      case 'pad':
        updatedPadFilter = newFilter;
        updatedPadAllSelected = isAllSelected;
        break;
    }

    // Apply all filters
    const filteredRows = csvData.filter(row => 
      (updatedRocketAllSelected || updatedRocketFilter.includes(row.configuration_name)) &&
      (updatedOrbitAllSelected || updatedOrbitFilter.includes(row.mission_orbit_abbrev)) &&
      (updatedPadAllSelected || updatedPadFilter.includes(row.pad_name))
    ).filter(row => {
      const year = new Date(row.net).getFullYear();
      return year >= sliderValue[0] && year <= sliderValue[1];
    });

    setFilteredData(filteredRows);
  };

  const filterTime = (sliderNewValue) => {
    // Apply all filters
    const filteredRows = csvData.filter(row => {
      const year = new Date(row.net).getFullYear();
      return year >= sliderNewValue[0] && year <= sliderNewValue[1];
    });
    setFilteredData(filteredRows);
  };
  
  // Get button labels for filters
  const getRocketButtonLabel = () => {
    if (isAllSelected1) {
      return 'Rocket: All';
    } else if (selectedFilter1.length === 0) {
      return 'Rocket: None';
    } else if (selectedFilter1.length === 1) {
      return `Rocket: ${selectedFilter1[0]}`;
    } else {
      return `Rocket: Multiple Values`;
    }
  };

  const getOrbitButtonLabel = () => {
    if (isAllSelectedOrbit) {
      return 'Orbit: All';
    } else if (selectedFilterOrbit.length === 0) {
      return 'Orbit: None';
    } else if (selectedFilterOrbit.length === 1) {
      return `Orbit: ${selectedFilterOrbit[0]}`;
    } else {
      return `Orbit: Multiple Values`;
    }
  };

  const getPadButtonLabel = () => {
    if (isAllSelectedPad) {
      return 'Pad: All';
    } else if (selectedFilterPad.length === 0) {
      return 'Pad: None';
    } else if (selectedFilterPad.length === 1) {
      return `Pad: ${selectedFilterPad[0]}`;
    } else {
      return `Pad: Multiple Values`;
    }
  };

  const getDimensionLabel = () => {
    if (selectedDimension == 'year') {
      return 'Year';
    } else if (selectedDimension == 'year_month') {
      return 'Month';
    }
    return selectedDimension; // This line might not be necessary if you ensure selectedDimension is always either 'year' or 'year_month'
  };

  const handleSelectDimension = (dim) => {
    setSelectedDimension(dim);
    setShowDropdownDimension(false);
  };

  // Prepare data for the bar chart
  const chartData = () => {
    // Generate labels based on the filtered year range
    let allLabels;
    if (selectedDimension === 'year') {
      allLabels = Array.from({ length: sliderValue[1] - sliderValue[0] + 1 }, (_, i) => sliderValue[0] + i);
    } else if (selectedDimension === 'year_month') {
      const startYear = sliderValue[0];
      const endYear = sliderValue[1];
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      allLabels = [];
      for (let year = startYear; year <= endYear; year++) {
        months.forEach(month => {
          allLabels.push(`${year}-${String(month).padStart(2, '0')}`);
        });
      }
    } 

    // Filter data and count occurrences
    const counts = filteredData.reduce((acc, row) => {
      const dimensionValue = row[selectedDimension]; // Use the selected dimension (year or year_month)
      acc[dimensionValue] = (acc[dimensionValue] || 0) + 1; // Count occurrences of each dimension value
      return acc;
    }, {});

    // Sort labels in ascending order
    const sortedLabels = allLabels.sort((a, b) => new Date(a) - new Date(b));

    // Determine which grouping to use based on selected view
    const groupingKey = selectedChartView === 'pad' 
      ? 'pad_name' 
      : (selectedChartView === 'orbit' 
        ? 'mission_orbit_abbrev' 
        : null);

    if (selectedChartView === 'total') {
      // Total view (original implementation)
      const counts = filteredData.reduce((acc, row) => {
        const dimensionValue = row[selectedDimension];
        acc[dimensionValue] = (acc[dimensionValue] || 0) + 1;
        return acc;
      }, {});

      return {
        labels: sortedLabels,
        datasets: [
          {
            label: 'Launch Count',
            data: sortedLabels.map(label => counts[label] || 0),
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // Grouped view (pad or orbit)
      // Get unique groups
      const uniqueGroups = [...new Set(filteredData.map(row => row[groupingKey]))];

      // Count launches per dimension and group
      const groupedCounts = filteredData.reduce((acc, row) => {
        const dimensionValue = row[selectedDimension];
        const groupName = row[groupingKey];
        
        if (!acc[dimensionValue]) {
          acc[dimensionValue] = {};
        }
        acc[dimensionValue][groupName] = (acc[dimensionValue][groupName] || 0) + 1;
        return acc;
      }, {});

      // Prepare datasets for stacked bar chart
      const datasets = uniqueGroups.map((group, index) => ({
        label: group || 'Unknown',
        data: sortedLabels.map(label => 
          groupedCounts[label] ? (groupedCounts[label][group] || 0) : 0
        ),
        backgroundColor: `rgba(${75 + index * 30},${192 - index * 20},${192 + index * 10},0.6)`,
      }));

      return {
        labels: sortedLabels,
        datasets: datasets,
      };
    }        
  };
  
  // Function to get the label for the chart view dropdown
  const getChartViewLabel = () => {
    const selectedView = chartViewOptions.find(option => option.value === selectedChartView);
    return selectedView ? `View: ${selectedView.label}` : 'View';
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>SpaceX Data</h1>
      {error ? (
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      ) : (
        <div style={{ width: '80%', margin: '20px auto' }}>
          {/* Year Range Slider */}
          <div style={{ marginBottom: '20px' }}>
            <label>Year Range: {sliderValue[0]} - {sliderValue[1]}</label>
              <Slider
                value={sliderValue}
                onChange={(event, newValue) => {
                  setSliderValue(newValue);
                  filterTime(newValue); // Pass the new year range
                }}
                valueLabelDisplay="auto"
                min={minYear}
                max={maxYear}
                step={1}
                marks 
              />
          </div>
          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px', 
            position: 'relative' 
          }}>
            {/* Rocket Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdownFilter1(!showDropdownFilter1)}
                style={{
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '220px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {getRocketButtonLabel()}
                <span style={{ marginLeft: '10px' }}>&#x25BC;</span>
              </button>
              {showDropdownFilter1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#fff',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    padding: '10px',
                    zIndex: 1,
                    minWidth:'150px',
                    marginTop:'5px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => handleFilterRocket('All')} style={{ padding:'10px', width:'100%', textAlign:'left' }}>
                    <input type="checkbox" checked={isAllSelected1} onChange={() => handleFilterRocket('All')} style={{ marginRight:'10px' }} />
                    All
                  </button>
                  {uniqueRockets.map((rocket, index) => (
                    <label key={index} style={{ display:'block', padding:'8px', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedFilter1.includes(rocket)}
                        onChange={() => handleFilterRocket(rocket)}
                        style={{ marginRight:'10px' }}
                      />
                      {rocket}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Orbit Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdownFilterOrbit(!showDropdownFilterOrbit)}
                style={{
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '220px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {getOrbitButtonLabel()}
                <span style={{ marginLeft: '10px' }}>&#x25BC;</span>
              </button>
              {showDropdownFilterOrbit && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#fff',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    padding: '10px',
                    zIndex: 1,
                    minWidth:'150px',
                    marginTop:'5px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => handleFilterOrbit('All')} 
                    style={{ padding:'10px', width:'100%', textAlign:'left' }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isAllSelectedOrbit} 
                      onChange={() => handleFilterOrbit('All')} 
                      style={{ marginRight:'10px' }} 
                    />
                    All
                  </button>
                  {uniqueOrbits.map((orbit, index) => (
                    <label key={index} style={{ display:'block', padding:'8px', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedFilterOrbit.includes(orbit)}
                        onChange={() => handleFilterOrbit(orbit)}
                        style={{ marginRight:'10px' }}
                      />
                      {orbit}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Pad Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdownFilterPad(!showDropdownFilterPad)}
                style={{
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '220px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {getPadButtonLabel()}
                <span style={{ marginLeft: '10px' }}>&#x25BC;</span>
              </button>
              {showDropdownFilterPad && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#fff',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    padding: '10px',
                    zIndex: 1,
                    minWidth:'150px',
                    marginTop:'5px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => handleFilterPad('All')} 
                    style={{ padding:'10px', width:'100%', textAlign:'left' }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isAllSelectedPad} 
                      onChange={() => handleFilterPad('All')} 
                      style={{ marginRight:'10px' }} 
                    />
                    All
                  </button>
                  {uniquePads.map((pad, index) => (
                    <label key={index} style={{ display:'block', padding:'8px', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedFilterPad.includes(pad)}
                        onChange={() => handleFilterPad(pad)}
                        style={{ marginRight:'10px' }}
                      />
                      {pad}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Dimension Selector */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <button
              onClick={() => setShowDropdownDimension(!showDropdownDimension)}
              style={{
                padding: '10px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '220px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {getDimensionLabel()}
              <span style={{ marginLeft: '10px' }}>▼</span>
            </button>
            {showDropdownDimension && (
              <div
                style={{
                  position: 'absolute',
                  backgroundColor: '#fff',
                  borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  padding: '10px',
                  zIndex: 1,
                  minWidth: '150px',
                  marginTop: '5px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {dimensionOptions.map((dim, index) => (
                  <label 
                    key={index} 
                    style={{ 
                      display: 'block', 
                      padding: '8px', 
                      cursor: 'pointer',
                      backgroundColor: selectedDimension === dim ? '#f0f0f0' : 'transparent' 
                    }}
                  >
                    <input
                      type="radio"
                      name="dimension"
                      value={dim}
                      checked={selectedDimension === dim}
                      onChange={() => handleSelectDimension(dim)}
                      style={{ marginRight: '10px' }}
                    />
                    {dim === 'year' ? 'Year' : 'Month'}
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Chart View Selector - Using the same dropdown style as other selectors */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <button
              onClick={() => setShowDropdownChartView(!showDropdownChartView)}
              style={{
                padding: '10px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '220px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {getChartViewLabel()}
              <span style={{ marginLeft: '10px' }}>▼</span>
            </button>
            {showDropdownChartView && (
              <div
                style={{
                  position: 'absolute',
                  backgroundColor: '#fff',
                  borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  padding: '10px',
                  zIndex: 1,
                  minWidth: '150px',
                  marginTop: '5px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {chartViewOptions.map((option, index) => (
                  <label 
                    key={index} 
                    style={{ 
                      display: 'block', 
                      padding: '8px', 
                      cursor: 'pointer',
                      backgroundColor: selectedChartView === option.value ? '#f0f0f0' : 'transparent' 
                    }}
                  >
                    <input
                      type="radio"
                      name="chartView"
                      value={option.value}
                      checked={selectedChartView === option.value}
                      onChange={() => {
                        setSelectedChartView(option.value);
                        setShowDropdownChartView(false);
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Bar Graph */}
          <Bar 
            data={chartData()} 
            options={{
              responsive: true,
              scales: {
                y: {
                  stacked: selectedChartView !== 'total',
                  ticks: {
                    beginAtZero: true,
                  }
                },
                x: {
                  stacked: selectedChartView !== 'total',
                }
              },
              plugins: {
                legend: {
                  display: selectedChartView !== 'total'
                }
              }
            }} 
          />

          {/* Data Table */}
          <table style={{ 
            borderCollapse: 'separate', 
            borderSpacing: '0', 
            width: '100%', 
            border: '1px solid #ddd' 
          }}>
            <thead>
              {/* Main category headers */}
              <tr style={{ 
                backgroundColor: '#f0f0f0', 
                border: 'none' 
              }}>
                <th 
                  colSpan={6} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    borderBottom: '1px solid #bbb',
                    borderTop: '1px solid #bbb',
                    borderRight: '1px solid #bbb',
                    borderLeft: '1px solid #bbb',
                    fontWeight: 'bold'
                  }}
                >
                  Launches
                </th>
                <th 
                  colSpan={3} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    borderBottom: '1px solid #bbb',
                    borderTop: '1px solid #bbb',
                    borderRight: '1px solid #bbb',
                    fontWeight: 'bold'
                  }}
                >
                  Landings
                </th>
              </tr>
              {/* Specific column headers */}
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                {columnConfigs.filter(config => config.visible).map((col, index) => (
                  <th 
                    key={index} 
                    style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #bbb',
                      borderRight: index < columnConfigs.filter(config => config.visible).length - 1 ? '1px solid #bbb' : 'none',
                      textAlign: 'left',
                      ...(col.displayName === 'Mission' && { width: '100px', overflow: 'hidden', textOverflow: 'ellipsis' })
                    }}
                  >
                    {col.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr 
                  key={index} 
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  {columnNames.map((columnName) => {
                    // Check if the column is one that might have multiple values
                    const isMultiValueColumn = ['launcher_serial_number', 'landing_location_abbrev', 'landing_type_abbrev'].includes(columnName);
                    
                    // Split the value if it's a multi-value column, clean it, otherwise use as-is
                    const cellValues = isMultiValueColumn 
                      ? (row[columnName] 
                          ? row[columnName]
                              .replace(/^\[|\]$/g, '') // Remove surrounding brackets
                              .replace(/'/g, '') // Remove all single quotes
                              .replace(/"/g, '') // Remove all double quotes
                              .split(',')
                              .map(val => val.trim()) // Trim whitespace
                          : [])
                      : [row[columnName]];

                    const getCellColor = (value) => {
                      if (isMultiValueColumn) {
                        // Find the index of the current value in the cellValues array
                        const landingAttemptIndex = cellValues.indexOf(value);
                        
                        // Parse landing attempt and success arrays, handling Python-style boolean representation
                        const landingAttemptArray = row['landing_attempt'] 
                          ? row['landing_attempt']
                              .replace(/^\[|\]$/g, '') // Remove brackets
                              .replace(/'/g, '') // Remove quotes
                              .replace(/True/g, 'true')
                              .replace(/False/g, 'false')
                              .replace(/nan/g, 'false')
                              .split(',')
                              .map(val => val.trim())
                          : [];
                        
                        const landingSuccessArray = row['landing_success'] 
                          ? row['landing_success']
                              .replace(/^\[|\]$/g, '') // Remove brackets
                              .replace(/'/g, '') // Remove quotes
                              .replace(/True/g, 'true')
                              .replace(/False/g, 'false')
                              .replace(/nan/g, 'false')
                              .split(',')
                              .map(val => val.trim())
                          : [];
                        
                        // Check the corresponding values at the same index
                        const landingAttempt = landingAttemptArray[landingAttemptIndex] === 'true';
                        const landingSuccess = landingSuccessArray[landingAttemptIndex] === 'true';

                        if (!landingAttempt) return '#ffff00'; // Yellow for no attempt
                        if (landingSuccess) return '#90EE90'; // Light green for successful landing
                        return '#FF6347'; // Tomato red for failed landing attempt
                      }
                      return 'transparent';
                    };

                    return (
                      <td 
                        key={columnName} 
                        style={{ 
                          padding: '10px', 
                          borderBottom: '1px solid #ddd',
                          borderRight: columnNames.indexOf(columnName) < columnNames.length - 1 ? '1px solid #ddd' : 'none',
                          verticalAlign: 'top',
                          ...(columnName === 'mission_name' && { width: '100px', overflow: 'hidden', textOverflow: 'ellipsis' })
                        }}
                      >
                        {isMultiValueColumn ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '0',
                            height: '100%'
                          }}>
                            {cellValues.map((val, valIndex) => (
                              <div 
                                key={valIndex} 
                                style={{ 
                                  backgroundColor: getCellColor(val),
                                  flex: '1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '2px 5px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {val || 'N/A'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            style={{ 
                              width: '100%', 
                              height: '100%',
                              backgroundColor: columnName === 'mission_name' ? '#f0f0f0' : 'transparent'
                            }}
                          >
                            {row[columnName] || 'N/A'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Tab3;