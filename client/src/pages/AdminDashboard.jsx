import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [user, setUser] = useState(null);

  // Auth check on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    };

    verifyAuth();
  }, [navigate]);

  // Fetch incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/incidents');
        setIncidents(response.data || []);
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setError('Failed to load incidents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Handle status update
  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await api.patch(`/incidents/${incidentId}`, { status: newStatus });
      // Update local state
      setIncidents(incidents.map(incident =>
        incident.id === incidentId
          ? { ...incident, status: newStatus }
          : incident
      ));
    } catch (err) {
      console.error('Failed to update incident status:', err);
      alert('Failed to update incident status. Please try again.');
    }
  };

  // Toggle expandable row
  const toggleRowExpanded = (incidentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(incidentId)) {
      newExpanded.delete(incidentId);
    } else {
      newExpanded.add(incidentId);
    }
    setExpandedRows(newExpanded);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'green';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      case 'critical':
        return 'darkred';
      default:
        return 'gray';
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      {/* Header Bar */}
      <header className="admin-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="header-right">
            <div className="incident-badge">
              Incidents: <span className="badge-count">{incidents.length}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {loading ? (
          <div className="loading-message">Loading incidents...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : incidents.length === 0 ? (
          <div className="no-incidents-message">No incidents reported yet</div>
        ) : (
          <div className="table-container">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Reporter Name</th>
                  <th>Date of Incident</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident, index) => (
                  <tbody key={incident.id}>
                    <tr
                      className={`incident-row ${index % 2 === 0 ? 'even' : 'odd'}`}
                      onClick={() => toggleRowExpanded(incident.id)}
                    >
                      <td className="expand-cell">
                        <span className="expand-icon">
                          {expandedRows.has(incident.id) ? '▼' : '▶'}
                        </span>
                      </td>
                      <td>{incident.title}</td>
                      <td>{incident.location || 'N/A'}</td>
                      <td>{incident.category || 'N/A'}</td>
                      <td>
                        <span
                          className="severity-badge"
                          style={{
                            backgroundColor: getSeverityColor(incident.severity),
                          }}
                        >
                          {incident.severity || 'N/A'}
                        </span>
                      </td>
                      <td>{incident.reporter_name || 'N/A'}</td>
                      <td>{formatDate(incident.incident_date)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="status-dropdown"
                          value={incident.status || 'New'}
                          onChange={(e) =>
                            handleStatusChange(incident.id, e.target.value)
                          }
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                    {expandedRows.has(incident.id) && (
                      <tr className="expanded-row">
                        <td colSpan="8">
                          <div className="expanded-details">
                            <div className="detail-group">
                              <h4>Description</h4>
                              <p>{incident.description || 'No description provided'}</p>
                            </div>
                            <div className="detail-group">
                              <h4>Reporter Email</h4>
                              <p>{incident.reporter_email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
