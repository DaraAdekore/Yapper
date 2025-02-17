import React from 'react';
import SearchBarWithRadius from './SearchBarWithRadius';
import { Logout } from './Logout';
import '../../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/logo.png" alt="Yapper" className="navbar-logo" />
        </div>
        <div className="navbar-search">
          <SearchBarWithRadius />
        </div>
        <div className="navbar-actions">
          <Logout />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 