import React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Scatter, Bar, Line, Pie, Chart } from 'react-chartjs-2';
import './styles/stepByStepExplanation.css';
import 'chartjs-adapter-date-fns';




const FinalVis = ({ VQL, explanation, tableData, showVQL }) => {


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
    const date = new Date(value);
    return !isNaN(date.getTime());
  };
  

  const generateChart = (currentTable, chart, selectedColumns_final, selectedColumns_bin) => {
    const selectedColumns = selectedColumns_bin ? selectedColumns_bin : selectedColumns_final
    const data = {
      datasets: [{
        label: `${chart} Chart`,
        data: currentTable.map(row => ({
          x: row[selectedColumns[0]],
          y: row[selectedColumns[1]],
        })),
        backgroundColor: '#f0eea3',
      }],
    };

    const options = {
      scales: {
        x: {
          type: isDate(currentTable[0][selectedColumns[0]]) ? 'time' : 'category', 
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
    };
    console.log('chart',chart.toLowerCase())
    console.log('chart data',data)
    console.log('chart option',options)
    return (
      <Chart
        type={chart.toLowerCase()}
        data={data}
        options={options}
      />
    );
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
        case 'SELECT': {
          const columns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim());
          selectpredata = currentTable
          selectedColumns_final = columns.map(col => {
            const match = col.match(/(SUM|AVG|COUNT|MIN|MAX)\((\w+)\)/i);
            if (match) {
              hasAggregateFunction = true;
              const columnName = `${match[1].toUpperCase()}(${match[2]})`;
              aggregateColumns.push({ function: match[1].toUpperCase(), column: match[2], alias: columnName });
              return columnName;
            } else {
              return col;
            }
          });
          // console.log('select col', selectedColumns_final)
          if (hasAggregateFunction && groupByColumn) {
            const groupedData = {};
            currentTable.forEach(row => {
              const key = row[groupByColumn];
              if (!groupedData[key]) {
                groupedData[key] = [];
              }
              groupedData[key].push(row);
            });
            // console.log('group select', groupedData)
            currentTable = Object.keys(groupedData).map(key => {
              const aggregatedRow = { ...groupedData[key][0], [groupByColumn]: key };
              // console.log('agg row', aggregatedRow)
              aggregateColumns.forEach(agg => {
                const columnName = `${agg.function}(${agg.column})`;
                switch (agg.function.toUpperCase()) {
                  case 'SUM':
                    aggregatedRow[columnName] = groupedData[key].reduce((sum, r) => sum + r[agg.column], 0);
                    break;
                  case 'AVG':
                    aggregatedRow[columnName] = groupedData[key].reduce((sum, r) => sum + r[agg.column], 0) / groupedData[key].length;
                    break;
                  case 'COUNT':
                    aggregatedRow[columnName] = groupedData[key].length;
                    break;
                  case 'MIN':
                    aggregatedRow[columnName] = Math.min(...groupedData[key].map(r => r[agg.column]));
                    break;
                  case 'MAX':
                    aggregatedRow[columnName] = Math.max(...groupedData[key].map(r => r[agg.column]));
                    break;
                  default:
                    break;
                }
              });
              return aggregatedRow;
            });
          } else if (hasAggregateFunction&&!groupByColumn) {
            const newAggregatedRow = currentTable[0] ? { ...currentTable[0] } : {};
            aggregateColumns.forEach(agg => {
              switch (agg.function) {
                case 'SUM':
                  newAggregatedRow[agg.alias] = currentTable.reduce((sum, r) => sum + r[agg.column], 0);
                  break;
                case 'AVG':
                  newAggregatedRow[agg.alias] = currentTable.reduce((sum, r) => sum + r[agg.column], 0) / currentTable.length;
                  break;
                case 'COUNT':
                  newAggregatedRow[agg.alias] = currentTable.length;
                  break;
                case 'MIN':
                  newAggregatedRow[agg.alias] = Math.min(...currentTable.map(r => r[agg.column]));
                  break;
                case 'MAX':
                  newAggregatedRow[agg.alias] = Math.max(...currentTable.map(r => r[agg.column]));
                  break;
                default:
                  break;
              }
            });
            currentTable = [newAggregatedRow];
          }
          
          currentColumns = [...new Set([...Object.keys(currentTable[0]), ...aggregateColumns.map(agg => agg.alias)])];
          currentTable_select = currentTable
          currentColumns_select = currentColumns
          currentTable = currentTable_select
          currentColumns=currentColumns_select
          break;
        }
        case 'ORDER BY': {
          orderByParts = step.clause.split(' ');
          orderByColumn = orderByParts[2];
          orderDirection = orderByParts[3] ? orderByParts[3].toLowerCase() : 'asc';
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
          const stringXData = shuffledXData.map(date => new Date(date).toISOString().split('T')[0]);

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
        }
        case 'VISUALIZE': {
          chartType = step.clause.split(' ')[1].toLowerCase(); // 从 VISUALIZE 子句中提取图表类型
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
    return {currentTable_from,currentColumns_from,currentTable_join,currentColumns_join,currentTable_where,currentColumns_where,currentTable_group,currentColumns_group,currentTable_select,currentColumns_select,currentTable_order,currentColumns_order,currentTable_bin,currentColumns_bin,currentTable,currentColumns,previousTable,previousColumns,selectedColumns_final,selectpredata,groupByColumn,orderByColumn,orderDirection,binBy,currentTablebin_pre,ChartComponent,selectedColumns_bin};
  };

  const renderStepContent = (step, steps) => {
    if (!step) {
      return <Typography variant="body2" color="error">No step data available</Typography>;
    }

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
      ChartComponent
     } = calculateCurrentData();
    
     const generateScatterData = (currentTable, selectedColumns) => {
      console.log('table join results', currentTable);
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
              // 将 x 值转换为字符串
              let xValue = String(row[selectedColumns[0]]);
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
                <Scatter
                  data={generateScatterData(currentTable_from,selectedColumns)}
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
        return (
                <Scatter
                  data={generateScatterData(currentTable_join,selectedColumns)}
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
        );
      }
      case 'WHERE': {
        return (
                <Scatter
                  data={generateScatterData(currentTable_where,selectedColumns)}
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
        );
      }
      case 'GROUP BY': {
        let groupByColumn = step.clause.split(' ')[2];
        return (
                renderGroupedChart(currentTable, groupByColumn, selectedColumns) 
        );
      }
      case 'SELECT': {  
        return (
                <Scatter
                  data={generateScatterData(currentTable_select, selectedColumns_final)}
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
                  }}
                />
        );
      }
      case 'ORDER BY': {
        
        return (
                <Scatter
                  data={{
                    datasets: [
                      {
                        label: `Scatter Chart`,
                        data: currentTable_order,
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
                  }}
                />
        );
      }
      case 'BIN BY': {
        return (
              <Scatter
                data={generateScatterData(currentTable,[`binBy_${binBy}`,selectedColumns_final[1]])}
                options={{
                  scales: {
                    x: {
                      type: 'category',
                      position: 'bottom',
                      title: {
                        display: true,
                        text: `binBy_${binBy}`,
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: selectedColumns_final[1],
                      },
                    },
                  },
                }}
              />
        );
      }
      case 'VISUALIZE': {
        return (
              generateChart(currentTable, ChartComponent, selectedColumns_final, selectedColumns_bin)
          );
        }
      default:
        return <Typography variant="body2" color="error">Unsupported operation: {step.operation}</Typography>;
    }
  };

  const formattedVQL = VQL ? VQL.split('\\n').map((line, index) => (
    <Typography key={index} variant="body2" className="vql-line">
      {formatVQLLine(line)}
    </Typography>
  )) : null;
  return (

    <div className="visualize">
        <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
        {explanation && explanation.length > 0 ? renderStepContent(explanation[explanation.length-1], explanation) : <Typography variant="body2">No explanations available</Typography>}
        {showVQL && (
        <><Typography variant="h6" className="vql-title">/ VQL</Typography>
        <Card className="vql-card">
          <CardContent>
            <div className="vql-content">
              {formattedVQL}
            </div>
          </CardContent>
        </Card></>
      )}
    </div>
  );
};

export default FinalVis;
