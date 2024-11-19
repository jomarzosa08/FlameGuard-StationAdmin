import React, { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { firestore } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import axios from "axios";
import "./ViewMap.css";

const mapContainerStyle = {
    width: "100%",
    height: "calc(100vh - 50px)",
};

const center = {
    lat: 10.3157, // Cebu City
    lng: 123.8854,
};

const WEATHER_API_KEY = "9f4e6a5088793054a90a3568ac331498";
const fireIncidentMarkerUrl = "fire.png";
const customMarkerUrl = "fire-station.png";

const ViewMap = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQ",
    });

    const mapRef = useRef();
    const [fireStations, setFireStations] = useState([]);
    const [fireIncidents, setFireIncidents] = useState([]);
    const [selectedFireIncident, setSelectedFireIncident] = useState(null);
    const [selectedFireStation, setSelectedFireStation] = useState(null);
    const [weatherData, setWeatherData] = useState({});
    const [incidentWeatherData, setIncidentWeatherData] = useState({});
    const [directions, setDirections] = useState({});

    const isValidLatLng = (lat, lng) =>
        typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);

    const fetchWeather = async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching weather data:", error);
            return null;
        }
    };

    useEffect(() => {
        const fetchFireStations = async () => {
            const fireStationsSnapshot = await getDocs(collection(firestore, "fireStations"));
            const stationsData = fireStationsSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().fireStation_name,
                    position: {
                        lat: parseFloat(doc.data().fireStation_latitude),
                        lng: parseFloat(doc.data().fireStation_longitude),
                    },
                }))
                .filter(station => isValidLatLng(station.position.lat, station.position.lng));
            
            setFireStations(stationsData);

            stationsData.forEach(async station => {
                const weather = await fetchWeather(station.position.lat, station.position.lng);
                setWeatherData(prevData => ({
                    ...prevData,
                    [station.id]: weather,
                }));
            });
        };

        fetchFireStations();
    }, []);

    useEffect(() => {
        const fetchFireIncidents = async () => {
            const fireIncidentsSnapshot = await getDocs(collection(firestore, "fireIncidents"));
            const incidentsData = fireIncidentsSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    location: {
                        lat: parseFloat(doc.data().fireIncident_lat),
                        lng: parseFloat(doc.data().fireIncident_lng),
                    },
                    locationName: doc.data().fireIncident_location_name,
                    description: doc.data().fireIncident_description,
                    status: doc.data().fireIncident_status,
                    responders: doc.data().fireIncident_responders || [],
                }))
                .filter(incident => isValidLatLng(incident.location.lat, incident.location.lng));
            
            setFireIncidents(incidentsData);

            incidentsData.forEach(async incident => {
                const weather = await fetchWeather(incident.location.lat, incident.location.lng);
                setIncidentWeatherData(prevData => ({
                    ...prevData,
                    [incident.id]: weather,
                }));
            });
        };

        fetchFireIncidents();
    }, []);

    const onMapLoad = useCallback(map => {
        mapRef.current = map;
    }, []);

    const calculateDirections = async fireIncident => {
        const directionsService = new window.google.maps.DirectionsService();
        const fireLocation = { lat: fireIncident.location.lat, lng: fireIncident.location.lng };
    
        const trafficBasedStations = await Promise.all(
            fireStations.map(async station => {
                const stationLocation = { lat: station.position.lat, lng: station.position.lng };
    
                return new Promise(resolve => {
                    directionsService.route(
                        {
                            origin: stationLocation,
                            destination: fireLocation,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                            drivingOptions: {
                                departureTime: new Date(), // Current time for real-time traffic
                            },
                        },
                        (result, status) => {
                            if (status === "OK" && result.routes.length > 0) {
                                const leg = result.routes[0].legs[0]; // First route, first leg
                                resolve({
                                    stationId: station.id,
                                    stationName: station.name,
                                    distance: leg.distance.text,
                                    duration: leg.duration_in_traffic
                                        ? leg.duration_in_traffic.text
                                        : leg.duration.text,
                                });
                            } else {
                                resolve(null); // Handle failed routes gracefully
                            }
                        }
                    );
                });
            })
        );
    
        const validStations = trafficBasedStations.filter(Boolean).sort((a, b) => {
            const durationA = parseInt(a.duration.split(" ")[0], 10);
            const durationB = parseInt(b.duration.split(" ")[0], 10);
            return durationA - durationB; // Sort by ETA
        });
    
        setDirections({
            fireIncidentId: fireIncident.id,
            nearestStations: validStations.slice(0, 3), // Take the 3 closest stations
        });
    
        setSelectedFireIncident(fireIncident);
        setSelectedFireStation(null);
    };
    
    

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className="view-map-page">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="map-container">
                    <h2>Fire Stations and Incidents in Cebu City</h2>

                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={12}
                        center={center}
                        onLoad={onMapLoad}
                    >
                        {fireStations.map(station => (
                            <Marker
                                key={station.id}
                                position={station.position}
                                title={station.name}
                                icon={{
                                    url: customMarkerUrl,
                                    scaledSize: new window.google.maps.Size(50, 50),
                                }}
                                onClick={() => {
                                    setSelectedFireStation(station);
                                    setSelectedFireIncident(null);
                                }}
                            />
                        ))}

                        {fireIncidents.map(fire => (
                            <Marker
                                key={fire.id}
                                position={fire.location}
                                title={`Fire Incident: ${fire.description}`}
                                icon={{
                                    url: fireIncidentMarkerUrl,
                                    scaledSize: new window.google.maps.Size(40, 40),
                                }}
                                onClick={() => calculateDirections(fire)}
                            />
                        ))}

                        {selectedFireIncident && directions.fireIncidentId === selectedFireIncident.id && (
                            <InfoWindow
                                position={selectedFireIncident.location}
                                onCloseClick={() => setSelectedFireIncident(null)}
                            >
                                <div>
                                    <h4>{selectedFireIncident.locationName}</h4>
                                    <p>{selectedFireIncident.description}</p>
                                    <p>Status: {selectedFireIncident.status}</p>
                                    <p><strong>Lat:</strong> {selectedFireIncident.location.lat}, <strong>Lng:</strong> {selectedFireIncident.location.lng}</p>
                                    {incidentWeatherData[selectedFireIncident.id] ? (
                                        <>
                                            <p><strong>Weather:</strong> {incidentWeatherData[selectedFireIncident.id].main.temp} °C</p>
                                            <p><strong>Condition:</strong> {incidentWeatherData[selectedFireIncident.id].weather[0].description}</p>
                                            <p><strong>Humidity:</strong> {incidentWeatherData[selectedFireIncident.id].main.humidity}%</p>
                                        </>
                                    ) : (
                                        <p>Loading weather data...</p>
                                    )}
                                    <h5>Nearest Fire Stations:</h5>
                                    {directions.nearestStations.length > 0 ? (
                                        directions.nearestStations.map(station => (
                                            <p key={station.stationId}>
                                                {station.stationName} - {station.distance} away
                                                <br />
                                                ETA (with traffic): {station.duration}
                                            </p>
                                        ))
                                    ) : (
                                        <p>No nearby fire stations found.</p>
                                    )}

                                    <h5>Responding Fire Stations:</h5>
                                    {selectedFireIncident.responders.length > 0 ? (
                                        selectedFireIncident.responders.map(responder => (
                                            <p key={responder}>{fireStations.find(s => s.id === responder)?.name || responder}</p>
                                        ))
                                    ) : (
                                        <p>No responders assigned yet.</p>
                                    )}
                                </div>
                            </InfoWindow>
                        )}


                        {selectedFireStation && (
                            <InfoWindow
                                position={selectedFireStation.position}
                                onCloseClick={() => setSelectedFireStation(null)}
                            >
                                <div>
                                    <h4>{selectedFireStation.name}</h4>
                                    <p><strong>Lat:</strong>{selectedFireStation.position.lat}, <strong>Lng:</strong> {selectedFireStation.position.lng}</p>
                                    {weatherData[selectedFireStation.id] ? (
                                        <>
                                            <p><strong>Weather:</strong> {weatherData[selectedFireStation.id].main.temp} °C</p>
                                            <p><strong>Humidity:</strong> {weatherData[selectedFireStation.id].main.humidity}%</p>
                                        </>
                                    ) : (
                                        <p>Loading weather data...</p>
                                    )}
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </div>
            </div>
        </div>
    );
};

export default ViewMap;
