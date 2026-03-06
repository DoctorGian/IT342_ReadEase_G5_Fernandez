import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
    } else if (email) {
      setUserEmail(email);
    }
  }, [navigate]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">ReadEase</h2>
        <ul>
          <li className="active">Browse Books</li>
          <li>My Request</li>
          <li>Calendar</li>
          <li onClick={handleProfileClick} className="profile-link">My Profile</li>
          <li onClick={handleLogout} className="logout">
            {loading ? 'Logging out...' : 'Log out'}
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main">

        {/* Top Search Bar */}
        <div className="topbar">
          <input type="text" placeholder="Search for books" />
        </div>

        <div className="content">
          <h2>Browse Books</h2>
          <p>Find and Borrow books</p>

          <div className="books-container">
            {[1, 2, 3].map((book) => (
              <div key={book} className="book-card">
                <h3>Book Name</h3>
                <p><strong>Author Name:</strong></p>
                <p><strong>Published Date:</strong></p>
                <p><strong>Status:</strong></p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;

