import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [dateTime, setDateTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  return (
    <div className="header">
      <h1 className="logo">
        <img src="flameguard-logo.png" alt="logo" className='flameguard-logo'/>FLAMEGUARD <span className="fire-animation">🔥</span>
      </h1>
      <p className="date-time">{dateTime.toLocaleString()}</p>
    </div>
  );
};

export default Header;
