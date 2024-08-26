import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import './styles/naturalLanguageQuery.css';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
// import { logEvent } from '../utils/logger'; 

function NaturalLanguageQuery({ onGenerate, tableData, placeholderText, userId }) {
  const [query, setQuery] = useState(placeholderText);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [latestLog, setLatestLog] = useState(null); // State to hold latest log

  const fetchProgress = async () => {
    const baseUrl = process.env.REACT_APP_API_URL;
    const progressUrl = `${baseUrl}/api/progress`;
    try {
      const response = await fetch(progressUrl);
      const text = await response.text();  // 获取响应的原始文本
      console.log('Response Text:', text);  // 输出响应文本
      const data = JSON.parse(text);  // 解析文本为JSON
      setLatestLog(data.latestLog);
      if (data.latestLog) {
        console.log(`Current Attempt: ${data.latestLog.attempt}`);
      }
    } catch (error) {
      console.error('Error fetching progress logs:', error.message);
    }
  };
  

  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        fetchProgress().then((newLog) => {
          if (newLog && newLog.attempt !== latestLog.attempt) {
            setLatestLog(newLog); // 仅当有新数据时才更新状态
          }
        });
      }, 500); // 使用合理的间隔
  
      return () => clearInterval(intervalId); // 清理定时器
    }
  }, [isLoading, latestLog]); // 确保依赖项完整
  
  // useEffect(() => {
  //   if (isLoading && latestLog) {
  //     console.log(`Rendering: Attempt ${latestLog.attempt}`);
  //   }
  // }, [latestLog, isLoading]);
  

  const handleGenerate = async () => {
    setIsLoading(true); // Start loading
    setLatestLog(null); // 重置旧状态
    console.log('Generate button clicked');
    // logEvent(userId, 'Generate button clicked');

    const demoText = "Show me a bar chart of the average prices grouped by quarter, including only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000. The results should be ordered by price in descending order.";
  
    try {
      if (query === demoText) {
        // 使用测试数据
        const VQL = 'VISUALIZE bar\nSELECT date, AVG(price)\nFROM price\nJOIN name ON price.id = name.id\nWHERE (price > 150 AND price < 2000) OR year > 2000\nGROUP BY date\nORDER BY avg(price) DESC\nBIN BY quarter'

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
              "description": "Join the table price on id with the table name on id.",
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
              "operation": "GROUP BY",
              "description": "Group data by date.",
              "clause": "GROUP BY date"
            },
            {
              "step": 5,
              "operation": "SELECT",
              "description": "Select the date and the average of price columns.",
              "clause": "SELECT date, AVG(price)"
            },
            {
              "step": 6,
              "operation": "ORDER BY",
              "description": "Order the results by AVG(price) in descending order.",
              "clause": "ORDER BY AVG(price) DESC"
            },
            {
              "step": 7,
              "operation": "BIN BY",
              "description": "Bin the date by quarter.",
              "clause": "BIN BY quarter"
            },
            {
              "step": 8,
              "operation": "VISUALIZE",
              "description": "Visualize the results as a bar chart.",
              "clause": "VISUALIZE bar"
            }]
        
            console.log(`Generated VQL: ${VQL}`);
            console.log(`Generated Explanation: ${JSON.stringify(explanation)}`);

        onGenerate({ VQL, explanation });
      } else {
        
        // console.log('userid',userId)
        console.log(`Natural Language Query Input: ${query}`);
        console.log(`ask api/generate-vegalite`);
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
          body: JSON.stringify({ query, data, userId }),
          mode: 'cors', // Explicitly set CORS mode
        });

        if (response.ok) {
          const result = await response.json();
          setLatestLog(result.logs[result.logs.length - 1]); // 更新最新日志
          let { VQL, logs } = result;
          console.log('Generated VQL:', VQL);
          console.log('Logs:', JSON.stringify(logs));
    
          // VQL = formatVQL(VQL)
          // logEvent(userId, `Generated VQL: ${VQL}`);
          const explanationApiUrl = `${baseUrl}/api/explain-vql`;
          console.log('API URL:', explanationApiUrl);
          console.log('Input VQL',VQL)
          
          const explanationResponse = await fetch(explanationApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ VQL, tableData: data, userId}),
            mode: 'cors', // Explicitly set CORS mode
          });
                  
          if (explanationResponse.ok) {
            const explanationResult = await explanationResponse.json();

            let { explanation, logs: explanationLogs } = explanationResult;
            console.log('explanation:', JSON.stringify(explanation));
            console.log('Explanation Logs from backend:',JSON.stringify(explanationLogs));
            // logEvent(userId, `Generated Explanation: ${JSON.stringify(explanation)}`);

            VQL = explanation.VQL
            explanation = explanation.explanation

            onGenerate({ VQL, explanation});
          } else {
            const { error, logs: explanationLogs } = await explanationResponse.json();
            console.error('Error fetching explanation:', error);
            console.log('Explanation Logs from backend:',JSON.stringify(explanationLogs));
            throw new Error(error || 'Error fetching explanation');
          }
        } else {
          const { error, logs } = await response.json();
          console.error('Error generating VQL spec:', error);
          console.error('Error log in generating VQL spec:', JSON.stringify(error));
          throw new Error(error || 'Error generating VQL spec');
        }
      }
      } catch (error) {
        console.error('Error generating VQL spec:', error);
        setError(error.message);
        setIsModalOpen(true); // Open the modal to show the error
      } finally {
        setIsLoading(false); // End loading
      }
  };

  return (
    <div className="nl">
      <div className="nl-query-header">
        <Typography variant="h6" className="nl-query-title">Natural Language Query</Typography>
        {isLoading && latestLog && (
  <div className="progress-logs" style={{ marginLeft: '100px' }}>
    <Typography variant="body2" style={{ color: 'gray' }}>
      {latestLog.attempt ? `Attempt ${latestLog.attempt} in progress!` : 'Starting new attempt...'}
    </Typography>
  </div>
)}
        <Button
          variant="contained"
          className="import-btn"
          style={{
            backgroundColor: '#a78cc8',
            color: 'white',
            fontWeight: 'bold',
            // marginLeft: '100px',
            borderRadius: '20px'
          }}
          onClick={handleGenerate}
          disabled={isLoading} // Disable while loading
        >
          {isLoading ? <CircularProgress size={24} style={{ color: 'white' }} /> : 'Generate'}
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
        onChange={(e) => {
          setQuery(e.target.value);
          // logEvent(userId, `Query text changed to: ${e.target.value}`);
          console.log(`Query text changed to: ${e.target.value}`)
        }}
      />

     

      {/* Modal for error handling */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="error"></Typography>
          <Typography variant="body2" color="textSecondary">{error}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsModalOpen(false)}
            style={{ marginTop: '20px' }}
          >
            OK
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default NaturalLanguageQuery;
