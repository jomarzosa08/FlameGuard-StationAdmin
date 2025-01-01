import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Firestore configuration
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Reports.css';

const testStart = '123.9083305,10.3138334'; // Example longitude,latitude
const testEnd = '123.9153097,10.3455782';   // Example longitude,latitude
const testUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a7592687ef4a44dabc957206e871c21e&start=${testStart}&end=${testEnd}`;
console.log('Test URL:', testUrl);

const Reports = () => {
    const location = useLocation();
    const { report } = location.state || {}; // Extract report from route state

    const [callerInfo, setCallerInfo] = useState({ address: 'N/A', contactNo: 'N/A' });
    const [responderNames, setResponderNames] = useState(['No responders assigned']);
    const [fireLevel, setFireLevel] = useState(report?.fireLevel || 'N/A');
    const [selectedFireLevel, setSelectedFireLevel] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incidentAddress, setIncidentAddress] = useState('Fetching address...');

    const MAPTILER_API_KEY = 'YaB4iP4jFDNdXfQfiNVT';

    useEffect(() => {
        if (report) {
            fetchCallerDetails();
            fetchResponderNames();
            fetchIncidentAddress();
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
                console.log('Assigned Responder IDs:', report.assignedResponder);
                const respondersRef = collection(firestore, 'responders');
                const snapshot = await getDocs(respondersRef);

                const assignedData = await Promise.all(
                    snapshot.docs
                        .filter((doc) => report.assignedResponder.includes(doc.id))
                        .map(async (doc) => {
                            const data = doc.data();
                            const responderLat = data.respondents_latitude;
                            const responderLng = data.respondents_longitude;
                            const incidentLat = report.latitude;
                            const incidentLng = report.longitude;

                            console.log(`Responder (${doc.id}) Coordinates:`, { responderLat, responderLng });
                            console.log(`Incident Coordinates:`, { incidentLat, incidentLng });

                            let eta = 'Unavailable';

                            if (responderLat && responderLng && incidentLat && incidentLng) {
                                try {
                                    const apiUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a7592687ef4a44dabc957206e871c21e&start=${responderLng},${responderLat}&end=${incidentLng},${incidentLat}`;
                                    console.log('API Request URL:', apiUrl);

                                    const response = await fetch(apiUrl);
                                    const directionsData = await response.json();

                                    console.log('Full API Response:', directionsData); // Log full response

                                    if (directionsData?.features?.length > 0) {
                                        const duration = directionsData.features[0].properties.segments[0].duration; // Duration in seconds
                                        console.log('Travel Time (seconds):', duration);
                                        if (duration) {
                                            eta = `${Math.round(duration / 60)} mins`; // Convert to minutes
                                        }
                                    } else {
                                        console.warn('No routes available in API response.');
                                    }
                                } catch (apiError) {
                                    console.error('Error fetching directions:', apiError);
                                }
                            }

                            return {
                                name: data.respondents_Name || 'N/A',
                                timeOfArrival: data.TOA || 'N/A',
                                eta,
                            };
                        })
                );

                console.log('Responder Data:', assignedData);
                setResponderNames(
                    assignedData.length ? assignedData : [{ name: 'No responders assigned', eta: 'N/A', timeOfArrival: 'N/A' }]
                );
            } else {
                console.log('No responders assigned.');
                setResponderNames([{ name: 'No responders assigned', eta: 'N/A', timeOfArrival: 'N/A' }]);
            }
        } catch (error) {
            console.error('Error fetching responder names:', error);
            setResponderNames([{ name: 'Error fetching responders', eta: 'N/A', timeOfArrival: 'N/A' }]);
        }
    };



    const fetchIncidentAddress = async () => {
        try {
            const { latitude, longitude } = report;
            if (latitude && longitude) {
                const response = await fetch(
                    `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_API_KEY}`
                );
                const data = await response.json();
                if (data?.features?.length) {
                    setIncidentAddress(data.features[0].place_name || 'Address not found');
                } else {
                    setIncidentAddress('Address not found');
                }
            } else {
                setIncidentAddress('Coordinates unavailable');
            }
        } catch (error) {
            console.error('Error fetching incident address:', error);
            setIncidentAddress('Failed to fetch address');
        }
    };

    const handleUpdateFireLevel = async () => {
        if (selectedFireLevel) {
            try {
                const reportRef = doc(firestore, 'reportDetails', report.id);
                await updateDoc(reportRef, { fireLevel: selectedFireLevel });
                setFireLevel(selectedFireLevel);
                closeModal();
            } catch (error) {
                console.error('Error updating fire level:', error);
                alert('Failed to update fire level. Try again.');
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

    const dateTimeOfIncident = new Date(report.timeOfReport).toLocaleString();

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
                                    {responderNames.map((responder, index) => (
                                        <tr key={index}>
                                            <td id={`responder-${index}`}>
                                                <strong>Responder Name:</strong> {responder.name}
                                            </td>
                                            <td id={`eta-${index}`}><strong>ETA:</strong> {responder.eta}</td>
                                            <td id={`time-of-arrival-${index}`}><strong>Time of Arrival:</strong> {responder.timeOfArrival}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td id="response-suggestions" colSpan="3"><strong>Response Suggestions:</strong> {report.description || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td id="responder-comments" colSpan="3">
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
