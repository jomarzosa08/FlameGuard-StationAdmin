// src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfiles from './pages/UserProfiles';
import ViewMap from './pages/ViewMap';
import RegisterForm from './components/RegisterForm';

const App = () => {
    const location = useLocation();

    useEffect(() => {
        const routeTitleMap = {
            "/": "Login - FlameGuard",
            "/dashboard": "Dashboard - FlameGuard",
            "/profiles": "User Profiles - FlameGuard",
            "/viewmap": "View Map - FlameGuard",
            "/register": "Register - FlameGuard",
        };
        document.title = routeTitleMap[location.pathname] || "FlameGuard";
    }, [location]);

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profiles" element={<UserProfiles />} />
            <Route path="/viewmap" element={<ViewMap />} />
            <Route path="/register" element={<RegisterForm />} />
        </Routes>
    );
};

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;
