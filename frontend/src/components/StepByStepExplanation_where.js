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
  const range = [0, 3000]; // default range, need to be limited by the selected column

  // 正则表达式匹配顺序调整，先匹配组合条件
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
    if (typeof value === 'number' ) {
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

  useEffect(() => {
    if (explanation[currentPage].operation === 'WHERE' && explanation[currentPage].conditions) {
      setConditions(explanation[currentPage].conditions.map(cond => ({
        ...cond,
        range: parseCondition(cond.condition)
      })));
      
    }
  }, [currentPage, explanation]);

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
    setWhereResults(combineConditionsAndFilter(currentData));
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
                    [newKey]: newVal, // 确保新列名能够在后续更新中正确使用
                  };
                  setWordReplacements(updatedWordReplacements);
                  onChange('column', cleanWord, newVal);
  
                  console.log(`Updating condition at index ${conditionIndex} from ${displayWord} to ${newVal}`);
                  
                  // 更新对应条件的列名
                  setConditions((prevConditions) => {
                    const newConditions = [...prevConditions];
                    newConditions[conditionIndex] = {
                      ...newConditions[conditionIndex],
                      condition: newConditions[conditionIndex].condition.replace(new RegExp(`\\b${displayWord}\\b`, 'g'), newVal)
                    };
                    console.log(`Updated conditions:`, newConditions);
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

  const handleEditClick = (text) => {
    setEditingText(true);
    setEditedText(text);
  };

  const handleBlur = () => {
    setEditingText(false);
    console.log('Edited text:', editedText);
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

  let selectedColumns = [];

  // Find the selected columns for default viz in all steps
  explanation.forEach(step => {
    if (step.operation === 'SELECT') {
      selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
    }
  });

  const calculateCurrentData = () => {
    let currentTable = [];
    let currentColumns = [];
    
    // Process all steps up to the current step
    explanation.slice(0, currentPage + 1).forEach(step => {
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
            const tableName1 = joinClauseParts[2];
            const tableName2 = joinClauseParts[1];
            const joinColumn1 = joinClauseParts[3];
            const joinColumn2 = joinClauseParts[5];

            const tableData1 = dataTables[tableName1];
            const tableData2 = dataTables[tableName2];

            if (tableData1 && tableData2) {
              const columns1 = Object.keys(tableData1[0]);
              const columns2 = Object.keys(tableData2[0]);

              currentTable = tableData1.map(row1 => {
                const matchedRow2 = tableData2.find(row2 => row1[joinColumn1] === row2[joinColumn2]);
                return matchedRow2 ? { ...row1, ...matchedRow2 } : row1;
              }).map(row => ({
                ...row,
                date: row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString().split('T')[0] : row.date
              }));

              currentColumns = [...new Set([...columns1, ...columns2])];
            }
          }
          break;
        }
        case 'WHERE': {
          // This will be handled separately in useEffect
          break;
        }
        default:
          break;
      }
    });

    return currentTable;
  };

  const renderStepContent = (step, steps) => {
    if (!step) {
      return <Typography variant="body2" color="error">No step data available</Typography>;
    }

    const tableNames = Object.keys(dataTables);

    const currentTable = calculateCurrentData();
    const currentColumns = currentTable.length > 0 ? Object.keys(currentTable[0]) : [];

    if (currentTable.length === 0 || currentColumns.length === 0) {
      return <Typography variant="body2" color="error">No data available to display</Typography>;
    }

    const scatterData = {
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

    const firstValue = currentTable[0][selectedColumns[0]];
    const xAxisType = isDate(firstValue) ? 'time' : 'category';

    

    // 现在处理当前步骤进行渲染
    switch (step.operation) {
      case 'WHERE': {
        const columnNames = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)))];
        const numbers = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b\d+\b/g)))];
        // 获取可用于条件的列
        const eligibleColumns = getConditionEligibleColumns(currentTable);
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], eligibleColumns, currentColumns, handleHighlightChange)}
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
                    {renderFilteredTable(currentTable, currentColumns, condition, index === 0)}
                  </div>
                ))}
                <div>
                  <div className="step-label" style={{ marginTop: '20px' }}>{`data::step${step.step}`}</div>
                  {renderTable(whereResults, currentColumns, 'Filtered')}
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
                          text: selectedColumns[1],
                        },
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
