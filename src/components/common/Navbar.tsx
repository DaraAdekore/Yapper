import React from 'react';
import SearchBarWithRadius from './SearchBarWithRadius';
import { Logout } from './Logout';
import { PulsatingLogoSmallWhite } from '../Logo/PulsatingLogoSmallWhite';
import { useAppSelector } from '../../store/hooks';
import '../../styles/Navbar.css';

const Navbar = () => {
  const user = useAppSelector((state) => state.user);
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <PulsatingLogoSmallWhite />
        </div>
        <div className="navbar-search">
          <SearchBarWithRadius />
        </div>
        <div className="navbar-actions">
          <span className="username">{user.username}</span>
          <Logout />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 