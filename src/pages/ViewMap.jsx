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
    height: "100%", // Use full height defined in CSS
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
    const [responders, setResponders] = useState([]);
    const [fireReports, setFireReports] = useState([]);
    const [selectedFireReport, setSelectedFireReport] = useState(null);
    const [selectedResponder, setSelectedResponder] = useState(null);
    const [weatherData, setWeatherData] = useState({});
    const [reportWeatherData, setReportWeatherData] = useState({});
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
        const handleResize = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        handleResize(); // Set on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchResponders = async () => {
            try {
                const respondersSnapshot = await getDocs(collection(firestore, "responders"));
                const respondersData = respondersSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        name: doc.data().respondents_Name,
                        position: {
                            lat: parseFloat(doc.data().respondents_latitude),
                            lng: parseFloat(doc.data().respondents_longitude),
                        },
                    }))
                    .filter(responder => isValidLatLng(responder.position.lat, responder.position.lng));

                setResponders(respondersData);

                respondersData.forEach(async responder => {
                    const weather = await fetchWeather(responder.position.lat, responder.position.lng);
                    setWeatherData(prevData => ({
                        ...prevData,
                        [responder.id]: weather,
                    }));
                });
            } catch (error) {
                console.error("Error fetching responders data:", error);
            }
        };

        fetchResponders();
    }, []);

    useEffect(() => {
        const fetchFireReports = async () => {
            try {
                const reportsSnapshot = await getDocs(collection(firestore, "reportDetails"));
                const reportsData = reportsSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        reportedBy: doc.data().reportedBy,
                        timeOfReport: doc.data().timeOfReport,
                        location: {
                            lat: parseFloat(doc.data().latitude),
                            lng: parseFloat(doc.data().longitude),
                        },
                    }))
                    .filter(report => isValidLatLng(report.location.lat, report.location.lng));

                setFireReports(reportsData);

                reportsData.forEach(async report => {
                    const weather = await fetchWeather(report.location.lat, report.location.lng);
                    setReportWeatherData(prevData => ({
                        ...prevData,
                        [report.id]: weather,
                    }));
                });
            } catch (error) {
                console.error("Error fetching fire reports:", error);
            }
        };

        fetchFireReports();
    }, []);

    const onMapLoad = useCallback(map => {
        mapRef.current = map;
    }, []);

    const calculateDirections = async fireReport => {
        const directionsService = new window.google.maps.DirectionsService();
        const fireLocation = { lat: fireReport.location.lat, lng: fireReport.location.lng };

        const trafficBasedResponders = await Promise.all(
            responders.map(async responder => {
                const responderLocation = { lat: responder.position.lat, lng: responder.position.lng };

                return new Promise(resolve => {
                    directionsService.route(
                        {
                            origin: responderLocation,
                            destination: fireLocation,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                            drivingOptions: {
                                departureTime: new Date(),
                            },
                        },
                        (result, status) => {
                            if (status === "OK" && result.routes.length > 0) {
                                const leg = result.routes[0].legs[0];
                                resolve({
                                    responderId: responder.id,
                                    responderName: responder.name,
                                    distance: leg.distance.text,
                                    duration: leg.duration_in_traffic
                                        ? leg.duration_in_traffic.text
                                        : leg.duration.text,
                                });
                            } else {
                                resolve(null);
                            }
                        }
                    );
                });
            })
        );

        const validResponders = trafficBasedResponders.filter(Boolean).sort((a, b) => {
            const durationA = parseInt(a.duration.split(" ")[0], 10);
            const durationB = parseInt(b.duration.split(" ")[0], 10);
            return durationA - durationB;
        });

        setDirections({
            fireReportId: fireReport.id,
            nearestResponders: validResponders.slice(0, 3),
        });

        setSelectedFireReport(fireReport);
        setSelectedResponder(null);
    };

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className="view-map-page">
            <Sidebar />
            <div className="main-content">
                <Header />
                <h2>Responders and Reports in Cebu City</h2>
                <div className="map-container">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={12}
                        center={center}
                        onLoad={onMapLoad}
                    >
                        {responders.map(responder => (
                            <Marker
                                key={responder.id}
                                position={responder.position}
                                title={responder.name}
                                icon={{
                                    url: customMarkerUrl,
                                    scaledSize: new window.google.maps.Size(50, 50),
                                }}
                                onClick={() => {
                                    setSelectedResponder(responder);
                                    setSelectedFireReport(null);
                                }}
                            />
                        ))}

                        {fireReports.map(report => (
                            <Marker
                                key={report.id}
                                position={report.location}
                                title={`Reported By: ${report.reportedBy}`}
                                icon={{
                                    url: fireIncidentMarkerUrl,
                                    scaledSize: new window.google.maps.Size(40, 40),
                                }}
                                onClick={() => calculateDirections(report)}
                            />
                        ))}
                    </GoogleMap>
                </div>
            </div>
        </div>
    );
};

export default ViewMap;
