// src/components/Sidebar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './SystemAdminSidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <img src="flameguard-logo.png" alt="logo" />
            <h2>FlameGuard (Station Admin)</h2>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/">Logout</Link>
        </div>
    );
};

export default Sidebar;
