import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Reports.css';

const Reports = () => {
    const location = useLocation();
    const { report } = location.state || {};

    const [isEditing, setIsEditing] = useState(false);
    const [editableReport, setEditableReport] = useState(report || {});
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [address, setAddress] = useState(''); // To store the geocoded address

    useEffect(() => {
        if (report?.latitude && report?.longitude) {
            fetchAddress(report.latitude, report.longitude); // Fetch address based on coordinates
        }
    }, [report]);

    // Geocoding: Fetch the address based on latitude and longitude
    const fetchAddress = async (lat, lng) => {
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                setAddress(response.results[0].formatted_address); // Set the geocoded address
            } else {
                setAddress('Address not found');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            setAddress('Error fetching address');
        }
    };

    // Toggle edit mode
    const handleEditToggle = () => {
        setIsEditing((prev) => !prev);
        setEditableReport(report); // Reset to original report values if cancel is clicked
    };

    // Handle changes in the input fields while editing
    const handleInputChange = (field, value) => {
        setEditableReport((prev) => ({ ...prev, [field]: value }));
    };

    // Save the updated report to Firebase
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
                fireSpread: editableReport.fireSpread,
                comments: editableReport.comments,
            });
            setIsEditing(false); // Exit edit mode
            alert('Report information updated successfully!');
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to save changes.');
        }
    };

    // Open confirmation modal
    const handleEditClick = () => {
        setIsConfirmationOpen(true);
    };

    // Close the confirmation modal
    const handleConfirmationClose = (confirm) => {
        setIsConfirmationOpen(false);
        if (confirm) {
            handleSave();
        }
    };

    if (!report) {
        return <p>No report details available.</p>;
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content">
                    <div className="card-wrapper">
                        <div className="action-buttons">
                            <button
                                className="edit-btn"
                                onClick={isEditing ? handleEditClick : handleEditToggle}
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
                                        <td colSpan="2"><strong>Address:</strong> {address}</td> {/* Display geocoded address */}
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
                                <div><strong>Comments:</strong>
                                    {isEditing ? (
                                        <textarea
                                            value={editableReport.comments || ''}
                                            onChange={(e) => handleInputChange('comments', e.target.value)}
                                        />
                                    ) : (
                                        report.comments || 'No comments available'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Confirmation Modal */}
            {isConfirmationOpen && (
                <div className="confirmation-modal">
                    <div className="modal-content">
                        <h2>Are you sure your changes are necessary?</h2>
                        <p>It is important to keep the integrity of the user's data. Please confirm before saving.</p>
                        <div className="modal-actions">
                            <button onClick={() => handleConfirmationClose(true)}>Yes, Save</button>
                            <button onClick={() => handleConfirmationClose(false)}>No, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
