import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import StarIcon from '@mui/icons-material/Star';
import './styles/navbar.css';

function Navbar({ onSelectPage }) {
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
        <IconButton 
          className={`label-button ${selectedLabel === 1 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(1)}
        >
          <StarIcon />
          <span className="label-text">Fixed Task 1</span>
        </IconButton>
        <IconButton 
          className={`label-button ${selectedLabel === 2 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(2)}
        >
          <StarIcon />
          <span className="label-text">Fixed Task 2</span>
        </IconButton>
        <IconButton 
          className={`label-button ${selectedLabel === 3 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(3)}
        >
          <StarIcon />
          <span className="label-text">Open Task 1</span>
        </IconButton>
        <IconButton 
          className={`label-button ${selectedLabel === 4 ? 'selected' : ''}`} 
          color="inherit" 
          onClick={() => handleSelect(4)}
        >
          <StarIcon />
          <span className="label-text">Open Task 2</span>
        </IconButton>
      </div>
    </div>
  );
}

export default Navbar;
