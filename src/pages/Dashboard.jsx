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
    const [allReports, setAllReports] = useState([]);
    const [isDescending, setIsDescending] = useState(true); // Default to descending
    const [lastOpenedReport, setLastOpenedReport] = useState(null);
    const [model, setModel] = useState(null); // Store the TensorFlow model
    const [allReportsSortOption, setAllReportsSortOption] = useState('all'); // 'all', 'fireOut', 'ongoing'
    const [isAllReportsDescending, setIsAllReportsDescending] = useState(false);
    const navigate = useNavigate();

    // Sorting logic
    const sortedAllReports = allReports
        .filter((report) => {
            if (allReportsSortOption === 'fireOut') return report.status === 'fire out';
            if (allReportsSortOption === 'ongoing') return report.status === 'on going';
            return true; // Show all reports
        })
        .sort((a, b) => {
            if (isAllReportsDescending) return b.timeOfReport - a.timeOfReport;
            return a.timeOfReport - b.timeOfReport;
        });


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

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const endOfDay = new Date(today);
                endOfDay.setHours(23, 59, 59, 999);

                // Filter and sort reports
                const todayReports = reportsData.filter(
                    (report) =>
                        report.status === 'on going' &&
                        report.timeOfReport &&
                        report.timeOfReport >= today &&
                        report.timeOfReport <= endOfDay
                );

                const sortedByTime = todayReports.sort(
                    (a, b) => (a.timeOfReport || new Date(0)) - (b.timeOfReport || new Date(0))
                );

                const numberedReports = sortedByTime.map((report, index) => ({
                    ...report,
                    number: index + 1,
                }));

                const allReportsSorted = reportsData
                    .sort((a, b) => (b.timeOfReport || new Date(0)) - (a.timeOfReport || new Date(0)))
                    .map((report, index) => ({
                        ...report,
                        number: index + 1,
                    }));

                setReports(numberedReports);
                setAllReports(allReportsSorted);
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

    // Function to determine fire level and append response to description
    const getFireLevelInfo = (fireSpreadRate) => {
        if (fireSpreadRate >= 0 && fireSpreadRate < 14) {
            return { level: "1", response: "1-2 fire trucks from nearby fire stations in Cebu City except Talamban and Talisay, escalate to level 2 in 15 mins" };
        } else if (fireSpreadRate >= 14 && fireSpreadRate <= 16) {
            return { level: "1", response: "1-2 fire trucks from nearby fire stations in Cebu City except Talamban and Talisay, escalate to level 2 in 15 mins" };
        } else if (fireSpreadRate > 16 && fireSpreadRate <= 21) {
            return { level: "1", response: "2 fire trucks from nearby fire stations in Cebu City except Talamban and Talisay, escalate to level 2 in 15 mins" };
        } else if (fireSpreadRate > 21 && fireSpreadRate <= 30) {
            return { level: "1", response: "2-4 fire trucks from nearby fire stations in Cebu City, potential level 2 in less than 15 mins" };
        } else if (fireSpreadRate > 30) {
            return { level: "1", response: "4-5 fire trucks from nearby fire stations in Cebu City, potential level 2 in less than 15 mins" };
        } else {
            return { level: "No Fire Level", response: "Normal conditions, no specific response required" };
        }
    };

    // Predict fire spread and update Firestore
    const predictFireSpread = async (report) => {
        try {
            const normalizedTemperature = normalize(report.temperature, 26, 36);
            const normalizedHumidity = normalize(report.humidity, 40, 80);
            const normalizedWindSpeed = normalize(report.windSpeed, 1.5, 8);
            const normalizedHousingSpace = normalize(report.housingSpace || 0, 0.5, 6);
            const normalizedBuildingHeight = normalize(report.floors || 1, 1, 10);
            const normalizedDistanceToStation = normalize(report.distanceToStation || 0.5, 0.5, 3);

            const housingMaterialWood = report.materialType === 'Wood' ? 1 : 0;
            const housingMaterialBrick = report.materialType === 'Brick' ? 1 : 0;
            const housingMaterialConcrete = report.materialType === 'Concrete' ? 1 : 0;

            const zoningResidential = report.propertyType === 'Residential' ? 1 : 0;
            const zoningMixedUse = report.propertyType === 'Mixed-use' ? 1 : 0;
            const zoningCommercial = report.propertyType === 'Commercial' ? 1 : 0;

            const inputData = [
                normalizedTemperature,
                normalizedHumidity,
                normalizedWindSpeed,
                normalizedHousingSpace,
                normalizedBuildingHeight,
                normalizedDistanceToStation,
                housingMaterialWood,
                housingMaterialBrick,
                housingMaterialConcrete,
                zoningResidential,
                zoningMixedUse,
                zoningCommercial,
            ];

            const inputTensor = tf.tensor([inputData]);
            const predictionTensor = model.predict(inputTensor);
            const prediction = parseFloat(predictionTensor.dataSync()[0].toFixed(2));
            const { level, response } = getFireLevelInfo(prediction);

            // Clear and update the description field
            await updateDoc(doc(firestore, 'reportDetails', report.id), {
                description: '', // Clear the existing description
            });

            // Update the report with the new values
            await updateDoc(doc(firestore, 'reportDetails', report.id), {
                fireSpread: prediction,
                fireLevel: level,
                description: response, // Set the description to the recommended response
            });

            console.log(`Updated report ${report.id}:`, { prediction, level, response });
        } catch (error) {
            console.error(`Error predicting fire spread for report ${report.id}:`, error);
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
        <div className="dashboard-container fire-theme">
            <Sidebar onViewReportClick={handleViewReportFromSidebar} />
            <div className="main-content">
                <Header />
                <div className="content">
                    <div className="card">
                        <div className="header-row">
                            <h3>🔥 Incoming Reports</h3>
                            <button
                                onClick={toggleSortOrder}
                                className="sort-button"
                                aria-label={`Toggle sort order to ${isDescending ? 'ascending' : 'descending'}`}
                            >
                                {isDescending ? '⬆️' : '⬇️'}
                            </button>
                        </div>
                        {sortedReports.length > 0 ? (
                            <div className="report-grid">
                                {sortedReports.map((report) => (
                                    <div key={report.id} className="report-card">
                                        <div className="report-content">
                                            <h3>Report #{report.number}</h3>
                                            <div className="report-details-horizontal">
                                                <div className="report-details-item">
                                                    <h3><strong>Reported by:</strong> {report.reportedBy || 'Unknown Caller'}</h3>
                                                </div>
                                            </div>
                                            <div className="report-details-horizontal">

                                                <div className="report-details-item">
                                                    <p><strong>Coordinates:</strong> Lat: {report.latitude || 'N/A'}, Lng: {report.longitude || 'N/A'}</p>
                                                </div>
                                                <div className="report-details-item">
                                                    <p>
                                                        <strong>Time:</strong>{' '}
                                                        {report.timeOfReport
                                                            ? report.timeOfReport.toLocaleString([], {
                                                                dateStyle: 'short',
                                                                timeStyle: 'short',
                                                            })
                                                            : 'Unknown Time'}
                                                    </p>
                                                </div>
                                                <div className="report-details-item">
                                                    <p><strong>Fire Level:</strong> {report.fireLevel || 'Not Predicted'}</p>
                                                </div>
                                            </div>
                                            <div className="report-details-horizontal">
                                                <div className="report-details-item">
                                                    <p><strong>Response Suggestion:</strong> {report.description || 'No description available'}</p>
                                                </div>
                                            </div>
                                            <div className="report-image">
                                                <img
                                                    src={
                                                        report.image && report.image.startsWith('http')
                                                            ? report.image
                                                            : 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg'
                                                    }
                                                    alt={`Report ${report.number}`}
                                                    className="report-image-img"
                                                />
                                            </div>
                                            <div className="button-container">
                                                <button
                                                    className="acknowledge-button"
                                                    onClick={() => navigate('/response', { state: { report } })}
                                                >
                                                    Acknowledge 🔥
                                                </button>
                                                <button onClick={() => handleViewDetails(report)} aria-label="View Details">
                                                    View Details 🔍
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No reports found.</p>
                        )}
                    </div>

                    <div className="card">
                        <div className="header-row">
                            <h3>📋 All Reports</h3>

                            <button
                                onClick={() => setIsAllReportsDescending((prev) => !prev)}
                                className="sort-button"
                                aria-label={`Toggle sort order to ${isAllReportsDescending ? 'ascending' : 'descending'}`}
                            >
                                {isAllReportsDescending ? '⬆️' : '⬇️'}
                            </button>
                        </div>

                        <select
                            className="sort-dropdown"
                            value={allReportsSortOption}
                            onChange={(e) => setAllReportsSortOption(e.target.value)}
                        >
                            <option value="all">All Reports</option>
                            <option value="fireOut">Fire Out</option>
                            <option value="ongoing">On Going</option>
                        </select>

                        <br /><br />

                        {sortedAllReports.length > 0 ? (
                            <div className="report-grid">
                                {sortedAllReports.map((report) => (
                                    <div key={report.id} className="report-card">
                                        <div className="report-content">
                                            <div className="report-details-horizontal">
                                                <div className="report-details-item">
                                                    <h3><strong>Reported by:</strong> {report.reportedBy || 'Unknown Caller'}</h3>
                                                </div>
                                            </div>
                                            <div className="report-details-horizontal">
                                                <div className="report-details-item">
                                                    <p><strong>Coordinates:</strong> Lat: {report.latitude || 'N/A'}, Lng: {report.longitude || 'N/A'}</p>
                                                </div>
                                                <div className="report-details-item">
                                                    <p>
                                                        <strong>Time:</strong>{' '}
                                                        {report.timeOfReport
                                                            ? report.timeOfReport.toLocaleString([], {
                                                                dateStyle: 'short',
                                                                timeStyle: 'short',
                                                            })
                                                            : 'Unknown Time'}
                                                    </p>
                                                </div>
                                                <div className="report-details-item">
                                                    <p><strong>Fire Level:</strong> {report.fireLevel || 'Not Predicted'}</p>
                                                </div>
                                            </div>
                                            <div className="report-details-horizontal">
                                                <div className="report-details-item">
                                                    <p><strong>Response Suggestion:</strong> {report.description || 'No description available'}</p>
                                                </div>
                                                <div className="report-details-item">
                                                    <p><strong>Status:</strong> {report.status || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="report-image">
                                                <img
                                                    src={
                                                        report.image && report.image.startsWith('http')
                                                            ? report.image
                                                            : 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg'
                                                    }
                                                    alt={`Report ${report.number}`}
                                                    className="report-image-img"
                                                />
                                            </div>
                                            <div className="button-container">
                                                <button onClick={() => handleViewDetails(report)} aria-label="View Details">
                                                    View Details 🔍
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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