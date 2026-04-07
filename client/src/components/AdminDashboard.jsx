import React, { useState, useEffect, useCallback } from 'react';

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const CATEGORIES = ['IT', 'Facility', 'Security', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const PRIORITY_COLORS = {
  Critical: { backgroundColor: '#dc3545', color: '#fff' },
  High:     { backgroundColor: '#fd7e14', color: '#fff' },
  Medium:   { backgroundColor: '#ffc107', color: '#333' },
  Low:      { backgroundColor: '#28a745', color: '#fff' },
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: 1200,
    margin: '0 auto',
    padding: 24,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: '#800000',
    margin: 0,
    fontSize: 26,
  },
  logoutBtn: {
    padding: '8px 20px',
    backgroundColor: '#800000',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  count: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  filters: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: '#333',
  },
  filterSelect: {
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 14,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    backgroundColor: '#800000',
    color: '#fff',
    padding: '10px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    borderBottom: '2px solid #600000',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  actionSelect: {
    padding: '4px 6px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 13,
    marginRight: 6,
    marginBottom: 4,
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: 4,
    padding: '10px 12px',
    marginBottom: 16,
    fontSize: 14,
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#666',
    fontSize: 16,
  },
};

function PriorityBadge({ priority }) {
  const colorStyle = PRIORITY_COLORS[priority] || { backgroundColor: '#6c757d', color: '#fff' };
  return (
    <span style={{ ...styles.badge, ...colorStyle }}>
      {priority}
    </span>
  );
}

function sortComparator(a, b, key, direction) {
  let valA = a[key];
  let valB = b[key];

  if (key === 'priority') {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    valA = order[valA] ?? 4;
    valB = order[valB] ?? 4;
  } else if (key === 'date') {
    valA = new Date(valA || 0).getTime();
    valB = new Date(valB || 0).getTime();
  } else {
    valA = (valA || '').toString().toLowerCase();
    valB = (valB || '').toString().toLowerCase();
  }

  if (valA < valB) return direction === 'asc' ? -1 : 1;
  if (valA > valB) return direction === 'asc' ? 1 : -1;
  return 0;
}

export default function AdminDashboard({ token, onLogout }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const data = await res.json();
      setIncidents(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDir('asc');
      }
      return key;
    });
  }, []);

  const handlePatch = useCallback(async (id, body) => {
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      await fetchIncidents();
    } catch (err) {
      setError(err.message || 'Failed to update incident');
    }
  }, [token, fetchIncidents]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    onLogout();
  }, [onLogout]);

  // Apply filters
  let filtered = incidents;
  if (filterStatus !== 'All') {
    filtered = filtered.filter((i) => i.status === filterStatus);
  }
  if (filterCategory !== 'All') {
    filtered = filtered.filter((i) => i.category === filterCategory);
  }

  // Apply sort
  const sorted = [...filtered].sort((a, b) => {
    const aRow = { ...a, priority: a.admin_priority || a.priority };
    const bRow = { ...b, priority: b.admin_priority || b.priority };
    return sortComparator(aRow, bRow, sortKey, sortDir);
  });

  const sortArrow = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
  ];

  if (loading) {
    return <div style={styles.loading}>Loading incidents…</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Incident Management Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.count}>
        Total incidents: <strong>{filtered.length}</strong>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status:</span>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Category:</span>
          <select
            style={styles.filterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={styles.th}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}{sortArrow(col.key)}
                </th>
              ))}
              <th style={{ ...styles.th, cursor: 'default' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                  No incidents found.
                </td>
              </tr>
            ) : (
              sorted.map((inc, idx) => {
                const displayPriority = inc.admin_priority || inc.priority;
                const rowBg = idx % 2 === 0 ? '#fff' : '#f9f9f9';
                return (
                  <tr key={inc.id || idx} style={{ backgroundColor: rowBg }}>
                    <td style={styles.td}>{inc.id}</td>
                    <td style={styles.td}>{inc.name}</td>
                    <td style={styles.td}>{inc.email}</td>
                    <td style={styles.td}>{inc.date ? new Date(inc.date).toLocaleDateString() : '—'}</td>
                    <td style={styles.td}>{inc.location}</td>
                    <td style={styles.td}>{inc.category}</td>
                    <td style={styles.td}>
                      <PriorityBadge priority={displayPriority} />
                    </td>
                    <td style={styles.td}>{inc.status}</td>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                      <select
                        style={styles.actionSelect}
                        value={displayPriority}
                        onChange={(e) => handlePatch(inc.id, { admin_priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select
                        style={styles.actionSelect}
                        value={inc.status}
                        onChange={(e) => handlePatch(inc.id, { status: e.target.value })}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
