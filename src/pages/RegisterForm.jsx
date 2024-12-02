import React, { useState, useRef } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';
import './RegisterForm.css';

const mapContainerStyle = {
    height: '300px',
    width: '100%',
};

const defaultCenter = { lat: 10.3157, lng: 123.8854 };

const RegisterForm = () => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState(''); // Full address with street name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contact, setContact] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [stationChief, setStationChief] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const autocompleteRef = useRef(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: 'AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQ',
        libraries: ['places'],
    });

    const handlePlaceSelected = () => {
        const place = autocompleteRef.current.getPlace();

        if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setLatitude(lat);
            setLongitude(lng);

            const fullAddress = place.formatted_address || 'Unknown address';

            // Extract street name
            const streetNameComponent = place.address_components?.find((component) =>
                component.types.includes('route')
            );
            const streetName = streetNameComponent?.long_name || '';

            const combinedAddress = streetName ? `${streetName}, ${fullAddress}` : fullAddress;
            setAddress(combinedAddress);

            const placeName = place.name || fullAddress.split(',')[0];
            if (document.getElementById('search')) {
                document.getElementById('search').value = placeName;
            }
        }
    };

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setLatitude(lat);
        setLongitude(lng);

        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC5eQ8Le4-U65MLi8ZqFXlytEjico-J8lQ`;

        try {
            const response = await axios.get(geocodeUrl);
            const formattedAddress = response.data.results[0]?.formatted_address || 'Unknown location';
            setAddress(formattedAddress);
        } catch (err) {
            console.error('Error getting address:', err);
            setAddress('Error retrieving address');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            const responderDocRef = doc(firestore, 'responders', userId);
            await setDoc(responderDocRef, {
                respondents_Id: userId,
                respondents_Name: name,
                respondents_Address: address,
                respondents_Email: email,
                respondents_Password: password,
                respondents_Contact: contact,
                respondents_latitude: latitude,
                respondents_longitude: longitude,
                respondents_StationChief: stationChief,
            });

            alert('Responder registered successfully!');
            navigate('/profiles');
        } catch (err) {
            console.error('Registration error:', err.message);
            setError(err.message || 'Error during registration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <p>Loading map...</p>;

    return (
        <div className="register-container">
            <div className="register-form">
                <h1>Register New Responder</h1>
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name:</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contact">Contact Number:</label>
                        <input
                            type="tel"
                            id="contact"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="stationChief">Station Chief:</label>
                        <input
                            type="text"
                            id="stationChief"
                            value={stationChief}
                            onChange={(e) => setStationChief(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Full Address:</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Click on the map to select location"
                            required
                        />
                    </div>

                    <div className="address-section">
                        <h3>Location Details</h3>
                        <div className="form-group">
                            <label htmlFor="search">Search Location:</label>
                            <Autocomplete
                                onLoad={(ref) => (autocompleteRef.current = ref)}
                                onPlaceChanged={handlePlaceSelected}
                            >
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search for a location"
                                    className="search-box"
                                />
                            </Autocomplete>
                        </div>
                        <div className="form-group">
                            <p>Latitude: {latitude || 'N/A'}</p>
                            <p>Longitude: {longitude || 'N/A'}</p>
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            </div>

            <div className="map-container">
                <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={defaultCenter}
                    zoom={13}
                    onClick={handleMapClick}
                    className="google-map"
                >
                    {latitude && longitude && <Marker position={{ lat: latitude, lng: longitude }} />}
                </GoogleMap>
            </div>
        </div>
    );
};

export default RegisterForm;
