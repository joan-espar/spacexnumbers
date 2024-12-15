// src/Tab4.js
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
import backgroundImage from './../assets/space_background_1.jpg'; // Ensure you have this image

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Analytics() {

  // Configuration for dynamic filters
  const filterConfigs = [
    {
      key: 'configuration_name', 
      label: 'Rocket', 
      accessor: row => row.configuration_name
    },
    {
      key: 'starlink_commercial', 
      label: 'Starlink', 
      accessor: row => row.starlink_commercial
    },
    {
      key: 'pad_name', 
      label: 'Pad', 
      accessor: row => row.pad_name
    } 
  ];

  const dimensionOptions = ['year', 'year_month'];

  const chartViewOptions = [ 
    { value: 'total', label: 'Total' },
    { value: 'pad_name', label: 'Launch Pad' },
    { value: 'mission_orbit_abbrev', label: 'Orbit' },
    { value: 'starlink_commercial', label: 'Starlink / Com.' },
  ];

  // State for dynamic filters
  const [dynamicFilters, setDynamicFilters] = useState(
    filterConfigs.map(config => ({
      key: config.key,
      label: config.label,
      selected: [],
      isAllSelected: true,
      showDropdown: false,
      uniqueValues: []
    }))
  );
  
  const [selectedChartView, setSelectedChartView] = useState(chartViewOptions[0].value);
  const [showDropdownChartView, setShowDropdownChartView] = useState(false);

  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  
  const [selectedDimension, setSelectedDimension] = useState(dimensionOptions[0]);
  const [showDropdownDimension, setShowDropdownDimension] = useState(false);

  const [minYear, setMinYear] = useState(0);
  const [maxYear, setMaxYear] = useState(0);
  const [sliderValue, setSliderValue] = useState([0, 0]); // Range for the slider

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
    { originalName: 'starlink_commercial', displayName: 'Starlink / Commercial', visible: false },
  ];


  // Read data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('data/table_launch_1.csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const cleanedData = results.data.filter(row => Object.values(row).some(value => value !== ''));
            setCsvData(cleanedData);
            setFilteredData(cleanedData);
            
            // Determine min and max years
            const years = cleanedData.map(row => new Date(row.net).getFullYear());
            const min = Math.min(...years);
            const max = Math.max(...years);
  
            setMinYear(min);
            setMaxYear(max);
            setSliderValue([min, max]);
  
            // Update dynamic filters with unique values
            const updatedFilters = filterConfigs.map(config => ({
              key: config.key,
              label: config.label,
              selected: [...new Set(cleanedData.map(config.accessor))],
              isAllSelected: true,
              showDropdown: false,
              uniqueValues: [...new Set(cleanedData.map(config.accessor))]
            }));
            setDynamicFilters(updatedFilters);
            // console.log(updatedFilters)
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

  const handleFilter = (filterKey, value) => {
    setDynamicFilters(prevFilters => {
      const updatedFilters = prevFilters.map(filter => {
        if (filter.key !== filterKey) return filter;
  
        let newSelected;
        let newIsAllSelected;
  
        if (value === 'All') {
          // Toggle between all and none
          newIsAllSelected = !filter.isAllSelected;
          newSelected = newIsAllSelected ? [...filter.uniqueValues] : [];
        } else {
          // Create a copy of current selected values
          newSelected = [...filter.selected];
          
          // Toggle the specific value
          if (newSelected.includes(value)) {
            newSelected = newSelected.filter(item => item !== value);
          } else {
            newSelected.push(value);
          }
  
          // Update "All" selection status
          newIsAllSelected = newSelected.length === filter.uniqueValues.length;
        }
  
        return {
          ...filter,
          selected: newSelected,
          isAllSelected: newIsAllSelected
        };
      });
  
      // Here we've updated the filters, now apply them
      applyFilters(updatedFilters, sliderValue);  // Pass the new state to applyFilters
  
      return updatedFilters;  // Return the new state
    });
  };
  
  // Modify applyFilters to accept the new filters directly
  const applyFilters = (newFilters = dynamicFilters, newSliderValue = sliderValue) => {
    // console.log(newFilters)
    const filtered = csvData.filter(row => {
      // Check dynamic filters
      const passedDynamicFilters = newFilters.every(filter => {
        // Find the corresponding config to get the correct accessor
        const config = filterConfigs.find(config => config.key === filter.key);
        
        // If no config found, return true (don't filter)
        if (!config) return true;
  
        // Check if the filter passes:
        // - Either all values are selected (isAllSelected is true)
        // - OR the row's value is in the selected values
        return filter.isAllSelected || 
               filter.selected.includes(config.accessor(row));
      });
  
      // Add time filter
      const year = new Date(row.net).getFullYear();
      const passedTimeFilter = 
        year >= newSliderValue[0] && year <= newSliderValue[1];

      return passedDynamicFilters && passedTimeFilter;
    });
  
    setFilteredData(filtered);
  };
  
  // Modify the filterTime function to ensure it triggers filter application
  const filterTime = (newSliderValue) => {
    // Update the slider value state
    setSliderValue(newSliderValue);
    // Reapply all existing filters including the new time filter
    applyFilters(dynamicFilters, newSliderValue);
  };

  // Get button label for a filter
  const getFilterButtonLabel = (filter) => {
    if (filter.isAllSelected) {
      return `${filter.label}: All`;
    } else if (filter.selected.length === 0) {
      return `${filter.label}: None`;
    } else if (filter.selected.length === 1) {
      return `${filter.label}: ${filter.selected[0]}`;
    } else {
      return `${filter.label}: Multiple`;
    }
  };

  const classButtons = "px-4 py-2 rounded-3xl bg-black/10 text-black border border-black w-56 flex justify-between items-center";

  const classDropdown = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 1)', 
    borderRadius: '20px',  // Tailwind's way for fully rounded corners
    border: '1px solid grey',
    zIndex: 1,
    minWidth: '14rem',  // Equivalent to w-56 in Tailwind
    maxHeight: '400px',  // To prevent dropdown from getting too large
    overflowY: 'auto',  // Scroll if content exceeds max height
    padding: '0.5rem',  // px-4 in Tailwind
    margin: '0.5rem 0 0 0',  // Adjust margin-top for spacing
    display: 'flex',
    flexDirection: 'column', // To stack elements vertically
  }
  
  const classDropdownLabel = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',  // py-2 px-4 in Tailwind
    cursor: 'pointer',
    color: 'black',  // text-white
  }

  // Render dropdown for a filter
  const renderFilterDropdown = (filter, index) => (
    <div key={filter.key} style={{ position: 'relative' }} className="max-w-[250px]">
      <button
        onClick={() => {
          const updatedFilters = [...dynamicFilters];
          updatedFilters[index].showDropdown = !updatedFilters[index].showDropdown;
          setDynamicFilters(updatedFilters);
        }}
        className={classButtons}
      >
        {getFilterButtonLabel(filter)}
        <span style={{ marginLeft: '10px' }}>▼</span>
      </button>
      {filter.showDropdown && (
        <div
          style={classDropdown}
          onClick={(e) => e.stopPropagation()}
        >
          <label
            style={classDropdownLabel}
          >
            <input 
              type="checkbox" 
              checked={filter.isAllSelected} 
              onChange={() => handleFilter(filter.key, 'All')}
              style={{ marginRight: '0.5rem' }}  // Space to the right of the checkbox
            />
            All
          </label>
          {filter.uniqueValues.map((value, valueIndex) => (
            <label 
              key={valueIndex} 
              style={classDropdownLabel}
            >
              <input
                type="checkbox"
                checked={filter.selected.includes(value)}
                onChange={() => handleFilter(filter.key, value)}
                style={{ marginRight: '0.5rem' }}  // Space to the right of the checkbox
              />
              {value}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const visibleColumns = columnConfigs.filter(config => config.visible);
  const columnNames = visibleColumns.map(config => config.originalName);
  
  const getDimensionLabel = () => {
    if (selectedDimension === 'year') {
      return 'Year';
    } else if (selectedDimension === 'year_month') {
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

    // Sort labels in ascending order
    const sortedLabels = allLabels.sort((a, b) => new Date(a) - new Date(b));

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
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderColor: 'rgba(0,0,0,0.5)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // Grouped view (pad or orbit)
      // Get unique groups
      const uniqueGroups = [...new Set(filteredData.map(row => row[selectedChartView]))];

      // Count launches per dimension and group
      const groupedCounts = filteredData.reduce((acc, row) => {
        const dimensionValue = row[selectedDimension];
        const groupName = row[selectedChartView];
        
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
        backgroundColor: `rgba(${index * 30}, ${index * 30}, ${index * 30}, 0.6)`,
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
    <div 
      style={{ 
        paddingTop: '70px', 
        minHeight: 'calc(100vh - 80px)', 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${backgroundImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'fixed', 
        color: 'white'
      }}
    >
      <div style={{ width: '80%', margin: '20px auto' }}>
        {/* All selectors Filters */}
        <div className="bg-white/60 rounded-3xl p-5 mb-5 shadow-md h-[170px]">
          {/* First Row: Year Range Slider and Dynamic Filters */}
          <div className="flex flex-nowrap items-center mb-4 w-full max-h-[80px]">
            <div className="pl-4 pr-6 flex-1 max-w-[150px]">
              <h1 className="text-2xl font-bold mb-6 text-black tracking-tight">
                Filter By: 
              </h1>
            </div>
            <div className="pl-4 pr-6 flex-1 max-w-[250px]">
              <label className="block mb-2 text-black">Year Range: {sliderValue[0]} - {sliderValue[1]}</label>
              <Slider
                value={sliderValue}
                onChange={(event, newValue) => {
                  setSliderValue(newValue);
                  filterTime(newValue);
                }}
                valueLabelDisplay="auto"
                min={minYear}
                max={maxYear}
                step={1}
                marks 
                className="w-full text-black"
                color='black'
              />
            </div>
            {/* Dynamic Filters */}
            <div className="flex-1">
              <div className="flex gap-2 relative">
                {dynamicFilters.map(renderFilterDropdown)}
              </div>
            </div>
          </div>
          {/* Second Row: Dimension and Chart View Selectors */}
          <div className="flex gap-2 w-full">
            <div className="pl-4 pr-6 flex-1 max-w-[150px]">
              <h1 className="text-2xl font-bold mb-6 text-black tracking-tight">
                X Axis: 
              </h1>
            </div>
            {/* Dimension Selector */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowDropdownDimension(!showDropdownDimension)}
                className={classButtons}
              >
                {getDimensionLabel()}
                <span>▼</span>
              </button>
              {showDropdownDimension && (
                <div
                  style={classDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  {dimensionOptions.map((dim, index) => (
                    <label 
                      key={index} 
                      style={classDropdownLabel}
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
            <div className="pl-4 pr-6 flex-1 max-w-[150px]">
              <h1 className="text-2xl font-bold mb-6 text-black tracking-tight">
                Bar by: 
              </h1>
            </div>
            <div className="relative flex-1">
              <button
                onClick={() => setShowDropdownChartView(!showDropdownChartView)}
                className={classButtons}
              >
                {getChartViewLabel()}
                <span>▼</span>
              </button>
              {showDropdownChartView && (
                <div
                  style={classDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  {chartViewOptions.map((option, index) => (
                    <label 
                      key={index} 
                      style={classDropdownLabel}
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
          </div>
        </div>
        {/* Bar Graph */}
        <div className="bg-white/60 rounded-3xl p-5 mb-5 shadow-md h-[400px]">
        <Bar 
          data={chartData()} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                stacked: selectedChartView !== 'total',
                ticks: {
                  beginAtZero: true,
                  color: 'black', // Change text color to black
                  font: {
                    size: 12, // Increase or decrease font size
                    family: "'Arial', sans-serif" // Change font family
                  }
                },
                title: {
                  display: true,
                  text: 'Launches', 
                  color: 'black',
                  font: {
                    size: 20,
                    style: 'italic'
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)', // Change grid line color with opacity
                  borderColor: 'rgba(0, 0, 0, 0.1)', // Color for the border around the chart area
                }
              },
              x: {
                stacked: selectedChartView !== 'total',
                ticks: {
                  color: 'black', // Change text color to black
                  font: {
                    size: 12,
                    family: "'Arial', sans-serif"
                  }
                },
                title: {
                  display: true,
                  text: selectedDimension == 'year' ? 'Year' : 'Month',
                  color: 'black',
                  font: {
                    size: 20,
                    style: 'italic'
                  }
                },
                grid: {
                  display: false // Hide the grid lines if you want
                }
              }
            },
            plugins: {
              legend: {
                display: selectedChartView !== 'total',
                labels: {
                  color: 'black', // Legend text color
                  font: {
                    size: 12,
                    family: "'Arial', sans-serif"
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker tooltip background
                titleFont: {
                  size: 14
                },
                bodyFont: {
                  size: 12
                },
                borderColor: 'rgba(255, 255, 255, 0.2)', // Border for tooltip
                borderWidth: 1
              },
              title: {
                display: true,
                text: 'Launches by ' + (selectedDimension == 'year' ? 'Year' : 'Month') ,
                color: 'black',
                font: {
                  size: 20,
                  weight: 'bold'
                }
              }
            }
          }} 
        />
        </div>
        {/* Data Table */}
        <div className="bg-white/60 rounded-3xl p-5 mb-5 shadow-md overflow-hidden">
          <table className="w-full border border-gray-300 rounded-3xl overflow-hidden">
            <thead>
              {/* Main category headers */}
              <tr className="bg-gray-600">
                <th colSpan={6} className="border border-gray-300 p-2 text-center text-white">Launches</th>
                <th colSpan={3} className="border border-gray-300 p-2 text-center text-white">Landings</th>
              </tr>
              {/* Specific column headers */}
              <tr className="bg-gray-500">
                {columnConfigs.filter(config => config.visible).map((col, index) => (
                  <th key={index} className="border border-gray-300 p-2 text-left text-white">{col.displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-black/30" : "bg-black/40"}>
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

                        if (!landingAttempt) return '#707070'; // Grey for no attempt
                        if (landingSuccess) return '#66ba00'; // Green for successful landing
                        return '#bf0000'; // Tomato red for failed landing attempt
                      }
                      return 'transparent';
                    };

                    return (
                      <td key={columnName} className="border border-gray-600 p-2">
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
                              backgroundColor: 'transparent'
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
      </div>
    </div>
  );
}

export default Analytics;