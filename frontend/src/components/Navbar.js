import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import StarIcon from '@mui/icons-material/Star';
import './styles/navbar.css';

function Navbar({ fixedTaskOrder, openTaskOrder, onSelectPage }) {
  const [selectedLabel, setSelectedLabel] = useState(0);

  const handleSelect = (page) => {
    setSelectedLabel(page);
    onSelectPage(page);
  };

  return (
    <div className="sidebar">
      <IconButton className="menu-button" color="inherit" aria-label="menu">
        <MenuIcon />
      </IconButton>
      <div className="labels">
        <IconButton 
          className={`label-button ${selectedLabel === 0 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(0)}
        >
          <StarIcon />
          <span className="label-text">Tutorial</span>
        </IconButton>
        
        {fixedTaskOrder.map((task, index) => (
          <IconButton 
            key={index} 
            className={`label-button ${selectedLabel === index + 1 ? 'selected' : ''}`} 
            color="inherit" 
            onClick={() => handleSelect(index + 1)}
          >
            <StarIcon />
            <span className="label-text">{task.name}</span>
          </IconButton>
        ))}
        
        {openTaskOrder.map((task, index) => (
          <IconButton 
            key={index + fixedTaskOrder.length} 
            className={`label-button ${selectedLabel === index + fixedTaskOrder.length + 1 ? 'selected' : ''}`} 
            color="inherit" 
            onClick={() => handleSelect(index + fixedTaskOrder.length + 1)}
          >
            <StarIcon />
            <span className="label-text">{task.name}</span>
          </IconButton>
        ))}
      </div>
    </div>
  );
}

export default Navbar;
