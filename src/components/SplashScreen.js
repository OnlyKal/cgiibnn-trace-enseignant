import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="splash-screen">
      <div className="splash-container">
        <img 
          src="/app-logo.png" 
          alt="Logo" 
          className="splash-logo"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
