// src/components/FixedTaskNL2Vis.js
import React, { useState } from 'react';
import NaturalLanguageQuery from './components/NaturalLanguageQuery';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization.js';
import StepByStepExplanation from './components/StepByStepExplanation.js';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import './components/styles/styles.css';
import CircularProgress from '@mui/material/CircularProgress';

const defaultData = {
  tables: {
    employee: [
      {
        "EMPLOYEE_ID": 100,
        "FIRST_NAME": "Steven",
        "JOB_ID": "AD_PRES",
        "SALARY": 24000,
        "MANAGER_ID": 0,
        "DEPARTMENT_ID": 90
      },
      {
        "EMPLOYEE_ID": 101,
        "FIRST_NAME": "Neena",
        "JOB_ID": "AD_VP",
        "SALARY": 17000,
        "MANAGER_ID": 100,
        "DEPARTMENT_ID": 90
      },
      {
        "EMPLOYEE_ID": 102,
        "FIRST_NAME": "Lex",
        "JOB_ID": "AD_VP",
        "SALARY": 17000,
        "MANAGER_ID": 100,
        "DEPARTMENT_ID": 90
      }
    ],
    departments: [
      {
        "DEPARTMENT_ID": 10,
        "DEPARTMENT_NAME": "Administration",
        "MANAGER_ID": 200,
        "LOCATION_ID": 1700
      },
      {
        "DEPARTMENT_ID": 20,
        "DEPARTMENT_NAME": "Marketing",
        "MANAGER_ID": 201,
        "LOCATION_ID": 1800
      },
      {
        "DEPARTMENT_ID": 90,
        "DEPARTMENT_NAME": "Executive",
        "MANAGER_ID": 100,
        "LOCATION_ID": 1700
      }
    ]
  },
  tableNames: ["employee", "departments"]
};


function FixedTaskNL2Vis() {
  const [interfaces, setInterfaces] = useState([{ id: 1 }]);
  const [generatedVQL, setGeneratedVQL] = useState({ VQL: '', vegaLiteSpec: null, explanation: [] });
  const [tableData, setTableData] = useState(defaultData);
  const [showVQL, setShowVQL] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentPage, setCurrentPage] = useState(0);
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

  return (
    <div>
      <div className="header">
        <Typography variant="h6" className="title">
          NL2ViZ - Fixed Task 1 w/o Explanation
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
                <NaturalLanguageQuery onGenerate={handleGenerate} tableData={tableData} />
                <DataTable onDataUpdate={handleDataUpdate} tableData={tableData}/>
              </div>
              <div className="right-column">
              {isLoading ? (
                  <div className="loading-container">
                    <CircularProgress />
                    <Typography variant="body2" color="textSecondary">Generating visualization...</Typography>
                  </div>
                ) : (
                  generatedVQL.explanation.length > 0 && (
                    <FinalVis
                      VQL={generatedVQL.VQL}
                      explanation={generatedVQL.explanation}
                      tableData={tableData}
                      showVQL={showVQL}
                    />
                  )
                )}
              </div>
            </div>
            {/* <hr /> */}
            {/* <div className="second-row">
              {generatedVQL.explanation.length > 0 && (
                <StepByStepExplanation
                  explanation={generatedVQL.explanation}
                  tableData={tableData}
                  showVQL={showVQL}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FixedTaskNL2Vis;
