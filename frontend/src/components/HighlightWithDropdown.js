import React, { useState } from 'react';
import { Popover, MenuItem } from '@mui/material';

const HighlightWithDropdown = ({ text, options, onChange, className }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (option) => {
    onChange(option);
    handleClose();
  };

  return (
    <span onMouseEnter={handleMouseEnter} className={className} style={{ cursor: 'pointer' }}>
      {text}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} onClick={() => handleMenuItemClick(option)}>
            {option}
          </MenuItem>
        ))}
      </Popover>
    </span>
  );
};

export default HighlightWithDropdown;
