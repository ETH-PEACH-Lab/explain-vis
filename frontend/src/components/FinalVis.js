import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Scatter, Bar, Line, Pie, Chart } from 'react-chartjs-2';
import './styles/stepByStepExplanation.css';
import 'chartjs-adapter-date-fns';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const FinalVis = ({ VQL, explanation, tableData, showVQL }) => {
  console.log('VQL',VQL)
  console.log('explanation',explanation)
  console.log('tableData',tableData)
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const totalTables = [];
  const totalColumns = [];
  tableData.tableNames.forEach((tableName) => {
      const tableRegex = new RegExp(`\\b${tableName}\\b`, 'gi');
      if (VQL.match(tableRegex)) {
          totalTables.push(tableName);
          const columns = Object.keys(tableData.tables[tableName][0]);
          totalColumns.push(...columns);
      }
  });

  useEffect(() => {
    try {
      if (!VQL) {
        throw new Error('Missing VQL data.');
      }
      if (!explanation || explanation.length === 0) {
        throw new Error('Missing or invalid explanation data.');
      }
      if (!tableData || Object.keys(tableData).length === 0) {
        throw new Error('Missing or invalid table data.');
      }
    } catch (err) {
      console.error('Error in FinalVis:', err);
      setError('An error occurred while generating the final visualization. Please try again.');
      setIsModalOpen(true);
    }
  }, [VQL, explanation, tableData]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!tableData || !tableData.tables) {
    // return <Typography variant="body2" color="error"></Typography>;
    setError(`An error occurred while generating the final visualization. Please try again.`);
        setIsModalOpen(true)
  }
  const dataTables = Object.keys(tableData.tables).reduce((acc, key) => {
    acc[key] = tableData.tables[key].map((row, index) => {
      // let date = new Date(row.date);
      // 调试信息，输出日期值和索引
    // if (isNaN(date.getTime())) {
    //   console.warn(`Invalid date value at row ${index} in table ${key}:`, row.date);
    // } else {
    //   // 在这里输出成功解析的日期
    //   console.log(`Valid date value at row ${index} in table ${key}:`, date.toISOString());
    // }
      return {
        ...row,
        // date: !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : row.date,
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

  const renderGroupedChart = (data, groupByColumn, selectedColumns, chart) => {
    const defaultoptions = {
      scales: {
          x: {
              position: 'bottom',
              title: {
                  display: true,
                  text: selectedColumns[0] || 'X-Axis',
              },
              ticks: {
                  display: true,
              },
              grid: {
                  display: true,
              }
          },
          y: {
              title: {
                  display: true,
                  text: selectedColumns[1] || 'Y-Axis',
              },
              ticks: {
                  display: true,
              },
              grid: {
                  display: true,
              }
          }
      }
  }
  
  const defaultdata = {
      labels: [''], // Adding a single empty label to force the display
      datasets: [{
        backgroundColor: '#f0eea3',
        label: `Empty Chart`,
          data: [] // Adding a single data point to force the display
      }]
  };
  
    console.log('error here',chart)
    if(chart==='default'){
      // return <Typography variant="body2" color="error"></Typography>;
      // setError(`An error occurred while generating the final visualization. Please try again.`);
      //   setIsModalOpen(true)
      return (
        <Chart
            type={'scatter'}
            data={defaultdata}
            options={defaultoptions}
        />
    );
  }

    if (!data || data.length === 0 || !selectedColumns || selectedColumns.length < 2) {
      // 如果数据为空或列选择无效，返回一个显示“Empty Chart”的空图表
      return (
        <Scatter 
          data={{
            labels: [''], // 强制显示
            datasets: [{
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              label: 'Empty Chart',
              data: [] // 添加一个空数据点以强制显示
            }]
          }} 
          options={{
            scales: {
              x: {
                position: 'bottom',
                title: {
                  display: true,
                  text: selectedColumns[0] || 'X-Axis',
                },
                ticks: {
                  display: true,
                },
                grid: {
                  display: true,
                }
              },
              y: {
                title: {
                  display: true,
                  text: selectedColumns[1] || 'Y-Axis',
                },
                ticks: {
                  display: true,
                },
                grid: {
                  display: true,
                }
              }
            },
          }}
        />
      );
    }
  
    const columnNames = Object.keys(data[0]); // 获取表的列名
  
    // 检查 selectedColumns 是否都在表的列名里
    const areSelectedColumnsValid = selectedColumns.every(column => columnNames.includes(column));
  
    if (!areSelectedColumnsValid) {
      // 如果 selectedColumns 无效，返回空图表
      return (
        <Scatter 
          data={{
            labels: [''], // 强制显示
            datasets: [{
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              label: 'Empty Chart',
              data: [] // 添加一个空数据点以强制显示
            }]
          }} 
          options={{
            scales: {
              x: {
                position: 'bottom',
                title: {
                  display: true,
                  text: selectedColumns[0] || 'X-Axis',
                },
                ticks: {
                  display: true,
                },
                grid: {
                  display: true,
                }
              },
              y: {
                title: {
                  display: true,
                  text: selectedColumns[1] || 'Y-Axis',
                },
                ticks: {
                  display: true,
                },
                grid: {
                  display: true,
                }
              }
            },
          }}
        />
      );
    }
  
    // 检查 groupByColumn 是否在表的列名里
    const isGroupByColumnValid = columnNames.includes(groupByColumn);
  
    const groupedData = isGroupByColumnValid
      ? data.reduce((acc, row) => {
          const key = row[groupByColumn];
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(row);
          return acc;
        }, {})
      : { '': data };
  
      const isDate = value => {
        if (Object.prototype.toString.call(value) === '[object Date]') {
          // Check if it's a valid Date object
          return !isNaN(value.getTime());
        } else if (typeof value === 'string') {
          // Attempt to parse the string as a date
          const parsedDate = new Date(value);
          return !isNaN(parsedDate.getTime());
        }
        return false; // Not a Date object or a valid date string
      };
  
    const isNumeric = value => {
      return !isNaN(parseFloat(value)) && isFinite(value);
    };
  
    const firstValue = data[0][selectedColumns[0]];
    const xAxisType = isDate(firstValue) ? 'time' : isNumeric(firstValue) ? 'linear' : 'category';
  
    const firstValue_select1 = data[0][selectedColumns[1]];
    const yAxisType = isDate(firstValue_select1) ? 'time' : isNumeric(firstValue_select1) ? 'linear' : 'category';
  
    const chartData = {
      datasets: Object.keys(groupedData).map((key) => ({
        label: key || 'Ungrouped',
        data: groupedData[key].map(row => ({ x: row[selectedColumns[0]], y: row[selectedColumns[1]] })),
        backgroundColor: isGroupByColumnValid ? `hsla(${Math.random() * 360}, 100%, 75%, 0.5)` : 'rgba(75, 192, 192, 0.6)',
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
          text: isGroupByColumnValid ? 'Grouped Chart' : 'Ungrouped Chart',
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
          type: yAxisType,
          title: {
            display: true,
            text: selectedColumns[1],
          },
        },
      },
    };
  
    return <Scatter data={chartData} options={chartOptions} />;
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
  const isDate = value => {
    if (Object.prototype.toString.call(value) === '[object Date]') {
      // Check if it's a valid Date object
      return !isNaN(value.getTime());
    } else if (typeof value === 'string') {
      // Attempt to parse the string as a date
      const parsedDate = new Date(value);
      return !isNaN(parsedDate.getTime());
    }
    return false; // Not a Date object or a valid date string
  };
  
  let selectedColumns = [];

  explanation.forEach(step => {
    if (step.operation === 'SELECT') {
      selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => {
        const match = col.match(/(SUM|AVG|COUNT|MIN|MAX)\((\w+)\)/i);
        return match ? match[2] : col.trim();
      });
    }
  });

  const generateChart = (currentTable_now, chart, selectedColumns,color) => {
    let data = {};
    let dataother = {};
    let options = {};
    const defaultoptions = {
      scales: {
          x: {
              position: 'bottom',
              title: {
                  display: true,
                  text: selectedColumns[0] || 'X-Axis',
              },
              ticks: {
                  display: true,
              },
              grid: {
                  display: true,
              }
          },
          y: {
              title: {
                  display: true,
                  text: selectedColumns[1] || 'Y-Axis',
              },
              ticks: {
                  display: true,
              },
              grid: {
                  display: true,
              }
          }
      }
  }
  
  const defaultdata = {
      labels: [''], // Adding a single empty label to force the display
      datasets: [{
        backgroundColor: '#f0eea3',
        label: `Empty Chart`,
          data: [] // Adding a single data point to force the display
      }]
  };
  
    console.log('error here',chart)
    if(chart==='default'){
      // return <Typography variant="body2" color="error"></Typography>;
      // setError(`An error occurred while generating the final visualization. Please try again.`);
      //   setIsModalOpen(true)
      return (
        <Chart
            type={'scatter'}
            data={defaultdata}
            options={defaultoptions}
        />
    );
    }
    const isDate = value => {
      if (Object.prototype.toString.call(value) === '[object Date]') {
        // Check if it's a valid Date object
        return !isNaN(value.getTime());
      } else if (typeof value === 'string') {
        // Attempt to parse the string as a date
        const parsedDate = new Date(value);
        return !isNaN(parsedDate.getTime());
      }
      return false; // Not a Date object or a valid date string
    };
    
    

    const isNumeric = value => {
        return !isNaN(parseFloat(value)) && isFinite(value);
    };
  if (currentTable_now &&
    currentTable_now.length > 0 &&
    selectedColumns.length > 0 &&
    currentTable_now[0].hasOwnProperty(selectedColumns[0])) {
    const firstValue_select = currentTable_now[0][selectedColumns[0]];
  } else {
    console.log('error table',currentTable_now)
    console.log('error col',selectedColumns)
    // setError('An error occurred while generating the final visualization. Please try again.');
    // setIsModalOpen(true);
    return (
          <Chart
              type={chart.toLowerCase()}
              data={defaultdata}
              options={defaultoptions}
          />
      );
    // return <Typography variant="body2" color="error"></Typography>;
  }
  if (currentTable_now &&
    currentTable_now.length > 0 &&
    selectedColumns.length > 0 &&
    currentTable_now[0].hasOwnProperty(selectedColumns[1])) {
    const firstValue_select1 = currentTable_now[0][selectedColumns[1]];
  } else {
    console.log('error table',currentTable_now)
    console.log('error col',selectedColumns)
    // setError('An error occurred while generating the final visualization. Please try again.');
    // setIsModalOpen(true);
    return (
      <Chart
          type={chart.toLowerCase()}
          data={defaultdata}
          options={defaultoptions}
      />
  );
    // return <Typography variant="body2" color="error"></Typography>;
  }
  const firstValue_select = currentTable_now[0][selectedColumns[0]];
  const xAxisType_select = isDate(firstValue_select) ? 'time' : isNumeric(firstValue_select) ? 'linear' : 'category';
  console.log('xAxistype final', xAxisType_select);



  const firstValue_select1 = currentTable_now[0][selectedColumns[1]];
  const yAxisType_select = isDate(firstValue_select1) ? 'time' : isNumeric(firstValue_select1) ? 'linear' : 'category';
  console.log('yAxistype final', yAxisType_select);

  console.log('firstValue_select1:', firstValue_select1);
console.log('isDate(firstValue_select1):', isDate(firstValue_select1));
console.log('isNumeric(firstValue_select1):', isNumeric(firstValue_select1));

    if (chart.toLowerCase() === 'pie') {
        // Pie chart specific logic
        const aggregatedData = currentTable_now.reduce((acc, row) => {
            const xValue = row[selectedColumns[0]];
            const yValue = row[selectedColumns[1]];

            const existing = acc.find(item => item.x === xValue);

            if (existing) {
                existing.y += yValue;
            } else {
                acc.push({ x: xValue, y: yValue });
            }

            return acc;
        }, []);

        const labels = aggregatedData.map(item => String(item.x));
        const datasetData = aggregatedData.map(item => item.y);

        console.log('Labels:', labels);
        console.log('Dataset data:', datasetData);

        if (labels.length === datasetData.length) {
            data = {
                labels: labels,  // Ensure labels are added only for Pie chart
                datasets: [{
                    data: datasetData,
                    backgroundColor: ['#f0eea3', '#a3d2f0', '#f0a3a3', '#a3f0a3', '#f0e0a3'],
                }],
            };

            options = {
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                    },
                },
            };
        } else {
            console.error('Labels and data arrays do not match in length!');
        }
        return <Pie data={data} options={options} />;
    } 
    else {
        // Other chart types logic
        
        dataother = {
            datasets: [{
                label: `${chart} Chart`,
                data: currentTable_now.map(row => ({
                    x: row[selectedColumns[0]],
                    y: row[selectedColumns[1]],
                })),
                backgroundColor: color,
            }],
        };

        options = {
            scales: {
              x: {
                type: xAxisType_select,
                // type: 'category',
                
                position: 'bottom',
                // ...(xAxisType_select === 'time' && {
                //   time: {
                //     unit: 'month',
                //   },
                // }),
                title: {
                  display: true,
                  text: selectedColumns[0],

                },
                labels: Array.from(new Set(currentTable_now.map(row => row[selectedColumns[0]])))
              },
                y: {
                  type: yAxisType_select,
                    title: {
                        display: true,
                        text: selectedColumns[1],
                    },
                },
            },
        };
        console.log('data chart', dataother)
        console.log('option chart', options)
        return (
          <Chart
              type={chart.toLowerCase()}
              data={dataother}
              options={options}
          />
      );
    }    
};
  

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
    let selectedColumns_final = selectedColumns;
    let aggregateColumns = [];
    let hasAggregateFunction = false;
    let selectpredata = [];
    let tableData1, tableData2, joinColumn1, joinColumn2, tableName1, tableName2, columns1, columns2, groupByColumn;
    let orderDirection, orderByColumn, orderByParts, binColumnName, binBy;
    let selectedColumns_bin = [];
    let currentTablebin_pre = [];
    let ChartComponent, chartType;

    explanation.forEach(step => {
      previousTable = [...currentTable];
      previousColumns = [...currentColumns];
      switch (step.operation) {
        case 'FROM': {
          const tableName = step.clause.split(' ')[1];
          const tableData = dataTables[tableName];
          if (tableData) {
            currentTable_from = tableData;
            currentColumns_from = Object.keys(tableData[0]);
            // console.log('current',currentColumns_from)
            currentTable = currentTable_from
            currentColumns = currentColumns_from
          }
          break;
        }
        case 'JOIN': {
          const joinClauseParts = step.clause.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
          if (joinClauseParts) {
            tableName1 = joinClauseParts[2];
            tableName2 = joinClauseParts[4];
            joinColumn1 = joinClauseParts[3];
            joinColumn2 = joinClauseParts[5];
            console.log(joinClauseParts)
            tableData1 = dataTables[tableName1];
            tableData2 = dataTables[tableName2];

            if (tableData1 && tableData2) {
              columns1 = Object.keys(tableData1[0]);
              columns2 = Object.keys(tableData2[0]);

        
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

              currentColumns_join = mergedColumns;
              currentTable = mergedWithDateHandling
              currentColumns = currentColumns_join
              currentTable_join = currentTable
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
          .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, 'row["$1"]')
          .replace(/=\s*(\d+)/g, '=== $1');

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
        case 'SELECT': {
          const columns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
          let aggFunction = null;
          let aggColumn = null;

          selectedColumns_final = columns.map(col => {
            const match = col.match(/(SUM|AVG|COUNT|MIN|MAX)\((\w+)\)/i);
            
            if (match) {
              hasAggregateFunction = true;
              aggFunction = match[1].toUpperCase(); // 提取聚合函数
              aggColumn = match[2];                 // 提取聚合列
              const columnName = `${aggFunction}(${aggColumn})`;
              aggregateColumns.push({ function: aggFunction, column: aggColumn, alias: columnName });
              return columnName;
            } else {
              return col;
            }
          });

            if (aggFunction && aggColumn) {
              const columnName = `${aggFunction}(${aggColumn})`;
              let newTable = currentTable.map(row => ({ ...row }));
              
              if (groupByColumn) {
                const groupedData = currentTable.reduce((acc, row) => {
                  const key = row[groupByColumn];
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(row);
                  return acc;
                }, {});
                console.log('groupdata', groupedData);
                const aggregatedData = Object.keys(groupedData).map(group => {
                  const rows = groupedData[group];
                  let aggregatedValue;
      
                  switch (aggFunction) {
                    case 'SUM':
                      aggregatedValue = rows.reduce((sum, r) => sum + r[aggColumn], 0);
                      break;
                    case 'AVG':
                      aggregatedValue = rows.reduce((sum, r) => sum + r[aggColumn], 0) / rows.length;
                      break;
                    case 'COUNT':
                      aggregatedValue = rows.length;
                      break;
                    case 'MIN':
                      aggregatedValue = Math.min(...rows.map(r => r[aggColumn]));
                      break;
                    case 'MAX':
                      aggregatedValue = Math.max(...rows.map(r => r[aggColumn]));
                      break;
                    default:
                      break;
                  }
                  // console.log('agg',aggregatedValue)
                  rows.forEach(row => {
                    row[columnName] = aggregatedValue;
                  });
      
                  return rows;
                }).flat();
      
                newTable = aggregatedData;
                // console.log('newselectdata',newTable)
              } else {
                let aggregatedValue;
      
                switch (aggFunction) {
                  case 'SUM':
                    aggregatedValue = currentTable.reduce((sum, r) => sum + r[aggColumn], 0);
                    break;
                  case 'AVG':
                    aggregatedValue = currentTable.reduce((sum, r) => sum + r[aggColumn], 0) / currentTable.length;
                    break;
                  case 'COUNT':
                    aggregatedValue = currentTable.length;
                    break;
                  case 'MIN':
                    aggregatedValue = Math.min(...currentTable.map(r => r[aggColumn]));
                    break;
                  case 'MAX':
                    aggregatedValue = Math.max(...currentTable.map(r => r[aggColumn]));
                    break;
                  default:
                    break;
                }
      
                newTable = currentTable.map(row => ({
                  ...row,
                  [columnName]: aggregatedValue
                }));
              }
      
              currentTable = newTable;
            } else {
              currentTable = currentTable;
            }
          
          break;
        }
        case 'ORDER BY': {
          orderByParts = step.clause.split(' ');
    
    if (orderByParts.length === 3) {
        // Case: ORDER BY x
        orderByColumn = orderByParts[2];
        orderDirection = 'asc'; // Default direction
    } else if (orderByParts.length === 4) {
        // Case: ORDER x BY a
        orderByColumn = orderByParts[2];
        orderDirection = orderByParts[3].toLowerCase();
    } else {
        // Default to handle any unexpected cases
        orderByColumn = orderByParts[2] || '';
        orderDirection = 'asc';
    } 
          currentTable_order = sortData(currentTable ,orderByColumn,orderDirection)
          currentTable = currentTable_order
          const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
          };

          const xData = currentTable.map(row => row[selectedColumns[0]]);
          const shuffledXData = shuffleArray([...xData]);
          // const stringXData = shuffledXData.map(date => new Date(date).toISOString().split('T')[0]);
          // const stringXData = shuffledXData.map(date => {
          //   const parsedDate = new Date(date);
          //   return isNaN(parsedDate) ? String(date) : parsedDate.toISOString().split('T')[0];
          // });
          const stringXData = shuffledXData.map(date => String(date));

          currentTable_order = currentTable.map((row, index) => ({
            x: stringXData[index],
            y: row[selectedColumns[1]],
          }));
          break;
        }
        case 'BIN BY': {
          currentTablebin_pre = currentTable
          const match = step.clause.split(' ')[2];
          binBy = match;
          const columnName=selectedColumns_final[0];
          const updatedTable = binData(currentTable, binBy, columnName);
          binColumnName = `binBy_${binBy}`;
          currentTable=updatedTable;
          currentTable_bin=currentTable
          currentColumns=[...currentColumns, binColumnName];
          currentColumns_bin=currentColumns
          selectedColumns_bin=[binColumnName, selectedColumns_final[1]];
          break;
        }
        case 'VISUALIZE': {
          const clauseParts = step.clause.split(' ');
          console.log('error here', clauseParts)
          if (clauseParts.length < 2) {
            chartType = 'default'
          }else{
            chartType = clauseParts[1].toLowerCase();
          }
        
          
        
          // Validate the chart type
          const validChartTypes = ['scatter', 'bar', 'line', 'pie'];
          if (!validChartTypes.includes(chartType)) {
            chartType = 'default'
          }
          // chartType = step.clause.split(' ')[1].toLowerCase(); // 从 VISUALIZE 子句中提取图表类型
          console.log('charttype init', chartType);
          switch (chartType) {
            case 'bar':
              ChartComponent = 'Bar';
              break;
            case 'scatter':
              ChartComponent = 'Scatter';
              break;
            case 'line':
              ChartComponent = 'Line';
              break;
            case 'pie':
              ChartComponent = 'Pie';
              break;
            default:
              ChartComponent = 'Scatter';
          }
        }
        default:
          break;
      }
    });
    return {currentTable_from,currentColumns_from,currentTable_join,currentColumns_join,currentTable_where,currentColumns_where,currentTable_group,currentColumns_group,currentTable_select,currentColumns_select,currentTable_order,currentColumns_order,currentTable_bin,currentColumns_bin,currentTable,currentColumns,previousTable,previousColumns,selectedColumns_final,selectpredata,groupByColumn,orderByColumn,orderDirection,binBy,currentTablebin_pre,chartType,selectedColumns_bin};
  };

  const renderStepContent = (step, steps) => {
    if (!step) {
      // return <Typography variant="body2" color="error"></Typography>;
      setError(`An error occurred while generating the final visualization. Please try again.`);
        setIsModalOpen(true)
    }
    let chartType_all = 'default'; // Default chart type

    steps.forEach(step => {
      if (step.operation === 'VISUALIZE') {
        const clauseParts = step.clause.split(' ');
        console.log('error here', clauseParts);
        if (clauseParts.length >= 2) {
          chartType_all = clauseParts[1].toLowerCase();
        }
    
        // Validate the chart type
        const validChartTypes = ['scatter', 'bar', 'line', 'pie'];
        if (!validChartTypes.includes(chartType_all)) {
          chartType_all = 'default';
        }
      }

    });
    
    console.log('Final chart type all:', chartType_all);
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
      previousColumns,
      selectedColumns_final,
      selectpredata,
      groupByColumn,
      orderByColumn,
      orderDirection,
      binBy,
      selectedColumns_bin,
      chartType
     } = calculateCurrentData();
    
     const generateScatterData = (currentTable_new, selectedColumns) => {
      console.log('table join results', currentTable_new);
      const defaultoptions = {
        scales: {
            x: {
                position: 'bottom',
                title: {
                    display: true,
                    text: selectedColumns[0] || 'X-Axis',
                },
                ticks: {
                    display: true,
                },
                grid: {
                    display: true,
                }
            },
            y: {
                title: {
                    display: true,
                    text: selectedColumns[1] || 'Y-Axis',
                },
                ticks: {
                    display: true,
                },
                grid: {
                    display: true,
                }
            }
        }
    }
      if (!currentTable_new || currentTable_new.length === 0 || !selectedColumns || selectedColumns.length < 2) {
        console.error('Invalid input data or selected columns');
        return {
          data: {
            labels: [''], // Adding a single empty label to force the display
            datasets: [{
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              label: `Empty Chart`,
                data: [] // Adding a single data point to force the display
            }]
        },
          options: defaultoptions,
        };
      }
      console.log('test selectcolumn results', selectedColumns);
      
      const isDate = value => {
        if (Object.prototype.toString.call(value) === '[object Date]') {
          // Check if it's a valid Date object
          return !isNaN(value.getTime());
        } else if (typeof value === 'string') {
          // Attempt to parse the string as a date
          const parsedDate = new Date(value);
          return !isNaN(parsedDate.getTime());
        }
        return false; // Not a Date object or a valid date string
      };
  
      const isNumeric = value => {
          return !isNaN(parseFloat(value)) && isFinite(value);
      };

      let firstValue_select;
      if (currentTable_new.length > 0 && selectedColumns.length > 0 && selectedColumns[0] in currentTable_new[0]) {
        firstValue_select = currentTable_new[0][selectedColumns[0]];
      } else {
          // setError(`Column "${selectedColumns[0]}" does not exist in the table.`);
          return {
            data: {
              labels: [''], // Adding a single empty label to force the display
              datasets: [{
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                label: `Empty Chart`,
                  data: [] // Adding a single data point to force the display
              }]
          },
            options: defaultoptions,
          }
          // <Typography variant="body2" color="error">Selected Column does not exist in the table.</Typography>;
      }
      const xAxisType_select = isDate(firstValue_select) ? 'time' : isNumeric(firstValue_select) ? 'linear' : 'category';
      console.log('xAxistype', xAxisType_select);

      let firstValue_select1;
      if (currentTable_new.length > 0 && selectedColumns.length > 0 && selectedColumns[1] in currentTable_new[0]) {
        firstValue_select1 = currentTable_new[0][selectedColumns[1]];
      } else {
        return {
          data: {
            labels: [''], // Adding a single empty label to force the display
            datasets: [{
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              label: `Empty Chart`,
                data: [] // Adding a single data point to force the display
            }]
        },
          options: defaultoptions,
        }
        }
          // setError(`Column "${selectedColumns[0]}" does not exist in the table.`);
          // return <Typography variant="body2" color="error">Selected Column does not exist in the table.</Typography>;
      

      const yAxisType_select = isDate(firstValue_select1) ? 'time' : isNumeric(firstValue_select1) ? 'linear' : 'category';
      console.log('yAxistype', yAxisType_select);

      const data =  {
        datasets: [
          {
            label: 'Scatter Plot',
            data: currentTable_new.map(row => {
              if (row[selectedColumns[0]] === undefined || row[selectedColumns[1]] === undefined) {
                console.error('Data contains undefined values for selected columns', row);
                return { x: null, y: null };
              }
              // 将 x 值转换为字符串
              let xValue = row[selectedColumns[0]];
              let yValue = row[selectedColumns[1]];
              return {
                x: xValue,
                y: yValue,
              };
            }).filter(point => point.x !== null && point.y !== null),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      };
      console.log('data',data)
      const options = {
            scales: {
              x: {
                type: xAxisType_select,
                position: 'bottom',
                // ...(xAxisType_select === 'time' && {
                //   time: {
                //     unit: 'month',
                //   },
                // }),
                title: {
                  display: true,
                  text: selectedColumns[0],
                },
              },
                y: {
                  // type: yAxisType_select,
                    title: {
                        display: true,
                        text: selectedColumns[1],
                    },
                },
            },
        };
        const result = {
          data: data,
          options: options,
        };
      return result
    };

    const isDate = value => {
      if (Object.prototype.toString.call(value) === '[object Date]') {
        // Check if it's a valid Date object
        return !isNaN(value.getTime());
      } else if (typeof value === 'string') {
        // Attempt to parse the string as a date
        const parsedDate = new Date(value);
        return !isNaN(parsedDate.getTime());
      }
      return false; // Not a Date object or a valid date string
    };

    const defaultcolor = 'rgba(75, 192, 192, 0.6)';
    const chartcolor = '#f0eea3';
    switch (step.operation) {
      case 'FROM': {
        const isDate = value => {
          if (Object.prototype.toString.call(value) === '[object Date]') {
            // Check if it's a valid Date object
            return !isNaN(value.getTime());
          } else if (typeof value === 'string') {
            // Attempt to parse the string as a date
            const parsedDate = new Date(value);
            return !isNaN(parsedDate.getTime());
          }
          return false; // Not a Date object or a valid date string
        };
        
        const isNumeric = value => {
          return !isNaN(parseFloat(value)) && isFinite(value);
        };        
    
        const table_data = currentTable_from;
        const columns = selectedColumns
        const firstValue_select = table_data[0][columns[0]];
        const xAxisType_select = isDate(firstValue_select) ? 'time' : 'category';

        return (
          <div className="chart">
          {generateChart(currentTable_from,chartType_all,selectedColumns, defaultcolor)}
          </div>
        );
      }
      case 'JOIN': {
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
        const isDate = value => {
          if (Object.prototype.toString.call(value) === '[object Date]') {
            // Check if it's a valid Date object
            return !isNaN(value.getTime());
          } else if (typeof value === 'string') {
            // Attempt to parse the string as a date
            const parsedDate = new Date(value);
            return !isNaN(parsedDate.getTime());
          }
          return false; // Not a Date object or a valid date string
        };
        
        const isNumeric = value => {
          return !isNaN(parseFloat(value)) && isFinite(value);
        };        
    
        const table_data = currentTable_join;
        const columns = selectedColumns
        const firstValue_select = table_data[0][columns[0]];
        const xAxisType_select = isDate(firstValue_select) ? 'time' : 'category';

        let { data, options } = generateScatterData(currentTable_join,selectedColumns)
        console.log('Final chart type all:', chartType_all);
        if (chartType_all==="default"){
          options = {
            scales: {
                x: {
                    position: 'bottom',
                    title: {
                        display: true,
                        text: selectedColumns[0] || 'X-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: selectedColumns[1] || 'Y-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                }
            }
        }
        
        data = {
            labels: [''], // Adding a single empty label to force the display
            datasets: [{
              backgroundColor: '#f0eea3',
                label: `Empty Chart`,
                data: [] // Adding a single data point to force the display
            }]
        };
        }
        return (
          <Scatter
          data={data}
          options={options}
        />
        );
      }
      case 'WHERE': {
        let { data, options } = generateScatterData(currentTable,selectedColumns)
        console.log('Final chart type all:', chartType_all);
        if (chartType_all==="default"){
          options = {
            scales: {
                x: {
                    position: 'bottom',
                    title: {
                        display: true,
                        text: selectedColumns[0] || 'X-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: selectedColumns[1] || 'Y-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                }
            }
        }
        
        data = {
            labels: [''], // Adding a single empty label to force the display
            datasets: [{
              backgroundColor: '#f0eea3',
                label: `Empty Chart`,
                data: [] // Adding a single data point to force the display
            }]
        };
        }
        return (
          <Scatter
          data={data}
          options={options}
        /> 
        );
      }
      case 'GROUP BY': {
        let groupByColumn = step.clause.split(' ')[2];
        return (
                renderGroupedChart(currentTable, groupByColumn, selectedColumns, chartType_all) 
        );
      }
      case 'SELECT': {  
        return (
          generateChart(currentTable,chartType_all,selectedColumns_final, defaultcolor)
        );
      }
      case 'ORDER BY': {
        let data = {
          datasets: [
            {
              label: `Scatter Chart`,
              data: currentTable_order,
              backgroundColor: '#f0eea3',
            },
          ],
        }
        let options = {
          scales: {
            x: {
              type: 'category', 
              position: 'bottom',
              title: {
                display: true,
                text: selectedColumns_final[0],
              },

            },
            y: {
              title: {
                display: true,
                text: selectedColumns_final[1],

              },
            
            },
          },
        }
        console.log('Final chart type all:', chartType_all);
        if (chartType_all==="default"){
          options = {
            scales: {
                x: {
                    position: 'bottom',
                    title: {
                        display: true,
                        text: selectedColumns[0] || 'X-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: selectedColumns[1] || 'Y-Axis',
                    },
                    ticks: {
                        display: true,
                    },
                    grid: {
                        display: true,
                    }
                }
            }
        }
        
        data = {
            labels: [''], // Adding a single empty label to force the display
            datasets: [{
              backgroundColor: '#f0eea3',
                label: `Empty Chart`,
                data: [] // Adding a single data point to force the display
            }]
        };
        }
        return (
                <Scatter
                  data={data}
                  options={options}
                />
        );
      }
      case 'BIN BY': {
        return (
          generateChart(currentTable, chartType_all, [`binBy_${binBy}`,selectedColumns_final[1]],defaultcolor)

              
        );
      }
      case 'VISUALIZE': {
        return (
              generateChart(currentTable, chartType, binBy?selectedColumns_bin:selectedColumns_final,chartcolor)
          );
        }
      default:
        // return <Typography variant="body2" color="error"></Typography>;
        setError(`An error occurred while generating the final visualization. Please try again.`);
        setIsModalOpen(true)
    }
  };

  const formattedVQL = VQL ? VQL.split('\\n').map((line, index) => (
    <Typography key={index} variant="body2" className="vql-line">
      {formatVQLLine(line)}
    </Typography>
  )) : null;
  return (

    // <div className="visualize">
    //     <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
  
      // <div className="visualize">
      //     <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
      <>
        {explanation && explanation.length > 0 ? renderStepContent(explanation[explanation.length - 1], explanation) : <Typography variant="body2">Try again, nothing generated</Typography>}
  
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="error">Error</Typography>
          <Typography variant="body2" color="textSecondary">{error}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsModalOpen(false)}
            style={{ marginTop: '20px' }}
          >
            OK
          </Button>
        </Box>
      </Modal></>
      //   {showVQL && (
      //   <><Typography variant="h6" className="vql-title">/ VQL</Typography>
      //   <Card className="vql-card">
      //     <CardContent>
      //       <div className="vql-content">
      //         {formattedVQL}
      //       </div>
      //     </CardContent>
      //   </Card></>
      // )}
    // </div>
  );
};

export default FinalVis;
