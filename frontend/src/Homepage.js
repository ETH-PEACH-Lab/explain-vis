// src/components/HomePage.js
import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

function HomePage() {
  const [homeData, setHomeData] = useState({
    welcomeMessage: 'Welcome to NL2ViZ',
    description: 'This is the landing page of your application.'
  });

  return (
    <div className="home-page">
      <Typography variant="h4">{homeData.welcomeMessage}</Typography>
      <Typography variant="body1">{homeData.description}</Typography>
    </div>
  );
}

export default HomePage;
