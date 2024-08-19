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
    departments: [
      {
        "department_id": 10,
        "department_name": "administration",
        "manager_id": 200,
        "location_id": 1700
      },
      {
        "department_id": 20,
        "department_name": "marketing",
        "manager_id": 201,
        "location_id": 1800
      },
      {
        "department_id": 30,
        "department_name": "purchasing",
        "manager_id": 114,
        "location_id": 1700
      },
      {
        "department_id": 40,
        "department_name": "human resources",
        "manager_id": 203,
        "location_id": 2400
      },
      {
        "department_id": 50,
        "department_name": "shipping",
        "manager_id": 121,
        "location_id": 1500
      },
      {
        "department_id": 60,
        "department_name": "it",
        "manager_id": 103,
        "location_id": 1400
      }
    ],
    employee: [
      {
        "employee_id": 200,
        "first_name": "steven",
        "job_id": "ad_pres",
        "salary": 24000,
      },
      {
        "employee_id": 201,
        "first_name": "neena",
        "job_id": "ad_vp",
        "salary": 17000,
      },
      {
        "employee_id": 102,
        "first_name": "lex",
        "job_id": "ad_vp",
        "salary": 17000,
      },
      {
        "employee_id": 114,
        "first_name": "alexander",
        "job_id": "it_prog",
        "salary": 9000,
      },
      {
        "employee_id": 203,
        "first_name": "bruce",
        "job_id": "it_prog",
        "salary": 6000,
      },
      {
        "employee_id": 103,
        "first_name": "david",
        "job_id": "it_prog",
        "salary": 4800,
      },
      {
        "employee_id": 121,
        "first_name": "valli",
        "job_id": "sa_rep",
        "salary": 4500,
      },
      {
        "employee_id": 107,
        "first_name": "diana",
        "job_id": "sa_rep",
        "salary": 4200,
      },
      {
        "employee_id": 108,
        "first_name": "nancy",
        "job_id": "sa_rep",
        "salary": 4000,
      },
      {
        "employee_id": 109,
        "first_name": "daniel",
        "job_id": "sa_rep",
        "salary": 3900,
      }
    ],
  },
  tableNames: ["departments", "employee"]
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
  const placeholderText = "Please display the relationship between department IDs and the salaries of their respective managers.";

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
              <NaturalLanguageQuery onGenerate={handleGenerate} tableData={tableData} placeholderText={placeholderText}/>
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

export default FixedTaskNL2Vis;
