import React from 'react';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import StarIcon from '@mui/icons-material/Star';
import './styles/navbar.css';

function Navbar({ onSelectPage }) {
  return (
    <div className="sidebar">
      <IconButton className="menu-button" color="inherit" aria-label="menu">
        <MenuIcon />
      </IconButton>
      <div className="labels">
        {/* <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(0)}>
          <StarIcon />
          <span className="label-text">HomePage</span>
        </IconButton> */}
        <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(0)}>
          <StarIcon />
          <span className="label-text">Tutorial</span>
        </IconButton>
        <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(1)}>
          <StarIcon />
          <span className="label-text">Fixed Task 1</span>
        </IconButton>
        <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(2)}>
          <StarIcon />
          <span className="label-text">Fixed Task 2</span>
        </IconButton>
        <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(3)}>
          <StarIcon />
          <span className="label-text">Open Task 1</span>
        </IconButton>
        <IconButton className="label-button" color="inherit" onClick={() => onSelectPage(4)}>
          <StarIcon />
          <span className="label-text">Open Task 2</span>
        </IconButton>
      </div>
    </div>
  );
}

export default Navbar;
