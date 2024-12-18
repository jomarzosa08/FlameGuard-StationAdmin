import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Firestore configuration
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Reports.css';

const Reports = () => {
    const location = useLocation();
    const { report } = location.state || {}; // Extract report from route state

    const [callerInfo, setCallerInfo] = useState({ address: 'N/A', contactNo: 'N/A' });
    const [responderNames, setResponderNames] = useState('N/A');
    const [incidentAddress, setIncidentAddress] = useState('Fetching address...');
    const [fireLevel, setFireLevel] = useState(report?.fireLevel || 'N/A');

    useEffect(() => {
        if (report) {
            fetchCallerDetails();
            fetchResponderNames();
            fetchIncidentAddress(report.latitude, report.longitude);
        }
    }, [report]);

    const fetchCallerDetails = async () => {
        if (report?.reportedBy) {
            const callerRef = collection(firestore, 'caller');
            const snapshot = await getDocs(callerRef);
            snapshot.forEach((doc) => {
                const data = doc.data();
                const fullName = `${data.firstName} ${data.lastName}`;
                if (fullName === report.reportedBy) {
                    setCallerInfo({
                        address: data.address || 'N/A',
                        contactNo: data.phoneNumber || 'N/A',
                    });
                }
            });
        }
    };

    const fetchResponderNames = async () => {
        if (report?.assignedResponder?.length > 0) {
            const respondersRef = collection(firestore, 'responders');
            const snapshot = await getDocs(respondersRef);
            const names = [];
            snapshot.forEach((doc) => {
                if (report.assignedResponder.includes(doc.id)) {
                    const data = doc.data();
                    names.push(data.responder_Name || 'N/A');
                }
            });
            setResponderNames(names.join(' | ') || 'N/A');
        }
    };

    const fetchIncidentAddress = async (latitude, longitude) => {
        try {
            const apiKey = 'AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQ';
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                setIncidentAddress(data.results[0].formatted_address);
            } else {
                setIncidentAddress('Address not found');
            }
        } catch (error) {
            console.error('Error fetching incident address:', error);
            setIncidentAddress('Unable to fetch address');
        }
    };

    const handleUpdateFireLevel = async () => {
        const newLevel = window.prompt('Enter the new fire level (1, 2, or 3):');
        if (newLevel === '1' || newLevel === '2' || newLevel === '3') {
            try {
                const reportRef = doc(firestore, 'reports', report.id);
                await updateDoc(reportRef, { fireLevel: newLevel });
                setFireLevel(newLevel);
                alert('Fire level updated successfully!');
            } catch (error) {
                console.error('Error updating fire level:', error);
                alert('Failed to update fire level. Try again.');
            }
        } else {
            alert('Invalid input. Please enter 1, 2, or 3.');
        }
    };

    if (!report) return <p>No report details available.</p>;

    const dateOfIncident = new Date(report.timeOfReport).toLocaleDateString();
    const timeOfIncident = new Date(report.timeOfReport).toLocaleTimeString();

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content">
                    <div className="button-container">
                        <button onClick={handleUpdateFireLevel} className="update-button">
                            Update Fire Level
                        </button>
                    </div>

                    <div className="card-wrapper">
                        <div className="tae">
                            <h1>REPORT DETAILS</h1>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><strong>Incident No.:</strong> {report.number || 'N/A'}</td>
                                        <td><strong>Fire Level:</strong> {fireLevel}</td>
                                        <td><strong>Status:</strong> {report.status || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>PERSONS INVOLVED</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><strong>Reported By:</strong> {report.reportedBy || 'Unknown'}</td>
                                        <td><strong>Address:</strong> {callerInfo.address}</td>
                                        <td><strong>Contact No:</strong> {callerInfo.contactNo}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>THE INCIDENT</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><strong>Date of Incident:</strong> {dateOfIncident}</td>
                                        <td><strong>Time of Incident:</strong> {timeOfIncident}</td>
                                        <td><strong>Location:</strong> {incidentAddress}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>ACTION RESPONSE</h2>
                            <table className="details-table">
                                <tbody>
                                    <tr>
                                        <td><strong>Responders:</strong> {responderNames}</td>
                                        <td><strong>Time of Arrival:</strong> N/A</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2"><strong>Response Suggestions:</strong> {report.description || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2">
                                            <strong>Responder's Comments:</strong> <br />
                                            {report.comments || 'No comments available.'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>FIRE LEVEL CALCULATION</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><strong>Temperature (C):</strong> {report.temperature || 'N/A'}</td>
                                        <td><strong>Humidity (%):</strong> {report.humidity || 'N/A'}</td>
                                        <td><strong>Windspeed (mph):</strong> {report.windSpeed || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Material:</strong> {report.materialType || 'N/A'}</td>
                                        <td><strong>Property:</strong> {report.propertyType || 'N/A'}</td>
                                        <td><strong>Floors:</strong> {report.floors || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3"><strong>Fire Spread (m/min):</strong> {report.fireSpread || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
