import React from 'react';
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
import { Scatter, Bar,Line,Pie } from 'react-chartjs-2';
import './styles/stepByStepExplanation.css';
import 'chartjs-adapter-date-fns'; 

function StepByStepExplanation({ explanation, tableData, showVQL }) {
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

  const highlightTableNamesAndColumns = (description, tableNames = [], columnsToHighlight = [], numbersToHighlight = [], charttype = []) => {
    if (typeof description !== 'string') {
      return description;
    }
    return description.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[.,]/g, ''); 
  
      // 检查是否为表名并高亮显示
      if (tableNames.includes(cleanWord)) {
        return (
          <React.Fragment key={index}>
            <span className="highlight-table-name">{cleanWord}</span>
            {word.replace(cleanWord, '')}
            {' '}
          </React.Fragment>
        );
      }
      // 检查是否为需要高亮的列名
      if (columnsToHighlight.includes(cleanWord)) {
        return (
          <React.Fragment key={index}>
            <span className="highlight-join-column">{cleanWord}</span>
            {word.replace(cleanWord, '')}
            {' '}
          </React.Fragment>
        );
      }
      // 检查是否为需要高亮的数字
      if (numbersToHighlight.includes(cleanWord)) {
        return (
          <React.Fragment key={index}>
            <span className="highlight-number">{cleanWord}</span>
            {word.replace(cleanWord, '')}
            {' '}
          </React.Fragment>
        );
      }
      // 检查是否为图表类型并用黄色高亮显示
      if (charttype.includes(cleanWord)) {
        return (
          <React.Fragment key={index}>
            <span className="highlight-chart-type">{cleanWord}</span>
            {word.replace(cleanWord, '')}
            {' '}
          </React.Fragment>
        );
      }

      return <span key={index}>{word} </span>;
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

  let currentTable = [];
  let currentColumns = [];
  let selectedColumns = [];
  let scatterData = {  };
  
  
  let firstValue = '';
  let xAxisType = '';

   explanation.forEach(step => {
    if (step.operation === 'SELECT') {
      selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
    }
  });
  
  const renderStepContent = (step) => {
    const tableNames = Object.keys(dataTables);
    
    console.log('select',selectedColumns)
    switch (step.operation) {
      case 'FROM': {
        const tableName = step.clause.split(' ')[1]; // 从 FROM 子句中提取表名
        const tableData = dataTables[tableName];
        if (!tableData) {
          return <Typography variant="body2" color="error">Table not found: {tableName}</Typography>;
        }
        const columns = tableData ? Object.keys(tableData[0]) : [];
        currentTable = tableData;
        currentColumns = columns;
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
        xAxisType = isDate(firstValue) ? 'time' : 'linear';
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(`${step.description}`, tableNames)}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                {renderTable(tableData, columns, tableName)}
              </Paper>
            </div>
            <div className="right-column1">
            <div className="step-label">{`viz::step${step.step}`}</div>
            {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
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
                      y:{
                        title: {
                          display: true,
                          text: selectedColumns[1],
                        },
                      }
                    },
                  }}
                />
              </div>
              {showVQL && (
                // <><Typography variant="h6" className="vql-title">/ VQL</Typography>
                <Card className="vql-card">
                  <CardContent>
                    <Typography variant="body2" className="vql-line">
                      {formatVQLLine(step.clause)}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      }
      case 'JOIN': {
        const joinClauseParts = step.clause.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
        if (!joinClauseParts) {
          return <Typography variant="body2" color="error">Invalid JOIN clause: {step.clause}</Typography>;
        }
        const tableName1 = joinClauseParts[2];
        const tableName2 = joinClauseParts[1];
        const joinColumn1 = joinClauseParts[3];
        const joinColumn2 = joinClauseParts[5];

        const tableData1 = dataTables[tableName1];
        const tableData2 = dataTables[tableName2];

        if (!tableData1 || !tableData2) {
          return (
            <Typography variant="body2" color="error">
              Table not found: {tableName1} or {tableName2}
            </Typography>
          );
        }

        const columns1 = tableData1 ? Object.keys(tableData1[0]) : [];
        const columns2 = tableData2 ? Object.keys(tableData2[0]) : [];

        const mergedData = tableData1.map(row1 => {
          const matchedRow2 = tableData2.find(row2 => row1[joinColumn1] === row2[joinColumn2]);
          return matchedRow2 ? { ...row1, ...matchedRow2 } : row1;
        }).map(row => ({
          ...row,
          date: row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString().split('T')[0] : row.date
        }));

        const mergedColumns = [...new Set([...columns1, ...columns2])];
        currentTable = mergedData;
        currentColumns = mergedColumns;

        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                {/* <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {highlightTableNamesAndColumns(`Step ${step.step}.1 Let's combine the ${tableName1} spreadsheet with the ${tableName2} spreadsheet.`, tableNames)}
                  </Typography>
                </div>
                <div className="table-row">
                  <div className="table-column">
                    <div className="step-label">{`Table: ${tableName1}`}</div>
                    {renderTable(tableData1, columns1, tableName1)}
                  </div>
                  <div className="table-column">
                    <div className="step-label">{`Table: ${tableName2}`}</div>
                    {renderTable(tableData2, columns2, tableName2)}
                  </div>
                </div> */}
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row" 
                  // style={{ marginTop: '20px' }}
                  >
                    {highlightTableNamesAndColumns(`Step ${step.step}. ${step.description}`, tableNames, joinColumn1, joinColumn2)}
                  </Typography>
                </div>
                <div className="table-row">
                  <div className="table-column">
                    <div className="step-label">{`Table: ${tableName1}`}</div>
                    {renderTable(tableData1, columns1, tableName1, [joinColumn1],null,[joinColumn1])}
                  </div>
                  <div className="arrow"></div>
                  <div className="table-column">
                    <div className="step-label">{`Table: ${tableName2}`}</div>
                    {renderTable(tableData2, columns2, tableName2, joinColumn2,null,[joinColumn2])}
                  </div>
                </div>
                <div className="arrow-down"></div>
                <div className="table-row">
                  <div className="table-column">
                    <div className="step-label">{`data:: step2`}</div>
                    {renderTable(mergedData, mergedColumns, 'Merged')}
                  </div>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
            {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
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
                      y:{
                        title: {
                          display: true,
                          text: selectedColumns[1],
                        },
                      }
                    },
                  }}
                />
              </div>
              {showVQL && (
                // <><Typography variant="h6" className="vql-title">/ VQL</Typography>
                <Card className="vql-card">
                  <CardContent>
                    <Typography variant="body2" className="vql-line">
                      {formatVQLLine(step.clause)}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      }
      case 'WHERE': {
      const basedata=currentTable
      const basedcolumn=currentColumns
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

      console.log('Combined Condition:', cleanedCondition); 

      const finalFilteredData = currentTable.filter(row => {
        try {
          const conditionFunction = new Function('row', `return ${cleanedCondition};`);
          return conditionFunction(row);
        } catch (error) {
          console.error(`Error evaluating condition: ${cleanedCondition}`, error);
          return false;
        }
      });
      currentTable = finalFilteredData

      const columnNames = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)))];
      const numbers = [...new Set(step.conditions.flatMap(cond => cond.condition.match(/\b\d+\b/g)))];

        
      
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], columnNames, numbers)}
                  </Typography>
                </div>
                
                {step.conditions.map((condition, index) => (
                  <div key={index} style={{ marginTop: '20px' }}>
                    <Typography variant="body2">{`Condition ${index + 1}: ${condition.condition}`}</Typography>
                    {renderFilteredTable(basedata, basedcolumn, condition, index === 0)}
                  </div>
                ))}
                  <div>
                  <div className="step-label"style={{ marginTop: '20px' }}>{`data::step${step.step}`}</div>
                  {renderTable(currentTable, currentColumns, 'Filtered')}
                  </div>
              </Paper>
            </div>
            <div className="right-column1">
              {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
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
                      y:{
                        title: {
                          display: true,
                          text: selectedColumns[1],
                        },
                      }
                    },
                  }}
                />
              </div>
              {showVQL && (
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }  
      case 'GROUP BY': {
        const groupByColumn = step.clause.split(' ')[2];
        const groupedData = renderGroupedTable(currentTable, currentColumns, groupByColumn);
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
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], [groupByColumn], [])}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                <div className="table-container">
                  {groupedData}
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
            {renderGroupedChart(currentTable, groupByColumn)}
            </div>
            {showVQL && (
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }
      case 'ORDER BY': {
        const orderByParts = step.clause.split(' ');
        const orderByColumn = orderByParts[2];
        const orderDirection = orderByParts[3] ? orderByParts[3].toLowerCase() : 'asc';
        const sortedData = sortData(currentTable, orderByColumn, orderDirection);
        currentTable = sortedData
        const shuffleArray = (array) => {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        };
        
        const xData = currentTable.map(row => row[selectedColumns[0]]);
        const shuffledXData = shuffleArray([...xData]);
        const stringXData = shuffledXData.map(date => new Date(date).toISOString().split('T')[0]);

        const scatterData = currentTable.map((row, index) => ({
          x: stringXData[index],
          y: row[selectedColumns[1]],
        }));
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], [orderByColumn], [])}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                <div className="table-container">
                  {renderTable(sortedData, currentColumns, `Sorted by: ${orderByColumn} ${orderDirection}`, [orderByColumn], [orderByColumn])}
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
              <div className="step-label">{`viz::step${step.step}`}</div>
              <div className="chart">
              <Scatter
  data={{
    datasets: [
      {
        label: `Scatter Chart`,
        data: scatterData,
        backgroundColor: '#f0eea3',
      },
    ],
  }}
  options={{
    scales: {
      x: {
        type: 'category', 
        position: 'bottom',
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
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }
      case 'BIN BY': {
        const match = step.clause.split(' ')[2];
        if (!match) {
          return <Typography variant="body2" color="error">Invalid BIN BY clause: {step.clause}</Typography>;
        }
        
        const binBy = match;
        const columnName=selectedColumns[0];
        const updatedTable = binData(currentTable, binBy, columnName);
        const binColumnName = `binBy_${binBy}`;
        currentTable = updatedTable;
        currentColumns = [...currentColumns, binColumnName];
        const scatterData = {
          datasets: [
            {
              label: 'Scatter Plot',
              data: currentTable.map(row => ({
                x: row[binColumnName],
                y: row[selectedColumns[1]], 
              })),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
  
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], [binColumnName])}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                {renderTable(currentTable, currentColumns, `Binned by: ${binBy}`, [binColumnName],[], [binColumnName])}
              </Paper>
            </div>
            <div className="right-column1">
            <div className="step-label">{`viz::step${step.step}`}</div>
            {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
            <div className="chart">
              <Scatter
                data={scatterData}
                options={{
                  scales: {
                    x: {
                      type: 'category',
                      position: 'bottom',
                      title: {
                        display: true,
                        text: binColumnName,
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
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }
  
      case 'SELECT': {
        selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
      
        if (currentTable.length === 0 || !currentTable[0].hasOwnProperty(selectedColumns[0]) || !currentTable[0].hasOwnProperty(selectedColumns[1])) {
          return (
            <div className="step-container" key={step.step}>
              <div className="left-column1">
                <Paper className="container explanation">
                  <Typography variant="body2" color="error">Selected columns are not available in the data</Typography>
                </Paper>
              </div>
            </div>
          );
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
        const xAxisType = isDate(firstValue) ? 'time' : 'linear';

        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], selectedColumns)}
                  </Typography>
                </div>
                <div className="step-label">{`data:: step${step.step}`}</div>
                {renderTable(currentTable, currentColumns, `Selected: ${selectedColumns.join(', ')}`, selectedColumns, selectedColumns, selectedColumns)}
              </Paper>
            </div>
            <div className="right-column1">
            <div className="step-label">{`viz::step${step.step}`}</div>
              {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
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
                            unit: 'month', // 根据需要调整时间单位
                          },
                        }),
                        title: {
                          display: true,
                          text: selectedColumns[0],
                        },
                      },
                      y:{
                        title: {
                          display: true,
                          text: selectedColumns[1],
                        },
                      }
                    },
                  }}
                />
              </div>
              {showVQL && (
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }
      
      case 'VISUALIZE': {
        const chartType = step.clause.split(' ')[1]; // 从 VISUALIZE 子句中提取图表类型
        let ChartComponent;
        switch (chartType) {
          case 'bar':
            ChartComponent = Bar;
            break;
          case 'scatter':
            ChartComponent = Scatter;
            break;
          case 'line':
            ChartComponent = Line;
            break;
          case 'pie':
            ChartComponent = Pie;
            break;
          default:
            ChartComponent = Scatter;
        }
      
        const chartData = currentTable.map(row => {
          if (row[selectedColumns[0]] === undefined || row[selectedColumns[1]] === undefined) {
            console.error('Data contains undefined values for selected columns', row);
            return { x: null, y: null };
          }
          return {
            x: row[selectedColumns[0]],
            y: row[selectedColumns[1]],
          };
        }).filter(point => point.x !== null && point.y !== null);
      
        if (chartData.length === 0) {
          return (
            <div className="step-container" key={step.step}>
              <div className="left-column1">
                <Paper className="container explanation">
                  <Typography variant="body2" color="error">No valid data available for visualization</Typography>
                </Paper>
              </div>
            </div>
          );
        }
      
        // 检查 selectedColumns[0] 是否为日期类型
        const isDate = value => {
          const date = new Date(value);
          return !isNaN(date.getTime());
        };
      
        const firstValue = chartData[0].x;
        const xAxisType = isDate(firstValue) ? 'time' : 'linear';
      
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], [], [chartType])}
                  </Typography>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
            <div className="step-label">{`viz::step${step.step}`}</div>
              {/* <Typography variant="h6" className="visualize-title">/ Visualization</Typography> */}
              <div className="chart">
                <ChartComponent
                  data={{
                    datasets: [
                      {
                        label: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                        data: chartData.map(point => ({
                          x: isDate(point.x) ? new Date(point.x).getTime() : point.x,
                          y: point.y,
                        })),
                        backgroundColor: '#f0eea3',
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
                      y:{
                        title: {
                          display: true,
                          text: selectedColumns[1],
                        },
                      }
                    },
                  }}
                />
              </div>
              {showVQL && (
                <>
                  {/* <Typography variant="h6" className="vql-title">/ VQL</Typography> */}
                  <Card className="vql-card">
                    <CardContent>
                      <Typography variant="body2" className="vql-line">
                        {formatVQLLine(step.clause)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        );
      }
      
      
      // 其他操作的情况
      default:
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: ${step.description}`}
                  </Typography>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              {showVQL && (
                <><Typography variant="h6" className="vql-title">/ VQL</Typography><Card className="vql-card">
                  <CardContent>
                    <Typography variant="body2" className="vql-line">
                      {formatVQLLine(step.clause)}
                    </Typography>
                  </CardContent>
                </Card></>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="step-by-step-explanation">
      <div className="explanation-container">
        <Typography variant="h6" className="purple-text">/ Step-by-Step Explanations</Typography>
        {explanation.map((step) => renderStepContent(step))}
      </div>
    </div>
  );
}

export default StepByStepExplanation;
