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
import Button from '@mui/material/Button';


function FixedTaskNL2Vis({data, userId }) {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({
    VQL: 'visualize scatter select manager_id, avg(salary) from employee group by manager_id order by manager_id asc',
    vegaLiteSpec: null,
    explanation: [
      { step: 1, operation: 'FROM', description: 'Specify the source table employee.', clause: 'FROM employee' },
      { step: 2, operation: 'GROUP BY', description: 'Group data by manager_id.', clause: 'GROUP BY manager_id' },
      { step: 3, operation: 'SELECT', description: 'Select the manager_id and the average of salary columns.', clause: 'SELECT manager_id, AVG(salary)' },
      { step: 4, operation: 'ORDER BY', description: 'Order the results by manager_id in ascending order.', clause: 'ORDER BY manager_id ASC' },
      { step: 5, operation: 'VISUALIZE', description: 'Visualize the results as a scatter plot (default type).', clause: 'VISUALIZE scatter' }
    ]
  });
  const [tableData, setTableData] = useState(data.data);
  const [showVQL, setShowVQL] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState(null); // Error state
  const [showExplanation, setShowExplanation] = useState(false); // New state to control explanation visibility
  const [elapsedTime, setElapsedTime] = useState(0); // Timer state in seconds
  const [isRunning, setIsRunning] = useState(false); // Timer running state
  const [hasEnded, setHasEnded] = useState(false); // Track if the timer has ended

  // Load the timer state from localStorage on component mount
  useEffect(() => {
    const savedTime = parseFloat(localStorage.getItem('elapsedTime'));
    const savedIsRunning = localStorage.getItem('isRunning') === 'true';

    if (!isNaN(savedTime)) {
      setElapsedTime(savedTime);
    }
    setIsRunning(savedIsRunning);
  }, []);

  useEffect(() => {
    let timer;

    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = prevTime + 0.01;
          localStorage.setItem('elapsedTime', newTime.toFixed(2)); // Save the updated time
          return newTime;
        });
      }, 10); // Update every 10 milliseconds for 2 decimal places
    }

    return () => {
      clearInterval(timer);
    };
  }, [isRunning]);

  const handleStartTimer = () => {
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem('isRunning', 'true'); // Save running state
  };

  const handleEndTimer = () => {
    setIsRunning(false);
    setHasEnded(true); // Set the timer as ended
    localStorage.setItem('isRunning', 'false'); // Save running state
  };

  const handleRestartTimer = () => {
    setElapsedTime(0);
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem('elapsedTime', '0'); // Reset time
    localStorage.setItem('isRunning', 'true'); // Start running again
  };

  // Calculate minutes and seconds from elapsedTime
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = (elapsedTime % 60).toFixed(2);
  
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
        <div className='timer'>
        <Typography variant="h6" className="timer">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds} minutes
      </Typography>
      <div>
        {isRunning ? (
          <>
            <Button 
              variant="outlined" 
              onClick={handleEndTimer}
              sx={{ 
                borderRadius: '12px', 
                padding: '5px 15px', 
                fontWeight: 'normal', 
                fontSize: '14px',
                textTransform: 'none',
                color: '#666666', // Light gray text
                borderColor: 'white', // White border
                backgroundColor: '#f9f9f9', // Very light gray background
                '&:hover': {
                  backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                  borderColor: '#bbbbbb', // Slightly darker border on hover
                },
                marginRight: '10px',
              }}
            >
              End
            </Button>  
            <Button 
              variant="outlined" 
              onClick={handleRestartTimer}
              sx={{ 
                borderRadius: '12px', 
                padding: '5px 15px', 
                fontWeight: 'normal', 
                fontSize: '14px',
                textTransform: 'none',
                color: '#666666', // Light gray text
                borderColor: 'white', // White border
                backgroundColor: '#f9f9f9', // Very light gray background
                '&:hover': {
                  backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                  borderColor: '#bbbbbb', // Slightly darker border on hover
                },
              }}
            >
              Restart
            </Button>        
          </>
        ) : hasEnded ? (
          <>
            <Button 
              variant="outlined" 
              onClick={handleStartTimer}
              sx={{ 
                borderRadius: '12px', 
                padding: '5px 15px', 
                fontWeight: 'normal', 
                fontSize: '14px',
                textTransform: 'none',
                color: '#666666', // Light gray text
                borderColor: 'white', // White border
                backgroundColor: '#f9f9f9', // Very light gray background
                '&:hover': {
                  backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                  borderColor: '#bbbbbb', // Slightly darker border on hover
                },
                marginRight: '10px',
              }}
            >
              Start
            </Button>  
            <Button 
              variant="outlined" 
              onClick={handleRestartTimer}
              sx={{ 
                borderRadius: '12px', 
                padding: '5px 15px', 
                fontWeight: 'normal', 
                fontSize: '14px',
                textTransform: 'none',
                color: '#666666', // Light gray text
                borderColor: 'white', // White border
                backgroundColor: '#f9f9f9', // Very light gray background
                '&:hover': {
                  backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                  borderColor: '#bbbbbb', // Slightly darker border on hover
                },
              }}
            >
              Restart
            </Button>  
          </>
        ) : (
          <Button 
            variant="outlined" 
            onClick={handleStartTimer}
            sx={{ 
              borderRadius: '12px', 
              padding: '5px 15px', 
              fontWeight: 'normal', 
              fontSize: '14px',
              textTransform: 'none',
              color: '#666666', // Light gray text
              borderColor: 'white', // White border
              backgroundColor: '#f9f9f9', // Very light gray background
              '&:hover': {
                backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                borderColor: '#bbbbbb', // Slightly darker border on hover
              },
            }}
          >
            Start
          </Button>  
        )}
      </div>
      </div>

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
          {showExplanation&&
          <><hr />
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
          </div></>
}
        </div>
      ))}
    </div>
    </div>
  );
}

export default FixedTaskNL2Vis;
