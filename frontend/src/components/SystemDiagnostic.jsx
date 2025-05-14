import React, { useState } from 'react';
import { diagnoseUserSystem, checkBackendConnection, testAllApiEndpoints } from '../utils/backendCheck';
import apiClient from '../api/client';

const SystemDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [apiEndpoint, setApiEndpoint] = useState('/current-user/');
  const [apiTestResult, setApiTestResult] = useState(null);
  const [allEndpointsResults, setAllEndpointsResults] = useState(null);
  const [testingAllEndpoints, setTestingAllEndpoints] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setDiagnosticResults(null);
    
    try {
      // First check connection
      const connectionStatus = await checkBackendConnection();
      if (!connectionStatus.connected) {
        // Check if it's a 404 error which might indicate a path issue
        if (connectionStatus.statusCode === 404) {
          const errMsg = connectionStatus.error?.response?.data?.includes('/api/api/') 
            ? `Path error: Duplicate API path detected (${connectionStatus.error.config?.url}). Check API client configuration.` 
            : `Backend connection failed with 404: ${connectionStatus.statusText}`;
          
          setError(errMsg);
        } else {
          setError(`Backend connection failed: ${connectionStatus.statusText}`);
        }
        setLoading(false);
        return;
      }
      
      // Run full diagnostic
      const results = await diagnoseUserSystem();
      setDiagnosticResults(results);
    } catch (err) {
      setError(`Diagnostic failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiEndpoint = async () => {
    setApiTestResult({
      loading: true,
      error: null,
      data: null,
      status: null
    });
    
    try {
      const response = await apiClient.get(apiEndpoint);
      setApiTestResult({
        loading: false,
        error: null,
        data: response.data,
        status: response.status
      });
    } catch (err) {
      setApiTestResult({
        loading: false,
        error: err.message,
        errorDetails: err.response?.data,
        status: err.response?.status || 'Error'
      });
    }
  };

  const runAllEndpointsTest = async () => {
    setTestingAllEndpoints(true);
    setAllEndpointsResults(null);
    
    try {
      const results = await testAllApiEndpoints();
      setAllEndpointsResults(results);
    } catch (err) {
      setError(`Failed to test all endpoints: ${err.message}`);
    } finally {
      setTestingAllEndpoints(false);
    }
  };

  const toggleDetails = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="system-diagnostic">
      <div className="diagnostic-header">
        <div>
          <h2>System Diagnostic</h2>
          <p>Check database connectivity and verify system health</p>
        </div>
        <div className="button-group">
          <button 
            className={`diagnostic-button ${loading ? 'loading' : ''}`}
            onClick={runDiagnostic} 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Running Diagnostic...
              </>
            ) : (
              <>
                <i className="fas fa-stethoscope"></i> Run System Diagnostic
              </>
            )}
          </button>
          
          <button 
            className={`diagnostic-button test-all-button ${testingAllEndpoints ? 'loading' : ''}`}
            onClick={runAllEndpointsTest} 
            disabled={testingAllEndpoints}
          >
            {testingAllEndpoints ? (
              <>
                <span className="spinner"></span>
                Testing Endpoints...
              </>
            ) : (
              <>
                <i className="fas fa-network-wired"></i> Test All Endpoints
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="diagnostic-error">
          <div className="error-icon"><i className="fas fa-exclamation-circle"></i></div>
          <div className="error-content">
            <h3>System Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {diagnosticResults && (
        <div className="diagnostic-results">
          <h3><i className="fas fa-chart-line"></i> Diagnostic Summary</h3>
          
          <div className="status-grid">
            <div className="status-item">
              <div className="status-icon">
                <i className={`fas ${diagnosticResults.apiConnection ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              </div>
              <div className="status-content">
                <div className="status-label">API Connection</div>
                <div className={`status-value ${diagnosticResults.apiConnection ? 'success' : 'error'}`}>
                  {diagnosticResults.apiConnection ? 'Connected' : 'Failed'}
                </div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className={`fas ${diagnosticResults.authSystem ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              </div>
              <div className="status-content">
                <div className="status-label">Auth System</div>
                <div className={`status-value ${diagnosticResults.authSystem ? 'success' : 'error'}`}>
                  {diagnosticResults.authSystem ? 'Working' : 'Failed'}
                </div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className={`fas ${diagnosticResults.database ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              </div>
              <div className="status-content">
                <div className="status-label">Database</div>
                <div className={`status-value ${diagnosticResults.database ? 'success' : 'error'}`}>
                  {diagnosticResults.database ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="status-content">
                <div className="status-label">Total Users</div>
                <div className="status-value">{diagnosticResults.userCount}</div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="status-content">
                <div className="status-label">Registered Doctors</div>
                <div className="status-value">{diagnosticResults.doctorCount}</div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className="fas fa-procedures"></i>
              </div>
              <div className="status-content">
                <div className="status-label">Registered Patients</div>
                <div className="status-value">{diagnosticResults.patientCount}</div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <i className="fas fa-user-tie"></i>
              </div>
              <div className="status-content">
                <div className="status-label">Registered Receptionists</div>
                <div className="status-value">{diagnosticResults.receptionistCount}</div>
              </div>
            </div>
            
            {diagnosticResults.systemStatus && (
              <div className="status-item full-width">
                <div className="status-icon">
                  <i className="fas fa-server"></i>
                </div>
                <div className="status-content">
                  <div className="status-label">System Status</div>
                  <div className="status-value">{diagnosticResults.systemStatus}</div>
                </div>
              </div>
            )}
            
            {diagnosticResults.message && (
              <div className="status-item full-width">
                <div className="status-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="status-content">
                  <div className="status-label">System Message</div>
                  <div className="status-value">{diagnosticResults.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="api-test-section">
        <h3><i className="fas fa-vial"></i> Test API Endpoint</h3>
        <div className="api-test-controls">
          <input 
            type="text" 
            value={apiEndpoint} 
            onChange={(e) => setApiEndpoint(e.target.value)} 
            placeholder="Enter API path (e.g., /current-user/)"
          />
          <button 
            className="api-test-button"
            onClick={testApiEndpoint}
            disabled={apiTestResult?.loading}
          >
            {apiTestResult?.loading ? (
              <>
                <span className="spinner small"></span>
                Testing...
              </>
            ) : (
              <>
                <i className="fas fa-play"></i> Test
              </>
            )}
          </button>
        </div>

        {apiTestResult && (
          <div className={`api-test-result ${apiTestResult.error ? 'error' : 'success'}`}>
            <div className="result-header">
              {apiTestResult.error ? (
                <><i className="fas fa-times-circle"></i> </>
              ) : (
                <><i className="fas fa-check-circle"></i> </>
              )}
              <strong>Status:</strong> {apiTestResult.status} 
              {apiTestResult.error ? ` - ${apiTestResult.error}` : ' - Success'}
            </div>
            {apiTestResult.data && (
              <div className="result-data">
                <strong>Response:</strong>
                <pre>{JSON.stringify(apiTestResult.data, null, 2)}</pre>
              </div>
            )}
            {apiTestResult.errorDetails && (
              <div className="result-error-details">
                <strong>Error Details:</strong>
                <pre>{typeof apiTestResult.errorDetails === 'string' ? 
                  apiTestResult.errorDetails : 
                  JSON.stringify(apiTestResult.errorDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {allEndpointsResults && (
        <div className="all-endpoints-results">
          <h3><i className="fas fa-sitemap"></i> All Endpoints Test Results</h3>
          {Object.entries(allEndpointsResults).map(([endpoint, result]) => (
            <div 
              key={endpoint} 
              className={`endpoint-result ${result.success ? 'success' : 'error'}`}
              onClick={() => toggleDetails(`endpoint-${endpoint}`)}
            >
              <div className="endpoint-header">
                {result.success ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <i className="fas fa-times-circle"></i>
                )}
                <strong>{endpoint}</strong>: {result.success ? 'Success' : 'Failed'} 
                {result.status && ` (Status: ${result.status})`}
                <span className="toggle-icon">{expanded[`endpoint-${endpoint}`] ? '▼' : '►'}</span>
              </div>
              
              {expanded[`endpoint-${endpoint}`] && (
                <div className="endpoint-details">
                  {result.data && (
                    <div className="endpoint-data">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                  {!result.success && result.error && (
                    <div className="endpoint-error">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemDiagnostic; 