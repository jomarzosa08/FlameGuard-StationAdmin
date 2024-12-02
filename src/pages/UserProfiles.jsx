import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './UserProfiles.css';

const UserProfiles = () => {
    const [responders, setResponders] = useState([]);
    const [editingResponder, setEditingResponder] = useState(null);
    const [updatedResponder, setUpdatedResponder] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch responders from Firestore
    useEffect(() => {
        const fetchResponders = async () => {
            try {
                const respondersCollection = collection(firestore, 'responders');
                const snapshot = await getDocs(respondersCollection);
                const responderList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setResponders(responderList);
            } catch (error) {
                console.error('Error fetching responder profiles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResponders();
    }, []);

    // Handle editing a responder
    const handleEdit = (responder) => {
        setEditingResponder(responder.id);
        setUpdatedResponder({ ...responder });
    };

    // Handle deleting a responder
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this profile? This action cannot be undone.'
        );
        if (confirmDelete) {
            try {
                // Delete from Firestore
                await deleteDoc(doc(firestore, 'responders', id));
                setResponders(responders.filter((responder) => responder.id !== id));

                // Delete from Firebase Authentication
                const user = await auth.getUser(id); // Fetch the user
                await deleteUser(user); // Delete the user
                alert('Responder profile deleted successfully!');
            } catch (error) {
                console.error('Error deleting responder:', error);
                alert('Failed to delete responder profile.');
            }
        }
    };

    // Handle updating a responder
    const handleUpdate = async () => {
        if (!updatedResponder.respondents_Email.includes('@')) {
            alert('Please provide a valid email address.');
            return;
        }
        if (isNaN(updatedResponder.respondents_Contact) || updatedResponder.respondents_Contact.length < 10) {
            alert('Please provide a valid contact number with at least 10 digits.');
            return;
        }
        try {
            const responderDoc = doc(firestore, 'responders', editingResponder);
            await updateDoc(responderDoc, updatedResponder);
            setResponders((prevResponders) =>
                prevResponders.map((responder) =>
                    responder.id === editingResponder ? updatedResponder : responder
                )
            );
            setEditingResponder(null);
            alert('Responder profile updated successfully!');
        } catch (error) {
            console.error('Error updating responder:', error);
            alert('Failed to update responder profile.');
        }
    };

    // Handle input changes for editing
    const handleInputChange = (field, value) => {
        setUpdatedResponder((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="user-profiles-page">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="user-profiles-container">
                <div className="user-profiles-header">
                        <h2>Responder Profiles</h2>
                        <button
                            className="add-responder-button"
                            onClick={() => navigate('/register')}
                        >
                            Add Responder
                        </button>
                    </div>
                    <br />
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
                            {responders.length > 0 ? (
                                responders.map((responder) => (
                                    <tr key={responder.id}>
                                        {editingResponder === responder.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={updatedResponder.respondents_Name}
                                                        onChange={(e) =>
                                                            handleInputChange('respondents_Name', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={updatedResponder.respondents_Address}
                                                        onChange={(e) =>
                                                            handleInputChange('respondents_Address', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={updatedResponder.respondents_Email}
                                                        onChange={(e) =>
                                                            handleInputChange('respondents_Email', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={updatedResponder.respondents_Contact}
                                                        onChange={(e) =>
                                                            handleInputChange('respondents_Contact', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <button className="save-button" onClick={handleUpdate}>
                                                        Save
                                                    </button>
                                                    <button
                                                        className="cancel-button"
                                                        onClick={() => setEditingResponder(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{responder.respondents_Name}</td>
                                                <td>{responder.respondents_Address}</td>
                                                <td>{responder.respondents_Email}</td>
                                                <td>{responder.respondents_Contact}</td>
                                                <td>
                                                    <button
                                                        className="edit-button"
                                                        onClick={() => handleEdit(responder)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleDelete(responder.id)}
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
                                    <td colSpan="5">No responder profiles found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserProfiles;
