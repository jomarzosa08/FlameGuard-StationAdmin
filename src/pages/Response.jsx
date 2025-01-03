import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { arrayUnion, collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // Move this import to the top
import { firestore } from '../firebaseConfig';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import Sidebar from '../components/Sidebar';
import './Response.css';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};

const Response = () => {
    const location = useLocation();
    const { report } = location.state || {};

    const [responders, setResponders] = useState([]);
    const [directions, setDirections] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });

    const [modalMessage, setModalMessage] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);


    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQKEY",
        libraries: ['places'],
    });

    useEffect(() => {
        const fetchResponders = async () => {
            try {
                const respondersCollection = collection(firestore, 'responders');
                const snapshot = await getDocs(respondersCollection);
                const respondersData = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .filter((responder) => responder.dutyStatus !== "on duty"); // Exclude on-duty responders

                if (report?.latitude && report?.longitude) {
                    const updatedResponders = respondersData.map((responder) => ({
                        ...responder,
                        distance: calculateDistance(
                            report.latitude,
                            report.longitude,
                            responder.respondents_latitude,
                            responder.respondents_longitude
                        ),
                    }));

                    setResponders(updatedResponders.sort((a, b) => a.distance - b.distance));
                    setMapCenter({
                        lat: report.latitude,
                        lng: report.longitude,
                    });
                }
            } catch (error) {
                console.error('Error fetching responders:', error);
            }
        };

        fetchResponders();
    }, [report]);

    const getDirectionsAndETA = async (responder) => {
        try {
            const directionsService = new window.google.maps.DirectionsService();
            const result = await directionsService.route({
                origin: {
                    lat: responder.respondents_latitude,
                    lng: responder.respondents_longitude,
                },
                destination: {
                    lat: report.latitude,
                    lng: report.longitude,
                },
                travelMode: window.google.maps.TravelMode.DRIVING,
            });
            setDirections(result);

            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].overview_path.forEach((point) => bounds.extend(point));
            setMapCenter(bounds.getCenter());
        } catch (error) {
            console.error('Error fetching directions:', error);
        }
    };

    const notifyResponder = async (responder) => {
        try {
            const reportRef = doc(firestore, 'reportDetails', report.id);

            // Add responder's ID to the assignedResponder field
            await updateDoc(reportRef, {
                assignedResponder: arrayUnion(responder.id),
            });

            // Update the responder's duty status
            const responderRef = doc(firestore, 'responders', responder.id);
            await updateDoc(responderRef, {
                dutyStatus: "on duty",
            });

            showModal(`Responder Notified!`);
        } catch (error) {
            console.error('Error notifying responder:', error);
            showModal('Failed to notify responder. Please try again.');
        }
    };


    const showModal = (message) => {
        setModalMessage(message);
        setIsModalVisible(true);

        setTimeout(() => {
            setIsModalVisible(false); // Just hide the modal
        }, 3000); // Modal disappears after 3 seconds
    };


    if (!isLoaded) return <p>Loading map...</p>;
    if (!report) return <p>No fire report details provided.</p>;

    return (
        <div className="dashboard-container fire-theme">
            <Sidebar />
            <div className="main-content">
                <div className="response-layout-fire">
                    <div className="details-container-fire">
                        <div className="card fire-card">
                            <div className="response-header">
                                <h1 className="response-title">Response Plan</h1>
                            </div>
                                <div className="report-details-container">
                                    <h2 className="section-title">🚨 Fire Report Details</h2>
                                    <div className="report-detail">
                                        <p><strong>📍 Location:</strong> <span className="detail-text">{report.latitude}, {report.longitude}</span></p>
                                    </div>
                                    <div className="report-detail">
                                        <p><strong>📝 Emergency Response:</strong> <span className="detail-text">{report.description || 'No description available'}</span></p>
                                    </div>
                                </div>
                                <br />
                                <div className="response-header">
                                    <h1 className="response-title">Nearest Responders:</h1>
                                </div>
                            {responders.length > 0 ? (
                                <ul className="responder-list-fire">
                                    {responders.slice(0, 3).map((responder) => (
                                        <li key={responder.id} className="responder-item-fire">
                                            <p><strong>{responder.respondents_Name}</strong> </p>
                                            <br />
                                            <p><strong>Distance:</strong> {responder.distance.toFixed(2)} km away </p>
                                            <br />
                                            <p> <strong>Address:</strong> {responder.respondents_Address}</p>
                                            <br />
                                            <p> <strong>Contact: </strong>{responder.respondents_Contact}</p>
                                            <div className="button-group">
                                                <button
                                                    className="btn fire-btn show-path-btn"
                                                    onClick={() => getDirectionsAndETA(responder)}
                                                >
                                                    Show Path
                                                </button>
                                                <button
                                                    className="btn fire-btn notify-btn"
                                                    onClick={() => notifyResponder(responder)}
                                                >
                                                    Notify Responder
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-responders">No nearby responders found.</p>
                            )}
                        </div>
                    </div>
    
                    <div className="map-container-fire">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={mapCenter}
                            zoom={14}
                        >
                            {directions && <DirectionsRenderer directions={directions} />}
                        </GoogleMap>
                    </div>
                </div>
            </div>
            {isModalVisible && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>{modalMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
    
    
    
};

export default Response;
