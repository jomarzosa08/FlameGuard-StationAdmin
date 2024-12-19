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
    const [responderNames, setResponderNames] = useState(['No responders assigned']);
    const [incidentAddress, setIncidentAddress] = useState('Fetching address...');
    const [fireLevel, setFireLevel] = useState(report?.fireLevel || 'N/A');
    const [selectedFireLevel, setSelectedFireLevel] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        try {
            if (report?.assignedResponder?.length > 0) {
                const respondersRef = collection(firestore, 'responders');
                const snapshot = await getDocs(respondersRef);

                // Filter responders based on assignedResponder UIDs and map their names
                const assignedNames = snapshot.docs
                    .filter((doc) => report.assignedResponder.includes(doc.id))
                    .map((doc) => doc.data().respondents_Name || 'N/A')
                    .reverse(); // Reverse to display most recent first

                // Set responderNames as an array for rendering individual rows
                setResponderNames(assignedNames.length ? assignedNames : ['No responders assigned']);
            } else {
                setResponderNames(['No responders assigned']);
            }
        } catch (error) {
            console.error('Error fetching responder names:', error);
            setResponderNames(['Error fetching responders']);
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
        if (selectedFireLevel) {
            try {
                // Update the fire level in the `reportDetails` collection
                const reportRef = doc(firestore, 'reportDetails', report.id); // Correct collection and document ID
                await updateDoc(reportRef, { fireLevel: selectedFireLevel }); // Update the fireLevel field
                setFireLevel(selectedFireLevel); // Update the local state
                closeModal(); // Close modal immediately after success
            } catch (error) {
                console.error('Error updating fire level:', error);
                alert('Failed to update fire level. Try again.'); // Keep alert only for errors
            }
        } else {
            alert('Please select a valid fire level.');
        }
    };



    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setSelectedFireLevel('');
        setIsModalOpen(false);
    };

    if (!report) return <p>No report details available.</p>;

    const dateTimeOfIncident = new Date(report.timeOfReport).toLocaleString(); // Combine date and time

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content">
                    <button
                        className="update-button"
                        style={{ width: '100px' }}
                        onClick={openModal}
                    >
                        Update
                    </button>

                    {isModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>Escalate to which fire level?</h2>
                                <select
                                    value={selectedFireLevel}
                                    onChange={(e) => setSelectedFireLevel(e.target.value)}
                                >
                                    <option value="">Select Fire Level</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                                <div className="modal-actions">
                                    <button className="confirm-button" onClick={handleUpdateFireLevel}>
                                        Confirm
                                    </button>
                                    <button className="cnl-button" onClick={closeModal}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-wrapper">
                        <div className="tae">
                            <h1>REPORT DETAILS</h1>
                            <table>
                                <tbody>
                                    <tr>
                                        <td id="incident-number"><strong>Incident No:</strong> {report.number || 'N/A'}</td>
                                        <td id="fire-level"><strong>Fire Level:</strong> <span className="fire-level-value">{fireLevel}</span></td>
                                        <td id="status"><strong>Status:</strong> <span className="status-value">{report.status || 'N/A'}</span></td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>PERSONS INVOLVED</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td id="reported-by"><strong>Reported By:</strong> {report.reportedBy || 'Unknown'}</td>
                                        <td id="address"><strong>Address:</strong> {callerInfo.address}</td>
                                        <td id="contact-no"><strong>Contact No:</strong> {callerInfo.contactNo}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <h2>THE INCIDENT</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td id="incident-datetime"><strong>Date and Time of Incident:</strong> {dateTimeOfIncident}</td>
                                        <td id="incident-location"><strong>Location:</strong> {incidentAddress}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>ACTION RESPONSE</h2>
                            <table className="details-table">
                                <tbody>
                                    {responderNames.map((name, index) => (
                                        <tr key={index}>
                                            <td id={`responder-${index}`}>
                                                <strong>Responder Name:</strong> {name}
                                            </td>
                                            <td id={`time-of-arrival-${index}`}><strong>Time of Arrival:</strong> N/A</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td id="response-suggestions" colSpan="2"><strong>Response Suggestions:</strong> {report.description || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td id="responder-comments" colSpan="2">
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
                                        <td id="temperature"><strong>Temperature (C):</strong> {report.temperature || 'N/A'}</td>
                                        <td id="humidity"><strong>Humidity (%):</strong> {report.humidity || 'N/A'}</td>
                                        <td id="windspeed"><strong>Windspeed (mph):</strong> {report.windSpeed || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td id="material"><strong>Material:</strong> {report.materialType || 'N/A'}</td>
                                        <td id="property"><strong>Property:</strong> {report.propertyType || 'N/A'}</td>
                                        <td id="floors"><strong>Floors:</strong> {report.floors || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td id="fire-spread" colSpan="3"><strong>Fire Spread (m/min):</strong> {report.fireSpread || 'N/A'}</td>
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
