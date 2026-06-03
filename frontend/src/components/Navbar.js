import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/dashboard" className="navbar-logo">
          Prime<span>trade</span>.ai
        </a>

        <div className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            Tasks
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-avatar">{initials}</div>
          <span className="navbar-name">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
