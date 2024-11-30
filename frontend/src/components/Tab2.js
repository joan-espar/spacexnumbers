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
  const [sliderValue, setSliderValue] = useState([0, 0]); // Range for the slider

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
            setSliderValue([min, max]); // Initialize slider value
            setSelectedRockets([...new Set(cleanedData.map(row => row.configuration_name))]); // Set all rockets as selected by default
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

  const handleFilterRocket = (rocket) => {
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
    filterData(newSelectedRockets, newIsAllSelected, sliderValue);
  };

  // Function to filter data based on selected rockets and year range
  const filterData = (rockets, allSelected, yearRange) => {
    const filteredRows = allSelected 
      ? csvData 
      : csvData.filter(row => rockets.includes(row.configuration_name));
  
    // Filter based on year range
    const finalFilteredRows = filteredRows.filter(row => {
      const year = new Date(row.net).getFullYear();
      return year >= yearRange[0] && year <= yearRange[1];
    });
    console.log(yearRange[0] , yearRange[1])
    setFilteredData(finalFilteredRows);
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

  // Prepare data for the bar chart
  const chartData = () => {
    // Generate labels based on the filtered year range
    let allLabels;
    if (xAxisDimension === 'year') {
      allLabels = Array.from({ length: sliderValue[1] - sliderValue[0] + 1 }, (_, i) => sliderValue[0] + i);
    } else if (xAxisDimension === 'year_month') {
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
      const dimensionValue = row[xAxisDimension]; // Use the selected dimension (year or year_month)
      acc[dimensionValue] = (acc[dimensionValue] || 0) + 1; // Count occurrences of each dimension value
      return acc;
    }, {});

    // Sort labels in ascending order
    const sortedLabels = allLabels.sort((a, b) => new Date(a) - new Date(b));

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
  };
  
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>SpaceX Launch Data</h1>
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
                  filterData(selectedRockets, isAllSelected, newValue); // Pass the new year range
                }}
                valueLabelDisplay="auto"
                min={minYear}
                max={maxYear}
                step={1}
                marks 
              />
          </div>

          {/* Filter Button */}
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
                  minWidth:'150px',
                  marginTop:'5px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => handleFilterRocket('All')} style={{ padding:'10px', width:'100%', textAlign:'left' }}>
                  <input type="checkbox" checked={isAllSelected} onChange={() => handleFilterRocket('All')} style={{ marginRight:'10px' }} />
                  All
                </button>
                {uniqueRockets.map((rocket, index) => (
                  <label key={index} style={{ display:'block', padding:'8px', cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRockets.includes(rocket)}
                      onChange={() => handleFilterRocket(rocket)}
                      style={{ marginRight:'10px' }}
                    />
                    {rocket}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Bar Graph */}
          <Bar 
            data={chartData()} 
            options={{
              responsive:true,
              scales:{
                yAxes:[{
                  ticks:{
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