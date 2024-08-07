import React, { useState } from 'react';
import Navbar from './components/Navbar';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization';
import StepByStepExplanation from './components/StepByStepExplanation';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import './components/styles/styles.css';

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
    stock: [
      { id: 'r1', quantity: 50 },
      { id: 'r2', quantity: 30 },
      { id: 'r3', quantity: 100 },
      { id: 'r4', quantity: 25 },
    ]
  },
  tableNames: ['price', 'name', 'stock']
};

function App() {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', vegaLiteSpec: null, explanation: [] });
  const [tableData, setTableData] = useState(defaultData);
  const [showVQL, setShowVQL] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const handleAddInterface = () => {
    const newInterface = { id: interfaces.length + 1 };
    setInterfaces([...interfaces, newInterface]);
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < generatedVQL.explanation.length) {
      setCurrentPage(page);
    }
    console.log('page', page);
  }

  const handleGenerate = (generated) => {
    console.log('Generated data received:', generated);
    setGeneratedVQL(generated);
  };

  const handleDataUpdate = (data) => {
    console.log('Table data updated:', data);
    setTableData(data);
  };

  const handleVQLSwitch = (event) => {
    setShowVQL(event.target.checked);
  };

  return (
    <div className="App">
      <Navbar onAddInterface={handleAddInterface} />
      <div className="main-content">
        <div className="header">
          <Typography variant="h6" className="title">
            NL2ViZ
          </Typography>
          <div className="vql-switch">
            <Switch color="default" checked={showVQL} onChange={handleVQLSwitch} />
            <Typography variant="body1" component="span">Show VQL</Typography>
          </div>
        </div>
        <div className="content">
          {interfaces.map((iface) => (
            <div key={iface.id} className="interface">
              <div className="first-row">
                <div className="left-column">
                  <NaturalLanguageQuery onGenerate={handleGenerate} tableData={tableData} />
                  <DataTable onDataUpdate={handleDataUpdate} />
                </div>
                <div className="right-column">
                {generatedVQL.explanation.length > 0 && (
                  <FinalVis
                    VQL={generatedVQL.VQL}
                    explanation={generatedVQL.explanation}
                    tableData={tableData}
                    showVQL={showVQL}
                  />
                )}
                </div>
              </div>
              <hr />
              <div className="second-row">
              {generatedVQL.explanation.length > 0 && (
                  <StepByStepExplanation
                    explanation={generatedVQL.explanation}
                    tableData={tableData}
                    showVQL={showVQL}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        {/* <div className="pagination">
          <span>← Previous</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>…</span>
          <span>6</span>
          <span>7</span>
          <span>Next →</span>
        </div> */}
      </div>
    </div>
  );
}

export default App;
