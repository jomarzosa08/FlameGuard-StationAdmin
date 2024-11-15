// src/pages/UserProfiles.jsx

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './UserProfiles.css';

const UserProfiles = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const callerCollection = collection(firestore, 'caller');
                const snapshot = await getDocs(callerCollection);
                const userList = snapshot.docs.map((doc) => doc.data());
                setUsers(userList);
            } catch (error) {
                console.error('Error fetching user profiles:', error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="user-profiles-page">
            <Sidebar /> {/* Include Sidebar */}
            <div className="main-content">
                <Header /> {/* Include Header */}
                <div className="user-profiles-container">
                    <h2>User Profiles</h2>
                    <table className="user-profiles-table">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Address</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, index) => (
                                    <tr key={index}>
                                        <td>{user.firstName}</td>
                                        <td>{user.lastName}</td>
                                        <td>{user.address}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phoneNumber}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5">No user profiles found.</td>
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
