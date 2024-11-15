import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { firestore } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import './ViewMap.css';

const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 50px)',
};

const center = {
    lat: 10.3157,
    lng: 123.8854,
};

const WEATHER_API_KEY = '9f4e6a5088793054a90a3568ac331498';

const fireIncidentMarkerUrl = 'fire.png';
const customMarkerUrl = 'fire-station.png';

const ViewMap = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQ',
    });

    const mapRef = useRef();
    const [fireStations, setFireStations] = useState([]);
    const [fireIncidents, setFireIncidents] = useState([]);
    const [selectedFireIncident, setSelectedFireIncident] = useState(null);
    const [selectedFireStation, setSelectedFireStation] = useState(null);
    const [weatherData, setWeatherData] = useState({});
    const [incidentWeatherData, setIncidentWeatherData] = useState({});
    const [directions, setDirections] = useState({});

    useEffect(() => {
        const fetchFireStations = async () => {
            const fireStationsSnapshot = await getDocs(collection(firestore, 'fireStations'));
            const stationsData = fireStationsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().fireStation_name,
                position: {
                    lat: doc.data().fireStation_latitude,
                    lng: doc.data().fireStation_longitude,
                },
            }));
            setFireStations(stationsData);

            for (const station of stationsData) {
                const weather = await fetchWeather(station.position.lat, station.position.lng);
                setWeatherData((prevData) => ({
                    ...prevData,
                    [station.id]: weather,
                }));
            }
        };

        const fetchFireIncidents = async () => {
            const fireIncidentsSnapshot = await getDocs(collection(firestore, 'fireIncidents'));
            const incidentsData = fireIncidentsSnapshot.docs.map(doc => ({
                id: doc.id,
                location: {
                    lat: doc.data().fireIncident_lat,
                    lng: doc.data().fireIncident_lng,
                },
                locationName: doc.data().fireIncident_location_name,
                description: doc.data().fireIncident_description,
                status: doc.data().fireIncident_status,
            }));
            setFireIncidents(incidentsData);

            for (const incident of incidentsData) {
                const weather = await fetchWeather(incident.location.lat, incident.location.lng);
                setIncidentWeatherData((prevData) => ({
                    ...prevData,
                    [incident.id]: weather,
                }));
            }
        };

        fetchFireStations();
        fetchFireIncidents();
    }, []);

    const fetchWeather = async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    };

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const calculateDirections = (fireIncident) => {
        const service = new window.google.maps.DistanceMatrixService();
        const fireLocationStr = `${fireIncident.location.lat},${fireIncident.location.lng}`;
        const stationLocations = fireStations.map(station => `${station.position.lat},${station.position.lng}`);
        
        service.getDistanceMatrix(
            {
                origins: [fireLocationStr],
                destinations: stationLocations,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === 'OK') {
                    // Sort stations by distance and select the top 3 closest stations
                    const sortedStations = response.rows[0].elements
                        .map((element, index) => ({
                            ...element,
                            stationId: fireStations[index].id,
                        }))
                        .sort((a, b) => a.distance.value - b.distance.value)
                        .slice(0, 3); // Select the 3 closest stations

                    setDirections({
                        fireIncidentId: fireIncident.id,
                        nearestStations: sortedStations,
                    });

                    setSelectedFireIncident(fireIncident);
                    setSelectedFireStation(null);
                } else {
                    console.error('DistanceMatrixService failed due to:', status);
                }
            }
        );
    };

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    const fireStationMarkerIcon = {
        url: customMarkerUrl,
        scaledSize: new window.google.maps.Size(50, 50),
    };

    const fireIncidentMarkerIcon = {
        url: fireIncidentMarkerUrl,
        scaledSize: new window.google.maps.Size(40, 40),
    };

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
                        {fireStations.map((station) => (
                            <Marker
                                key={station.id}
                                position={station.position}
                                title={station.name}
                                icon={fireStationMarkerIcon}
                                onClick={() => {
                                    setSelectedFireStation(station);
                                    setSelectedFireIncident(null);
                                }}
                            />
                        ))}

                        {fireIncidents.map((fire) => (
                            <Marker
                                key={fire.id}
                                position={fire.location}
                                title={`Fire Incident: ${fire.description}`}
                                icon={fireIncidentMarkerIcon}
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
                                    {incidentWeatherData[selectedFireIncident.id] ? (
                                        <>
                                            <p><strong>Weather:</strong> {incidentWeatherData[selectedFireIncident.id].main.temp} °C</p>
                                            <p><strong>Condition:</strong> {incidentWeatherData[selectedFireIncident.id].weather[0].description}</p>
                                            <p><strong>Humidity:</strong> {incidentWeatherData[selectedFireIncident.id].main.humidity}%</p>
                                        </>
                                    ) : (
                                        <p>Loading weather data...</p>
                                    )}
                                    {directions.nearestStations && directions.nearestStations.length > 0 && (
                                        <>
                                            <h5>Nearest Fire Stations</h5>
                                            {directions.nearestStations.map((station, index) => {
                                                const stationInfo = fireStations.find(s => s.id === station.stationId);
                                                return (
                                                    <div key={station.stationId}>
                                                        <p><strong>Station {index + 1}:</strong> {stationInfo.name}</p>
                                                        <p><strong>ETA:</strong> {station.duration.text}</p>
                                                        <p><strong>Distance:</strong> {station.distance.text}</p>
                                                    </div>
                                                );
                                            })}
                                        </>
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
                                    <p><strong>Latitude:</strong> {selectedFireStation.position.lat}</p>
                                    <p><strong>Longitude:</strong> {selectedFireStation.position.lng}</p>
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
