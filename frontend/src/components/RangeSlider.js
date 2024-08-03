import React, { useState } from 'react';
import Slider from '@mui/material/Slider';

const RangeSlider = ({ initialRange, min, max, step, onChange, fixedEnds }) => {
  const [range, setRange] = useState(initialRange);

  const handleChange = (event, newValue) => {
    if (fixedEnds === 'left') {
      newValue[0] = initialRange[0]; // Fix the left end
    } else if (fixedEnds === 'right') {
      newValue[1] = initialRange[1]; // Fix the right end
    }
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
        disableSwap
      />
      <div>
        <span>{range[0]}</span> - <span>{range[1]}</span>
      </div>
    </div>
  );
};

export default RangeSlider;
