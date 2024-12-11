import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import * as tf from '@tensorflow/tfjs';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Dashboard.css';

// Helper function to normalize values
const normalize = (value, min, max) => {
    return (value - min) / (max - min);
};

const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const [sortedReports, setSortedReports] = useState([]);
    const [isDescending, setIsDescending] = useState(true);
    const [lastOpenedReport, setLastOpenedReport] = useState(null);
    const [model, setModel] = useState(null);
    const [addressCache, setAddressCache] = useState({});
    const navigate = useNavigate();

    // Load TensorFlow.js model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await tf.loadLayersModel('/models/fire_spread_model_tfjs/model.json');
                setModel(loadedModel);
            } catch (error) {
                console.error('Error loading TensorFlow.js model:', error);
            }
        };

        loadModel();
    }, []);

    // Fetch reports from Firestore
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reportsCollection = collection(firestore, 'reportDetails');
                const snapshot = await getDocs(reportsCollection);
                const reportsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    timeOfReport: doc.data().timeOfReport?.toDate(),
                }));

                const sortedByTime = reportsData.sort(
                    (a, b) => (a.timeOfReport || new Date(0)) - (b.timeOfReport || new Date(0))
                );

                const numberedReports = sortedByTime.map((report, index) => ({
                    ...report,
                    number: index + 1,
                }));

                setReports(numberedReports);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchReports();
    }, []);

    // Predict fire spread automatically for all reports
    useEffect(() => {
        const predictForAllReports = async () => {
            if (model && reports.length > 0) {
                for (const report of reports) {
                    await predictFireSpread(report);
                }
            }
        };

        predictForAllReports();
    }, [model, reports]);

    // Fetch addresses for all reports
    useEffect(() => {
        const fetchAddresses = async () => {
            if (reports.length > 0) {
                for (const report of reports) {
                    if (report.latitude && report.longitude && !addressCache[report.id]) {
                        await fetchAddress(report.id, report.latitude, report.longitude);
                    }
                }
            }
        };

        fetchAddresses();
    }, [reports, addressCache]);

    const fetchAddress = async (reportId, lat, lng) => {
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                setAddressCache((prev) => ({
                    ...prev,
                    [reportId]: response.results[0].formatted_address,
                }));
            } else {
                setAddressCache((prev) => ({
                    ...prev,
                    [reportId]: 'Address not found',
                }));
            }
        } catch (error) {
            console.error(`Error fetching address for report ${reportId}:`, error);
            setAddressCache((prev) => ({
                ...prev,
                [reportId]: 'Error fetching address',
            }));
        }
    };

    const toggleSortOrder = () => {
        setIsDescending((prev) => !prev);
    };

    const handleViewDetails = (report) => {
        setLastOpenedReport(report);
        navigate('/reports', { state: { report } });
    };

    const handleViewReportFromSidebar = () => {
        if (lastOpenedReport) {
            navigate('/reports', { state: { report: lastOpenedReport } });
        } else if (sortedReports.length > 0) {
            navigate('/reports', { state: { report: sortedReports[0] } });
        }
    };

    useEffect(() => {
        const sorted = [...reports].sort((a, b) => {
            const timeA = a.timeOfReport || new Date(0);
            const timeB = b.timeOfReport || new Date(0);
            return isDescending ? timeB - timeA : timeA - timeB;
        });

        setSortedReports(sorted);
    }, [reports, isDescending]);

    return (
        <div className="dashboard-container">
            <Sidebar onViewReportClick={handleViewReportFromSidebar} />
            <div className="main-content">
                <Header />
                <div className="content">
                    <div className="card">
                        <div className="header-row">
                            <h2>Incoming Reports</h2>
                            <button onClick={toggleSortOrder} className="sort-button">
                                {isDescending ? 'Sort Ascending' : 'Sort Descending'}
                            </button>
                        </div>
                        {sortedReports.length > 0 ? (
                            sortedReports.map((report) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-details">
                                        <p><strong>Report #</strong> {report.number}</p>
                                        <p><strong>Caller:</strong> {report.reportedBy || 'Unknown Caller'}</p>
                                        <p><strong>Location:</strong> {addressCache[report.id] || 'Loading...'}</p>
                                        <p><strong>Time:</strong>
                                            {report.timeOfReport
                                                ? report.timeOfReport.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                                : 'Unknown Time'}
                                        </p>
                                    </div>

                                    <div className="report-description">
                                        <p><strong>Description:</strong> {report.description || 'No description available'}</p>
                                    </div>

                                    <div className="report-main-content">
                                        {/* Report Image */}
                                        <div className="report-image-container">
                                            <div className="report-image">
                                                <img
                                                    src={report.image || 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg'}
                                                    alt="Report"
                                                    className="report-image-img"
                                                />
                                            </div>
                                        </div>

                                        {/* Fire Level and Status */}
                                        <div className="fire-info">
                                            <div className="fire-level-status">
                                                <p><strong>Fire Level:</strong> {report.fireLevel || 'Not predicted'}</p>
                                                <p><strong>Status:</strong> {report.status || 'Status not available'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="button-container">
                                        <button
                                            className="acknowledge-button"
                                            onClick={() => navigate('/response', { state: { report } })}
                                        >
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
