import React, { useState, useEffect } from 'react';
import Pagination from '@mui/material/Pagination';
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
import { Scatter, Bar, Line, Pie } from 'react-chartjs-2';
import './styles/stepByStepExplanation.css';
import 'chartjs-adapter-date-fns';
import DraggableNumber from './DraggableNumber';
import RangeSlider from './RangeSlider';

const parseCondition = (condition) => {
  const range = [0, 3000];

  const combinedMatch = condition.match(/>\s*(\d+)\s*AND\s*<\s*(\d+)/i);
  if (combinedMatch) {
    console.log("Matched combined condition:", combinedMatch);
    range[0] = parseInt(combinedMatch[1], 10);
    range[1] = parseInt(combinedMatch[2], 10);
  } else {
    const match = condition.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      console.log("Matched range:", match);
      range[0] = parseInt(match[1], 10);
      range[1] = parseInt(match[2], 10);
    } else {
      const lowerMatch = condition.match(/>\s*(\d+)/);
      const upperMatch = condition.match(/<\s*(\d+)/);

      if (lowerMatch) {
        console.log("Matched lower condition:", lowerMatch);
        range[0] = parseInt(lowerMatch[1], 10);
      }
      if (upperMatch) {
        console.log("Matched upper condition:", upperMatch);
        range[1] = parseInt(upperMatch[1], 10);
      }
    }
  }

  console.log("Parsed range:", range);
  return range;
};

const updateConditionWithRange = (condition, range) => {
  const greaterThanMatch = condition.match(/>\s*\d+/);
  const lessThanMatch = condition.match(/<\s*\d+/);

  if (greaterThanMatch && lessThanMatch) {
    condition = condition.replace(/>\s*\d+/, `> ${range[0]}`);
    condition = condition.replace(/<\s*\d+/, `< ${range[1]}`);
  } else if (greaterThanMatch) {
    condition = condition.replace(/>\s*\d+/, `> ${range[0]}`);
  } else if (lessThanMatch) {
    condition = condition.replace(/<\s*\d+/, `< ${range[1]}`);
  }

  return condition;
};

const getConditionEligibleColumns = (tableData) => {
  if (!tableData || tableData.length === 0) return [];
  
  const eligibleColumns = [];
  const firstRow = tableData[0];

  for (const column in firstRow) {
    const value = firstRow[column];
    if (typeof value === 'number') {
      eligibleColumns.push(column);
    }
  }

  return eligibleColumns;
};

const StepByStepExplanation = ({ explanation, tableData, showVQL, currentPage, onPrevPage, onNextPage }) => {
  const [editingText, setEditingText] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [wordReplacements, setWordReplacements] = useState({});
  const [conditions, setConditions] = useState([]);
  const [whereResults, setWhereResults] = useState([]);
  const [fromTable, setFromTable] = useState(null); 
  const [joinfindTable1, setJoinfindTable1] = useState('price'); 
  const [joinfindTable2, setJoinfindTable2] = useState('name'); 
  const [joinfindColumn1, setJoinfindColumn1] = useState('id'); 
  const [joinfindColumn2, setJoinfindColumn2] = useState('id'); 
  const [joinTableResults, setJoinTableResults] = useState(null);
  const [joinColumnResults, setJoinColumnResults] = useState(null);
  const [ErrorMessage, setErrorMessage] = useState(null);
  const [groupcolumn, setGroupColumn] = useState('date')

  useEffect(() => {
    if (explanation[currentPage].operation === 'WHERE' && explanation[currentPage].conditions) {
      setConditions(explanation[currentPage].conditions.map(cond => ({
        ...cond,
        range: parseCondition(cond.condition)
      })));
    }
  }, [currentPage, explanation]);

  useEffect(() => {
    if (!joinfindTable1 || !joinfindTable2 || !joinfindColumn1 || !joinfindColumn2) {
      setJoinTableResults(null);
      setJoinColumnResults(null);
      setErrorMessage('Please select valid tables and columns for merging.');
      return; 
    }

    const { mergedData, columns, error } = mergeTables(
      dataTables[joinfindTable1],
      dataTables[joinfindTable2],
      joinfindColumn1,
      joinfindColumn2
    );

    if (error) {
      console.error(error);
      setErrorMessage(error);
    } else {
      setJoinTableResults(mergedData);
      setJoinColumnResults(columns);
      setErrorMessage(null); 
    }
  }, [joinfindTable1, joinfindTable2, joinfindColumn1, joinfindColumn2]); 

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

  useEffect(() => {
    const combineConditionsAndFilter = (data) => {
      if (!data || conditions.length === 0) return data;

      const combinedCondition = conditions.map((condition, index) => {
        if (index === 0) {
          return condition.condition;
        }
        return condition.condition.replace(/^\s*\b(?:AND|OR)\b\s*/, '');
      }).join(' || ');

      const cleanedCondition = combinedCondition
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, 'row["$1"]');

      const finalFilteredData = data.filter(row => {
        try {
          const conditionFunction = new Function('row', `return ${cleanedCondition};`);
          return conditionFunction(row);
        } catch (error) {
          console.error(`Error evaluating condition: ${cleanedCondition}`, error);
          return false;
        }
      });

      return finalFilteredData;
    };

    const currentData = calculateCurrentData();
    setWhereResults(combineConditionsAndFilter(currentData.currentTable_where));
  }, [conditions]);

  if (!tableData || !tableData.tables) {
    return <Typography variant="body2" color="error">No table data available</Typography>;
  }

  const dataTables = Object.keys(tableData.tables).reduce((acc, key) => {
    acc[key] = tableData.tables[key].map((row) => {
      const date = new Date(row.date);
      return {
        ...row,
      };
    });
    return acc;
  }, {});

  const mergeTables = (tableData1, tableData2, joinColumn1, joinColumn2) => {
    if (!tableData1 || !tableData2 || !joinColumn1 || !joinColumn2) {
        return { mergedData: [], columns:[],  error: 'Invalid parameters for merging tables' };
    }
    if (!Array.isArray(tableData1) || !Array.isArray(tableData2)) {
        return { mergedData: [], columns:[], error: 'Invalid table data' };
    }

    const columns1 = Object.keys(tableData1[0]);
    const columns2 = Object.keys(tableData2[0]);

    // Check if join columns exist in respective tables
    if (!columns1.includes(joinColumn1) || !columns2.includes(joinColumn2)) {
        return { mergedData: [], columns:[], error: 'Join columns do not exist in the respective tables' };
    }

    const merged = tableData1.map(row1 => {
        const matchedRow2 = tableData2.find(row2 => row1[joinColumn1] === row2[joinColumn2]);
        return matchedRow2 ? { ...row1, ...matchedRow2 } : null;
    }).filter(row => row !== null);
    
    console.log('merged results', merged)

    if (merged.length === 0) {
        return { mergedData: [], columns:[], error: 'No matching rows found for join operation' };
    }

    const mergedWithDateHandling = merged.map(row => ({
        ...row,
        date: row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString().split('T')[0] : row.date
    }));

    const mergedColumns = [...new Set([...columns1, ...columns2])];

    return { mergedData: mergedWithDateHandling, columns: mergedColumns, error: null };
};


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
                      borderTop: borderColumns.includes(column) ? "2px solid #155724" : "",
                      borderBottom: borderColumns.includes(column) ? "" : "",
                      borderLeft: borderColumns.includes(column) ? "2px solid #155724" : "none",
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
                        backgroundColor: selectedColumns.includes(column) && !borderColumns.includes(column) ? "#d4edda" : "transparent",
                        color: selectedColumns.includes(column) ? "#155724" : "inherit",
                        borderTop: borderColumns.includes(column) ? "" : "",
                        borderBottom: borderColumns.includes(column) && rowIndex === data.length - 1 ? "2px solid #155724" : "",
                        borderLeft: borderColumns.includes(column) ? "2px solid #155724" : "none",
                        borderRight: borderColumns.includes(column) ? "2px solid #155724" : "none",
                      }}
                    >
                      {row[column]}
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
  const highlightTablefrom = (description, tableNames = [], columnsToHighlight = [], numbersToHighlight = [], chartTypes = [], binByOptions = [], currentTableColumns = [], onChange) => {
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
      const key = `${cleanWord}_${index}`;
      const displayWord = wordReplacements[key] || cleanWord;

      if (tableNames.includes(cleanWord)) {
        return (
          <HighlightWithDropdown
            key={index}
            text={displayWord}
            options={optionsForType('table')}
            onChange={(newVal) => {
              setWordReplacements((prev) => ({
                ...prev,
                [key]: newVal,
              }));
              onChange('column', cleanWord, newVal);
              setFromTable(newVal);
              console.log('table now',newVal)
            }}
            className="highlight-table-name"
          />
        );
      }
  
      return <span key={index}>{displayWord} </span>;
    });
  };
  const highlightTableNamesAndColumns = (description, tableNames = [], eligibleColumns = [], currentTableColumns = [], onChange) => {
    if (typeof description !== 'string') {
      return description;
    }

    const optionsForType = (type) => {
      switch (type) {
        case 'table':
          return tableNames;
        case 'column':
          return eligibleColumns;
        default:
          return [];
      }
    };

    const tableIndices = [];
    const columnIndices = [];

    description.split(' ').forEach((word, index) => {
      const cleanWord = word.replace(/[.,]/g, '');
      if (tableNames.includes(cleanWord)) {
        tableIndices.push(index);
      } else if (currentTableColumns.includes(cleanWord)) {
        columnIndices.push(index);
      }
    });

    return (
      <>
        {description.split(' ').map((word, index) => {
          const cleanWord = word.replace(/[.,]/g, '');
          const key = `${cleanWord}_${index}`;
          const displayWord = wordReplacements[key] || cleanWord;

          if (tableIndices.includes(index)) {
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
                }}
                className="highlight-table-name"
              />
            );
          }

          const conditionIndex = columnIndices.indexOf(index);
          if (conditionIndex !== -1) {
            return (
              <HighlightWithDropdown
                key={index}
                text={displayWord}
                options={eligibleColumns}
                onChange={(newVal) => {
                  const newKey = `${newVal}_${index}`;
                  const updatedWordReplacements = {
                    ...wordReplacements,
                    [key]: newVal,
                    [newKey]: newVal,
                  };
                  setWordReplacements(updatedWordReplacements);
                  onChange('column', cleanWord, newVal);

                  setConditions((prevConditions) => {
                    const newConditions = [...prevConditions];
                    newConditions[conditionIndex] = {
                      ...newConditions[conditionIndex],
                      condition: newConditions[conditionIndex].condition.replace(new RegExp(`\\b${displayWord}\\b`, 'g'), newVal)
                    };
                    return newConditions;
                  });
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
const highlightGroup = (description, columnsToHighlight = [], currentTableColumns = [], onChange) => {
  if (typeof description !== 'string') {
    return description;
  }

  const optionsForType = (type) => {
    switch (type) {
      case 'column':
        return currentTableColumns;
      default:
        return [];
    }
  };

  return description.split(' ').map((word, index) => {
    const cleanWord = word.replace(/[.,]/g, '');
    const displayWord = wordReplacements[index] || cleanWord;
    if (columnsToHighlight.includes(cleanWord)) {
      return (
        <HighlightWithDropdown
          key={index}
          text={displayWord}
          options={optionsForType('column')}
          onChange={(newVal) => {
            setWordReplacements((prev) => ({
              ...prev,
              [index]: newVal,
            }));
            onChange('column', cleanWord, newVal);
            setGroupColumn(newVal)
          }}
          className="highlight-table-name"
        />
      );
    }

    return <span key={index}>{displayWord} </span>;
  });
};
  const handleEditClick = (text) => {
    setEditingText(true);
    setEditedText(text);
  };

  const handleBlur = () => {
    setEditingText(false);
    console.log('Edited text:', editedText);
  };
  const handleHighlighttableChange = (type, oldValue, newValue) => {

    console.log(`Changed ${type} from ${oldValue} to ${newValue}`);

    setWordReplacements((prev) => ({
      ...prev,
      [oldValue]: newValue
    }));
  };
  const handleHighlightChange = (type, oldValue, newValue) => {
    console.log(`Changed ${type} from ${oldValue} to ${newValue}`);

    if (type === 'column') {
      setConditions((prevConditions) =>
        prevConditions.map((condition) => ({
          ...condition,
          condition: condition.condition.replace(new RegExp(`\\b${oldValue}\\b`, 'g'), newValue)
        }))
      );
    }

    setWordReplacements((prev) => ({
      ...prev,
      [oldValue]: newValue
    }));
  };

  const handleRangeChange = (index, newRange) => {
    setConditions(prev => {
      const newConditions = [...prev];
      newConditions[index] = { ...newConditions[index], range: newRange };
      newConditions[index].condition = updateConditionWithRange(newConditions[index].condition, newRange);
      return newConditions;
    });
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
                    }}
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
  const renderGroupedChart = (data, groupByColumn, selectedColumns) => {
    if (!data || data.length === 0 || !selectedColumns || selectedColumns.length < 2) {
      return <div>No data available</div>;
    }
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
  
    const firstValue = data[0][selectedColumns[0]];
    const xAxisType = isDate(firstValue) ? 'time' : (isNaN(firstValue) ? 'category' : 'linear');
  
    const chartData = {
      datasets: Object.keys(groupedData).map((key, index) => ({
        label: key,
        data: groupedData[key].map(row => ({ x: row[selectedColumns[0]], y: row[selectedColumns[1]] })),
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
  const renderGroupedTable = (data, columns, groupByColumn) => {
    // 计算每个组的颜色
    const groupColors = {};
    const uniqueGroups = Array.from(new Set(data.map(row => row[groupByColumn])));
    uniqueGroups.forEach((key, index) => {
      groupColors[key] = `hsla(${index * 360 / uniqueGroups.length}, 100%, 75%, 0.3)`;
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
                    backgroundColor: column === groupByColumn ? "#a78cc8" : "transparent",
                    color: column === groupByColumn ? "black" : "inherit",
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
                style={{
                  backgroundColor: groupColors[row[groupByColumn]],
                }}
              >
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`}>
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

  let selectedColumns = [];

  explanation.forEach(step => {
    if (step.operation === 'SELECT') {
      selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
    }
  });

  const calculateCurrentData = () => {
    let currentTable = [];
    let previousTable = [];
    let currentColumns = [];
    let previousColumns = [];
    let scatterData = {};
    let scatterData_order = {};
    let firstValue = '';
    let xAxisType = '';
    let currentTable_from = [];
    let currentColumns_from = [];
    let currentTable_join = [];
    let currentColumns_join = [];
    let currentTable_where = [];
    let currentColumns_where = [];
    let currentTable_group = [];
    let currentColumns_group = [];
    let currentTable_select = [];
    let currentColumns_select = [];
    let currentTable_order = [];
    let currentColumns_order = [];
    let currentTable_bin = [];
    let currentColumns_bin = [];
    let tableData1, tableData2, joinColumn1, joinColumn2, tableName1, tableName2, columns1, columns2, groupByColumn;


    explanation.slice(0, currentPage + 1).forEach(step => {
      previousTable = [...currentTable];
      previousColumns = [...currentColumns];
      switch (step.operation) {
        case 'FROM': {
          const tableName = step.clause.split(' ')[1];
          const tableData = dataTables[tableName];
          if (tableData) {
            currentTable_from = tableData;
            currentColumns_from = Object.keys(tableData[0]);
            console.log('current',currentColumns_from)
            currentTable = currentTable_from
            currentColumns = currentColumns_from
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

            if (tableData1 && tableData2) {
              columns1 = Object.keys(tableData1[0]);
              columns2 = Object.keys(tableData2[0]);

              currentTable_join = tableData1.map(row1 => {
                const matchedRow2 = tableData2.find(row2 => row1[joinColumn1] === row2[joinColumn2]);
                return matchedRow2 ? { ...row1, ...matchedRow2 } : row1;
              }).map(row => ({
                ...row,
                date: row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString().split('T')[0] : row.date
              }));

              currentColumns_join = [...new Set([...columns1, ...columns2])];
              currentTable = currentTable_join
              currentColumns = currentColumns_join
            }
          }
          break;
        }
        case 'WHERE': {
          currentTable_where=currentTable
          currentColumns_where=currentColumns
          const basedcolumn = currentColumns;
          const combinedCondition = step.conditions.map((condition, index) => {
          if (index === 0) {
            return condition.condition;
          }
          return condition.condition.replace(/^\s*\b(?:AND|OR)\b\s*/, '');
        }).join(' || ');

        const cleanedCondition = combinedCondition
          .replace(/\bAND\b/g, '&&')
          .replace(/\bOR\b/g, '||')
          .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, 'row["$1"]');

        const finalFilteredData = currentTable.filter(row => {
          try {
            const conditionFunction = new Function('row', `return ${cleanedCondition};`);
            return conditionFunction(row);
          } catch (error) {
            console.error(`Error evaluating condition: ${cleanedCondition}`, error);
            return false;
          }
        });

          currentTable = finalFilteredData;
          currentColumns = basedcolumn;
          break;
        }
        case 'GROUP BY': {
          groupByColumn  = step.clause.split(' ')[2];
          break;
        }
        default:
          break;
      }
    });
    return {currentTable_from,currentColumns_from,currentTable_join,currentColumns_join,currentTable_where,currentColumns_where,currentTable_group,currentColumns_group,currentTable_select,currentColumns_select,currentTable_order,currentColumns_order,currentTable_bin,currentColumns_bin,currentTable,currentColumns,previousTable,previousColumns};
  };

  const renderStepContent = (step, steps) => {
    if (!step) {
      return <Typography variant="body2" color="error">No step data available</Typography>;
    }

    const tableNames = Object.keys(dataTables);

    const {
      currentTable_from,
      currentColumns_from,
      currentTable_join,
      currentColumns_join,
      currentTable_where,
      currentColumns_where,
      currentTable_group,
      currentColumns_group,
      currentTable_select,
      currentColumns_select,
      currentTable_order,
      currentColumns_order,
      currentTable_bin,
      currentColumns_bin,
      currentTable,
      currentColumns,
      previousTable,
      previousColumns
     } = calculateCurrentData();
    
    const generateScatterData = (currentTable, selectedColumns) => {
      console.log('table join results', currentTable)
      if (!currentTable || currentTable.length === 0 || !selectedColumns || selectedColumns.length < 2) {
        console.error('Invalid input data or selected columns');
        return {
          datasets: [],
        };
      }
    
      return {
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
    };

    const isDate = value => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    };

    const firstValue = currentTable_from[0][selectedColumns[0]];
    const xAxisType = isDate(firstValue) ? 'time' : 'category';

    switch (step.operation) {
      case 'FROM': {
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTablefrom(`${step.description}`, tableNames,[],[],[],[],[],handleHighlighttableChange)}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                {renderTable(fromTable? dataTables[fromTable]:currentTable_from, fromTable? Object.keys(dataTables[fromTable][0]):currentColumns_from)}
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                <Scatter
                  data={generateScatterData(fromTable? dataTables[fromTable]:currentTable_from,selectedColumns)}
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
        const tableNames = Object.keys(dataTables);
        let tableName1, tableName2, joinColumn1, joinColumn2, tableData1, tableData2;
        steps.forEach(step => {
          if (step.operation === 'JOIN') {
            const joinClauseParts = step.clause.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
            if (joinClauseParts) {
              tableName1 = joinClauseParts[2];
              tableName2 = joinClauseParts[1];
              joinColumn1 = joinClauseParts[3];
              joinColumn2 = joinClauseParts[5];

              tableData1 = dataTables[tableName1];
              tableData2 = dataTables[tableName2];
            }
          }
        });
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
                    ) : (
                      renderTable(joinTableResults ? joinTableResults : currentTable_join, joinColumnResults ? joinColumnResults : currentColumns, 'Merged')
                    )}
                  </div>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                <Scatter
                  data={generateScatterData(joinTableResults?joinTableResults : currentTable_join,selectedColumns)}
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
      case 'WHERE': {
        const columnNames = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)))];
        const numbers = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b\d+\b/g)))];
        const eligibleColumns = getConditionEligibleColumns(currentTable_where);
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], eligibleColumns, currentColumns_where, handleHighlightChange)}
                  </Typography>
                </div>

                {conditions.map((condition, index) => (
                  <div key={index} style={{ marginTop: '20px' }}>
                    <Typography variant="body2">{`Condition ${index + 1}: ${condition.condition}`}</Typography>
                    <RangeSlider
                      initialRange={condition.range}
                      min={0}
                      max={2500}
                      step={1}
                      onChange={(newRange) => handleRangeChange(index, newRange)}
                      fixedEnds={
                        condition.condition.includes('>') && condition.condition.includes('<')
                          ? null
                          : condition.condition.includes('>')
                          ? 'right'
                          : condition.condition.includes('<')
                          ? 'left'
                          : null
                      }
                    />
                    {renderFilteredTable(currentTable_where, currentColumns_where, condition, index === 0)}
                  </div>
                ))}
                <div>
                  <div className="step-label" style={{ marginTop: '20px' }}>{`data::step${step.step}`}</div>
                  {renderTable(whereResults, currentColumns_where, 'Filtered')}
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                <Scatter
                  data={generateScatterData(whereResults,selectedColumns)}
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
      case 'GROUP BY': {
        let groupByColumn = step.clause.split(' ')[2];
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightGroup(step.description, [groupByColumn],currentColumns,handleHighlightChange)}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                <div className="table-container">
                  {renderGroupedTable(currentTable, currentColumns, groupcolumn?groupcolumn:groupByColumn)}
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
                {renderGroupedChart(currentTable, groupcolumn?groupcolumn:groupByColumn, selectedColumns)}
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
      default:
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
};

export default StepByStepExplanation;
