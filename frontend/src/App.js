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
  const [selectedPage, setSelectedPage] = useState(0); // 0 for tutorial page
  const [taskOrder, setTaskOrder] = useState([]);
  const [userId, setUserId] = useState('default');

  const dataScenario1 = {
    scenario:"Hiring",
    data: {
      tables: {
        departments: [
          {
            "department_id": 10,
            "department_name": "administration",
            "manager_id": 200,
            "location_id": 1700,
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
            "department_id": 10,
            "first_name": "steven",
            "job_id": "ad_pres",
            "salary": 24000,
            "hire_date": "2001-06-17"
          },
          {
            "employee_id": 201,
            "department_id": 20,
            "first_name": "neena",
            "job_id": "ad_vp",
            "salary": 17000,
            "hire_date": "2005-09-21"
          },
          {
            "employee_id": 102,
            "department_id": 90,
            "first_name": "lex",
            "job_id": "ad_vp",
            "salary": 17000,
            "hire_date": "2006-01-13"
          },
          {
            "employee_id": 114,
            "department_id": 30,
            "first_name": "alexander",
            "job_id": "it_prog",
            "salary": 9000,
            "hire_date": "2007-03-15"
          },
          {
            "employee_id": 203,
            "department_id": 40,
            "first_name": "bruce",
            "job_id": "it_prog",
            "salary": 6000,
            "hire_date": "2008-07-11"
          },
          {
            "employee_id": 103,
            "department_id": 60,
            "first_name": "david",
            "job_id": "it_prog",
            "salary": 4800,
            "hire_date": "2010-02-23"
          },
          {
            "employee_id": 121,
            "department_id": 50,
            "first_name": "valli",
            "job_id": "sa_rep",
            "salary": 4500,
            "hire_date": "2012-04-10"
          },
          {
            "employee_id": 107,
            "department_id": 60,
            "first_name": "diana",
            "job_id": "sa_rep",
            "salary": 4200,
            "hire_date": "2013-06-01"
          },
          {
            "employee_id": 108,
            "department_id": 100,
            "first_name": "nancy",
            "job_id": "sa_rep",
            "salary": 4000,
            "hire_date": "2014-08-18"
          },
          {
            "employee_id": 109,
            "department_id": 100,
            "first_name": "daniel",
            "job_id": "sa_rep",
            "salary": 3900,
            "hire_date": "2015-11-30"
          }
        ],
        jobs: [
          {
            "job_id": "ad_pres",
            "job_title": "President",
            "min_salary": 20000,
            "max_salary": 40000
          },
          {
            "job_id": "ad_vp",
            "job_title": "Vice President",
            "min_salary": 15000,
            "max_salary": 30000
          },
          {
            "job_id": "it_prog",
            "job_title": "Programmer",
            "min_salary": 4000,
            "max_salary": 12000
          },
          {
            "job_id": "sa_rep",
            "job_title": "Sales Representative",
            "min_salary": 3000,
            "max_salary": 10000
          }
        ]
      },
      tableNames: ["departments", "employee", "jobs"]
    },    
    placeholderText: "Please display the relationship between departments and the salaries of their respective managers.",
  };
  const dataScenario2 = { 
    scenario:"College",
    "data": {
        "tables": {
            "student": [
                {
                    "stu_num": 324299,
                    "stu_fname": "John",
                    "stu_class": "Fr",
                    "stu_gpa": 2.92,
                    "stu_transfer": 0,
                    "dept_code": "ACCT"
                },
                {
                    "stu_num": 324257,
                    "stu_fname": "Anne",
                    "stu_class": "Jr",
                    "stu_gpa": 3.27,
                    "stu_transfer": 1,
                    "dept_code": "CIS"
                },
                {
                    "stu_num": 324269,
                    "stu_fname": "Walter",
                    "stu_class": "Jr",
                    "stu_gpa": 3.09,
                    "stu_transfer": 0,
                    "dept_code": "CIS"
                },
                {
                    "stu_num": 321452,
                    "stu_fname": "William",
                    "stu_class": "So",
                    "stu_gpa": 2.84,
                    "stu_transfer": 0,
                    "dept_code": "BIOL"
                },
                {
                    "stu_num": 324258,
                    "stu_fname": "Juliette",
                    "stu_class": "So",
                    "stu_gpa": 2.26,
                    "stu_transfer": 1,
                    "dept_code": "ACCT"
                },
                {
                    "stu_num": 324291,
                    "stu_fname": "Gerald",
                    "stu_class": "Sr",
                    "stu_gpa": 3.87,
                    "stu_transfer": 0,
                    "dept_code": "EDU"
                },
                {
                    "stu_num": 324274,
                    "stu_fname": "Raphael",
                    "stu_class": "Sr",
                    "stu_gpa": 3.15,
                    "stu_transfer": 0,
                    "dept_code": "ACCT"
                },
                {
                    "stu_num": 324273,
                    "stu_fname": "John",
                    "stu_class": "Sr",
                    "stu_gpa": 2.11,
                    "stu_transfer": 1,
                    "dept_code": "ENGL"
                }
            ],
            "enroll": [
                {
                    "class_code": "10014",
                    "stu_num": 321452,
                    "enroll_grade": "C"
                },
                {
                    "class_code": "10014",
                    "stu_num": 324257,
                    "enroll_grade": "B"
                },
                {
                    "class_code": "10018",
                    "stu_num": 321452,
                    "enroll_grade": "A"
                },
                {
                    "class_code": "10018",
                    "stu_num": 324257,
                    "enroll_grade": "B"
                },
                {
                    "class_code": "10021",
                    "stu_num": 321452,
                    "enroll_grade": "C"
                },
                {
                    "class_code": "10021",
                    "stu_num": 324257,
                    "enroll_grade": "C"
                }
            ],
            "department": [
                {
                    "dept_code": "ACCT",
                    "dept_name": "Accounting"
                },
                {
                    "dept_code": "BIOL",
                    "dept_name": "Biology"
                },
                {
                    "dept_code": "CIS",
                    "dept_name": "Computer Info. Systems"
                }
            ]
        },
        "tableNames": [
            "student",
            "enroll",
            "department"
        ]
    },
    placeholderText: "Please show me the students in each class.",
 };

 useEffect(() => {
  // Shuffle the data scenarios
  // const scenarioOrder = shuffleArray([dataScenario1, dataScenario2]);
  const scenarioOrder = [dataScenario1, dataScenario2];

  // Define the vis and expl groups
  const visGroup = [
    { name: `${scenarioOrder[0].scenario} - Fixed Task`, component: FixedTaskNL2Vis, scenario: scenarioOrder[0] },
    { name: `${scenarioOrder[0].scenario} - Open Task`, component: OpenEndNL2Vis, scenario: scenarioOrder[0] },
  ];

  const explGroup = [
    { name: `${scenarioOrder[1].scenario} - Fixed Task`, component: FixedTaskNL2VisExplain, scenario: scenarioOrder[1] },
    { name: `${scenarioOrder[1].scenario} - Open Task`, component: OpenEndNL2VisExplain, scenario: scenarioOrder[1] },
  ];

  // Shuffle the group order (vis/expl)
  // const finalTaskOrder = shuffleArray([visGroup, explGroup]).flat();
  const finalTaskOrder = [visGroup, explGroup].flat();

  setTaskOrder(finalTaskOrder);
}, []);

const handleSelectPage = (page) => {
  setSelectedPage(page);
};

const renderTask = () => {
  if (selectedPage === 0) {
    return <TutorialPage userId={userId} />;
  } else if (selectedPage <= taskOrder.length) {
    const TaskComponent = taskOrder[selectedPage - 1].component;
    return <TaskComponent data={taskOrder[selectedPage - 1].scenario} userId={userId} />;  // Pass userId as a prop
  }
};

return (
  <div className="App">
    <Navbar 
      taskOrder={taskOrder} 
      onSelectPage={handleSelectPage} 
      setUserId={setUserId} 
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