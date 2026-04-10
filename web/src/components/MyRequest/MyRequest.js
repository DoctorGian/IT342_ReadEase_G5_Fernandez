import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyRequest.css';

function MyRequest() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

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

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
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

  const handleCancelRequest = (id) => {
    setRequests(requests.map(request =>
      request.id === id ? { ...request, status: 'Cancelled' } : request
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffa726';
      case 'Approved': return '#66bb6a';
      case 'Cancelled': return '#ef5350';
      default: return '#999';
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">ReadEase</h2>
        <ul>
          <li onClick={handleDashboardClick}>Browse Books</li>
          <li className="active">My Request</li>
          <li onClick={handleCalendarClick}>Calendar</li>
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
          <input type="text" placeholder="Search your requests" />
        </div>

        <div className="content">
          <h2>My Requests</h2>
          <p>Track your book borrowing requests</p>

          <div className="requests-container">
            {requests.length === 0 ? (
              <div className="no-requests">
                <p>You haven't made any requests yet.</p>
                <button onClick={handleDashboardClick} className="browse-btn">
                  Browse Books
                </button>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{request.bookName}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="request-details">
                    <p><strong>Author:</strong> {request.author}</p>
                    <p><strong>Request Date:</strong> {request.requestDate}</p>
                    {request.dueDate && (
                      <p><strong>Due Date:</strong> {request.dueDate}</p>
                    )}
                  </div>

                  <div className="request-actions">
                    {request.status === 'Pending' && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel Request
                      </button>
                    )}
                    {request.status === 'Approved' && (
                      <button className="return-btn">
                        Return Book
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyRequest;