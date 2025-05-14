import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import '../styles/Dashboard.css';

const StatisticsSection = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState('summary');
  const [reportFormat, setReportFormat] = useState('screen');
  const [dateRange, setDateRange] = useState('month');

  // Fetch statistics data
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/statistics/');
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(`Failed to load statistics data. ${err.message || 'Please try again.'}`);
      setLoading(false);
      
      // Generate mock stats for development/demo purposes
      setStats(generateMockStats());
    }
  };

  const generateMockStats = () => {
    return {
      total_doctors: 24,
      total_patients: 152,
      total_appointments: 387,
      total_lab_tests: 95,
      appointments: {
        today: 8,
        this_week: 37,
        this_month: 124,
        status_distribution: {
          'Scheduled': 45,
          'Completed': 75,
          'Cancelled': 12,
          'No-Show': 8
        }
      },
      departments: [
        { department: 'Cardiology', count: 5 },
        { department: 'Neurology', count: 4 },
        { department: 'Pediatrics', count: 3 },
        { department: 'Orthopedics', count: 3 },
        { department: 'General Medicine', count: 6 },
        { department: 'Dermatology', count: 2 },
        { department: 'Ophthalmology', count: 1 }
      ],
      lab_tests: [
        { status: 'completed', count: 68 },
        { status: 'pending', count: 24 },
        { status: 'processing', count: 3 }
      ],
      patient_gender_distribution: [
        { gender: 'Male', count: 78 },
        { gender: 'Female', count: 71 },
        { gender: 'Other', count: 3 }
      ],
      patient_registration_trend: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 15 },
        { month: 'Mar', count: 20 },
        { month: 'Apr', count: 18 },
        { month: 'May', count: 25 },
        { month: 'Jun', count: 22 }
      ]
    };
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleGenerateReport = () => {
    // In a real app, this would generate a downloadable report
    alert(`Generating ${reportType} report for ${dateRange} in ${reportFormat} format`);
    
    // For a real implementation, you would:
    // 1. Make an API call to generate the report
    // 2. Download the file or display it in a modal
  };

  // Create a chart-like display for departments
  const renderDepartmentChart = () => {
    if (!stats || !stats.departments) return null;

    const maxCount = Math.max(...stats.departments.map(d => d.count));
    
    return (
      <div className="simple-chart">
        <h4>Doctors by Department</h4>
        {stats.departments.map((dept, index) => (
          <div key={index} className="chart-row">
            <div className="chart-label">{dept.department || 'Unknown'}</div>
            <div className="chart-bar-container">
              <div 
                className="chart-bar" 
                style={{ width: `${(dept.count / maxCount) * 100}%` }}
              ></div>
              <span className="chart-value">{dept.count}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Create a pie chart visualization for patient gender distribution
  const renderGenderDistribution = () => {
    if (!stats || !stats.patient_gender_distribution) return null;

    const total = stats.patient_gender_distribution.reduce((sum, item) => sum + item.count, 0);
    let startPercent = 0;
    
    return (
      <div className="stats-card">
        <h4>Patient Gender Distribution</h4>
        <div className="pie-chart-container">
          <div className="pie-chart">
            {stats.patient_gender_distribution.map((item, index) => {
              const percent = (item.count / total) * 100;
              const endPercent = startPercent + percent;
              
              // Create CSS for the pie slice
              const pieSlice = {
                '--start': `${startPercent}%`,
                '--end': `${endPercent}%`,
                '--color': index === 0 ? '#4285f4' : index === 1 ? '#ea4335' : '#fbbc05'
              };
              
              startPercent = endPercent;
              
              return (
                <div 
                  key={index} 
                  className="pie-slice" 
                  style={pieSlice}
                ></div>
              );
            })}
          </div>
        </div>
        <div className="pie-legend">
          {stats.patient_gender_distribution.map((item, index) => (
            <div key={index} className="legend-item">
              <span 
                className="legend-color" 
                style={{ 
                  backgroundColor: index === 0 ? '#4285f4' : index === 1 ? '#ea4335' : '#fbbc05' 
                }}
              ></span>
              <span className="legend-label">{item.gender}</span>
              <span className="legend-value">
                {item.count} ({((item.count / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Create a line chart visualization for patient registration trend
  const renderPatientTrend = () => {
    if (!stats || !stats.patient_registration_trend) return null;
    
    const maxCount = Math.max(...stats.patient_registration_trend.map(i => i.count));
    
    return (
      <div className="stats-card">
        <h4>Patient Registration Trend</h4>
        <div className="line-chart">
          <div className="chart-bars">
            {stats.patient_registration_trend.map((item, index) => (
              <div key={index} className="chart-column">
                <div 
                  className="chart-column-bar" 
                  style={{ height: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="chart-column-value">{item.count}</span>
                </div>
                <div className="chart-column-label">{item.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-indicator">Loading statistics...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchStatistics}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="statistics-section">
      <div className="statistics-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => handleTabChange('patients')}
        >
          Patient Stats
        </button>
        <button 
          className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => handleTabChange('appointments')}
        >
          Appointment Stats
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          Generate Reports
        </button>
      </div>

      <div className="statistics-content">
        {activeTab === 'overview' && (
          <div className="overview-stats">
            <div className="stats-summary">
              <div className="stats-card primary">
                <span className="stats-icon"><i className="fas fa-user-md"></i></span>
                <div className="stats-info">
                  <h3>{stats?.total_doctors || 0}</h3>
                  <p>Doctors</p>
                </div>
              </div>
              <div className="stats-card success">
                <span className="stats-icon"><i className="fas fa-users"></i></span>
                <div className="stats-info">
                  <h3>{stats?.total_patients || 0}</h3>
                  <p>Patients</p>
                </div>
              </div>
              <div className="stats-card warning">
                <span className="stats-icon"><i className="fas fa-calendar-check"></i></span>
                <div className="stats-info">
                  <h3>{stats?.total_appointments || 0}</h3>
                  <p>Appointments</p>
                </div>
              </div>
              <div className="stats-card danger">
                <span className="stats-icon"><i className="fas fa-flask"></i></span>
                <div className="stats-info">
                  <h3>{stats?.total_lab_tests || 0}</h3>
                  <p>Lab Tests</p>
                </div>
              </div>
            </div>

            <div className="stats-charts">
              <div className="stats-row">
                {/* Department distribution chart */}
                <div className="stats-column">
                  {renderDepartmentChart()}
                </div>
                
                {/* Gender distribution chart */}
                <div className="stats-column">
                  {renderGenderDistribution()}
                </div>
              </div>
              
              <div className="stats-row">
                {/* Recent patient trend chart */}
                <div className="stats-column">
                  {renderPatientTrend()}
                </div>
                
                {/* Appointment status chart */}
                <div className="stats-column">
                  <div className="stats-card">
                    <h4>Appointment Status</h4>
                    <div className="status-distribution">
                      {stats?.appointments?.status_distribution && 
                       Object.entries(stats.appointments.status_distribution).map(([status, count], index) => (
                        <div key={index} className="status-item">
                          <div className="status-label">{status}</div>
                          <div className="status-count">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="patient-stats">
            <div className="stats-row">
              <div className="stats-column">
                <div className="stats-card">
                  <h3>Patient Demographics</h3>
                  {renderGenderDistribution()}
                </div>
              </div>
              
              <div className="stats-column">
                <div className="stats-card">
                  <h3>Patient Growth</h3>
                  {renderPatientTrend()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointment-stats">
            <div className="stats-row">
              <div className="stats-column">
                <div className="stats-card">
                  <h3>Appointment Summary</h3>
                  <div className="appointment-metrics">
                    <div className="metric">
                      <div className="metric-label">Today's Appointments</div>
                      <div className="metric-value">{stats?.appointments?.today || 0}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">This Week</div>
                      <div className="metric-value">{stats?.appointments?.this_week || 0}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">This Month</div>
                      <div className="metric-value">{stats?.appointments?.this_month || 0}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Total Appointments</div>
                      <div className="metric-value">{stats?.total_appointments || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stats-column">
                <div className="stats-card">
                  <h3>Appointment Status Distribution</h3>
                  <div className="status-distribution-chart">
                    {stats?.appointments?.status_distribution && 
                     Object.entries(stats.appointments.status_distribution).map(([status, count], index) => {
                      const total = Object.values(stats.appointments.status_distribution).reduce((a, b) => a + b, 0);
                      const percent = ((count / total) * 100).toFixed(1);
                      
                      return (
                        <div key={index} className="status-bar">
                          <div className="status-bar-label">{status}</div>
                          <div className="status-bar-container">
                            <div 
                              className={`status-bar-fill status-${status.toLowerCase().replace(' ', '-')}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                            <div className="status-bar-text">{count} ({percent}%)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h3>Generate Reports</h3>
            <div className="report-form">
              <div className="form-group">
                <label>Report Type</label>
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="patients">Patients Report</option>
                  <option value="appointments">Appointments Report</option>
                  <option value="doctors">Doctors Report</option>
                  <option value="financials">Financial Report</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Date Range</label>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Format</label>
                <select 
                  value={reportFormat} 
                  onChange={(e) => setReportFormat(e.target.value)}
                >
                  <option value="screen">View on Screen</option>
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV File</option>
                </select>
              </div>
              
              <button className="generate-report-btn" onClick={handleGenerateReport}>
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsSection; 