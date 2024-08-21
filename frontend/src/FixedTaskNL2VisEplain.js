// src/components/FixedTaskNL2VisExplain.js
import React, { useState, useEffect } from 'react';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import StepByStepExplanation from './components/StepByStepExplanation';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Visualization from './components/Visualization.js';
import CircularProgress from '@mui/material/CircularProgress';
import './components/styles/styles.css';
import VQLEditor from './components/VQLEditor.js'
import { logEvent } from './utils/logger'; 

function FixedTaskNL2VisExplain({data, userId }) {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', vegaLiteSpec: null, explanation: [] });
  const [tableData, setTableData] = useState(data.data);
  const [showVQL, setShowVQL] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    const taskTitle = `NL2ViZ - Fixed Task 2 with Explanation, ${data.scenario} Scenario`;
    logEvent(userId, `Task started: ${taskTitle}`);
  }, [data.scenario, userId]);

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
      // Your generation logic here, wrapped in try-catch to catch unexpected errors
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

  return (
    <div>
      <div className="header">
        <Typography variant="h6" className="title">    
          {`NL2ViZ - Fixed Task 2 with Explanation, ${data.scenario} Scenario`}
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
                <NaturalLanguageQuery onGenerate={handleGenerate} tableData={tableData} placeholderText={data.placeholderText}/>
                <DataTable onDataUpdate={handleDataUpdate} tableData={tableData}/>
              </div>
              <div className="right-column">
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
                          tableData={tableData}
                        />
                      )}
                      </div>
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
    </div>
  );
}

export default FixedTaskNL2VisExplain;
