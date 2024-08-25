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
import { Scatter } from 'react-chartjs-2';
import Button from '@mui/material/Button';

function FixedTaskNL2VisExplain({data, userId, pageKey }) {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({
    VQL: 'VISUALIZE bar SELECT dept_name, COUNT(stu_num) FROM student WHERE stu_transfer = 0 GROUP BY dept_name ORDER BY COUNT(stu_num) ASC',
    vegaLiteSpec: null,
    explanation: [
      { step: 1, operation: 'FROM', description: 'Specify the source table student.', clause: 'FROM student' },
      { step: 2, operation: 'WHERE', description: 'Filter data to include only the items where stu_transfer column equals 0.', conditions: [{ condition: 'stu_transfer = 0', explanation: 'Select records where stu_transfer equals 0.' }], clause: 'WHERE stu_transfer = 0' },
      { step: 3, operation: 'GROUP BY', description: 'Group data by dept_name.', clause: 'GROUP BY dept_name' },
      { step: 4, operation: 'SELECT', description: 'Select the dept_name and the count of stu_num.', clause: 'SELECT dept_name, COUNT(stu_num)' },
      { step: 5, operation: 'ORDER BY', description: 'Order the results by the count of stu_num in ascending order.', clause: 'ORDER BY COUNT(stu_num) ASC' },
      { step: 6, operation: 'VISUALIZE', description: 'Visualize the results as a bar chart.', clause: 'VISUALIZE bar' }
    ]
  });
    const [tableData, setTableData] = useState(data.data);
  const [showVQL, setShowVQL] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState(null); // Error state
  const [showExplanation, setShowExplanation] = useState(false); // New state to control explanation visibility
  const [startTime, setStartTime] = useState(null); // Store the start time
  const [elapsedTime, setElapsedTime] = useState(0); // Timer state in seconds
  const [isRunning, setIsRunning] = useState(false); // Timer running state
  const [hasEnded, setHasEnded] = useState(false); // Track if the timer has ended

  const timeKey = `${pageKey}_elapsedTime`; // Unique key for elapsed time in localStorage
  const startTimeKey = `${pageKey}_startTime`; // Key for start time in localStorage
  const runningKey = `${pageKey}_isRunning`; // Unique key for running state in localStorage

  // Load the timer state from localStorage on component mount
  useEffect(() => {
    const savedElapsedTime = parseFloat(localStorage.getItem(timeKey)) || 0;
    const savedStartTime = parseFloat(localStorage.getItem(startTimeKey)) || null;
    const savedIsRunning = localStorage.getItem(runningKey) === 'true';

    if (savedStartTime && savedIsRunning) {
      // If the timer was running, calculate the new elapsed time
      const currentTime = Date.now();
      const additionalTime = (currentTime - savedStartTime) / 1000;
      setElapsedTime(savedElapsedTime + additionalTime);
    } else {
      setElapsedTime(savedElapsedTime);
    }

    setStartTime(savedIsRunning ? Date.now() : null);
    setIsRunning(savedIsRunning);
  }, [timeKey, startTimeKey, runningKey]);

  useEffect(() => {
    let timer;

    if (isRunning) {
      timer = setInterval(() => {
        const currentTime = Date.now();
        const newElapsedTime = (currentTime - startTime) / 1000;
        setElapsedTime(newElapsedTime);
        localStorage.setItem(timeKey, newElapsedTime.toFixed(2)); // Save the updated time
      }, 100); // Update every 100 milliseconds for better accuracy
    }

    return () => {
      clearInterval(timer);
    };
  }, [isRunning, startTime, timeKey]);

  const handleStartTimer = () => {
    const currentTime = Date.now();
    setStartTime(currentTime);
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem(startTimeKey, currentTime); // Save start time
    localStorage.setItem(runningKey, 'true'); // Save running state
  };

  const handleEndTimer = () => {
    setIsRunning(false);
    setHasEnded(true); // Set the timer as ended
    localStorage.setItem(runningKey, 'false'); // Save running state
  };

  const handleRestartTimer = () => {
    const currentTime = Date.now();
    setElapsedTime(0);
    setStartTime(currentTime);
    setIsRunning(true);
    setHasEnded(false); // Reset the end state
    localStorage.setItem(timeKey, '0'); // Reset time
    localStorage.setItem(startTimeKey, currentTime); // Save new start time
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

//   useEffect(() => {
//     console.log('Generated VQL and explanation updated:', generatedVQL);
// }, [generatedVQL]);

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
              text: 'dept_name',
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
              text: 'COUNT(stu_num)',
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
                    {showExplanation&&showVQL && (
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
         <> <hr />
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

export default FixedTaskNL2VisExplain;
