// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check if email belongs to Station Admin
            const stationAdminsRef = collection(firestore, 'stationAdmin');
            const stationAdminQuery = query(stationAdminsRef, where('stationAdmin_Email', '==', email));
            const stationAdminSnapshot = await getDocs(stationAdminQuery);

            // Check if email belongs to System Admin
            const systemAdminsRef = collection(firestore, 'systemAdmin');
            const systemAdminQuery = query(systemAdminsRef, where('systemAdmin_Email', '==', email));
            const systemAdminSnapshot = await getDocs(systemAdminQuery);

            if (!stationAdminSnapshot.empty) {
                // Email matches Station Admin
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/dashboard'); // Redirect to Station Admin Dashboard
            } else if (!systemAdminSnapshot.empty) {
                // Email matches System Admin
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/SystemAdminDashboard'); // Redirect to System Admin Dashboard
            } else {
                setError('Unauthorized access. Only authorized admins are allowed.');
            }
        } catch (error) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <img src="flameguard-logo.png" alt="logo" className="login-logo" />
                <h1>FlameGuard</h1>
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
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
