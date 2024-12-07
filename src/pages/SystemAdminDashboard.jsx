import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SystemAdminSidebar';
import Header from '../components/Header'; 
import './SystemAdminDashboard.css';

const SystemAdminDashboard = () => {
    const [callers, setCallers] = useState([]);
    const [editingCaller, setEditingCaller] = useState(null);
    const [updatedCaller, setUpdatedCaller] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCallers = async () => {
            try {
                const callersRef = collection(firestore, 'caller'); // Replace 'caller' with your collection name
                const querySnapshot = await getDocs(callersRef);
                const callersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCallers(callersData);
            } catch (err) {
                setError('Failed to load caller data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCallers();
    }, []);

    const handleEdit = (caller) => {
        setEditingCaller(caller.id);
        setUpdatedCaller({ ...caller });
    };

    const handleInputChange = (field, value) => {
        setUpdatedCaller((prev) => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async () => {
        // Implement Firestore update logic here
        setEditingCaller(null); // Exit editing mode
    };

    const handleDelete = async (id) => {
        // Implement Firestore delete logic here
    };

    return (
        <div className="user-profiles-page">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="user-profiles-container">
                    <div className="user-profiles-header">
                        <h2>Caller Profiles</h2>
                    </div>
                    <br />
                    {loading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <table className="user-profiles-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Email</th>
                                    <th>Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {callers.length > 0 ? (
                                    callers.map((caller) => (
                                        <tr key={caller.id}>
                                            {editingCaller === caller.id ? (
                                                <>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={updatedCaller.firstName}
                                                            onChange={(e) =>
                                                                handleInputChange('firstName', e.target.value)
                                                            }
                                                        />
                                                        <input
                                                            type="text"
                                                            value={updatedCaller.lastName}
                                                            onChange={(e) =>
                                                                handleInputChange('lastName', e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={updatedCaller.address}
                                                            onChange={(e) =>
                                                                handleInputChange('address', e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="email"
                                                            value={updatedCaller.email}
                                                            onChange={(e) =>
                                                                handleInputChange('email', e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={updatedCaller.phoneNumber}
                                                            onChange={(e) =>
                                                                handleInputChange('phoneNumber', e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <button className="save-button" onClick={handleUpdate}>
                                                            Save
                                                        </button>
                                                        <button
                                                            className="cancel-button"
                                                            onClick={() => setEditingCaller(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>
                                                        {caller.firstName} {caller.lastName}
                                                    </td>
                                                    <td>{caller.address}</td>
                                                    <td>{caller.email}</td>
                                                    <td>{caller.phoneNumber}</td>
                                                    <td>
                                                        <button
                                                            className="edit-button"
                                                            onClick={() => handleEdit(caller)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="delete-button"
                                                            onClick={() => handleDelete(caller.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">No caller profiles found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemAdminDashboard;
