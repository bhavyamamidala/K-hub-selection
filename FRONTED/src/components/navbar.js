import React from 'react';
import './navbar.css';

const Navbar = () => {
  const username = localStorage.getItem('username'); // Adjust this as per your actual logic

  return (
    <div className="navbar">
      <div className="navbar-logo">
        <h1>NOTEBOOK</h1>
      </div>
      <div className="navbar-user">
        <p> {username}</p>
      </div>
    </div>
  );
};

export default Navbar;
