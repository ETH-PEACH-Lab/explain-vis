// src/utils/logger.js

// Function to log events by sending them to the backend server
export const logEvent = (sessionId, message) => {
  const baseUrl = process.env.REACT_APP_API_URL;
  fetch(`${baseUrl}/log`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      message,
    }),
  })
  .then(response => response.text())
  .then(data => console.log('Log response:', data))
  .catch(error => console.error('Error logging event:', error));
};
