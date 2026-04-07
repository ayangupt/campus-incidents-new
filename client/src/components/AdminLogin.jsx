import React, { useState, useCallback } from 'react';

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    maxWidth: 400,
    width: '100%',
    margin: '0 16px',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  },
  title: {
    textAlign: 'center',
    color: '#800000',
    marginTop: 0,
    marginBottom: 24,
    fontSize: 24,
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600,
    color: '#333',
    fontSize: 14,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 4,
    boxSizing: 'border-box',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#800000',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: 4,
    padding: '10px 12px',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
};

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('adminToken', data.token);
        onLogin(data.token);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [password, onLogin]);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          <label style={styles.label} htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            required
          />
          <button
            type="submit"
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
