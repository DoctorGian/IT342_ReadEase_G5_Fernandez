import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');

    if (!token) {
      navigate('/login');
    } else {
      setUserName(name || '');
      setUserEmail(email || '');
      setLoading(false);
    }
  }, [navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="profile-container">
        <div className="profile-card">
          {/* Profile Avatar Section */}
          <div className="avatar-section">
            <div className="avatar">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2>{userName || 'User'}</h2>
          </div>

          {/* Profile Information */}
          <div className="profile-info">
            <div className="info-group">
              <label>Full Name</label>
              <p className="info-value">{userName || 'Not provided'}</p>
            </div>

            <div className="info-group">
              <label>Email Address</label>
              <p className="info-value">{userEmail || 'Not provided'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="btn-edit" onClick={() => alert('Edit profile feature coming soon!')}>
              Edit Profile
            </button>
            <button className="btn-change-password" onClick={() => alert('Change password feature coming soon!')}>
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;