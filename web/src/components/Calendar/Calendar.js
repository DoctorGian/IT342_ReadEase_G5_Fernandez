import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../service/authService';
import { bookService } from '../../service/bookService';
import { sessionState } from '../../service/sessionState';
import './Calendar.css';

function Calendar() {
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionState.getToken();
    const userId = sessionState.getUserId();

    if (!token) {
      navigate('/login');
    } else {
      loadSchedules();

      const subscription = bookService.subscribeToRequests({
        userId,
        isAdmin: false,
        onChange: () => loadSchedules(),
      });

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [navigate]);

  const loadSchedules = async () => {
    try {
      const allRequests = await bookService.getRequests();
      setRequests(allRequests);
    } catch (err) {
      console.error('Error loading schedules:', err);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile', { state: { from: 'student' } });
  };

  const handleDashboardClick = () => {
    navigate('/book-approval');
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);
  let emptyCellIndex = 0;

  const approvedSchedules = requests.filter((request) => request.due_date && request.status !== 'Rejected' && request.status !== 'Cancelled');

  const schedulesForDay = (day) => {
    if (!day) {
      return [];
    }

    return approvedSchedules.filter((request) => {
      const dueDate = new Date(request.due_date);
      return dueDate.getFullYear() === currentDate.getFullYear()
        && dueDate.getMonth() === currentDate.getMonth()
        && dueDate.getDate() === day;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
          <li>
            <button type="button" className="nav-link-button" onClick={handleRequestBlockedClick}>Request Books</button>
          </li>
          <li className="active">Calendar</li>
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
          <input type="text" placeholder="Search events" />
        </div>

        <div className="content">
          <div className="content-header">
            <div>
              <h2>Calendar</h2>
              <p>Track the return schedule assigned by the librarian.</p>
            </div>
            <div className="calendar-summary">
              <div>
                <span>Upcoming Returns</span>
                <strong>{approvedSchedules.filter((request) => new Date(request.due_date) >= new Date()).length}</strong>
              </div>
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-header">
              <button onClick={prevMonth} className="nav-btn">&lt;</button>
              <h3>
                {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="nav-btn">&gt;</button>
            </div>

            <div className="calendar-grid">
              {daysOfWeek.map(day => (
                <div key={day} className="day-header">{day}</div>
              ))}
              {days.map((day, index) => (
                <div
                  key={day ? `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}` : `empty-${emptyCellIndex++}`}
                  className={`day-cell ${day ? '' : 'empty'}`}
                >
                  {Boolean(day) && <span className="day-number">{day}</span>}
                  {schedulesForDay(day).slice(0, 2).map((request) => (
                    <div key={request.id} className={`event event-${String(request.status || 'approved').toLowerCase()}`}>
                      {request.book_name}
                    </div>
                  ))}
                  {schedulesForDay(day).length > 2 && (
                    <div className="event-more">+{schedulesForDay(day).length - 2} more</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="schedule-list">
            <h3>Assigned Return Schedules</h3>
            {approvedSchedules.length === 0 ? (
              <div className="no-schedules">
                <p>No return schedules assigned yet.</p>
              </div>
            ) : (
              approvedSchedules.map((request) => (
                <article key={request.id} className="schedule-card">
                  <div>
                    <h4>{request.book_name}</h4>
                    <p>{request.author}</p>
                  </div>
                  <div className="schedule-meta">
                    <span className={`status-badge status-${String(request.status).toLowerCase()}`}>{request.status}</span>
                    <strong>{new Date(request.due_date).toLocaleString()}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;