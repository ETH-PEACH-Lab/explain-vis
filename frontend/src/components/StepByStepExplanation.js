import React, { useState }  from 'react';
import Pagination from '@mui/material';
import HighlightWithDropdown from './HighlightWithDropdown';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import SortIcon from '@mui/icons-material/Sort';
import { Scatter, Bar,Line,Pie } from 'react-chartjs-2';
import './styles/stepByStepExplanation.css';
import 'chartjs-adapter-date-fns'; 
import DraggableNumber from './DraggableNumber';
import RangeSlider from './RangeSlider';

function StepByStepExplanation({ explanation, tableData, showVQL, currentPage, onPrevPage, onNextPage }) {
  const [editedCell, setEditedCell] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [tableDataState, setTableDataState] = useState(tableData);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [fromTable, setFromTable] = useState(null); 
  const [joinfindTable1, setJoinfindTable1] = useState('price'); 
  const [joinfindTable2, setJoinfindTable2] = useState('name'); 
  const [joinfindColumn1, setJoinfindColumn1] = useState('id'); 
  const [joinfindColumn2, setJoinfindColumn2] = useState('id'); 
  const [wordReplacements, setWordReplacements] = useState({});
  const [joinTableResults, setJoinTableResults] = useState(null);
  const [joinColumnResults, setJoinColumnResults] = useState(null);
  const [ErrorMessage, setErrorMessage] = useState(null);

  if (!tableData || !tableData.tables) {
    return <Typography variant="body2" color="error">No table data available</Typography>;
  }
  
  const dataTables = Object.keys(tableData.tables).reduce((acc, key) => {
    acc[key] = tableData.tables[key].map((row) => {
      const date = new Date(row.date);
      return {
        ...row,
        // date: !isNaN(date) ? date.toISOString().split('T')[0] : row.date, // 格式化为 YYYY-MM-DD
      };
    });
    return acc;
  }, {});

  const formatVQLLine = (line) => {
    return line.split('').map((char, index) => {
      if (char >= 'A' && char <= 'Z') {
        return <span key={index} className="uppercase-char">{char}</span>;
      } else if (char >= '0' && char <= '9') {
        return <span key={index} className="number-char">{char}</span>;
      } else {
        return <span key={index}>{char}</span>;
      }
    });
  };

  const renderTable = (data, columns, tableName, selectedColumns = [], borderColumns = [], fullHighlightColumns = []) => {
    selectedColumns = selectedColumns || [];
    borderColumns = borderColumns || [];
    fullHighlightColumns = fullHighlightColumns || [];

    return (
      <div className="table-section">
        <TableContainer component={Paper} className="table-container">
          <Table size="small" aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    className={`${fullHighlightColumns.includes(column) ? "full-highlight-column" : ""}`}
                    style={{
                      fontWeight: fullHighlightColumns.includes(column) ? "bold" : "normal",
                      backgroundColor: selectedColumns.includes(column) ? "#d4edda" : "transparent",
                      color: selectedColumns.includes(column) ? "#155724" : "inherit",
                      borderTop: borderColumns.includes(column)  ? "2px solid #155724" : "",
                      borderBottom: borderColumns.includes(column)  ? "" : "",
                      borderLeft: borderColumns.includes(column)? "2px solid #155724" : "none",
                      borderRight: borderColumns.includes(column) ? "2px solid #155724" : "none",
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={`${rowIndex}-${column}`}
                      className={`${fullHighlightColumns.includes(column) ? "full-highlight-column" : ""}`}
                      style={{
                        fontWeight: fullHighlightColumns.includes(column) ? "normal" : "normal",
                        backgroundColor: selectedColumns.includes(column)&&! borderColumns.includes(column) ? "#d4edda" : "transparent",
                        color: selectedColumns.includes(column) ? "#155724" : "inherit",
                        borderTop: borderColumns.includes(column) ? "" : "",
                        borderBottom: borderColumns.includes(column) &&rowIndex === data.length - 1 ? "2px solid #155724" : "",
                        borderLeft: borderColumns.includes(column)  ? "2px solid #155724" : "none",
                        borderRight: borderColumns.includes(column)  ? "2px solid #155724" : "none",
                      }}
                    >
                      {/* {column === 'date' && row[column] ? new Date(row[column]).toISOString().split('T')[0] : row[column]} */}
                      {row[column] }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };
  // const renderTable = (data, columns, tableName, selectedColumns = [], borderColumns = [], fullHighlightColumns = []) => {
  //   selectedColumns = selectedColumns || [];
  //   borderColumns = borderColumns || [];
  //   fullHighlightColumns = fullHighlightColumns || [];

  //   const sortedData = sortData(data, sortConfig);

  //   return (
  //     <div className="table-section">
  //       <TableContainer component={Paper} className="table-container">
  //         <Table size="small" aria-label="simple table">
  //           <TableHead>
  //             <TableRow>
  //               {columns.map((column) => (
  //                 <TableCell
  //                   key={column}
  //                   className={`${fullHighlightColumns.includes(column) ? "full-highlight-column" : ""}`}
  //                   style={{
  //                     fontWeight: fullHighlightColumns.includes(column) ? "bold" : "normal",
  //                     backgroundColor: selectedColumns.includes(column) ? "#d4edda" : "transparent",
  //                     color: selectedColumns.includes(column) ? "#155724" : "inherit",
  //                     borderTop: borderColumns.includes(column)  ? "2px solid #155724" : "",
  //                     borderBottom: borderColumns.includes(column)  ? "" : "",
  //                     borderLeft: borderColumns.includes(column)? "2px solid #155724" : "none",
  //                     borderRight: borderColumns.includes(column) ? "2px solid #155724" : "none",
  //                   }}
  //                   onMouseEnter={() => setHoveredColumn(column)}
  //                   onMouseLeave={() => setHoveredColumn(null)}
  //                 >
  //                   {column}
  //                   <IconButton size="small" onClick={() => handleSort(column)}>
  //                     <SortIcon />
  //                   </IconButton>
  //                 </TableCell>
  //               ))}
  //             </TableRow>
  //           </TableHead>
  //           <TableBody>
  //             {sortedData.map((row, rowIndex) => (
  //               <TableRow key={rowIndex}>
  //                 {columns.map((column) => (
  //                   <TableCell
  //                     key={`${rowIndex}-${column}`}
  //                     className={`${fullHighlightColumns.includes(column) ? "full-highlight-column" : ""}`}
  //                     style={{
  //                       fontWeight: fullHighlightColumns.includes(column) ? "normal" : "normal",
  //                       backgroundColor: selectedColumns.includes(column)&&! borderColumns.includes(column) ? "#d4edda" : "transparent",
  //                       color: selectedColumns.includes(column) ? "#155724" : "inherit",
  //                       borderTop: borderColumns.includes(column) ? "" : "",
  //                       borderBottom: borderColumns.includes(column) &&rowIndex === data.length - 1 ? "2px solid #155724" : "",
  //                       borderLeft: borderColumns.includes(column)  ? "2px solid #155724" : "none",
  //                       borderRight: borderColumns.includes(column)  ? "2px solid #155724" : "none",
  //                       backgroundColor: hoveredColumn === column ? "#e0f7fa" : "transparent", // 添加高亮效果
  //                     }}
  //                     onMouseEnter={() => handleEdit(rowIndex, column)}
  //                   >
  //                     {editedCell && editedCell.rowIndex === rowIndex && editedCell.column === column ? (
  //                       <input
  //                         type="text"
  //                         value={row[column]}
  //                         onChange={(e) => {
  //                           const newData = [...data];
  //                           newData[rowIndex][column] = e.target.value;
  //                           setTableDataState({
  //                             ...tableDataState,
  //                             tables: {
  //                               ...tableDataState.tables,
  //                               [tableName]: newData,
  //                             },
  //                           });
  //                         }}
  //                       />
  //                     ) : (
  //                       row[column]
  //                     )}
  //                   </TableCell>
  //                 ))}
  //               </TableRow>
  //             ))}
  //           </TableBody>
  //         </Table>
  //       </TableContainer>
  //     </div>
  //   );
  // };

  const highlightTableNamesAndColumns = (description, tableNames = [], columnsToHighlight = [], numbersToHighlight = [], chartTypes = [], binByOptions = [], currentTableColumns = [], onChange) => {
    if (typeof description !== 'string') {
      return description;
    }
  
    const optionsForType = (type) => {
      switch (type) {
        case 'table':
          return tableNames;
        case 'column':
          return currentTableColumns;
        case 'number':
          return numbersToHighlight;
        case 'chartType':
          return ['bar', 'line', 'pie', 'scatter'];
        case 'binBy':
          return ['year', 'month', 'week', 'day', 'weekday', 'quarter'];
        default:
          return [];
      }
    };
  
    return description.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[.,]/g, '');
      const displayWord = wordReplacements[cleanWord] || cleanWord;
  
      if (tableNames.includes(cleanWord)) {
        return (
          <HighlightWithDropdown
            key={index}
            text={displayWord}
            options={optionsForType('table')}
            onChange={(newVal) => {onChange('table', cleanWord, newVal);
              setFromTable(newVal);
              // setDescription((prevDescription) =>
              //               prevDescription.replace(new RegExp(`\\b${cleanWord}\\b`), newVal)
              //           );
            }}
            className="highlight-table-name"
          />
        );
      }
  
      if (columnsToHighlight.includes(cleanWord)) {
        return (
          <HighlightWithDropdown
            key={index}
            text={cleanWord}
            options={optionsForType('column')}
            onChange={(newVal) => {
              onChange('column', cleanWord, newVal);
            }}
            className="highlight-join-column"
          />
        );
      }
  
      if (numbersToHighlight.includes(cleanWord)) {
        // return (
          // <HighlightWithDropdown
          //   key={index}
          //   text={cleanWord}
          //   options={optionsForType('number')}
          //   onChange={(newVal) => onChange('number', cleanWord, newVal)}
          //   className="highlight-number"
          // />
          return (
            <DraggableNumber
              key={index}
              initialNumber={parseFloat(cleanWord)}
              min={0}
              max={100000}
              step={1}
              onChange={(newVal) => onChange('number', cleanWord, newVal)}
            />
        );
      }
  
      if (chartTypes.includes(cleanWord)) {
        return (
          <HighlightWithDropdown
            key={index}
            text={cleanWord}
            options={optionsForType('chartType')}
            onChange={(newVal) => onChange('chartType', cleanWord, newVal)}
            className="highlight-chart-type"
          />
        );
      }
  
      if (binByOptions.includes(cleanWord)) {
        return (
          <HighlightWithDropdown
            key={index}
            text={cleanWord}
            options={optionsForType('binBy')}
            onChange={(newVal) => onChange('binBy', cleanWord, newVal)}
            className="highlight-bin-by"
          />
        );
      }
  
      return <span key={index}>{displayWord} </span>;
    });
  };
  const highlightJoinTableNamesAndColumns = (
    description,
    tableNames = [],
    joinTable1,
    joinTable2,
    joinColumn1,
    joinColumn2,
    dataTables = {},
    onChange,
) => {
    if (typeof description !== 'string') {
        return description;
    }
// 用于存储表名和列名的索引
const tableIndices = [];
const columnIndices = [];

// 先找出表名和列名的索引
description.split(' ').forEach((word, index) => {
  const cleanWord = word.replace(/[.,]/g, '');
  if (tableNames.includes(cleanWord)) {
    tableIndices.push(index);
  } else if (Object.keys(dataTables[joinTable1][0]).includes(cleanWord)) {
    columnIndices.push(index);
  } else if (Object.keys(dataTables[joinTable2][0]).includes(cleanWord)) {
    columnIndices.push(index);
  }
});

// 根据索引生成对应的下拉菜单组件
return (
  <>
    {description.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[.,]/g, '');
      const key = `${cleanWord}_${index}`;
      const displayWord = wordReplacements[key] || cleanWord;
      console.log('index',index)
    if (tableIndices.includes(index)) {
      const tableIndex = tableIndices.indexOf(index);
      
      return (
        <HighlightWithDropdown
          key={index}
          text={displayWord}
          options={tableNames}
          onChange={(newVal) => {
            setWordReplacements((prev) => ({
              ...prev,
              [key]: newVal,
            }));
            onChange('table', cleanWord, newVal);
            if (tableIndex === 0) setJoinfindTable1(newVal);
            if (tableIndex === 1) setJoinfindTable2(newVal);
          }}
          className="highlight-table-name"
        />
      );
    }

    if (columnIndices.includes(index)) {
      const columnIndex = columnIndices.indexOf(index);
      console.log('column1',joinfindColumn1)
      console.log('column2',joinfindColumn2)
      console.log('table1',joinfindTable1)
      console.log('table2',joinfindTable2)
      console.log('data',dataTables)
      const columnOptions =
        columnIndex === 0
          ? joinfindTable1
            ? Object.keys(dataTables[joinfindTable1][0])
            : Object.keys(dataTables[joinTable1][0])
          : joinfindTable2
          ? Object.keys(dataTables[joinfindTable2][0])
          : Object.keys(dataTables[joinTable2][0]);
          
      return (
        <HighlightWithDropdown
          key={index}
          text={displayWord}
          options={columnOptions}
          onChange={(newVal) => {
            setWordReplacements((prev) => ({
              ...prev,
              [key]: newVal,
            }));
            onChange('column', cleanWord, newVal);
            if (columnIndex === 0) setJoinfindColumn1(newVal);
            if (columnIndex === 1) setJoinfindColumn2(newVal);
          }}
          className="highlight-join-column"
        />
      );
    }

      return <span key={index}>{displayWord} </span>;
    })}
  </>
);
};
  
  
  
  const renderFilteredTable = (data, columns, condition, isFirstCondition = true) => {
    const highlightedRows = new Set();
    const fullHighlightColumns = new Set();
    const cellHighlights = {};

    let conditionString = condition.condition;
    if (!isFirstCondition) {
      conditionString = conditionString.replace(/^\s*\b(?:AND|OR)\b\s*/, '');
    }

    const match = conditionString.match(/(\b\w+\b)/g);
    if (match) {
      match.forEach(col => {
        if (columns.includes(col)) {
          fullHighlightColumns.add(col);
        }
      });
    }

    data.forEach((row, rowIndex) => {
      if (evaluateCondition(row, conditionString)) {
        highlightedRows.add(rowIndex);
        match.forEach(col => {
          if (columns.includes(col)) {
            if (!cellHighlights[rowIndex]) {
              cellHighlights[rowIndex] = {};
            }
            cellHighlights[rowIndex][col] = true;
          }
        });
      }
    });
    
    return (
      <TableContainer component={Paper} className="table-container">
        <Table size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  className={`${fullHighlightColumns.has(column) ? "full-highlight-column" : ""}`}
                  style={{
                    fontWeight: fullHighlightColumns.has(column) ? "bold" : "normal",
                    backgroundColor: fullHighlightColumns.has(column) ? "#d4edda" : "transparent",
                    color: fullHighlightColumns.has(column) ? "#155724" : "inherit",
                    borderTop: fullHighlightColumns.has(column) ? "2px solid #28a745" : "",
                    borderBottom: fullHighlightColumns.has(column) ? "2px solid #28a745" : "",
                    borderLeft: fullHighlightColumns.has(column) ? "2px solid #28a745" : "",
                    borderRight: fullHighlightColumns.has(column) ? "2px solid #28a745" : "",
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={highlightedRows.has(rowIndex) ? "highlight-row" : ""}
                style={{
                  border: highlightedRows.has(rowIndex) ? "2px solid #ffc107" : "",
                  backgroundColor: highlightedRows.has(rowIndex) ? "white" : "transparent",
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${rowIndex}-${column}`}
                    className={`${fullHighlightColumns.has(column) ? "full-highlight-column" : ""}`}
                    style={{
                      backgroundColor: cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "#f3f1bb" : "transparent",
                    borderTop: cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "2px solid #ffc107" : "",
                    borderBottom: cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "2px solid #ffc107" : "",
                    borderLeft: cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "2px solid #ffc107" : "none",
                    borderRight: cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "2px solid #ffc107" : "none",
                    border: fullHighlightColumns.has(column) ? "2px solid #28a745" : cellHighlights[rowIndex] && cellHighlights[rowIndex][column] ? "2px solid #ffc107" : ""                    }}
                  >
                    {row[column]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const evaluateCondition = (row, condition) => {
    try {
      const jsCondition = condition
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, 'row["$1"]'); 
      const conditionFunction = new Function('row', `return ${jsCondition};`);
      return conditionFunction(row);
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  };
  const renderGroupedTable = (data, columns, groupByColumn) => {
    const groupedData = data.reduce((acc, row) => {
      const key = row[groupByColumn];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {});
  
    const groupColors = {};
    Object.keys(groupedData).forEach((key, index) => {
    groupColors[key] = `hsla(${index * 360 / Object.keys(groupedData).length}, 100%, 75%, 0.3)`;
  });
  
    return (
      <TableContainer component={Paper} className="table-container">
        <Table size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  className={column === groupByColumn ? "highlight-group-column" : ""}
                  style={{
                    fontWeight: column === groupByColumn ? "bold" : "normal",
                    backgroundColor: column === groupByColumn ? "#d4edda" : "transparent",
                    color: column === groupByColumn ? "#155724" : "inherit",
                    borderTop: column === groupByColumn ? "2px solid #28a745" : "",
                    borderBottom: column === groupByColumn ? "2px solid #28a745" : "",
                    borderLeft: column === groupByColumn ? "2px solid #28a745" : "",
                    borderRight: column === groupByColumn ? "2px solid #28a745" : "",
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedData).map((key) => (
              groupedData[key].map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  style={{
                    backgroundColor: groupColors[key],
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>
                      {row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  const sortData = (data, orderByColumn, orderDirection = 'asc') => {
    return data.slice().sort((a, b) => {
      if (a[orderByColumn] < b[orderByColumn]) return orderDirection === 'asc' ? -1 : 1;
      if (a[orderByColumn] > b[orderByColumn]) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  const binData = (data, binBy, columnName) => {
  const binColumnName = `binBy_${binBy}`;
  const updatedData = data.map(row => {
    const date = new Date(row[columnName]);
    let binValue;

    switch (binBy) {
      case 'year':
        binValue = date.getFullYear();
        break;
      case 'month':
        binValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'week':
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        binValue = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
        break;
      case 'day':
        binValue = date.toISOString().split('T')[0];
        break;
      case 'weekday':
        binValue = date.toLocaleString('default', { weekday: 'long' });
        break;
      case 'quarter':
        binValue = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
        break;
      default:
        binValue = row[columnName];
    }

    return {
      ...row,
      [binColumnName]: binValue,
    };
  });

  return updatedData;
};
  const renderChart = (data, selectedColumns) => {
  if (!data || !selectedColumns || selectedColumns.length < 2) {
    return <Typography variant="body2" color="error">Insufficient data for chart</Typography>;
  }
  const isDate = value => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  };
  const firstValue = data[0][selectedColumns[0]];
  const xAxisType = isDate(firstValue) ? 'time' : 'category';

  return (
    <Scatter
      data={{
        datasets: [
          {
            label: 'Scatter Plot',
            data: data.map(row => {
              if (row[selectedColumns[0]] === undefined || row[selectedColumns[1]] === undefined) {
                console.error('Data contains undefined values for selected columns', row);
                return { x: null, y: null };
              }
              return {
                x: row[selectedColumns[0]],
                y: row[selectedColumns[1]],
              };
            }).filter(point => point.x !== null && point.y !== null),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      }}
      options={{
        scales: {
          x: {
            type: xAxisType,
            position: 'bottom',
            ...(xAxisType === 'time' && {
              time: {
                unit: 'month',
              },
            }),
            title: {
              display: true,
              text: selectedColumns[0],
            },
          },
          y: {
            title: {
              display: true,
              text: selectedColumns[1],
            },
          },
        },
      }}
    />
  );
  };
  const handleEditClick = (text) => {
    setEditingText(true);
    setEditedText(text);
  };
  const handleBlur = () => {
    setEditingText(false);
    console.log('Edited text:', editedText);
  };
  const handleEdit = (rowIndex, column) => {
    setEditedCell({ rowIndex, column });
  };
  const handleSort = (column) => {
    let direction = 'asc';
    if (sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: column, direction });
  };
  const handleHighlightChange = (type, oldValue, newValue) => {
    console.log(`Changed ${type} from ${oldValue} to ${newValue}`);
    setWordReplacements(prev => ({
        ...prev,
        [oldValue]: newValue
    }));

    const { mergedData, columns, error } = mergeTables(
        dataTables[joinfindTable1],
        dataTables[joinfindTable2],
        joinfindColumn1,
        joinfindColumn2
    );

    if (!error) {
        setJoinTableResults(mergedData);
        setJoinColumnResults(columns);
    } else {
        console.error(error);
        setErrorMessage(error);
    }
};
  const handleRangeChange = (newRange) => {
    console.log(`Range changed to: ${newRange}`);
  };
  const renderGroupedChart = (data, groupByColumn) => {
            const groupedData = data.reduce((acc, row) => {
              const key = row[groupByColumn];
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(row);
              return acc;
            }, {});
          
            const isDate = (value) => {
              const date = new Date(value);
              return !isNaN(date.getTime());
            };
          
            const firstValue = data[0][groupByColumn];
            const xAxisType = isDate(firstValue) ? 'time' : 'linear';
          
            const chartData = {
              datasets: Object.keys(groupedData).map((key, index) => ({
                label: key,
                data: groupedData[key].map(row => ({ x: row[selectedColumns[0]],
                  y: row[selectedColumns[1]], })), 
                backgroundColor: `hsla(${index * 360 / Object.keys(groupedData).length}, 100%, 75%, 0.5)`,
                pointRadius: 5, 
              })),
            };
          
            const chartOptions = {
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  // text: 'Grouped Data Scatter Chart',
                },
              },
              scales: {
                x: {
                  type: xAxisType,
                  title: {
                    display: true,
                    text: selectedColumns[0],
                  },
                  ...(xAxisType === 'time' && {
                    time: {
                      unit: 'month', 
                    },
                  }),
                },
                y: {
                  title: {
                    display: true,
                    text: selectedColumns[1],
                  },
                },
              },
            };
          
            return <Scatter data={chartData} options={chartOptions} />;
          };
  const mergeTables = (tableData1, tableData2, joinColumn1, joinColumn2) => {
    if (!tableData1 || !tableData2 || !joinColumn1 || !joinColumn2) {
        return { mergedData: [], error: 'Invalid parameters for merging tables' };
    }
    if (!Array.isArray(tableData1) || !Array.isArray(tableData2)) {
        return { mergedData: [], error: 'Invalid table data' };
    }

    const columns1 = Object.keys(tableData1[0]);
    const columns2 = Object.keys(tableData2[0]);

    // Check if join columns exist in respective tables
    if (!columns1.includes(joinColumn1) || !columns2.includes(joinColumn2)) {
        return { mergedData: [], error: 'Join columns do not exist in the respective tables' };
    }

    const merged = tableData1.map(row1 => {
        const matchedRow2 = tableData2.find(row2 => row1[joinColumn1] === row2[joinColumn2]);
        return matchedRow2 ? { ...row1, ...matchedRow2 } : null;
    }).filter(row => row !== null);

    if (merged.length === 0) {
        return { mergedData: [], error: 'No matching rows found for join operation' };
    }

    const mergedWithDateHandling = merged.map(row => ({
        ...row,
        date: row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString().split('T')[0] : row.date
    }));

    const mergedColumns = [...new Set([...columns1, ...columns2])];

    return { mergedData: mergedWithDateHandling, columns: mergedColumns, error: null };
};

          
  let selectedColumns = [];

  // Find the selected columns for default viz in all steps
  explanation.forEach(step => {
    if (step.operation === 'SELECT') {
      selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
    }
  });

  const renderStepContent = (step, steps) => {
    if (!step) {
      return <Typography variant="body2" color="error">No step data available</Typography>;
    }
    const tableNames = Object.keys(dataTables);

    let currentTable = [];
    let previousTable = [];
    let currentColumns = [];
    let previousColumns = [];
    let scatterData = {};
    let scatterData_order = {};
    let firstValue = '';
    let xAxisType = '';

    let tableData1, tableData2, joinColumn1, joinColumn2, tableName1, tableName2, columns1, columns2, groupByColumn;
    let orderDirection, orderByColumn, orderByParts, binColumnName, binBy;
    let ChartComponent, chartType;
    // Process all steps up to the current step
    steps.forEach(step => {
      previousTable = [...currentTable];
      previousColumns = [...currentColumns];
      switch (step.operation) {
        case 'FROM': {
          const tableName = step.clause.split(' ')[1];
          const tableData = dataTables[tableName];
          if (tableData) {
            currentTable = tableData;
            currentColumns = Object.keys(tableData[0]);
          }
          break;
        }
        case 'JOIN': {
          const joinClauseParts = step.clause.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
          if (joinClauseParts) {
            tableName1 = joinClauseParts[2];
            tableName2 = joinClauseParts[1];
            joinColumn1 = joinClauseParts[3];
            joinColumn2 = joinClauseParts[5];

            tableData1 = dataTables[tableName1];
            tableData2 = dataTables[tableName2];
            console.log('raw table1',tableData1)
            console.log('raw table2',tableData2)
            console.log('raw column1',joinColumn1)
            console.log('raw column2',joinColumn2)
            const { mergedData, columns, error } = mergeTables(tableData1, tableData2, joinColumn1, joinColumn2);
            currentTable = mergedData
            console.log('currenttable',currentTable)
            currentColumns = columns
            console.log('currentColumns',currentColumns)
          }
          break;
        }
      }
    });

    if (currentTable.length === 0 || currentColumns.length === 0) {
      return <Typography variant="body2" color="error">No data available to display</Typography>;
    }
    const parseCondition = (condition) => {
      const range = [0, 3000]; // default range, need to be limited by the selected column
    
      const match = condition.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        range[0] = parseInt(match[1], 10);
        range[1] = parseInt(match[2], 10);
      } else {
        const lowerMatch = condition.match(/>\s*(\d+)/);
        const upperMatch = condition.match(/<\s*(\d+)/);
    
        if (lowerMatch) {
          range[0] = parseInt(lowerMatch[1], 10);
        }
        if (upperMatch) {
          range[1] = parseInt(upperMatch[1], 10);
        }
      }
    
      return range;
    };
    
    scatterData = {
      datasets: [
        {
          label: 'Scatter Plot',
          data: currentTable.map(row => {
            if (row[selectedColumns[0]] === undefined || row[selectedColumns[1]] === undefined) {
              console.error('Data contains undefined values for selected columns', row);
              return { x: null, y: null };
            }
            return {
              x: row[selectedColumns[0]],
              y: row[selectedColumns[1]],
            };
          }).filter(point => point.x !== null && point.y !== null),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };

    const isDate = value => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    };

    firstValue = currentTable[0][selectedColumns[0]];
    xAxisType = isDate(firstValue) ? 'time' : 'category';

    // Now process the current step for rendering
    switch (step.operation) {
      case 'FROM': {
        
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(`${step.description}`, tableNames,[],[],[],[],[],handleHighlightChange)}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                {renderTable(fromTable ? dataTables[fromTable] : currentTable, fromTable ? Object.keys(dataTables[fromTable][0]) : currentColumns)} 
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                <Scatter
                  data={scatterData}
                  options={{
                    scales: {
                      x: {
                        type: xAxisType,
                        position: 'bottom',
                        ...(xAxisType === 'time' && {
                          time: {
                            unit: 'month',
                          },
                        }),
                        title: {
                          display: true,
                          text: selectedColumns[0],
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: selectedColumns[1]},
                      },
                    },
                  }}
                />
              </div>
              {showVQL && (
                <Card className="vql-card">
                <CardContent>
                  {editingText ? (
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onBlur={handleBlur}
                      autoFocus
                      style={{ width: '100%', fontSize: '1rem', border: 'none', outline: 'none' }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      className="vql-line"
                      onClick={() => handleEditClick(step.clause)}
                    >
                      {formatVQLLine(step.clause)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        );
      }
      case 'JOIN': {
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                  {highlightJoinTableNamesAndColumns(`Step ${step.step}. ${step.description}`, tableNames, tableName1, tableName2,joinColumn1, joinColumn2, dataTables, handleHighlightChange)}
                  </Typography>
                </div>
                <div className="table-row">
                <div className="table-column">
                      <div className="step-label">{`Table: ${joinfindTable1 || tableName1}`}</div>
                      {renderTable(joinfindTable1 ? dataTables[joinfindTable1] : tableData1, joinfindTable1 ? Object.keys(dataTables[joinfindTable1][0]) : Object.keys(tableData1[0]), joinfindTable1 || tableName1, [joinfindColumn1||joinColumn1], null, [joinfindColumn1||joinColumn1])}
                    </div>
                    <div className="arrow"></div>
                    <div className="table-column">
                      <div className="step-label">{`Table: ${joinfindTable2 || tableName2}`}</div>
                      {renderTable(joinfindTable2 ? dataTables[joinfindTable2] : tableData2, joinfindTable2 ? Object.keys(dataTables[joinfindTable2][0]) : Object.keys(tableData2[0]), joinfindTable2 || tableName2, [joinfindColumn2||joinColumn2], null, [joinfindColumn2||joinColumn2])}
                    </div>
                  </div>
                <div className="arrow-down"></div>
                <div className="table-row">
                  <div className="table-column">
                  <div className="step-label">{`data:: step${step.step}`}</div>
                  {ErrorMessage ? (
                    <Typography variant="body2" color="error">{ErrorMessage}</Typography>
                  ) : (renderTable(joinTableResults ? joinTableResults : currentTable, joinColumnResults ? joinColumnResults : currentColumns, 'Merged') 
                )}
                  </div>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                <Scatter
                  data={scatterData}
                  options={{
                    scales: {
                      x: {
                        type: xAxisType,
                        position: 'bottom',
                        ...(xAxisType === 'time' && {
                          time: {
                            unit: 'month',
                          },
                        }),
                        title: {
                          display: true,
                          text: selectedColumns[0],
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: selectedColumns[1]},
                      },
                    },
                  }}
                />
              </div>
              {showVQL && (
                <Card className="vql-card">
                <CardContent>
                  {editingText ? (
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onBlur={handleBlur}
                      autoFocus
                      style={{ width: '100%', fontSize: '1rem', border: 'none', outline: 'none' }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      className="vql-line"
                      onClick={() => handleEditClick(step.clause)}
                    >
                      {formatVQLLine(step.clause)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        );
      }
        return <Typography variant="body2" color="error">Unsupported operation: {step.operation}</Typography>;
    }
    
  };

  const currentSteps = explanation.slice(0, currentPage + 1);

  return (
    <div className="step-by-step-explanation">
      <div className="explanation-container">
        <Typography variant="h6" className="purple-text">/ Step-by-Step Explanations</Typography>
        {explanation && explanation.length > 0 ? renderStepContent(explanation[currentPage], currentSteps) : <Typography variant="body2">No explanations available</Typography>}
        <div className="pagination">
          <button onClick={onPrevPage} disabled={currentPage === 0}>← Previous step</button>
          <span>{currentPage + 1} / {explanation ? explanation.length : 0}</span>
          <button onClick={onNextPage} disabled={currentPage === explanation.length - 1}>Next step →</button>
        </div>
      </div>
    </div>
  );



}

export default StepByStepExplanation;
