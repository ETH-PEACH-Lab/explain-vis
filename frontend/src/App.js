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
  const [userId, setUserId] = useState(''); 

  const dataScenarioFixed1 = {
    scenario:"Hiring",
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
  const dataScenarioFixed2 = {
    scenario:"Address",
      "data": {
          "tables": {
              "student_addresses": [
                  {
                      "student_id": 6,
                      "address_id": 12,
                      "date_address_from": "2017-10-16 13:56:34",
                      "date_address_to": "2018-03-15 10:37:19",
                      "monthly_rental": 826.4319,
                      "other_details": "house"
                  },
                  {
                      "student_id": 12,
                      "address_id": 10,
                      "date_address_from": "2017-09-23 05:16:17",
                      "date_address_to": "2018-03-05 21:12:37",
                      "monthly_rental": 1032.9782,
                      "other_details": "apartment"
                  },
                  {
                      "student_id": 13,
                      "address_id": 19,
                      "date_address_from": "2017-08-17 11:51:00",
                      "date_address_to": "2018-03-04 13:24:28",
                      "monthly_rental": 644.9306,
                      "other_details": "apartment"
                  },
                  {
                      "student_id": 3,
                      "address_id": 18,
                      "date_address_from": "2017-06-19 12:39:39",
                      "date_address_to": "2018-03-02 00:19:57",
                      "monthly_rental": 1113.0996,
                      "other_details": "house"
                  },
                  {
                      "student_id": 7,
                      "address_id": 13,
                      "date_address_from": "2018-01-13 22:56:06",
                      "date_address_to": "2018-03-22 17:56:20",
                      "monthly_rental": 1067.8383,
                      "other_details": "house"
                  },
                  {
                      "student_id": 11,
                      "address_id": 12,
                      "date_address_from": "2018-02-18 06:58:49",
                      "date_address_to": "2018-02-27 04:45:57",
                      "monthly_rental": 747.5312,
                      "other_details": "house"
                  },
                  {
                      "student_id": 5,
                      "address_id": 13,
                      "date_address_from": "2017-03-29 18:22:55",
                      "date_address_to": "2018-03-14 09:12:05",
                      "monthly_rental": 1036.8462,
                      "other_details": "apartment"
                  },
                  {
                      "student_id": 7,
                      "address_id": 3,
                      "date_address_from": "2017-04-28 06:27:14",
                      "date_address_to": "2018-03-23 09:52:56",
                      "monthly_rental": 894.0958,
                      "other_details": "house"
                  },
                  {
                      "student_id": 1,
                      "address_id": 5,
                      "date_address_from": "2017-11-12 04:24:02",
                      "date_address_to": "2018-03-14 17:00:44",
                      "monthly_rental": 1007.2597,
                      "other_details": "apartment"
                  },
                  {
                      "student_id": 15,
                      "address_id": 1,
                      "date_address_from": "2018-03-05 19:28:26",
                      "date_address_to": "2018-03-15 04:44:58",
                      "monthly_rental": 1032.8717,
                      "other_details": "apartment"
                  }
              ]
          },
          "tableNames": [
              "student_addresses"
          ]
      },  
    placeholderText: "Please show correlation between student_id and the corresponding amounts.",
  };
  const dataScenarioOpen1 = { 
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
    placeholderText: "...",
 };
  const dataScenarioOpen2 = { 
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
    placeholderText: "...",
 };

  useEffect(() => {
    const fixedScenarios = shuffleArray([
      { name: `Fixed Task - ${dataScenarioFixed1.scenario}`, component: FixedTaskNL2Vis, scenario: dataScenarioFixed1 },
      { name: `Fixed Task - ${dataScenarioFixed2.scenario}`, component: FixedTaskNL2VisExplain, scenario: dataScenarioFixed2 }
    ]);
  
    const openScenarios = shuffleArray([
      { name: `Open Task - ${dataScenarioOpen1.scenario}`, component: OpenEndNL2Vis, scenario: dataScenarioOpen1 },
      { name: `Open Task - ${dataScenarioOpen2.scenario}`, component: OpenEndNL2VisExplain, scenario: dataScenarioOpen2 }
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
      return <TaskComponent data={fixedTaskOrder[selectedPage - 1].scenario} userId={userId} />;  // Pass userId as a prop
    } else {
      const TaskComponent = openTaskOrder[selectedPage - fixedTaskOrder.length - 1].component;
      return <TaskComponent data={openTaskOrder[selectedPage - fixedTaskOrder.length - 1].scenario} userId={userId} />;  // Pass userId as a prop
    }
  };

  return (
    <div className="App">
      <Navbar 
        fixedTaskOrder={fixedTaskOrder} 
        openTaskOrder={openTaskOrder} 
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
