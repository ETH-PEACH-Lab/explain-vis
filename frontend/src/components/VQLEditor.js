import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { logEvent } from '../utils/logger'; 

  function VQLEditor({ initialVQL, onExecute, tableData, userId }) {
    const [vql, setVql] = useState(initialVQL);
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [error, setError] = useState(null); // Error state
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
    const [editingText, setEditingText] = useState(false); // 是否处于编辑状态
    const [editedText, setEditedText] = useState(''); // 编辑中的文本

    function formatVQL(vql) {
      // Define the list of keywords, operators, and functions to insert a newline before and to uppercase
      const keywords = [
          'VISUALIZE', 'SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'BIN BY'
      ];
  
      const operators = [
          'AND', 'OR', 'NOT','ON', 'BETWEEN', 'IN', 'LIKE', 'IS', '=', '!=', '<>', '<', '<=', '>', '>=',
          '\\+', '-', '\\*', '/', '%', '\\^', '&&', '\\|\\|', '!', 'ASC', 'DESC'
      ];
  
      const functions = [
          'SUM', 'AVG', 'COUNT', 'MIN', 'MAX'
      ];
  
      // Combine all for the regex
      const allTerms = [...keywords, ...operators, ...functions];
  
      // Regular expression to match keywords, operators, and functions, with word boundaries and case-insensitive flag
      const regex = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');
  
      let VQL = vql.replace(/\n/g, ' ');
      // Replace the matched keywords, operators, and functions with uppercase, and insert the escaped newline for keywords
      return VQL.replace(regex, (match) => {
          if (keywords.includes(match.toUpperCase())) {
              return `\n${match.toUpperCase()}`;
          } else {
              return match.toUpperCase();
          }
      }).trim();
  }
  

  useEffect(() => {
    setVql(initialVQL);
  }, [initialVQL]);

  const handleEditClick = (text) => {
    setEditedText(text);
    setEditingText(true);
  };

  const handleBlur = () => {
    setEditingText(false);
    setVql(formatVQL(editedText));
  };

  const handleVqlChange = (e) => {
    const newVql = e.target.value;
    setEditedText(newVql);
    logEvent(userId, `VQL Edited: ${newVql}`);
  };

  const handleExecuteVQL = async () => {
    logEvent(userId, 'Execute button clicked');
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const explanationApiUrl = `${baseUrl}/api/explain-vql`;
      console.log('API URL:', explanationApiUrl);
      const VQL = formatVQL(vql)
      console.log('edited VQL:', VQL);
      logEvent(userId, `Executing VQL: ${VQL}`);
      
      const explanationResponse = await fetch(explanationApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ VQL: VQL, tableData, userId }),
      });

      if (explanationResponse.ok) {
        const explanationResult = await explanationResponse.json();
        console.log('result:', explanationResult);
        const explanation = explanationResult.explanation;
        if (!explanation || !Array.isArray(explanation)) {
          throw new Error('Invalid explanation received'); // 如果 explanation 不是数组，则抛出错误
        }
        console.log('explanation:', explanation);
        logEvent(userId, `Generated Explanation: ${JSON.stringify(explanation)}`);
        const updatedGeneratedVQL = { VQL: explanationResult.VQL, explanation };
        onExecute(updatedGeneratedVQL);
      } else {
        const { error } = await explanationResponse.json();
        throw new Error(error || 'Error fetching explanation');
      }
    } catch (err) {
      console.error('Error during VQL execution:', err);
      setError(`An error occurred while executing the VQL. Please refine your VQL. Try simple query, ${err.message}`);
      logEvent(userId, `Error during VQL execution: ${err.message}`);
      setIsModalOpen(true); // Show error modal
    } finally {
      setIsLoading(false);
    }
  };

  const formatVQLLine = (line) => {
    return line.split('\n').map((segment, i) => (
      <div key={i} style={{ marginBottom: '4px' }}>
        {segment.split('').map((char, index) => {
          if (char >= 'A' && char <= 'Z') {
            return <span key={index} className="uppercase-char">{char}</span>;
          } else if (char >= '0' && char <= '9') {
            return <span key={index} className="number-char">{char}</span>;
          } else {
            return <span key={index}>{char}</span>;
          }
        })}
      </div>
    ));
  };
  const calculateRows = (text) => {
    return text.split('\n').length || 1;
  };

  return (
    <>
      <div className="nl-query-header" style={{ marginTop: '10px' }}>
        <Typography variant="h6" className="vql-title">/ VQL</Typography>
        <Button
          variant="contained"
          className="import-btn"
          style={{
            backgroundColor: '#a78cc8',
            color: 'white',
            fontWeight: 'bold',
            marginLeft: '100px',
            borderRadius: '20px'
          }}
          onClick={handleExecuteVQL}
          disabled={isLoading} // Disable while loading
        >
          {isLoading ? <CircularProgress size={24} style={{ color: 'white' }} /> : 'Execute'}
        </Button>
      </div>
      <Card className="vql-card">
        <CardContent>
          {editingText ? (
            <textarea
              value={editedText}
              onChange={handleVqlChange}
              onBlur={handleBlur}
              autoFocus
              rows={calculateRows(formatVQL(editedText))}
              style={{
                width: '95%',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
              }}
            />
          ) : (
            <Typography
              variant="body2"
              className="vql-line"
              onClick={() => handleEditClick(vql)}
              style={{ whiteSpace: 'pre-wrap', cursor: 'pointer' }} 
            >
              {formatVQLLine(formatVQL(vql))}
            </Typography>
          )}
        </CardContent>
      </Card>
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
          <Typography variant="h6" color="error">Error</Typography>
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
    </>
  );
}

export default VQLEditor;
