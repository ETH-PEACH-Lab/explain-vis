import React from 'react';
import { Table } from 'react-bootstrap';

const TableComponent = ({ data, columns, title }) => (
  <div className="table-container">
    <h5>{title}</h5>
    <Table striped bordered hover className="table">
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>{row[col.toLowerCase()]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

export default TableComponent;
