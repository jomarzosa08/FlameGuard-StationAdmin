import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserProfiles from './pages/UserProfiles';
import ViewMap from './pages/ViewMap';
import RegisterForm from './components/RegisterForm';
import Reports from './pages/Reports'; // Import the new Reports page

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profiles" element={<UserProfiles />} />
                <Route path="/viewmap" element={<ViewMap />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/reports" element={<Reports />} /> 

                {/* Add other routes here as needed */}
            </Routes>
        </Router>
    );
};

export default App;
