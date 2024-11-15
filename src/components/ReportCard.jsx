// src/components/ReportCard.jsx

import React from 'react';
import './ReportCard.css';

const ReportCard = ({ report }) => {
  return (
    <div className="report-card">
      <h3>{report.title}</h3>
      <div className="report-details">
        <p><strong>Caller:</strong> {report.caller}</p>
        <p><strong>Location:</strong> {report.location}</p>
        <p><strong>Time:</strong> {report.time}</p>
      </div>
      <p><strong>Description:</strong> {report.description}</p>
      <div className="report-image">
        <img src={report.image} alt={report.title} />
      </div>
      <div className="button-container">
        <button>Acknowledge</button>
        <button onClick={() => alert('Redirecting to report details')}>View Details</button>
      </div>
    </div>
  );
};

export default ReportCard;
