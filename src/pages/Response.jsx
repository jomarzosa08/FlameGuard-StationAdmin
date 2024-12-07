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

            alert(`Notification sent to ${responder.respondents_Name}`);
        } catch (error) {
            console.error('Error notifying responder:', error);
            alert('Failed to notify responder. Please try again.');
        }
    };

    if (!isLoaded) return <p>Loading map...</p>;
    if (!report) return <p>No fire report details provided.</p>;

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <div className="response-layout">
                    <div className="details-container">
                        <div className="card">
                            <h1>Response Plan</h1>
                            <h3>Fire Report Details:</h3>
                            <p><strong>Location:</strong> {report.latitude}, {report.longitude}</p>
                            <p><strong>Description:</strong> {report.description || 'No description available'}</p>

                            <h3>Nearest Responders:</h3>
                            {responders.length > 0 ? (
                                <ul>
                                    {responders.slice(0, 3).map((responder) => (
                                        <li key={responder.id}>
                                            <strong>{responder.respondents_Name}</strong> - {responder.distance.toFixed(2)} km away
                                            <p>Address: {responder.respondents_Address}</p>
                                            <p>Contact: {responder.respondents_Contact}</p>
                                            <button onClick={() => getDirectionsAndETA(responder)}>
                                                Show Path
                                            </button>
                                            <button onClick={() => notifyResponder(responder)}>
                                                Notify Responder
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No nearby responders found.</p>
                            )}
                        </div>
                    </div>

                    <div className="map-containers">
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
        </div>
    );
};

export default Response;
