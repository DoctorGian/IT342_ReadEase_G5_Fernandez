import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../service/bookService';
import './Dashboard.css';

function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');

  /* Book catalog */
  const [books] = useState([
    { id: 1, name: "", author: "" },
    { id: 2, name: "", author: "" },
    { id: 3, name: "", author: "" }
  ]);

  /* Track book status */
  const [bookStatus, setBookStatus] = useState({
    1: "Available",
    2: "Available",
    3: "Available"
  });

  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
    } else if (email) {
      setUserEmail(email);
      // Load book statuses from pending requests
      loadBookStatuses();
    }
  }, [navigate]);

  // Load book statuses based on pending requests
  const loadBookStatuses = async () => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      const statuses = {
        1: "Available",
        2: "Available",
        3: "Available"
      };
      
      // Update status for any pending requests
      allRequests.forEach(req => {
        if (req.status === 'Pending') {
          statuses[req.bookId] = 'Pending';
        }
      });
      
      setBookStatus(statuses);
    } catch (err) {
      console.error('Error loading book statuses:', err);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleMyRequestClick = () => {
    navigate('/my-request');
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

  /* Borrow button function */
  const handleBorrow = async (bookId) => {
    setLoading(true);
    setBorrowError('');
    try {
      const token = localStorage.getItem('token');
      const book = books.find(b => b.id === bookId);
      
      // Call the book service to create a borrow request
      await bookService.borrowBook(bookId, book.name, book.author, token);
      
      // Update local status to Pending
      setBookStatus({
        ...bookStatus,
        [bookId]: "Pending"
      });
      
      // Navigate to My Request page
      navigate('/my-request');
    } catch (err) {
      console.error('Borrow error:', err);
      setBorrowError('Failed to create borrow request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Cancel button function */
  const handleCancel = async (bookId) => {
    try {
      setBorrowError('');
      const token = localStorage.getItem('token');
      const allRequests = await bookService.getRequests(token);
      
      // Find the pending request for this book
      const pendingRequest = allRequests.find(req => req.bookId === bookId && req.status === 'Pending');
      
      if (pendingRequest) {
        // Cancel the request
        await bookService.cancelRequest(pendingRequest.id, token);
        
        // Reset the local status
        setBookStatus({
          ...bookStatus,
          [bookId]: "Available"
        });
        
        // Navigate to My Request page to see it removed
        navigate('/my-request');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      setBorrowError('Failed to cancel request. Please try again.');
    }
  };

  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">ReadEase</h2>
        <ul>
          <li className="active">Browse Books</li>
          <li onClick={handleMyRequestClick}>My Request</li>
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
          <input type="text" placeholder="Search for books" />
        </div>

        <div className="content">
          <h2>Browse Books</h2>
          <p>Find and Borrow books</p>

          {borrowError && (
            <div className="error-message">
              {borrowError}
            </div>
          )}

          <div className="books-container">
            {books.map((book) => (

              <div key={book.id} className="book-card">

                <h3>Book Name</h3>

                <p><strong>Author Name:</strong></p>
                <p><strong>Published Date:</strong></p>

                {/* Status Display */}
                <p>
                  <strong>Status:</strong> {bookStatus[book.id]}
                </p>

                <div className="book-buttons">

                  <button
                    className="borrow-btn"
                    onClick={() => handleBorrow(book.id)}
                    disabled={bookStatus[book.id] === "Pending" || loading}
                  >
                    {loading ? 'Processing...' : 'Borrow Book'}
                  </button>

                </div>

              </div>

            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;