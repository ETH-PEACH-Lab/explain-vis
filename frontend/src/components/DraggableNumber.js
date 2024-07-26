import React, { useState } from 'react';

const DraggableNumber = ({ initialNumber, min, max, step, onChange }) => {
  const [number, setNumber] = useState(initialNumber);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = (event) => {
    setDragging(true);
    setStartX(event.clientX);
  };

  const handleMouseMove = (event) => {
    if (dragging) {
      const deltaX = event.clientX - startX;
      let newNumber = number + deltaX * step;
      if (newNumber < min) newNumber = min;
      if (newNumber > max) newNumber = max;
      setNumber(newNumber);
      onChange(newNumber);
      setStartX(event.clientX); // 更新 startX 以使拖动过程更平滑
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  return (
    <span
      onMouseDown={handleMouseDown}
      style={{ color: 'blue', cursor: 'ew-resize', userSelect: 'none' }}
    >
      {Math.round(number * 100) / 100+' '} 
    </span>
  );
};

export default DraggableNumber;
