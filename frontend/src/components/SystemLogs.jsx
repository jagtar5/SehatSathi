import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from './Modal';
import '../styles/Dashboard.css';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'error', 'warning', 'info'
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogDetailsModal, setShowLogDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Fetch system logs
  useEffect(() => {
    fetchSystemLogs();
  }, [logFilter]);

  const fetchSystemLogs = async () => {
    setLoading(true);
    try {
      // Add filter as query parameter if not 'all'
      const endpoint = logFilter !== 'all' 
        ? `/logs/?level=${logFilter}` 
        : '/logs/';
        
      const response = await apiClient.get(endpoint);
      
      // Process and normalize log data
      const processedLogs = (response.data || []).map((log, index) => ({
        id: log.id || `log-${Date.now()}-${index}`,
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level?.toLowerCase() || 'info',
        source: log.source || 'system',
        message: log.message || 'Log entry',
        details: log.details || null
      }));
      
      setLogs(processedLogs);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(`Failed to load system logs: ${err.message}`);
      
      // Generate mock logs as fallback
      const mockLogs = generateMockLogs(25);
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock logs for demonstration or when fetch fails
  const generateMockLogs = (count = 20) => {
    const levels = ['info', 'warning', 'error'];
    const sources = ['system', 'auth', 'database', 'api'];
    const messages = [
      'User login successful',
      'User login failed',
      'Database connection established',
      'Database query error',
      'API request received',
      'API request failed',
      'Patient record updated',
      'Doctor record created',
      'Appointment scheduled',
      'Appointment cancelled'
    ];
    
    const mockLogs = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const randomHours = Math.floor(Math.random() * 24 * 7); // Within last week
      const timestamp = new Date(now - randomHours * 60 * 60 * 1000).toISOString();
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Create more detailed info for the log based on type
      let details = {};
      if (message.includes('login')) {
        details = {
          username: `user${Math.floor(Math.random() * 100)}`,
          ip: `192.168.0.${Math.floor(Math.random() * 255)}`,
          browser: 'Chrome',
          success: !message.includes('failed')
        };
      } else if (message.includes('database')) {
        details = {
          query: 'SELECT * FROM patients WHERE id = ?',
          execution_time: `${Math.floor(Math.random() * 1000)}ms`,
          table: 'patients',
          error: message.includes('error') ? 'Connection timeout' : null
        };
      } else if (message.includes('record')) {
        details = {
          record_id: Math.floor(Math.random() * 1000),
          user: `user${Math.floor(Math.random() * 100)}`,
          changes: ['name', 'email', 'phone'],
          timestamp: timestamp
        };
      }
      
      mockLogs.push({
        id: `log-${i}`,
        timestamp,
        level,
        source,
        message,
        details
      });
    }
    
    // Sort by timestamp (newest first)
    mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return mockLogs;
  };

  const handleFilterChange = (filter) => {
    setLogFilter(filter);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogDetailsModal(true);
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(term) ||
      log.source.toLowerCase().includes(term) ||
      log.level.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    );
  });

  const formatLogDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatLogDetails = (details) => {
    if (!details) return 'No details available';
    
    if (typeof details === 'string') {
      try {
        // Try to parse if it's a JSON string
        return JSON.stringify(JSON.parse(details), null, 2);
      } catch (e) {
        return details;
      }
    }
    
    return JSON.stringify(details, null, 2);
  };

  // Render loading state
  if (loading && logs.length === 0) {
    return <div className="loading-spinner">Loading system logs...</div>;
  }

  return (
    <div className="system-logs-section">
      <div className="logs-header">
        <h2>System Logs</h2>
        
        <div className="logs-actions">
          <div className="log-filters">
            <button 
              className={`filter-btn ${logFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn info ${logFilter === 'info' ? 'active' : ''}`}
              onClick={() => handleFilterChange('info')}
            >
              Info
            </button>
            <button 
              className={`filter-btn warning ${logFilter === 'warning' ? 'active' : ''}`}
              onClick={() => handleFilterChange('warning')}
            >
              Warning
            </button>
            <button 
              className={`filter-btn error ${logFilter === 'error' ? 'active' : ''}`}
              onClick={() => handleFilterChange('error')}
            >
              Error
            </button>
          </div>
          
          <div className="log-search">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <button className="refresh-btn" onClick={fetchSystemLogs}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSystemLogs}>Try Again</button>
        </div>
      )}
      
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Source</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className={`log-row ${log.level}`}>
                  <td className="log-time">{formatLogDate(log.timestamp)}</td>
                  <td className="log-level">
                    <span className={`level-badge ${log.level}`}>
                      {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                    </span>
                  </td>
                  <td className="log-source">{log.source}</td>
                  <td className="log-message">{log.message}</td>
                  <td className="log-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewLogDetails(log)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-logs">
                  {searchTerm 
                    ? "No logs match your search criteria" 
                    : "No logs found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Log Details Modal */}
      {showLogDetailsModal && selectedLog && (
        <Modal 
          title="Log Details" 
          onClose={() => setShowLogDetailsModal(false)}
        >
          <div className="log-details">
            <div className="log-detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedLog.id}</span>
            </div>
            <div className="log-detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">{formatLogDate(selectedLog.timestamp)}</span>
            </div>
            <div className="log-detail-row">
              <span className="detail-label">Level:</span>
              <span className={`detail-value ${selectedLog.level}`}>
                {selectedLog.level.toUpperCase()}
              </span>
            </div>
            <div className="log-detail-row">
              <span className="detail-label">Source:</span>
              <span className="detail-value">{selectedLog.source}</span>
            </div>
            <div className="log-detail-row">
              <span className="detail-label">Message:</span>
              <span className="detail-value">{selectedLog.message}</span>
            </div>
            <div className="log-detail-row">
              <span className="detail-label">Details:</span>
              <pre className="detail-value code-block">
                {formatLogDetails(selectedLog.details)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SystemLogs; 