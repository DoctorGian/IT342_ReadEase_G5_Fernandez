import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionState } from '../../service/sessionState';
import './Profile.css';

function Profile() {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = sessionState.getUserEmail() || '';
  const userRole = sessionState.getUserRole() || 'student';
  const isAdmin = userRole === 'admin';

  // Determine the "from" source - default based on userRole
  const fromState = location.state?.from;
  const resolvedFrom = fromState || (isAdmin ? 'admin' : 'student');

  useEffect(() => {
    const token = sessionState.getToken();
    const name = sessionState.getUserName();

    if (token) {
      setUserName(name || '');
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleBackToDashboard = () => {
    // If coming from admin, go to admin dashboard; otherwise go to student
    const targetPath = resolvedFrom === 'admin' ? '/admin/dashboard' : '/book-approval';
    navigate(targetPath);
  };

  const adminStats = useMemo(() => ([
    { label: 'Role', value: 'System Administrator' },
    { label: 'Access', value: 'Full dashboard control' },
    { label: 'Email', value: userEmail || 'Not provided' },
  ]), [userEmail]);

  const handleAdminDashboardClick = () => {
    navigate('/admin/dashboard');
  };

  if (loading) {
    return (
      <div className={isAdmin ? 'admin-layout' : 'profile-container'}>
        <div className={isAdmin ? 'admin-shell loading-state' : 'loading'}>
          Loading...
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="admin-layout profile-admin-layout">
        <aside className="sidebar admin-sidebar">
          <h2 className="logo">ReadEase Admin</h2>
          <div className="admin-user">
            <strong>{userName || 'Librarian Admin'}</strong>
            <span>{userEmail || 'cit.library@cit.edu'}</span>
          </div>
          <ul>
            <li>
              <button type="button" className="nav-link-button" onClick={handleAdminDashboardClick}>Add Books</button>
            </li>
            <li>
              <button type="button" className="nav-link-button" onClick={handleAdminDashboardClick}>Book Approval</button>
            </li>
            <li>
              <button type="button" className="nav-link-button" onClick={handleAdminDashboardClick}>Borrowed Overdue</button>
            </li>
            <li className="active">Profile</li>
            <li>
              <button type="button" className="nav-link-button logout" onClick={handleBackToDashboard}>Back to Dashboard</button>
            </li>
          </ul>
        </aside>

        <main className="admin-main profile-admin-main">
          <header className="admin-hero profile-hero">
            <div>
              <p className="eyebrow">Admin Profile</p>
              <h1>Account Overview</h1>
              <p>Review the administrator account used to manage books, requests, and overdue loans.</p>
            </div>
            <div className="search-panel profile-hero-actions">
              <button type="button" className="action-button schedule" onClick={handleAdminDashboardClick}>
                Return to Dashboard
              </button>
            </div>
          </header>

          <section className="summary-grid profile-summary-grid">
            {adminStats.map((item) => (
              <article key={item.label} className="summary-card total profile-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>

          <section className="admin-card profile-admin-card">
            <div className="profile-admin-card-header">
              <div className="profile-avatar-large">
                {userName ? userName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <p className="request-id">Administrator Account</p>
                <h2>{userName || 'Librarian Admin'}</h2>
                <p className="profile-description">This profile uses the same admin shell and routes as the admin dashboard.</p>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span>Full Name</span>
                <strong>{userName || 'Not provided'}</strong>
              </div>
              <div className="profile-detail-item">
                <span>Email Address</span>
                <strong>{userEmail || 'Not provided'}</strong>
              </div>
              <div className="profile-detail-item">
                <span>Role</span>
                <strong>Admin</strong>
              </div>
              <div className="profile-detail-item">
                <span>Navigation</span>
                <strong>Dashboard, profile, and account controls</strong>
              </div>
            </div>

            <div className="profile-action-row">
              <button type="button" className="action-button approve" onClick={() => alert('Edit admin profile feature coming soon!')}>
                Edit Profile
              </button>
              <button type="button" className="action-button schedule" onClick={() => alert('Admin password change feature coming soon!')}>
                Change Password
              </button>
            </div>
          </section>
        </main>
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
        <h1>Profile</h1>
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
              <div className="field-label">Full Name</div>
              <p className="info-value">{userName || 'Not provided'}</p>
            </div>

            <div className="info-group">
              <div className="field-label">Email Address</div>
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