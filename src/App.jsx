// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserProfiles from './pages/UserProfiles';
import ViewMap from './pages/ViewMap';
import RegisterForm from './components/RegisterForm';
// other imports...

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profiles" element={<UserProfiles />} />
                <Route path="/viewmap" element={<ViewMap />} />
                <Route path="/register" element={<RegisterForm />} />
                {/* Add other routes here */}
            </Routes>
        </Router>
    );
};

export default App;
