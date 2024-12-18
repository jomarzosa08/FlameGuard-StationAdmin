// src/components/Sidebar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <img src="flameguard-logo.png" alt="FlameGuard Logo" className="sidebar-logo" />
      <h2 className="sidebar-title">FlameGuard (Station Admin)</h2>
      <div className="sidebar-links">
        <Link to="/dashboard">🔥 Dashboard</Link>
        <Link to="/profiles">👤 Responder Profiles</Link>
        <Link to="/viewmap">🗺️ View Map</Link>
        <Link to="/">↘️ Logout</Link>
      </div>
    </div>
  );
};

export default Sidebar;
