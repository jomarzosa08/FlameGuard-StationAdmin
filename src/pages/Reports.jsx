import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Firestore configuration
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Reports.css'; // Import styles for this component

const Reports = () => {
    const location = useLocation();
    const { report } = location.state || {};

    const [isEditing, setIsEditing] = useState(false);
    const [editableReport, setEditableReport] = useState(report || {});

    useEffect(() => {
        if (report) {
            setEditableReport(report); // Initialize editable report with data
        }
    }, [report]);

    if (!report) {
        return <p>No report details available.</p>;
    }

    const handleEditToggle = () => {
        setIsEditing((prev) => !prev); // Toggle edit mode
        setEditableReport(report); // Reset editable values to original report if cancel is pressed
    };

    const handleInputChange = (field, value) => {
        setEditableReport((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const reportRef = doc(firestore, 'reportDetails', editableReport.id);
            await updateDoc(reportRef, {
                fireLevel: editableReport.fireLevel,
                status: editableReport.status,
                reportedBy: editableReport.reportedBy,
                latitude: editableReport.latitude,
                longitude: editableReport.longitude,
                description: editableReport.description,
                temperature: editableReport.temperature,
                humidity: editableReport.humidity,
                windSpeed: editableReport.windSpeed,
                materialType: editableReport.materialType,
                propertyType: editableReport.propertyType,
                floors: editableReport.floors,
                distanceToStation: editableReport.distanceToStation,
                housingSpace: editableReport.housingSpace,
                fireSpread: editableReport.fireSpread, // Add Fire Spread back
            });

            // Immediately update report after saving to show the updated values
            setIsEditing(false); // Exit edit mode after saving
            setEditableReport((prev) => ({ ...prev, ...editableReport })); // Update the display with the saved data
            alert('Report information updated successfully!');
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to save changes.');
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content">
                    {/* Card Wrapper with Buttons */}
                    <div className="card-wrapper">
                        <div className="action-buttons">
                            <button
                                className="edit-btn"
                                onClick={isEditing ? handleSave : handleEditToggle}
                            >
                                {isEditing ? 'Save' : 'Edit Information'}
                            </button>
                            {isEditing && (
                                <button
                                    className="cancel-btn"
                                    onClick={handleEditToggle}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {/* The Card that holds report details */}
                        <div className="card">
                            <h1>Report Details</h1>
                            <table className="details-table">
                                <tbody>
                                    <tr>
                                        <td><strong>Number:</strong> {report.number}</td>
                                        <td><strong>ID:</strong> {report.id}</td>
                                        <td><strong>Fire Level:</strong>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editableReport.fireLevel || ''}
                                                    onChange={(e) => handleInputChange('fireLevel', e.target.value)}
                                                />
                                            ) : (
                                                report.fireLevel || 'Unknown'
                                            )}
                                        </td>
                                        <td><strong>Status:</strong>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editableReport.status || ''}
                                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                                />
                                            ) : (
                                                report.status || 'Unknown'
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Reported By:</strong>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editableReport.reportedBy || ''}
                                                    onChange={(e) => handleInputChange('reportedBy', e.target.value)}
                                                />
                                            ) : (
                                                report.reportedBy || 'Unknown Caller'
                                            )}
                                        </td>
                                        <td><strong>Latitude:</strong>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editableReport.latitude || ''}
                                                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                                                />
                                            ) : (
                                                report.latitude || 'N/A'
                                            )}
                                        </td>
                                        <td><strong>Longitude:</strong>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editableReport.longitude || ''}
                                                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                                                />
                                            ) : (
                                                report.longitude || 'N/A'
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4"><strong>Description:</strong>
                                            {isEditing ? (
                                                <textarea
                                                    value={editableReport.description || ''}
                                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                                />
                                            ) : (
                                                report.description || 'No description available'
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="vertical-fields">
                                <div><strong>Temperature:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.temperature || ''}
                                            onChange={(e) => handleInputChange('temperature', e.target.value)}
                                        />
                                    ) : (
                                        report.temperature || 'N/A'
                                    )}
                                </div>
                                <div><strong>Humidity:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.humidity || ''}
                                            onChange={(e) => handleInputChange('humidity', e.target.value)}
                                        />
                                    ) : (
                                        report.humidity || 'N/A'
                                    )}
                                </div>
                                <div><strong>Wind Speed:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.windSpeed || ''}
                                            onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                                        />
                                    ) : (
                                        report.windSpeed || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Material Type:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.materialType || ''}
                                            onChange={(e) => handleInputChange('materialType', e.target.value)}
                                        />
                                    ) : (
                                        report.materialType || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Property Type:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.propertyType || ''}
                                            onChange={(e) => handleInputChange('propertyType', e.target.value)}
                                        />
                                    ) : (
                                        report.propertyType || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Floors:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.floors || ''}
                                            onChange={(e) => handleInputChange('floors', e.target.value)}
                                        />
                                    ) : (
                                        report.floors || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Distance to Station:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.distanceToStation || ''}
                                            onChange={(e) => handleInputChange('distanceToStation', e.target.value)}
                                        />
                                    ) : (
                                        report.distanceToStation || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Housing Space:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.housingSpace || ''}
                                            onChange={(e) => handleInputChange('housingSpace', e.target.value)}
                                        />
                                    ) : (
                                        report.housingSpace || 'Unknown'
                                    )}
                                </div>
                                <div><strong>Fire Spread:</strong>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editableReport.fireSpread || ''}
                                            onChange={(e) => handleInputChange('fireSpread', e.target.value)}
                                        />
                                    ) : (
                                        report.fireSpread || 'Unknown'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
