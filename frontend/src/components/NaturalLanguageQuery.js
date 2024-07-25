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
      if (query === placeholderText) {
        // 使用测试数据
        const VQL = 'VISUALIZE bar\\nSELECT date, price FROM price\\nJOIN name ON price.id = name.id\\nWHERE (price > 150 AND price < 2000) OR year > 2000\\nGROUP BY date\\nORDER BY avg(price)\\nDESC BIN BY quarter'

        const vegaLiteSpec= {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "data": {
            "values": [
              {"quarter":"2022-Q4","avg_price":2000},
              {"quarter":"2010-Q4","avg_price":1000}
            ]
          },
          "mark": "bar",
          "encoding": {
            "x": {"field": "quarter", "type": "ordinal", "title": "Quarter"},
            "y": {"field": "avg_price", "type": "quantitative", "title": "Average Price"},
            "color": {"field": "quarter", "type": "nominal", "title": "Quarter"},
            "tooltip": [
              {"field": "quarter", "type": "ordinal", "title": "Quarter"},
              {"field": "avg_price", "type": "quantitative", "title": "Average Price"}
            ]
          },
          "config": {
            "axis": {
              "labelFontSize": 12,
              "titleFontSize": 14
            }
          }
        }
        const explanation=[
            {
              "step": 1,
              "operation": "FROM",
              "description": "Specify the source table price.",
              "clause": "FROM price"
            },
            {
              "step": 2,
              "operation": "JOIN",
              "description": "Join the table price with the table name based on the id.",
              "clause": "JOIN name ON price.id = name.id"
            },
            {
              "step": 3,
              "operation": "WHERE",
              "description": "Filter data to include only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000.",
              "conditions": [
                {
                  "condition": "(price > 150 AND price < 2000)",
                  "explanation": "Select records where the price is between 150 and 2000."
                },
                {
                  "condition": "OR year > 2000",
                  "explanation": "Select records where the year is greater than 2000, and extend to the results."
                }
              ],
              "clause": "WHERE (price > 150 AND price < 2000) OR year > 2000"
            },
            {
              "step": 4,
              "operation": "SELECT",
              "description": "Select the date and price columns.",
              "clause": "SELECT date, price"
            },
            {
              "step": 5,
              "operation": "GROUP BY",
              "description": "Group data by date and calculate the average price for each date.",
              "clause": "GROUP BY date"
            },
            {
              "step": 6,
              "operation": "ORDER BY",
              "description": "Order the results by price in descending order.",
              "clause": "ORDER BY price DESC"
            },
            {
              "step": 7,
              "operation": "BIN BY",
              "description": "Bin the data by quarter.",
              "clause": "BIN BY quarter"
            },
            {
              "step": 8,
              "operation": "VISUALIZE",
              "description": "Visualize the results as a bar chart.",
              "clause": "VISUALIZE bar"
            }]
        

        onGenerate({ VQL, vegaLiteSpec, explanation });
      } else {
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
