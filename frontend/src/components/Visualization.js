import React, { useEffect } from 'react';
import { VegaLite } from 'react-vega';
import { Typography, Card, CardContent } from '@mui/material';
import { Chart, LinearScale, CategoryScale, registerables } from 'chart.js';
import './styles/visualization.css';

Chart.register(...registerables, LinearScale, CategoryScale);

function Visualization({ spec, showVQL, vql }) {
  useEffect(() => {
    if (spec) {
      console.log('Visualization received new Vega-Lite spec:', spec);
    }
  }, [spec]);

  const vegaLiteSpec = spec || {
    data: { values: [] },
    mark: 'line',
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'price', type: 'quantitative' }
    }
  };

  const formatVQLLine = (line) => {
    return line.split('').map((char, index) => {
      if (char >= 'A' && char <= 'Z') {
        return <span key={index} className="uppercase-char">{char}</span>;
      } else if (char >= '0' && char <= '9') {
        return <span key={index} className="number-char">{char}</span>;
      } else {
        return <span key={index}>{char}</span>;
      }
    });
  };

  const formattedVQL = vql ? vql.split('\\n').map((line, index) => (
    <Typography key={index} variant="body2" className="vql-line">
      {formatVQLLine(line)}
    </Typography>
  )) : null;

  return (
    <div className="visualize">
      <Typography variant="h6" className="visualize-title">/ Visualization</Typography>
      <VegaLite spec={vegaLiteSpec} />
      {showVQL && (
        <><Typography variant="h6" className="vql-title">/ VQL</Typography>
        <Card className="vql-card">
          <CardContent>
            <div className="vql-content">
              {formattedVQL}
            </div>
          </CardContent>
        </Card></>
      )}
    </div>
  );
}

export default Visualization;
