// src/components/TutorialPage.js
import React, { useState, useEffect } from 'react';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization.js';
import StepByStepExplanation from './components/StepByStepExplanation';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import './components/styles/styles.css';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import VQLEditor from './components/VQLEditor.js'

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

function TutorialPage() {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', explanation: [] });
  const [tableData, setTableData] = useState(defaultData);
  const [showVQL, setShowVQL] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state

  const handleAddInterface = () => {
    const newInterface = { id: interfaces.length + 1 };
    setInterfaces([...interfaces, newInterface]);
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < generatedVQL.explanation.length) {
      setCurrentPage(page);
    }
  };

  const handleGenerate = async (generated) => {
    setIsLoading(true); // Start loading
    setError(null); // Clear any previous errors
    try {
      setGeneratedVQL(generated);
      setCurrentPage(0); // Reset to page 0 when new data is generated
    } catch (err) {
      console.error('Error during generation:', err);
      setError('An unexpected error occurred while generating the visualization. Please try again.');
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const handleExecuteVQL = async (edited) => {
    setIsLoading(true);
    setError(null);
    try {
      setGeneratedVQL(edited);
      setCurrentPage(0); // Reset to page 0 when new data is generated
    } catch (err) {
      console.error('Error during VQL execution:', err);
      setError('An error occurred while executing the VQL. Please refine your VQL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataUpdate = (data) => {
    setTableData(data);
  };
  
  useEffect(() => {
    console.log('Generated VQL and explanation updated:', generatedVQL);
}, [generatedVQL]);

  const placeholderText = "Show me a bar chart of the average prices grouped by quarter, including only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000. The results should be ordered by price in descending order.";


  return (
    <div>
      <div className="header">
        <Typography variant="h6" className="title">
          NL2ViZ - Tutorial
        </Typography>
        <div className="vql-switch">
          <Switch color="default" checked={showVQL} onChange={(e) => setShowVQL(e.target.checked)} />
          <Typography variant="body1" component="span">Show VQL</Typography>
        </div>
      </div>
      <div className="content">
        {interfaces.map((iface) => (
          <div key={iface.id} className="interface">
            <div className="first-row">
              <div className="left-column">
              <NaturalLanguageQuery onGenerate={handleGenerate} tableData={tableData} placeholderText={placeholderText}/>
              <DataTable onDataUpdate={handleDataUpdate} tableData={tableData}/>
              </div>
              <div className="right-column">
              {/* {
              isLoading ? (
                  <div className="loading-container">
                    <CircularProgress />
                    <Typography variant="body2" color="textSecondary">Generating visualization...</Typography>
                  </div>
                ) : ( */}
                {
                  generatedVQL.explanation && generatedVQL.explanation.length > 0 && (
                    <div className="visualize">
                      <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
                          <FinalVis
                          VQL={generatedVQL.VQL}
                          explanation={generatedVQL.explanation}
                          tableData={tableData}
                          showVQL={showVQL}
                        />
                      {showVQL && (
                        <VQLEditor
                          initialVQL={generatedVQL.VQL}
                          onExecute={handleExecuteVQL}
                        />
                      )}
                  </div>
                    
                  )
                // )
              }
              </div>
            </div>
            <hr />
            <div className="second-row">
              {generatedVQL.explanation && generatedVQL.explanation.length > 0 && (
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
    </div>
  );
}

export default TutorialPage;
