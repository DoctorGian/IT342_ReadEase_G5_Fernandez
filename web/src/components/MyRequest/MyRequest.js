import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../service/bookService';
import { authService } from '../../service/authService';
import { sessionState } from '../../service/sessionState';
import './MyRequest.css';

function MyRequest() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [overdueRequests, setOverdueRequests] = useState([]);
  const [cancelError, setCancelError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionState.getToken();
    const userId = sessionState.getUserId();

    if (!token) {
      navigate('/login');
    } else {
      loadRequests();

      const subscription = bookService.subscribeToRequests({
        userId,
        isAdmin: false,
        onChange: () => loadRequests(),
      });

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [navigate]);

  // Load requests from storage
  const loadRequests = async () => {
    try {
      const allRequests = await bookService.getRequests();
      const overdue = await bookService.getUserOverdueRequests();
      setRequests(allRequests.filter((req) => req.status !== 'Cancelled'));
      setOverdueRequests(overdue);
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile', { state: { from: 'student' } });
  };

  const handleDashboardClick = () => {
    navigate('/book-approval');
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();

      sessionState.clear();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      setCancelError('');
      await bookService.cancelRequest(id);
      
      // Remove the cancelled request from the list
      setRequests(requests.filter((request) => request.id !== id));
    } catch (err) {
      console.error('Error cancelling request:', err);
      setCancelError('Failed to cancel request. Please try again.');
    }
  };

  const handleReturnBook = async (id) => {
    try {
      setCancelError('');
      await bookService.returnBook(id);
      await loadRequests();
    } catch (err) {
      console.error('Error returning book:', err);
      setCancelError('Failed to return the book. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffa726';
      case 'Approved': return '#66bb6a';
      case 'Rejected': return '#c94f4f';
      case 'Cancelled': return '#ef5350';
      case 'Returned': return '#5d73c7';
      default: return '#999';
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">ReadEase</h2>
        <ul>
          <li>
            <button type="button" className="nav-link-button" onClick={handleDashboardClick}>Browse Books</button>
          </li>
          <li className="active">Request Books</li>
          <li>
            <button type="button" className="nav-link-button" onClick={handleCalendarClick}>Calendar</button>
          </li>
          <li>
            <button type="button" className="nav-link-button profile-link" onClick={handleProfileClick}>Profile</button>
          </li>
          <li>
            <button type="button" className="nav-link-button logout" onClick={handleLogout}>
              {loading ? 'Logging out...' : 'Log out'}
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main">
        {/* Top Search Bar */}
        <div className="topbar">
          <input type="text" placeholder="Search blocked requests" />
        </div>

        <div className="content">
          <h2>Request Books</h2>
          <p>Return overdue books before borrowing again.</p>

          {overdueRequests.length > 0 && (
            <div className="blocked-banner request-blocked-banner">
              <strong>Your account is blocked</strong>
              <p>You have overdue books that must be returned before you can borrow another book.</p>
            </div>
          )}

          {cancelError && (
            <div className="error-message">
              {cancelError}
            </div>
          )}

          <div className="requests-container">
            {requests.length === 0 ? (
              <div className="no-requests">
                <p>You don't have any active requests.</p>
                <button onClick={handleDashboardClick} className="browse-btn">
                  Go to Browse Books
                </button>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{request.book_name}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="request-details">
                    <p><strong>Author:</strong> {request.author}</p>
                    <p><strong>Request Date:</strong> {request.request_date ? new Date(request.request_date).toLocaleDateString() : ''}</p>
                    {request.due_date && (
                      <p><strong>Due Date:</strong> {new Date(request.due_date).toLocaleString()}</p>
                    )}
                    {request.returned_at && (
                      <p><strong>Returned:</strong> {new Date(request.returned_at).toLocaleString()}</p>
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
                      <button className="return-btn" onClick={() => handleReturnBook(request.id)}>
                        Return Book
                      </button>
                    )}
                    {request.status === 'Approved' && bookService.isRequestOverdue(request) && (
                      <span className="request-note">This book is overdue. Return it to unblock borrowing.</span>
                    )}
                    {request.status === 'Rejected' && (
                      <span className="request-note">This request was rejected by the librarian.</span>
                    )}
                    {request.status === 'Returned' && (
                      <span className="request-note">Book returned successfully.</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {overdueRequests.length > 0 && (
            <div className="requests-container overdue-container">
              <h3>Overdue Books</h3>
              {overdueRequests.map((request) => (
                <div key={request.id} className="request-card overdue-card">
                  <div className="request-header">
                    <h3>{request.book_name}</h3>
                    <span className="status-badge status-returned">Overdue</span>
                  </div>
                  <div className="request-details">
                    <p><strong>Author:</strong> {request.author}</p>
                    <p><strong>Due Date:</strong> {new Date(request.due_date).toLocaleString()}</p>
                  </div>
                  <div className="request-actions">
                    <button className="return-btn" onClick={() => handleReturnBook(request.id)}>
                      Return to Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyRequest;