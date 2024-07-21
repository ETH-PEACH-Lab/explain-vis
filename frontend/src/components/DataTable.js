import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import * as XLSX from 'xlsx';
import './styles/dataTable.css';

const defaultData = {
  tables: {
    price: [
      { date: '1998-01-01', month: 1, year: 1998, price: 100, id: 'r1' },
      { date: '2010-12-05', month: 12, year: 2010, price: 1000, id: 'r2' },
      { date: '2020-03-15', month: 3, year: 2020, price: 150, id: 'r3' },
      { date: '2022-10-10', month: 10, year: 2022, price: 2000, id: 'r4' },
    ],
    name: [
      { id: 'r1', name: 'apple' },
      { id: 'r2', name: 'pear' },
      { id: 'r3', name: 'banana' },
      { id: 'r4', name: 'orange' },
    ],
  },
  tableNames: ['price', 'name']
};

function DataTable({ onDataUpdate }) {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    onDataUpdate(data);
  }, [data, onDataUpdate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const newTables = {};
      const newTableNames = workbook.SheetNames;

      workbook.SheetNames.forEach(sheetName => {
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const headers = sheet[0];
        const rows = sheet.slice(1).map(row => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          return rowData;
        });
        newTables[sheetName] = rows;
      });

      setData({
        tables: newTables,
        tableNames: newTableNames
      });
    };

    reader.readAsBinaryString(file);
  };

  const currentTableName = data.tableNames[tabValue];
  const currentTable = data.tables[currentTableName];

  return (
    <div className="data-table-section">
      <Box display="flex" justifyContent="space-between" alignItems="center">
      <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="#714288" textColor="#714288" centered>
      {data.tableNames.map((tableName, index) => (
            <Tab label={tableName} key={index} />
          ))}
        </Tabs>
        <Button
          variant="contained"
          component="label"
          className="import-btn"
          style={{ backgroundColor: '#ece9ed', color: 'gray', fontWeight: 'bold', marginLeft: '100px', borderRadius: '20px' }}
        >
          Import
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </Box>
      <TableContainer component={Paper} className="data-table-container">
        <Table>
          <TableHead>
            <TableRow>
              {currentTable && Object.keys(currentTable[0]).map((col, index) => (
                <TableCell key={index}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentTable && currentTable.map((row, index) => (
              <TableRow key={index}>
                {Object.values(row).map((value, i) => (
                  <TableCell key={i}>{value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default DataTable;
