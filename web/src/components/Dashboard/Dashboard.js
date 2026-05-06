import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../service/bookService';
import { authService } from '../../service/authService';
import { sessionState } from '../../service/sessionState';
import './Dashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookStatus, setBookStatus] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionState.getToken();
    const userId = sessionState.getUserId();
    const role = sessionState.getUserRole();

    if (!token) {
      navigate('/login');
    } else {
      loadLibraryState(role === 'admin');

      const requestSubscription = bookService.subscribeToRequests({
        userId,
        isAdmin: role === 'admin',
        onChange: () => loadLibraryState(role === 'admin'),
      });

      const bookSubscription = bookService.subscribeToBooks(() => loadLibraryState(role === 'admin'));

      return () => {
        if (requestSubscription) {
          requestSubscription.unsubscribe();
        }

        if (bookSubscription) {
          bookSubscription.unsubscribe();
        }
      };
    }
  }, [navigate]);

  const loadLibraryState = async (isAdmin = false) => {
    try {
      const [bookRows, requestRows] = await Promise.all([
        bookService.getBooks(),
        isAdmin ? bookService.getAllRequests() : bookService.getRequests(),
      ]);

      const statuses = {};

      bookRows.forEach((book) => {
        statuses[String(book.id)] = { status: 'Available', dueDate: null, requestId: null };
      });

      requestRows.forEach((req) => {
        const bookId = String(req.book_id);
        if (!statuses[bookId]) {
          return;
        }

        statuses[bookId] = {
          status: req.status,
          dueDate: req.due_date,
          requestId: req.id,
        };
      });

      setBooks(bookRows);
      setRequests(requestRows);
      setBookStatus(statuses);
    } catch (err) {
      console.error('Error loading library state:', err);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile', { state: { from: 'student' } });
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleRequestBlockedClick = () => {
    navigate('/request-blocked');
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

  /* Borrow button function */
  const handleBorrow = async (bookId) => {
    setLoading(true);
    setBorrowError('');
    try {
      const book = books.find((item) => String(item.id) === String(bookId));
      if (!book) {
        throw new Error('Book not found.');
      }

      console.log('Borrowing book:', book.title);
      const result = await bookService.borrowBook(bookId, book.title, book.author);
      console.log('Borrow request result:', result);

      setBookStatus({
        ...bookStatus,
        [String(bookId)]: { status: 'Pending', dueDate: null, requestId: null }
      });

      // Reload library state to ensure admin sees the request
      await loadLibraryState(sessionState.getUserRole() === 'admin');
      
      // Wait a moment before navigating to ensure data is synced
      setTimeout(() => {
        navigate('/my-request');
      }, 500);
    } catch (err) {
      console.error('Borrow error:', err);
      setBorrowError(err?.message || 'Failed to create borrow request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Cancel button function */
  const handleCancel = async (bookId) => {
    try {
      setBorrowError('');
      const pendingRequest = requests.find((req) => Number(req.book_id) === bookId && req.status === 'Pending');
      
      if (pendingRequest) {
        await bookService.cancelRequest(pendingRequest.id);

        setBookStatus({
          ...bookStatus,
          [String(bookId)]: { status: 'Available', dueDate: null, requestId: null }
        });

        navigate('/my-request');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      setBorrowError('Failed to cancel request. Please try again.');
    }
  };

  const borrowButtonLabel = (isLocked) => {
    if (sessionState.getUserRole() === 'admin') {
      return 'View Only';
    }

    if (isBlocked) {
      return 'Blocked';
    }

    if (loading) {
      return 'Processing...';
    }

    return isLocked ? 'Requested' : 'Borrow Book';
  };

  const isAdminView = sessionState.getUserRole() === 'admin';
  const blockedRequests = requests.filter((request) => bookService.isRequestOverdue(request));
  const isBlocked = blockedRequests.length > 0;

  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">ReadEase</h2>
        <ul>
          <li className="active">Browse Books</li>
          <li>
            <button type="button" className="nav-link-button" onClick={handleRequestBlockedClick}>Request Books</button>
          </li>
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
          <input
            type="text"
            placeholder="Search for books"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="content">
          <div className="content-header">
            <div>
              <h2>Browse Books</h2>
              <p>Browse the live catalog and request books.</p>
            </div>
            <div className="dashboard-summary">
              <div>
                <span>Books</span>
                <strong>{books.length}</strong>
              </div>
              <div>
                <span>Active Requests</span>
                <strong>{requests.filter((request) => request.status !== 'Returned' && request.status !== 'Rejected' && request.status !== 'Cancelled').length}</strong>
              </div>
              <div>
                <span>Blocked</span>
                <strong>{blockedRequests.length}</strong>
              </div>
              <div>
                <p>{isAdminView ? 'Browse the live catalog and manage borrowing activity.' : isBlocked ? 'You have an overdue book. Return it to borrow again.' : 'Browse the live catalog and request books.'}</p>
                <strong>{requests.filter((request) => request.status === 'Approved').length}</strong>
              </div>
            </div>
          </div>

          {isBlocked && (
            <div className="blocked-banner">
              <strong>Request Books</strong>
              <p>You cannot borrow a new book until the overdue book is returned.</p>
            </div>
          )}

          {borrowError && (
            <div className="error-message">
              {borrowError}
            </div>
          )}

          <div className="books-container">
            {books
              .filter((book) => {
                const normalized = searchTerm.trim().toLowerCase();
                if (!normalized) {
                  return true;
                }

                return [book.title, book.author, book.category]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(normalized));
              })
              .map((book) => {
                const currentStatus = bookStatus[String(book.id)] || { status: 'Available', dueDate: null };
                const isLocked = currentStatus.status === 'Pending' || currentStatus.status === 'Approved';

                return (
                  <div key={book.id} className="book-card">
                    <h3>{book.title}</h3>

                    <p><strong>Author:</strong> {book.author}</p>
                    <p><strong>Category:</strong> {book.category}</p>

                    <div className="book-status-block">
                      <span className={`status-badge status-${String(currentStatus.status).toLowerCase()}`}>
                        {currentStatus.status}
                      </span>
                      {currentStatus.status === 'Approved' && currentStatus.dueDate && (
                        <p className="schedule-text">
                          Return by {new Date(currentStatus.dueDate).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="book-buttons">
                      <button
                        className="borrow-btn"
                        onClick={() => handleBorrow(book.id)}
                        disabled={isLocked || loading || isAdminView || isBlocked}
                      >
                        {borrowButtonLabel(isLocked)}
                      </button>

                      {currentStatus.status === 'Pending' && !isAdminView && !isBlocked && (
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancel(book.id)}
                          disabled={loading}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;