import React from 'react';

const columnConfigs = [
  { originalName: 'net', displayName: 'Date and Time', visible: true },
  // ... other column configurations
];

function DataTable({ data }) {
  const visibleColumns = columnConfigs.filter(config => config.visible);
  const columnNames = visibleColumns.map(config => config.originalName);

  const getCellColor = (row, columnName, value) => {
    // This function was simplified for this example. Adjust according to your needs.
    return 'transparent';
  };

  return (
    <table style={{
      borderCollapse: 'separate',
      borderSpacing: '0',
      width: '100%',
      border: '1px solid #ddd'
    }}>
      <thead>
        <tr style={{ backgroundColor: '#f0f0f0', border: 'none' }}>
          <th colSpan={7} style={{ /* th styles */ }}>Launches</th>
          <th colSpan={3} style={{ /* th styles */ }}>Landings</th>
        </tr>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          {columnConfigs.map((col, index) => (
            <th key={index} style={{ /* th styles */ }}>{col.displayName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
            {columnNames.map((columnName) => {
              const isMultiValueColumn = ['launcher_serial_number', 'landing_location_abbrev', 'landing_type_abbrev'].includes(columnName);
              const cellValues = isMultiValueColumn 
                ? (row[columnName] || '').split(',').map(val => val.trim()) 
                : [row[columnName]];

              return (
                <td key={columnName} style={{ /* td styles */ }}>
                  {isMultiValueColumn ? (
                    cellValues.map((val, valIndex) => (
                      <div key={valIndex} style={{ backgroundColor: getCellColor(row, columnName, val) }}>{val || 'N/A'}</div>
                    ))
                  ) : (
                    row[columnName] || 'N/A'
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;