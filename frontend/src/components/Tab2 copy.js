// src/Tab2.js
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
import { Slider } from '@mui/material'; // Import Slider from Material-UI

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Tab2() {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRockets, setSelectedRockets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(true); // Track if "All" is selected
  const [xAxisDimension, setXAxisDimension] = useState('year'); // Track the selected x-axis dimension
  const [minYear, setMinYear] = useState(0);
  const [maxYear, setMaxYear] = useState(0);
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(0);

  const columnConfigs = [
    { originalName: 'net', displayName: 'Date and Time', visible: true },
    { originalName: 'configuration_name', displayName: 'Rocket', visible: true },
    { originalName: 'status_abbrev', displayName: 'Status', visible: true },
    { originalName: 'pad_name', displayName: 'Pad Name', visible: true },
    { originalName: 'mission_name', displayName: 'Mission', visible: true },
    { originalName: 'mission_orbit_abbrev', displayName: 'Orbit', visible: true },
  ];

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
            setSliderMin(min); // Set initial slider min
            setSliderMax(max); // Set initial slider max

            // Set all rockets as selected by default
            const allRockets = [...new Set(cleanedData.map(row => row.configuration_name))];
            setSelectedRockets(allRockets);
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
  const uniqueRockets = [...new Set(csvData.map(row => row.configuration_name))];

  const handleFilterChange = (rocket) => {
    let newSelectedRockets;
    let newIsAllSelected;

    if (rocket === 'All') {
      if (isAllSelected) {
        newSelectedRockets = []; // Deselect all rockets
        newIsAllSelected = false;
      } else {
        newSelectedRockets = uniqueRockets; // Select all rockets
        newIsAllSelected = true;
      }
    } else {
      newSelectedRockets = [...selectedRockets];
      if (newSelectedRockets.includes(rocket)) {
        newSelectedRockets.splice(newSelectedRockets.indexOf(rocket), 1); // Deselect the rocket
      } else {
        newSelectedRockets.push(rocket); // Select the rocket
      }

      // Update "All" selection status based on individual selections
      newIsAllSelected = newSelectedRockets.length === uniqueRockets.length;
    }

    // Update state
    setSelectedRockets(newSelectedRockets);
    setIsAllSelected(newIsAllSelected);

    // Perform filtering based on the new state
    const filteredRows = newIsAllSelected 
      ? csvData 
      : csvData.filter(row => newSelectedRockets.includes(row.configuration_name));
    
    setFilteredData(filteredRows);
  };

  const getButtonLabel = () => {
    if (isAllSelected) {
      return 'Rocket: All';
    } else if (selectedRockets.length === 0) {
      return 'Rocket: None';
    } else if (selectedRockets.length === 1) {
      return `Rocket: ${selectedRockets[0]}`;
    } else {
      return `Rocket: Multiple Values`;
    }
  };

  const chartData = () => {
    const counts = filteredData.reduce((acc, row) => {
      const year = new Date(row.net).getFullYear(); // Assuming 'net' is the date field
      if (year >= sliderMin && year <= sliderMax) { // Use slider values for filtering
        const dimensionValue = row[xAxisDimension]; // Use the selected dimension (year or year_month)
        acc[dimensionValue] = (acc[dimensionValue] || 0) + 1; // Count occurrences of each dimension value
      }
      return acc;
    }, {});
  
    // Sort labels in ascending order
    const sortedLabels = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
  
    return {
      labels: sortedLabels, // Use sorted labels
      datasets: [
        {
          label: 'Launch Count',
          data: sortedLabels.map(label => counts[label] || 0), // Map counts to sorted labels
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>SpaceX Launch Data</h1>
      {error ? (
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      ) : (
        <div style={{ width: '80%', margin: '20px auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
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
              {getButtonLabel()}
              <span style={{ marginLeft: '10px' }}>&#x25BC;</span>
            </button>
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  backgroundColor: '#fff',
                  borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  padding: '10px',
                  zIndex: 1,
                  minWidth: '150px',
                  marginTop:'5px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => handleFilterChange('All')} style={{ padding:'10px', width:'100%', textAlign:'left' }}>
                  <input type="checkbox" checked={isAllSelected} onChange={() => handleFilterChange('All')} style={{ marginRight:'10px' }} />
                  All
                </button>
                {uniqueRockets.map((rocket, index) => (
                  <label key={index} style={{ display:'block', padding:'8px', cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRockets.includes(rocket)}
                      onChange={() => handleFilterChange(rocket)}
                      style={{ marginRight:'10px' }}
                    />
                    {rocket}
                  </label>
                ))}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label>Year Range: {sliderMin} - {sliderMax}</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  type="range"
                  min={minYear}
                  max={maxYear}
                  value={sliderMin}
                  onChange={(e) => {
                    const value = Math.min(e.target.value, sliderMax); // Ensure min does not exceed max
                    setSliderMin(value);
                  }}
                  style={{ marginRight: '10px' }}
                />
                <input
                  type="range"
                  min={minYear}
                  max={maxYear}
                  value={sliderMax}
                  onChange={(e) => {
                    const value = Math.max(e.target.value, sliderMin); // Ensure max does not go below min
                    setSliderMax(value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bar Graph */}
          <Bar 
            data={chartData()} 
            options={{
              responsive: true,
              scales: {
                yAxes: [{
                  ticks: {
                    beginAtZero:true,
                  }
                }]
              }
            }} 
          />
          <div>
            <button 
              onClick={() => setXAxisDimension(xAxisDimension === 'year' ? 'year_month' : 'year')} 
              style={{ padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
            >
              Switch to {xAxisDimension === 'year' ? 'Year Month' : 'Year'}
            </button>
          </div>
          {/* Data Table */}
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead>
              <tr style={{ backgroundColor:'#f0f0f0' }}>
                {columnConfigs.filter(config => config.visible).map((col, index) => (
                  <th key={index} style={{ padding:'10px', borderBottom:'2px solid #ddd' }}>{col.displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index} style={{ backgroundColor:index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  {columnNames.map((columnName) => (
                    <td key={columnName} style={{ padding:'10px', borderBottom:'1px solid #ddd'}}>{row[columnName]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Tab2;