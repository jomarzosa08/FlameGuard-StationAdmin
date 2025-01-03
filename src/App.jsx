// src/pages/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfiles from './pages/UserProfiles';
import ViewMap from './pages/ViewMap';
import RegisterForm from './pages/RegisterForm';
import Reports from './pages/Reports';
import Response from './pages/Response';
import SystemAdminDashboard from './pages/SystemAdminDashboard';

const App = () => {
    const location = useLocation();

    useEffect(() => {
        const routeTitleMap = {
            "/": "Login - FlameGuard",
            "/dashboard": "Dashboard - FlameGuard",
            "/profiles": "User Profiles - FlameGuard",
            "/viewmap": "View Map - FlameGuard",
            "/register": "Register - FlameGuard",
            "/reports": "Reports - FlameGuard",
            "/response": "Response - FlameGuard",
            "/SystemAdminDashboard": "System Admin Dashboard",
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
            <Route path="/reports" element={<Reports/>} />
            <Route path="/response" element={<Response />} />
            <Route path="/SystemAdminDashboard" element={<SystemAdminDashboard />} />
        </Routes>
    );
};

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;
