import React, { useState } from 'react';
import Slider from '@mui/material/Slider';

const RangeSlider = ({ initialRange, min, max, step, onChange }) => {
  const [range, setRange] = useState(initialRange);

  const handleChange = (event, newValue) => {
    setRange(newValue);
    onChange(newValue);
  };

  return (
    <div style={{ width: '200px', margin: '0 10px' }}>
      <Slider
        value={range}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        valueLabelDisplay="auto"
      />
      <div>
        <span>{range[0]}</span> - <span>{range[1]}</span>
      </div>
    </div>
  );
};

export default RangeSlider;
