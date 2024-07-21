import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import StarIcon from '@mui/icons-material/Star';
import './styles/navbar.css';

function Navbar({ onAddInterface }) {
  return (
    <div className="sidebar">
      <IconButton className="menu-button" color="inherit" aria-label="menu">
        <MenuIcon />
      </IconButton>
      <IconButton className="add-button" color="inherit" onClick={onAddInterface}>
        <AddIcon />
      </IconButton>
      <div className="labels">
        <IconButton className="label-button" color="inherit">
          <StarIcon />
          <span className="label-text">Label</span>
        </IconButton>
        <IconButton className="label-button" color="inherit">
          <StarIcon />
          <span className="label-text">Label</span>
        </IconButton>
        <IconButton className="label-button" color="inherit">
          <StarIcon />
          <span className="label-text">Label</span>
        </IconButton>
        <IconButton className="label-button" color="inherit">
          <StarIcon />
          <span className="label-text">Label</span>
        </IconButton>
      </div>
    </div>
  );
}

export default Navbar;
