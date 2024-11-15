// src/components/Sidebar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h2>FlameGuard (Station Admin)</h2>
            <Link to="/dashboard">View Post</Link>
            <Link to="/profiles">User Profiles</Link>
            <Link to="/reports">View Report</Link>
            <Link to="/viewmap">View Map</Link> {/* New link added for the map page */}
            <Link to="/">Logout</Link>
        </div>
    );
};

export default Sidebar;
