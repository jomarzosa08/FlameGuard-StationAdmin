import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';  // Import Sidebar
import Header from '../components/Header';  // You can add this if you want the Header too
import './Dashboard.css'; // Reuse styles from Dashboard.css

const Reports = () => {
    const location = useLocation();
    const { report } = location.state || {};

    if (!report) {
        return <p>No report details available.</p>;
    }

    return (
        <div className="dashboard-container">
            <Sidebar /> {/* Add Sidebar to the Reports page */}
            <div className="main-content">
                <Header /> {/* Optional: You can add the Header if you want it on the reports page */}
                <div className="content">
                    <h1>Report Details</h1>
                    <div className="card">
                        {Object.entries(report).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '10px' }}>
                                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value?.toString()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
//tae