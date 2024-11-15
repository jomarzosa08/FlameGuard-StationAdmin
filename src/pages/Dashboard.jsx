// src/pages/Dashboard.jsx

import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReportCard from '../components/ReportCard';
import './Dashboard.css';

const Dashboard = () => {
  const reports = [
    {
      title: 'Report #1',
      caller: 'John Doe',
      location: '123 Main St',
      time: '14:35',
      description: 'Fire reported at the main entrance of the building, heavy smoke visible.',
      image: 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg',
    },
    {
      title: 'Report #2',
      caller: 'Jane Smith',
      location: '456 Elm St',
      time: '15:12',
      description: 'Fire in the kitchen, flames visible, no injuries reported.',
      image: 'https://i.cdn.turner.com/cnn/2010/WORLD/asiapcf/04/25/philippines.fire/t1larg.afp.gi.jpg',
    },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="content">
          <div className="card">
            <h2>Incoming Reports</h2>
            {reports.map((report, index) => (
              <ReportCard key={index} report={report} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
