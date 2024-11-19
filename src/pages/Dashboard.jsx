import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Dashboard.css';

const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reportsCollection = collection(firestore, 'reportDetails');
                const snapshot = await getDocs(reportsCollection);
                const reportsData = snapshot.docs.map((doc, index) => ({
                    id: doc.id, // Include the document ID for navigation
                    ...doc.data(),
                }));
                setReports(reportsData);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchReports();
    }, []);

    const handleViewDetails = (report) => {
        navigate('/reports', { state: { report } });
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content">
                    <div className="card">
                        <h2>Incoming Reports</h2>
                        {reports.length > 0 ? (
                            reports.map((report, index) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-details">
                                        <p><strong>Title:</strong> Report #{index + 1}</p>
                                        <p><strong>Caller:</strong> {report.reportedBy || 'Unknown Caller'}</p>
                                        <p><strong>Location:</strong> {`${report.latitude}, ${report.longitude}`}</p>
                                        <p>
                                            <strong>Time:</strong>
                                            {report.timeOfReport?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Unknown Time'}
                                        </p>
                                    </div>
                                    <div className="report-description">
                                        <p><strong>Description:</strong> {report.description || 'No description available'}</p>
                                    </div>
                                    <div className="report-image">
                                        <img
                                            src={report.image || 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg'}
                                            alt="Report"
                                            className="report-image-img"
                                        />
                                    </div>
                                    <div className="button-container">
                                        <button className="acknowledge-button">
                                            Acknowledge
                                        </button>
                                        <button onClick={() => handleViewDetails(report)}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No reports found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
