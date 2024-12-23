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
    { originalName: 'date_time', displayName: 'Date', visible: true },
    { originalName: 'configuration_name', displayName: 'Rocket', visible: true },
    { originalName: 'status_abbrev', displayName: 'Status', visible: false },
    { originalName: 'pad_name', displayName: 'Pad', visible: true },
    { originalName: 'mission_name', displayName: 'Mission', visible: true },
    { originalName: 'mission_orbit_abbrev', displayName: 'Orbit', visible: true },
    { originalName: 'launcher_serial_number', displayName: 'Booster', visible: true },
    { originalName: 'landing_location_abbrev', displayName: 'Location', visible: true },
    { originalName: 'landing_type_abbrev', displayName: 'Landing Type', visible: false },
    { originalName: 'landing_attempt', displayName: 'Landing Attempt', visible: false },
    { originalName: 'landing_success', displayName: 'Landing Success', visible: false },
    { originalName: 'starlink_commercial', displayName: 'Starlink / Commercial', visible: false },
  ];

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const classButtonContainer = "relative max-w-[250px]";
  const classButtons = "min-w-full max-w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-3xl shadow-md hover:bg-gray-100 sm:px-3 sm:py-2 sm:text-sm";
  const classDropdown = "absolute z-10 w-auto min-w-full mt-1 bg-white border border-gray-300 rounded-3xl shadow-lg max-h-[300px] overflow-y-auto overflow-x-hidden";
  const classDropdownLabel = "flex items-center px-3 py-2 text-sm text-black cursor-pointer hover:bg-gray-100 sm:px-4 sm:py-3 sm:text-base lg:px-3 lg:py-2 lg:text-sm";

  // Render dropdown for a filter
  const renderFilterDropdown = (filter, index) => (
    <div key={filter.key} className={classButtonContainer}>
      <button
        onClick={() => {
          const updatedFilters = [...dynamicFilters];
          updatedFilters[index].showDropdown = !updatedFilters[index].showDropdown;
          setDynamicFilters(updatedFilters);
        }}
        className={classButtons}
      >
        {getFilterButtonLabel(filter)}
        <span className="ml-2">▼</span>
      </button>
      {filter.showDropdown && (
        <div
          className={classDropdown}
          onClick={(e) => e.stopPropagation()}
        >
          <label
            className={classDropdownLabel}
          >
            <input 
              type="checkbox" 
              checked={filter.isAllSelected} 
              onChange={() => handleFilter(filter.key, 'All')}
              className="mr-2"
            />
            All
          </label>
          {filter.uniqueValues.map((value, valueIndex) => (
            <label 
              key={valueIndex} 
              className={classDropdownLabel}
            >
              <input
                type="checkbox"
                checked={filter.selected.includes(value)}
                onChange={() => handleFilter(filter.key, value)}
                className="mr-2"
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
      className="pt-[70px] min-h-[calc(100vh-80px)] bg-cover bg-center bg-no-repeat bg-fixed text-white overflow-auto"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${backgroundImage})`
      }}
    >
      <div className="w-full px-2 md:w-[95%] lg:w-[90%] xl:w-[80%] mx-auto my-5">
        {/* All selectors Filters */}
        <div className="bg-white/60 rounded-3xl p-1 sm:p-2 md:p-3 lg:p-4 mb-5 shadow-md">
          {/* First Row: Year Range Slider and Dynamic Filters */}
          <div className="flex flex-nowrap items-center mb-4 w-full max-h-[80px]">
            <div className="flex-1 max-w-[250px] pr-2">
              <div className="min-w-full max-w-full h-10 px-5 text-sm text-black bg-white border border-gray-300 rounded-3xl shadow-md hover:bg-gray-100">
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
                  color='black'
                />
              </div>
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
            {/* Dimension Selector */}
            <div className={classButtonContainer}>
              <button
                onClick={() => setShowDropdownDimension(!showDropdownDimension)}
                className={classButtons}
              >
                {getDimensionLabel()}
                <span>▼</span>
              </button>
              {showDropdownDimension && (
                <div
                  className={classDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  {dimensionOptions.map((dim, index) => (
                    <label 
                      key={index} 
                      className={classDropdownLabel}
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
            <div className={classButtonContainer}>
              <button
                onClick={() => setShowDropdownChartView(!showDropdownChartView)}
                className={classButtons}
              >
                {getChartViewLabel()}
                <span>▼</span>
              </button>
              {showDropdownChartView && (
                <div
                  className={classDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  {chartViewOptions.map((option, index) => (
                    <label 
                      key={index} 
                      className={classDropdownLabel}
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
        <div className="bg-white/60 rounded-3xl p-1 sm:p-2 md:p-3 lg:p-4 mb-5 shadow-md h-[400px] md:h-[400px] sm:h-auto">
          <Bar 
            data={chartData()} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  stacked: selectedChartView !== 'total',
                  ticks: {
                    color: 'black', // Change text color to black
                    font: {
                      size: 12,
                      family: "'Arial', sans-serif"
                    }
                  },
                },
                y: {
                  stacked: selectedChartView !== 'total', // Add this for stacking on y-axis
                  beginAtZero: true, // Optional, ensures bars start from zero
                  ticks: {
                    color: 'black',
                    font: {
                      size: 12,
                      family: "'Arial', sans-serif"
                    }
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
        <div className="bg-white/60 rounded-3xl p-1 sm:p-2 md:p-3 lg:p-4 mb-5 shadow-md overflow-auto">
          <table className="w-full border border-gray-300 rounded-3xl overflow-hidden">
            <thead>
              {/* Main category headers */}
              <tr className="bg-gray-600">
                <th colSpan={windowWidth < 600 ? 3 : 5} className="border border-gray-300 p-2 text-center text-white text-xs sm:text-sm col-span-3 sm:col-span-5">Launches</th>
                <th colSpan={2} className="border border-gray-300 p-2 text-center text-white text-xs sm:text-sm">Landings</th>
              </tr>
              {/* Specific column headers */}
              <tr className="bg-gray-500">
                {columnConfigs.filter(config => config.visible).map((col, index) => (
                  <th 
                    key={index} 
                    className={`border border-gray-300 p-2 text-left text-white text-xs sm:text-sm ${col.originalName === 'mission_orbit_abbrev' || col.originalName === 'pad_name' ? 'hidden sm:table-cell' : ''}`}
                  >
                    {col.displayName}
                  </th>
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
                      if (columnName === 'mission_name') {
                        if (row['status_abbrev'] === 'Failure') return '#bf0000'; // Red for failure
                        return '#66ba00'; // Green for success or other cases
                      }

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
                        return '#bf0000'; // Red for failed landing attempt
                        
                      }
                      return 'transparent';
                    };

                    return (
                      <td key={columnName} className={`border border-gray-600 p-1 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] break-words whitespace-normal ${columnName === 'mission_orbit_abbrev' || columnName === 'pad_name' ? 'hidden sm:table-cell' : ''}`}>
                        <div className="w-full h-full break-words whitespace-normal">
                          {isMultiValueColumn ? (
                            <div className="flex flex-col gap-0 h-full">
                              {cellValues.map((val, valIndex) => (
                                <div 
                                  key={valIndex} 
                                  className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm"
                                  style={{ backgroundColor: getCellColor(val) }}
                                >
                                  {val || ''}
                                </div>
                              ))}
                            </div>
                          ) : (columnName === 'mission_name' ? (
                            <div 
                              className="flex flex-col gap-0 h-full text-xs sm:text-sm"
                              style={{ backgroundColor: getCellColor(row[columnName]) }}
                            >
                              {row[columnName] || ''}
                            </div>
                          ) : (
                            <div 
                              className="w-full h-full text-xs sm:text-sm"
                              style={{ backgroundColor: 'transparent' }}
                            >
                              {row[columnName] || ''}
                            </div>
                          ))}
                        </div>
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