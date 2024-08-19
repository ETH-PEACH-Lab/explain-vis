import React, { useState,useEffect } from 'react';
import Navbar from './components/Navbar.js';
import NaturalLanguageQuery from './components/NaturalLanguageQuery.js';
import DataTable from './components/DataTable.js';
import Visualization from './components/Visualization.js';
import StepByStepExplanation from './components/StepByStepExplanation.js';
import FinalVis from './components/FinalVis.js';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import './components/styles/styles.css';
import HomePage from './Homepage';
import TutorialPage from './TutorialPage';
import FixedTaskNL2Vis from './FixedTaskNL2Vis';
import FixedTaskNL2VisExplain from './FixedTaskNL2VisEplain';
import OpenEndNL2Vis from './OpenEndNL2Vis';
import OpenEndNL2VisExplain from './OpenEndNL2VisEplain';

import './components/styles/styles.css';

function App() {
  const [selectedPage, setSelectedPage] = useState(0); // 0 for home page, 1 for NL2ViZ, 2 for second page
  const [fixedTaskOrder, setFixedTaskOrder] = useState([]);
  const [openTaskOrder, setOpenTaskOrder] = useState([]);

  const dataScenarioFixed1 = {
    data: {
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
    },
    placeholderText: "Please display the relationship between department IDs and the salaries of their respective managers.",
    correctVisualization: {
      chartType: "scatter",
      data: {
        labels: ["Administration", "Marketing", "Purchasing", "Human Resources", "Shipping", "IT"],
        datasets: [
          {
            label: "Scatter Chart",
            data: [24000, 17000, 9000, 6000, 4500, 4800],
            backgroundColor:'#f0eea3',
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'category',
            position: 'bottom',
            title: {
              display: true,
              text: 'department_name',
            },
          },
            y: {
                title: {
                    display: true,
                    text: 'salary',
                },
            },
        },
      },
    }
  };
  
  
  const dataScenarioFixed2 = { /* 固定任务数据场景2 */ };
  const dataScenarioOpen1 = { /* 开放任务数据场景1 */ };
  const dataScenarioOpen2 = { /* 开放任务数据场景2 */ };

  useEffect(() => {
    const fixedScenarios = shuffleArray([
      { name: 'Fixed Task 1', component: FixedTaskNL2Vis, scenario: dataScenarioFixed1 },
      { name: 'Fixed Task 2', component: FixedTaskNL2VisExplain, scenario: dataScenarioFixed2 }
    ]);

    const openScenarios = shuffleArray([
      { name: 'Open Task 1', component: OpenEndNL2Vis, scenario: dataScenarioOpen1 },
      { name: 'Open Task 2', component: OpenEndNL2VisExplain, scenario: dataScenarioOpen2 }
    ]);

    setFixedTaskOrder(fixedScenarios);
    setOpenTaskOrder(openScenarios);
  }, []);

  const handleSelectPage = (page) => {
    setSelectedPage(page);
  };

  const renderTask = () => {
    if (selectedPage === 0) {
      return <TutorialPage />;
    } else if (selectedPage <= fixedTaskOrder.length) {
      const TaskComponent = fixedTaskOrder[selectedPage - 1].component;
      return <TaskComponent data={fixedTaskOrder[selectedPage - 1].scenario} />;
    } else {
      const TaskComponent = openTaskOrder[selectedPage - fixedTaskOrder.length - 1].component;
      return <TaskComponent data={openTaskOrder[selectedPage - fixedTaskOrder.length - 1].scenario} />;
    }
  };

  return (
    <div className="App">
      <Navbar 
        fixedTaskOrder={fixedTaskOrder} 
        openTaskOrder={openTaskOrder} 
        onSelectPage={handleSelectPage} 
      />
      <div className="main-content">
        {renderTask()}
      </div>
    </div>
  );
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

export default App;
