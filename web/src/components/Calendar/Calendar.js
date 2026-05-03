import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../service/authService';
import './Calendar.css';

function Calendar() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleMyRequestClick = () => {
    navigate('/my-request');
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();

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
          <li onClick={handleDashboardClick}>Browse Books</li>
          <li onClick={handleMyRequestClick}>My Request</li>
          <li className="active">Calendar</li>
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
          <input type="text" placeholder="Search events" />
        </div>

        <div className="content">
          <h2>Calendar</h2>
          <p>View your book due dates and events</p>

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
                <div key={index} className={`day-cell ${day ? '' : 'empty'}`}>
                  {day && <span className="day-number">{day}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;