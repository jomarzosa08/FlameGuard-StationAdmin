import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Import your Firestore config
import * as tf from '@tensorflow/tfjs'; // Import TensorFlow.js
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
    const [isDescending, setIsDescending] = useState(true); // Default to descending
    const [lastOpenedReport, setLastOpenedReport] = useState(null);
    const [model, setModel] = useState(null); // Store the TensorFlow model
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
                    timeOfReport: doc.data().timeOfReport?.toDate(), // Convert Firestore timestamp to JS Date
                }));

                // Sort reports by timeOfReport in ascending order (oldest first) for numbering
                const sortedByTime = reportsData.sort(
                    (a, b) => (a.timeOfReport || new Date(0)) - (b.timeOfReport || new Date(0))
                );

                // Assign chronological numbers (oldest report is 1)
                const numberedReports = sortedByTime.map((report, index) => ({
                    ...report,
                    number: index + 1, // Assign number based on chronological order
                }));

                setReports(numberedReports); // Save reports with assigned numbers
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

    // Function to predict fire spread and update Firestore
    const predictFireSpread = async (report) => {
        try {
            // Normalize and encode input features
            const normalizedTemperature = normalize(report.temperature, 26, 36);
            const normalizedHumidity = normalize(report.humidity, 40, 80);
            const normalizedWindSpeed = normalize(report.windSpeed, 1.5, 8);
            const normalizedHousingSpace = normalize(report.housingSpace || 0, 0.5, 6);
            const normalizedBuildingHeight = normalize(report.floors || 1, 1, 10);
            const normalizedDistanceToStation = normalize(report.distanceToStation || 0.5, 0.5, 3);

            // One-hot encode housing material
            const housingMaterialWood = report.materialType === 'Wood' ? 1 : 0;
            const housingMaterialBrick = report.materialType === 'Brick' ? 1 : 0;
            const housingMaterialConcrete = report.materialType === 'Concrete' ? 1 : 0;

            // One-hot encode zoning
            const zoningResidential = report.propertyType === 'Residential' ? 1 : 0;
            const zoningMixedUse = report.propertyType === 'Mixed-use' ? 1 : 0;
            const zoningCommercial = report.propertyType === 'Commercial' ? 1 : 0;

            // Prepare input array (12 features)
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

            // Convert input array to Tensor
            const inputTensor = tf.tensor([inputData]);

            // Run prediction
            const predictionTensor = model.predict(inputTensor);

            // Get prediction value and round to 2 decimal places
            const prediction = parseFloat(predictionTensor.dataSync()[0].toFixed(2));

            // Update Firestore with prediction
            await updateDoc(doc(firestore, 'reportDetails', report.id), {
                fireSpread: prediction,
            });

            console.log(`Predicted fire spread for report ${report.id}: ${prediction}`);
        } catch (error) {
            console.error(`Error predicting fire spread for report ${report.id}:`, error);
        }
    };


    // Handle sorting order toggle
    const toggleSortOrder = () => {
        setIsDescending((prev) => !prev); // Toggle sort order
    };

    // Handle viewing report details
    const handleViewDetails = (report) => {
        setLastOpenedReport(report); // Update the last opened report
        navigate('/reports', { state: { report } });
    };

    // Handle navigating to report from the sidebar
    const handleViewReportFromSidebar = () => {
        if (lastOpenedReport) {
            navigate('/reports', { state: { report: lastOpenedReport } });
        } else if (sortedReports.length > 0) {
            navigate('/reports', { state: { report: sortedReports[0] } }); // Default to most recent
        }
    };

    // Sort reports based on current sort order (ascending or descending)
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
                                        <p><strong>Title:</strong> Report #{report.number}</p>
                                        <p><strong>Caller:</strong> {report.reportedBy || 'Unknown Caller'}</p>
                                        <p><strong>Location:</strong> {`${report.latitude}, ${report.longitude}`}</p>
                                        <p>
                                            <strong>Time:</strong>
                                            {report.timeOfReport
                                                ? report.timeOfReport.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                                : 'Unknown Time'}
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
