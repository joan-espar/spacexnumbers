import React from 'react';
import { Bar } from 'react-chartjs-2';

function ChartDisplay({ filteredData, filterState }) {
  const chartData = () => {
    let allLabels;
    if (filterState.selectedDimension === 'year') {
      allLabels = Array.from({ length: filterState.sliderValue[1] - filterState.sliderValue[0] + 1 }, (_, i) => filterState.sliderValue[0] + i);
    } else {
      const startYear = filterState.sliderValue[0];
      const endYear = filterState.sliderValue[1];
      allLabels = [];
      for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
          allLabels.push(`${year}-${String(month).padStart(2, '0')}`);
        }
      }
    }

    const counts = filteredData.reduce((acc, row) => {
      const value = row[filterState.selectedDimension];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    const sortedLabels = allLabels.sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: sortedLabels,
      datasets: [{
        label: 'Launch Count',
        data: sortedLabels.map(label => counts[label] || 0),
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      }],
    };
  };

  return (
    <Bar 
      data={chartData()} 
      options={{
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }} 
    />
  );
}

export default ChartDisplay;