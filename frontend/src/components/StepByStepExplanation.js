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
import 'chartjs-adapter-date-fns'; // 日期适配器

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

  const highlightTableNamesAndColumns = (description, tableNames = [], columnsToHighlight = [], charttype = []) => {
    if (typeof description !== 'string') {
      return description;
    }
    return description.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[.,]/g, ''); // 移除单词中的标点符号
  
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
      // 默认显示单词
      return <span key={index}>{word} </span>;
    });
  };

  let currentTable = [];
  let currentColumns = [];

  const renderStepContent = (step) => {
    const tableNames = Object.keys(dataTables);
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
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(`Specify the source table ${tableName}. ${step.description}`, tableNames)}
                  </Typography>
                </div>
                <div className="step-label">{`data::step${step.step}`}</div>
                {renderTable(tableData, columns, tableName)}
              </Paper>
            </div>
            <div className="right-column1">
              {showVQL && (
                <><Typography variant="h6" className="vql-title">/ VQL</Typography>
                <Card className="vql-card">
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
                <div className="highlight-row-container">
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
                </div>
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row" style={{ marginTop: '20px' }}>
                    {highlightTableNamesAndColumns(`Step ${step.step}.2 ${step.description}`, tableNames, joinColumn1, joinColumn2)}
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
                    <div className="step-label">{`${tableName1}: step2`}</div>
                    {renderTable(mergedData, mergedColumns, 'Merged')}
                  </div>
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
      case 'SELECT': {
        const selectedColumns = step.clause.replace('SELECT ', '').split(',').map(col => col.trim()); // 提取 SELECT 子句中的列名
        const scatterData = {
          datasets: [
            {
              label: `Scatter Plot`,
              data: currentTable.map(row => ({
                x: row[selectedColumns[0]],
                y: row[selectedColumns[1]],
              })),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
        const chartData = currentTable.map(row => ({
          x: row[selectedColumns[0]],
          y: row[selectedColumns[1]],
        }));
        console.log('scatter data',scatterData)
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
              <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
              <div className="chart">
              <Scatter
                    data={{
                      datasets: [
                        {
                          label: 'Scatter Plot',
                          data: chartData.map(point => ({
                            x: point.x,
                            y: point.y,
                          })),
                          backgroundColor: '#a2dbaf',
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        x: {
                          type: 'linear',
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                  </div>
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
        const chartData = currentTable.map(row => ({
          x: row[currentColumns[0]],
          y: row[currentColumns[1]],
        }));
        return (
          <div className="step-container" key={step.step}>
            <div className="left-column1">
              <Paper className="container explanation">
                <div className="highlight-row-container">
                  <Typography variant="body1" className="highlight-row">
                    {`Step ${step.step}: `}
                    {highlightTableNamesAndColumns(step.description, [], [],[chartType])}
                  </Typography>
                </div>
              </Paper>
            </div>
            <div className="right-column1">
              <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
              <div className="chart">
              <ChartComponent
                data={{
                  datasets: [
                    {
                      label: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                      data: chartData.map(point => ({
                        x: isNaN(new Date(point.x).getTime()) ? point.x : new Date(point.x).getTime(),
                        y: point.y,
                      })),
                      backgroundColor: '#f0eea3',
                    },
                  ],
                }}
                options={{
                  scales: {
                    x: {
                      type: isNaN(new Date(chartData[0].x).getTime()) ? 'linear' : 'time',
                      position: 'bottom',
                    },
                  },
                }}
              /></div>
              {showVQL && (
                <>
                  <Typography variant="h6" className="vql-title">/ VQL</Typography>
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
