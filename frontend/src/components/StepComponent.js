import React from 'react';
import { Table } from 'react-bootstrap';
import { VegaLite } from 'react-vega';

const StepComponent = ({ steps, data1, data2 }) => {
  const adjustColorOpacity = (color, opacity = 0.5) => {
    const hexToRgba = (hex, alpha) => {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return hexToRgba(color, opacity);
  };

  const renderTable = (data, columns, tableName, groupColors = {}, highlightConditions = {}, noHeaderHighlight = false, isDefault = true) => {
    if (!data || data.length === 0) {
      return <div>No data available to display</div>;
    }

    const getHighlightColor = (highlightArray, rowKey) => {
      if (rowKey && groupColors[rowKey]) {
        return adjustColorOpacity(groupColors[rowKey], 0.3); 
      }
      if (!highlightArray || highlightArray.length === 0) {
        return 'transparent';
      }
      if (highlightArray.length > 1) {
        return highlightConditions['overlap'];
      }
      return highlightConditions[highlightArray[0]];
    };

    return (
      <div>
        <h5 style={{ backgroundColor: '#FFFFE0' }}>{tableName}</h5>
        <Table bordered hover variant={isDefault ? "" : "striped"}>
          <thead>
            <tr>
              {Object.keys(data[0]).filter(key => key !== '_highlight' && key !== '_color').map((key) => (
                <th key={key} style={{ backgroundColor: !noHeaderHighlight && columns.includes(key) ? (key === columns[0] ? '#DDDDFF' : '#FFDDDD') : 'transparent' }}>
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const rowKey = columns.map(col => row[col]).join('_');
              return (
                <tr key={rowIndex}>
                  {Object.keys(row).filter(key => key !== '_highlight' && key !== '_color').map((key) => (
                    <td key={key} style={{ backgroundColor: getHighlightColor(row._highlight, rowKey) }}>
                      {row[key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderVegaLite = (data, columns, chartType, groupByColumns = [], binBy = null, orderBy = null, orderDirection = 'asc', groupColors = {}) => {
    if (!data || data.length === 0 || columns.length < 2) {
      return <div>Not enough data to render chart</div>;
    }
  
    const dataWithIndex = data.map((d, i) => ({ ...d, _index: i }));
  
    const inferType = (value) => {
      if (typeof value === 'number') {
        return 'quantitative';
      // } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      //   return 'temporal';
      } else if (typeof value === 'string') {
        return 'nominal';
      } else if (typeof value === 'boolean') {
        return 'nominal';
      } else {
        return 'ordinal';
      }
    };
  
    const xType = inferType(data[0][columns[0]]);
    const yType = inferType(data[0][columns[1]]);
    const colorField = groupByColumns.length > 0 ? groupByColumns.join('_') : null;
  
    const isTemporal = (column) => {
      const sampleValue = data[0][column];
      return inferType(sampleValue) === 'temporal';
    };
    console.log("Group Colors:", groupColors);

    const colorEncoding = colorField
      ? {
          "field": colorField,
          "type": "nominal",
          "legend": binBy ? { "labelExpr": "timeFormat(datum.label, '%Y-%m-%d')" } : undefined,
          // "legend": isTemporal(colorField) ? { "labelExpr": "timeFormat(datum.label, '%Y-%m-%d')" } : undefined
          // "legend":  { "labelExpr": "timeFormat(datum.label, '%Y-%m-%d')" } 
          "scale": {
            // "domain": Object.keys(groupColors),
            "range": ['#FFA07A', '#FFD700', '#32CD32', '#00CED1', '#4682B4']
          }
        }
      : undefined;
  
    const xEncoding = {
      "field": columns[0],
      "type": xType,
      "axis": { "title": columns[0], "labelColor": "blue", "titleColor": "blue" },
      "sort": "_index"  
    };
  
    // if (xType === 'temporal') {
    //   xEncoding["timeUnit"] = binBy ? binBy : 'date';
    // }
    if (binBy) {
      xEncoding["type"] = "temporal";
      xEncoding["timeUnit"] = binBy;
    }
    
    const vegaSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description": "Highlight x and y axis with data points.",
      "data": { "values": dataWithIndex },
      "transform": [
        { "sort": [{ "field": "_index", "order": "ascending" }] }
      ],
      "mark": chartType,
      "encoding": {
        "x": xEncoding,
        "y": {
          "field": columns[1],
          "type": yType,
          "axis": { "title": columns[1], "labelColor": "red", "titleColor": "red" },
          "sort": "_index"  
        },
        "color": colorEncoding,
        // "tooltip": columns.map(col => ({ "field": col, "type": binBy? "temporal":inferType(data[0][col]) }))
        "tooltip": columns.map((col, index) => {
        if (index === 0 && binBy) {
          return { "field": col, "type": "temporal", "format": "%Y-%m-%d" };
        }
        return { "field": col, "type": inferType(data[0][col]) };
      })
      }
    };
  
    return (
      <VegaLite spec={vegaSpec} width={300} height={180} />
    );
  };
  

  const joinTables = (data1, data2, key1, key2) => {
    if (!data1 || !data2) {
      return [];
    }
    const joinedData = [];
    data1.forEach(row1 => {
      const matchedRow2 = data2.find(row2 => row1[key1] === row2[key2]);
      if (matchedRow2) {
        joinedData.push({ ...row1, ...matchedRow2 });
      }
    });
    return joinedData;
  };

  const renderfilterData = (data, whereCondition, highlightCondition) => {
    if (!whereCondition) {
      return data.map(row => ({ ...row, _highlight: highlightCondition ? [highlightCondition] : [] }));
    }

    const conditionFunction = new Function('row', `with(row) { return ${whereCondition} }`);
    return data.map(row => {
      const highlightArray = row._highlight ? [...row._highlight] : [];
      if (conditionFunction(row)) {
        highlightArray.push(highlightCondition);
      }
      return { ...row, _highlight: highlightArray };
    });
  };

  const applyConditions = (data, conditions) => {
    if (!Array.isArray(conditions) || !conditions.length) {
      return data;
    }
  
    const sanitizeCondition = (condition) => {
      return condition.replace(/["']/g, '');
    };
  
    const conditionString = conditions
      .map((cond, index) => {
        const operator = index > 0 ? ` ${cond.operator} ` : '';
        return `${operator}(${sanitizeCondition(cond.condition)})`;
      })
      .join('');
  
    let conditionFunction;
    try {
      conditionFunction = new Function('row', `
        with(row) {
          return ${conditionString};
        }
      `);
    } catch (error) {
      console.error('Invalid condition string:', conditionString);
      return data; 
    }
  
    return data.filter(row => {
      try {
        return conditionFunction(row);
      } catch (error) {
        console.error('Error evaluating condition for row:', row, error);
        return false;
      }
    }).map(row => ({
      ...row,
      _highlight: row._highlight || []
    }));
  };
  

  const highlightOverlap = (data, preConditions, postConditions) => {
    const preFilteredData = applyConditions(data, preConditions).map(row => ({
      ...row,
      _highlight: ['pre']
    }));

    const postFilteredData = applyConditions(data, postConditions).map(row => ({
      ...row,
      _highlight: ['post']
    }));

    return data.map(row => {
      const isPreMatch = preFilteredData.find(preRow => preRow.id === row.id);
      const isPostMatch = postFilteredData.find(postRow => postRow.id === row.id);

      if (isPreMatch && isPostMatch) {
        return { ...row, _highlight: ['pre', 'post'] };
      } else if (isPreMatch) {
        return { ...row, _highlight: ['pre'] };
      } else if (isPostMatch) {
        return { ...row, _highlight: ['post'] };
      } else {
        return { ...row, _highlight: row._highlight || [] };
      }
    });
  };

  // const pastelColors = ['#FFDAB9', '#FFFFE0', '#98FB98', '#AFEEEE', '#ADD8E6'];
  const pastelColors = ['#FFA07A', '#FFD700', '#32CD32', '#00CED1', '#4682B4']; 
  // const pastelColors = ['#1f77b4', '#ff7f0e', '#d62728', '#00CED1', '#4682B4']; 


  const generateColor = (index) => {
    return pastelColors[index % pastelColors.length];
  };

  const groupBy = (data, columns) => {
    const groupedData = {};
    const groupColors = {};
    let colorIndex = 0;
  
    data.forEach(row => {
      const key = columns.map(col => row[col]).join('_');
      if (!groupedData[key]) {
        groupedData[key] = { ...row, _count: 0 };
        groupColors[key] = generateColor(colorIndex++);
      }
      groupedData[key]._count += 1;
    });
  
    const groupedDataWithColors = Object.values(groupedData).map(row => {
      const result = { ...row };
      delete result._count;
      const key = columns.map(col => row[col]).join('_');
      result._color = groupColors[key];
      return result;
    });
  
    return { data: groupedDataWithColors, colors: groupColors };
  };
  
  

  const orderData = (data, orderByColumn, order) => {
    if (!orderByColumn || !order) {
      return data;
    }
  
    const orderDirection = order.toLowerCase() === 'desc' ? -1 : 1;
    const dataCopy = [...data];
  
    return dataCopy.sort((a, b) => {
      if (a[orderByColumn] < b[orderByColumn]) return -1 * orderDirection;
      if (a[orderByColumn] > b[orderByColumn]) return 1 * orderDirection;
      return 0;
    });
  };
  

  const binData = (data, binBy, groupColors, columnName) => {
    const newGroupColors = {};
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
  
      const colorKey = row[columnName];
      const color = groupColors[colorKey] || generateColor(Object.keys(groupColors).length);
      newGroupColors[binValue] = color;
  
      return { ...row, [binColumnName]: binValue, _color: color };
    });
  
    return { data: updatedData, colors: newGroupColors };
  };
  
  
  
  const renderStepContent = (step) => {
    let joinedData = data1;
    let filteredDataResults = joinedData;

    const preConditions = Array.isArray(step.precondition) ? step.precondition : [];
    const postConditions = Array.isArray(step.postcondition) ? step.postcondition : [];

    if (['joined', 'final', 'where', 'and', 'or','groupBy','binBy', 'orderBy','select'].includes(step.table)) {
      joinedData = joinTables(data1, data2, step.key1, step.key2);
      filteredDataResults = joinedData
    }
    if (['joined', 'where', 'and', 'or'].includes(step.table)) {
      filteredDataResults = applyConditions(filteredDataResults, [...preConditions, ...postConditions]);
    }

    if (['final', 'select','groupBy','orderBy','binBy'].includes(step.table)) {
      filteredDataResults = applyConditions(filteredDataResults, preConditions);
    }

    let groupDataResults = filteredDataResults;
    let groupColors = {};
    let groupByColumns = step.groupByColumns
    if (step.table === 'final' || step.table === 'binBy'|| step.table === 'orderBy'|| (step.table === 'groupBy' && step.groupByColumns)) {
      groupByColumns = step.groupByColumns ? step.groupByColumns.split(',').map(col => col.trim()) : [];
      const groupByResult = groupBy(filteredDataResults, groupByColumns);
      groupDataResults = groupByResult.data;
      groupColors = groupByResult.colors;
    }

    let orderedDataResults = groupDataResults;
    if (step.table === 'final' || step.table === 'binBy' || (step.table === 'orderBy' && step.orderByColumn)) {
      orderedDataResults = orderData(groupDataResults, step.orderByColumn, step.order);
    }

    let binDataResults = orderedDataResults;
    let binGroupColors = groupColors;
    if (step.table === 'final' || (step.table === 'binBy' && step.binBy)) {
      const binResult = binData(orderedDataResults, step.binBy, groupColors, step.columns[0]);
      binDataResults = binResult.data;
      binGroupColors = binResult.colors;
    }

    switch (step.title) {
      case 'Find the table':
        return (
          <div>
            <h5>{step.description}</h5>
            {step.table === 'data' && renderTable(data1, [], 'Table: Data')}
            {step.table === 'name' && renderTable(data2, [], 'Table: Name')}
          </div>
        );
      case 'Find the tables and foreign key for joining':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
              {renderTable(data1, [step.key1], `Initial Table: ${step.table1}`)}
              {renderTable(data2, [step.key2], `Joined Table: ${step.table2}`)}
            </div>
          </div>
        );
      case 'Join tables':
      case 'Show the joined results':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
              {renderTable(joinedData, [], 'Joined Table')}
            </div>
          </div>
        );
      case 'Find the data for where operation':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(joinedData, [], 'Joined Table')}
          </div>
        );
      case 'Filter the data by where condition':
        joinedData = renderfilterData(joinedData, step.whereCondition, 'where');
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(joinedData, [], 'Where-Filtered Data', {}, { 'where': 'lightblue' })}
          </div>
        );
      case 'Show the where results':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(filteredDataResults, [], 'Where-Filtered Table')}
          </div>
        );
      case 'Find the data before and':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(highlightOverlap(joinedData, step.precondition, step.precondition), [], 'Where-Filtered Data', {}, { 'pre': 'rgba(255, 192, 203, 0.5)', 'post': 'rgba(255, 192, 203, 0.5)', 'overlap': 'rgba(255, 192, 203, 0.5)' })}
          </div>
        );
      case 'Find the data after and':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(renderfilterData(joinedData, postConditions[0]['condition'], 'and'), [], 'Filtered-Data based on And', {}, { 'and': 'rgba(173, 216, 230, 0.5)' })}
          </div>
        );
      case 'Show the overlap results':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(highlightOverlap(joinedData, step.precondition, step.postcondition), [], 'Joined Table with Overlap', {}, { 'pre': 'rgba(255, 192, 203, 0.5)', 'post': 'rgba(173, 216, 230, 0.5)', 'overlap': 'rgba(214,204,216)' })}
          </div>
        );
      case 'Show the and results':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(filteredDataResults, [], 'And-Filtered Table')}
          </div>
        );
      case 'Find the data before or':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(highlightOverlap(joinedData, preConditions.slice(0, -1), preConditions.slice(-1)[0]), [], 'And-Filtered Data', {}, { 'pre': 'transparent', 'post': 'transparent', 'overlap': 'rgba(173, 216, 230, 0.5)' })}
          </div>
        );
      case 'Find the data after or':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(renderfilterData(joinedData, postConditions[0]['condition'], 'or'), [], 'Filtered-Data based on Or', {}, { 'or': 'rgba(173, 216, 230, 0.5)' })}
          </div>
        );
      case 'Show the unite results':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(highlightOverlap(joinedData, preConditions, postConditions), [], 'Unite Results', {}, { 'and': 'rgba(173, 216, 230, 0.5)', 'or': 'rgba(173, 216, 230, 0.5)', 'overlap': 'rgba(173, 216, 230, 0.5)' })}
          </div>
        );
      case 'Show the or results':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(filteredDataResults, [], 'Or-Filtered Table')}
          </div>
        );
      case 'Find the column of table':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(filteredDataResults, step.columns, 'Filtered Table')}
          </div>
        );
      case 'Map to the chart Axis':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
              {renderVegaLite(filteredDataResults, step.columns, 'point')}
            </div>
          </div>
        );
      case 'Find the data before group by':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(filteredDataResults, step.columns, 'Filtered Table')}
          </div>
        );
      case 'Group the data':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(groupDataResults, groupByColumns, 'Grouped Data', groupColors)}
          </div>
        );
      case 'Show the group by chart':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
            {renderVegaLite(groupDataResults, step.columns, 'point', step.groupByColumns ? step.groupByColumns.split(',').map(col => col.trim()) : [], null, null, null, groupColors)}            </div>
          </div>
        );
      case 'Find the data before order by':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(groupDataResults, groupByColumns, 'Grouped Data',groupColors)}
          </div>
        );
      case 'Order the data':
        return (
          <div>
            <h5>{step.description}</h5>
            {renderTable(orderedDataResults, groupByColumns, 'Ordered Data', groupColors)}
          </div>
        );
      case 'Show the order by chart':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
            {renderVegaLite(orderedDataResults, step.columns, 'point', step.groupByColumns ? step.groupByColumns.split(',').map(col => col.trim()) : [], null, step.orderByColumn, step.order,groupColors)}
            </div>
          </div>
        );
        case 'Find the data before bin by':
          return (
            <div>
              <h5>{step.description}</h5>
              {renderTable(orderedDataResults, groupByColumns, 'Ordered Data',groupColors)}
            </div>
          );
        case 'Bin the data':
          return (
            <div>
              <h5>{step.description}</h5>
              <div>
              {renderTable(binDataResults, groupByColumns, 'Bined Data', groupColors)}
              </div>
            </div>
          );
        case 'Show the bin by chart':
          return (
            <div>
              <h5>{step.description}</h5>
              <div>
                {renderVegaLite(binDataResults, step.columns, 'point', step.groupByColumns ? step.groupByColumns.split(',').map(col => col.trim()) : [], step.binBy, step.orderByColumn,step.order,groupColors)}
              </div>
            </div>
          );
      case 'Render the chart':
        return (
          <div>
            <h5>{step.description}</h5>
            <div>
              {renderVegaLite(binDataResults, step.columns, step.chartType, step.groupByColumns ? step.groupByColumns.split(',').map(col => col.trim()) : [],step.binBy,step.orderByColumn,step.order,groupColors)}
            </div>
          </div>
        );
      default:
        return <p>{step.description}</p>;
    }
  };

  return (
    <div>
      {steps.map((step, index) => (
        <div key={index} className="mb-3">
          {renderStepContent(step)}
        </div>
      ))}
    </div>
  );
};

export default StepComponent;
