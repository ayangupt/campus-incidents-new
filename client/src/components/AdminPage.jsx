import React, { useState, useCallback } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken'));

  const handleLogin = useCallback((newToken) => {
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    setToken(null);
  }, []);

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
