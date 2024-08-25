// src/components/OpenEndNL2Vis.js
import React, { useState, useEffect } from 'react';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import StepByStepExplanation from './components/StepByStepExplanation';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Visualization from './components/Visualization.js';
import './components/styles/styles.css';
import CircularProgress from '@mui/material/CircularProgress';
import VQLEditor from './components/VQLEditor.js'
import { logEvent } from './utils/logger'; 
import Button from '@mui/material/Button';

function OpenEndNL2Vis({data, userId, pageKey  }) {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', vegaLiteSpec: null, explanation: [] });
  const [tableData, setTableData] = useState(data.data);
  const [showVQL, setShowVQL] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [showExplanation, setShowExplanation] = useState(false); // New state to control explanation visibility
  const [elapsedTime, setElapsedTime] = useState(0); // Timer state in seconds
  const [isRunning, setIsRunning] = useState(false); // Timer running state
  const [hasEnded, setHasEnded] = useState(false); // Track if the timer has ended

  const timeKey = `${pageKey}_elapsedTime`; // Unique key for elapsed time in localStorage
  const runningKey = `${pageKey}_isRunning`; // Unique key for running state in localStorage

  // Load the timer state from localStorage on component mount
  useEffect(() => {
    const savedTime = parseFloat(localStorage.getItem(timeKey));
    const savedIsRunning = localStorage.getItem(runningKey) === 'true';

    if (!isNaN(savedTime)) {
      setElapsedTime(savedTime);
    }
    setIsRunning(savedIsRunning);
  }, [timeKey, runningKey]);

  useEffect(() => {
    let timer;

    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = prevTime + 0.01;
          localStorage.setItem(timeKey, newTime.toFixed(2)); // Save the updated time
          return newTime;
        });
      }, 10); // Update every 10 milliseconds for 2 decimal places
    }

    return () => {
      clearInterval(timer);
    };
  }, [isRunning, timeKey]);

  const handleStartTimer = () => {
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem(runningKey, 'true'); // Save running state
  };

  const handleEndTimer = () => {
    setIsRunning(false);
    setHasEnded(true); // Set the timer as ended
    localStorage.setItem(runningKey, 'false'); // Save running state
  };

  const handleRestartTimer = () => {
    setElapsedTime(0);
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem(timeKey, '0'); // Reset time
    localStorage.setItem(runningKey, 'true'); // Start running again
  };

  // Calculate minutes and seconds from elapsedTime
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = (elapsedTime % 60).toFixed(2);

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
  const placeholderText='...'
  return (
    <div>
      <div className="header">
        <Typography variant="h6" className="title">
          {`NL2ViZ - ${data.scenario} Scenario, Open-ended Task`}
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
                placeholderText={'...'} 
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
                  {generatedVQL.explanation && generatedVQL.explanation.length > 0 && (
                    <FinalVis
                      VQL={generatedVQL.VQL}
                      explanation={generatedVQL.explanation}
                      tableData={tableData}
                      showVQL={showVQL}
                    />
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

export default OpenEndNL2Vis;
