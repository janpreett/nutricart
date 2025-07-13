// frontend/src/components/Header.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import './Header.css'
import logoSrc from '../assets/logo.png'
import LogoutConfirmModal from './LogoutConfirmModal';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const handleConfirmLogout = () => {
        logout();
        setShowLogoutModal(false);
    };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <NavLink to="/profile" className="logo-link">
            <img
              src={logoSrc}
              alt="NutriCart logo"
              className="logo-image"
            />
          </NavLink>
        </div>
        <nav className="nav">
          <ul>
            {isAuthenticated ? (
              <>
                <li>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? 'nav-link active' : 'nav-link'
                    }
                  >
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/plan"
                    className={({ isActive }) =>
                      isActive ? 'nav-link active' : 'nav-link'
                    }
                  >
                    Meal Plan
                  </NavLink>
                </li>
                <li className="user-info">Welcome, {user.first_name}!</li>
                <li>
                  <button onClick={() => setShowLogoutModal(true)} className="logout-btn">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login" className="nav-link">
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className="nav-link">
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
        {showLogoutModal && (
            <LogoutConfirmModal
                onCancel={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
            />
        )}
    </header>
  );
}
