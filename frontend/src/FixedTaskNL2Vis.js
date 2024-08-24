// src/components/FixedTaskNL2Vis.js
import React, { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization.js';
import StepByStepExplanation from './components/StepByStepExplanation.js';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import './components/styles/styles.css';
import CircularProgress from '@mui/material/CircularProgress';
import { Chart } from 'react-chartjs-2';
import { logEvent } from './utils/logger'; 
import VQLEditor from './components/VQLEditor.js'

function FixedTaskNL2Vis({data, userId }) {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', vegaLiteSpec: null, explanation: [] });
  const [tableData, setTableData] = useState(data.data);
  const [showVQL, setShowVQL] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState(null); // Error state
  const [showExplanation, setShowExplanation] = useState(false); // New state to control explanation visibility

  useEffect(() => {
    const taskTitle = `NL2ViZ - Fixed Task 1 w/o Explanation, ${data.scenario} Scenario`;
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

  const handleDataUpdate = (data) => {
    setTableData(data);
  };

  const FailedScatterChart = () => {
    return (
      <Scatter 
        data={{
          labels: [''], // 强制显示
          datasets: [{
            backgroundColor: '#f0eea3',
            label: 'Empty Chart',
            data: [] // 空数据
          }]
        }} 
        options={{
          scales: {
            x: {
              position: 'bottom',
              title: {
                display: true,
                text: 'manager_id',
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
                text: 'avg(salary)',
              },
              ticks: {
                display: true,
              },
              grid: {
                display: true,
              }
            }
          },
          responsive: true,
        }}
      />
    );
  };

  return (
    <div>
      <div className="header">
        <Typography variant="h6" className="title">
          {`NL2ViZ - ${data.scenario} Scenario, Fixed Task`}
        </Typography>
        <div className="vql-switch">
          <Switch color="default" checked={showExplanation} onChange={(e) => setShowExplanation(e.target.checked)} />
          <Typography variant="body1" component="span">Show Explanation</Typography>
          {showExplanation&&
            <><Switch color="default" checked={showVQL} onChange={(e) => setShowVQL(e.target.checked)} /><Typography variant="body1" component="span">Show VQL</Typography></>}
        </div>
      </div>
      <div className="content">
      {interfaces.map((iface) => (
        <div key={iface.id} className="interface">
          <div className="first-row">
            <div className="left-column">
              <NaturalLanguageQuery 
                onGenerate={handleGenerate} 
                tableData={tableData} 
                placeholderText={data.placeholderText} 
                userId={userId}
              />
              <DataTable 
                onDataUpdate={handleDataUpdate} 
                tableData={tableData}
              />
            </div>
            <div className="right-column">
            <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
              <div className="visualize">
              <div className="chart">
                    {generatedVQL.explanation && generatedVQL.explanation.length > 0 ? (
                      <FinalVis
                        VQL={generatedVQL.VQL}
                        explanation={generatedVQL.explanation}
                        tableData={tableData}
                        showVQL={showVQL}
                      />
                    ) : (
                      <FailedScatterChart /> 
                    )}
                  </div>
                {generatedVQL.explanation && generatedVQL.explanation.length > 0 && (
                  <div>
                    {showVQL && (
                      <VQLEditor
                        initialVQL={generatedVQL.VQL}
                        onExecute={handleExecuteVQL}
                        tableData={tableData}
                        userId={userId}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <hr />
          <div className="second-row">
            {generatedVQL.explanation && generatedVQL.explanation.length > 0 && (
              <StepByStepExplanation
                VQL={generatedVQL.VQL}
                explanation={generatedVQL.explanation}
                tableData={tableData}
                showVQL={showVQL}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                userId={userId}
              />
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

export default FixedTaskNL2Vis;
