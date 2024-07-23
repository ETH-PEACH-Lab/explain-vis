import React, { useState } from 'react';
import { Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import './styles/naturalLanguageQuery.css';

function NaturalLanguageQuery({ onGenerate, tableData }) {
  const placeholderText = "Show me a bar chart of the average prices grouped by quarter, including only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000. The results should be ordered by price in descending order.";
  const [query, setQuery] = useState(placeholderText);

  const handleGenerate = async () => {
    try {
      const data = tableData;
      const baseUrl = process.env.REACT_APP_API_URL;
      const apiUrl = `${baseUrl}/api/generate-vegalite`;
      console.log('Incoming Data:', JSON.stringify({ query, data }));
      console.log('API URL:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, data }),
      });

      if (response.ok) {
        const result = await response.json();
        const { VQL, vegaLiteSpec } = result;
      
        const explanationApiUrl = `${baseUrl}/api/explain-vql`;
        console.log('API URL:', explanationApiUrl);
        console.log('VQL',JSON.stringify({ VQL }))
        
        const explanationResponse = await fetch(explanationApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ VQL }),
        });
                
        if (explanationResponse.ok) {
          const explanationResult = await explanationResponse.json();
          console.log('result',explanationResult)
          const { explanation } = explanationResult;
          console.log('explanation:', explanation);
          onGenerate({ VQL, vegaLiteSpec, explanation });
        } else {
          console.error('Error fetching explanation');
        }
      } else {
        console.error('Error generating Vega-Lite spec');
      }
    } catch (error) {
      console.error('Error generating Vega-Lite spec:', error);
    }
  };

  return (
    <div className="nl">
      <div className="nl-query-header">
        <Typography variant="h6" className="nl-query-title">Natural Language Query</Typography>
        <Button variant="contained" className="import-btn" style={{ backgroundColor: '#a78cc8', color: 'white', fontWeight: 'bold', marginLeft: '100px', borderRadius: '20px' }} onClick={handleGenerate}>
          Generate
        </Button>
      </div>
      <TextField
        fullWidth
        multiline
        rows={3} 
        InputProps={{ className: "nl-query-input",
          disableUnderline: true, 
          style: { border: 'none' } }}
        placeholder={placeholderText}
        value={query}
        style={{ border: 'none' }}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}

export default NaturalLanguageQuery;
