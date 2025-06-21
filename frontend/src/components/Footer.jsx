import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} NutriCart. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link> {/* Added this line */}
        </div>
      </div>
    </footer>
  );
}
