import React, { useState } from 'react';
import Button from '@mui/material/Button';
import StarIcon from '@mui/icons-material/Star';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import './styles/navbar.css';
import { logEvent } from '../utils/logger';  // Import the logEvent function

function Navbar({ fixedTaskOrder, openTaskOrder, onSelectPage, setUserId }) {  // Accept setUserId as a prop
  const [selectedLabel, setSelectedLabel] = useState(0);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [logFileName, setLogFileName] = useState('');
  const [userId, setLocalUserId] = useState('');  // Define userId in local state

  // Function to generate a session ID based on the current timestamp
  const generateSessionId = () => {
    const now = new Date();
    return now.toISOString().replace(/[-:.TZ]/g, '');  // Format: YYYYMMDDHHMMSSmmm
  };

  // Function to handle the start session
  const handleStartSession = () => {
    const newUserId = generateSessionId();  // Generate a session ID based on the current time
    setLocalUserId(newUserId);  // Set the local userId
    setUserId(newUserId);  // Set the userId in the App component

    const fileName = `${newUserId}.json`;
    setLogFileName(fileName);

    // Log that the session has started
    logEvent(newUserId, 'Session started');

    setStartDialogOpen(true);
  };

  // Function to handle ending the session
  const handleEndSession = () => {
    logEvent(userId, 'Session ended');  // Log session end
    setEndDialogOpen(true);
  };

  // Function to handle page selection
  const handleSelect = (page, pageName) => {
    setSelectedLabel(page);
    onSelectPage(page);
    logEvent(userId, `Navigated to page ${page}: ${pageName}`);  // Log page navigation with name
  };

  const handleCloseStartDialog = () => {
    setStartDialogOpen(false);
  };

  const handleCloseEndDialog = () => {
    setEndDialogOpen(false);
  };

  return (
    <div className="sidebar">
      {/* Start Button */}
      <Button 
        className="menu-button" 
        color="inherit" 
        aria-label="start" 
        onClick={handleStartSession}
        style={{ marginTop:'5px', marginBottom: '0px' }}
      >
        Start
      </Button>

      {/* Divider Below Start Button */}
      <hr className="divider" />

      <div className="labels">
        <Button 
          className={`label-button ${selectedLabel === 0 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(0, 'Tutorial')}
        >
          <StarIcon />
          <span className="label-text">Tutorial</span>
        </Button>
        
        {fixedTaskOrder.map((task, index) => (
          <Button 
            key={index} 
            className={`label-button ${selectedLabel === index + 1 ? 'selected' : ''}`} 
            color="inherit" 
            onClick={() => handleSelect(index + 1, task.name)}
          >
            <StarIcon />
            <span className="label-text">{task.name}</span>
          </Button>
        ))}
        
        {openTaskOrder.map((task, index) => (
          <Button 
            key={index + fixedTaskOrder.length} 
            className={`label-button ${selectedLabel === index + fixedTaskOrder.length + 1 ? 'selected' : ''}`} 
            color="inherit" 
            onClick={() => handleSelect(index + fixedTaskOrder.length + 1, task.name)}
          >
            <StarIcon />
            <span className="label-text">{task.name}</span>
          </Button>
        ))}
      </div>

      {/* Divider Above End Button */}
      <hr className="divider" />

      {/* End Button */}
      <Button 
        className="end-button" 
        color="inherit" 
        aria-label="end" 
        onClick={handleEndSession}
      >
        End
      </Button>

      {/* Start Dialog */}
      <Dialog
        open={startDialogOpen}
        onClose={handleCloseStartDialog}
      >
        <DialogTitle>Welcome</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Welcome to the user testing session. Please follow the instructions to complete the tasks.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStartDialog} color="primary">
            Start
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Dialog */}
      <Dialog
        open={endDialogOpen}
        onClose={handleCloseEndDialog}
      >
        <DialogTitle>Thank You</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Thank you for participating in the user testing session. Your feedback is valuable.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEndDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Navbar;
