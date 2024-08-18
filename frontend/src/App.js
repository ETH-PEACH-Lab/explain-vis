import React, { useState } from 'react';
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
import OpenEndNL2VisEplain from './OpenEndNL2VisEplain';

import './components/styles/styles.css';

function App() {
  const [selectedPage, setSelectedPage] = useState(0); // 0 for home page, 1 for NL2ViZ, 2 for second page

  const handleSelectPage = (page) => {
    setSelectedPage(page);
  };

  return (
    <div className="App">
      <Navbar onSelectPage={handleSelectPage} />
      <div className="main-content">
        {/* {selectedPage === 0 && <HomePage />} */}
        {selectedPage === 0 && <TutorialPage />}
        {selectedPage === 1 && <FixedTaskNL2Vis />}
        {selectedPage === 2 && <FixedTaskNL2VisExplain />}
        {selectedPage === 3 && <OpenEndNL2Vis />}
        {selectedPage === 4 && <OpenEndNL2VisEplain />}
      </div>
    </div>
  );
}

export default App;
