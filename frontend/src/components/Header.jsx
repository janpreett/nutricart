import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">NutriCart</Link>
        </div>
        <nav className="nav">
          <ul>
            <li><Link to="/">Profile</Link></li>
            <li><Link to="/plan">Meal Plan</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
