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
            // Query Firestore to check if this email belongs to a station admin
            const adminsRef = collection(firestore, 'stationAdmin');
            const q = query(adminsRef, where('stationAdmin_Email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Email matches admin; proceed with sign-in
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/dashboard'); // Redirect to dashboard
            } else {
                setError('Unauthorized access. Only station admins are allowed.');
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
                <h1>FlameGuard Admin Login</h1>
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
                <p className="register-link" onClick={() => navigate('/register')}>
                    Register
                </p>
            </form>
        </div>
    );
};

export default LoginForm;
