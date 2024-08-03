import React, { useState, useEffect }  from 'react';
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
    setWordReplacements(prev => ({
      ...prev,
      [oldValue]: newValue
    }));
  };


  
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
    // Process all steps up to the current step
    steps.forEach(step => {
      previousTable = [...currentTable];
      previousColumns = [...currentColumns];
      switch (step.operation) {
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
