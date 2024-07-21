import React from 'react';
import { VegaLite } from 'react-vega';

const ChartComponent = ({ vegaSpec }) => {
  return (
    <div className="chart-container" style={{ width: '100%', height: '100%' }}>
      {vegaSpec && Object.keys(vegaSpec).length > 0 ? (
        <VegaLite spec={vegaSpec} width={300} height={180} />
      ) : (
        <p>No chart data available</p>
      )}
    </div>
  );
};

export default ChartComponent;
