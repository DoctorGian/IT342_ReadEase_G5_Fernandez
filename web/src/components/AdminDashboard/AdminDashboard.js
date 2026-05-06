import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../service/authService';
import { bookService } from '../../service/bookService';
import { sessionState } from '../../service/sessionState';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const addBooksRef = useRef(null);
  const approvalRef = useRef(null);
  const overdueRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [overdueRequests, setOverdueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookActionLoading, setBookActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookFormError, setBookFormError] = useState('');
  const [bookForm, setBookForm] = useState({ title: '', author: '', category: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [reloadLoading, setReloadLoading] = useState(false);
  const [reloadMessage, setReloadMessage] = useState('');

  const adminName = sessionState.getUserName() || 'Librarian Admin';
  const adminEmail = sessionState.getUserEmail() || 'cit.library@cit.edu';

  const loadRequests = async () => {
    try {
      setError('');
      const [requestData, bookData] = await Promise.all([
        bookService.getAllRequests(),
        bookService.getBooks(),
      ]);
      setRequests(requestData);
      setBooks(bookData);
      setOverdueRequests(bookService.isRequestOverdue ? requestData.filter((request) => bookService.isRequestOverdue(request)) : []);

      const drafts = {};
      requestData.forEach((request) => {
        if (request.due_date) {
          drafts[request.id] = toDateTimeLocalValue(request.due_date);
        }
      });
      setScheduleDrafts(drafts);
    } catch (requestError) {
      console.error('Load admin requests error:', requestError);
      setError('Unable to load borrowing requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionState.getToken();
    const role = sessionState.getUserRole();

    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }

    loadRequests();

    const userId = sessionState.getUserId();
    const requestSubscription = bookService.subscribeToRequests({
      userId,
      isAdmin: true,
      onChange: () => {
        console.log('Subscription triggered - reloading requests');
        loadRequests();
      },
    });

    const bookSubscription = bookService.subscribeToBooks(() => {
      console.log('Book subscription triggered - reloading requests');
      loadRequests();
    });

    // Add a polling mechanism to refresh requests every 5 seconds as a backup
    const pollInterval = setInterval(() => {
      console.log('Polling for updates...');
      loadRequests();
    }, 5000);

    return () => {
      if (requestSubscription) {
        requestSubscription.unsubscribe();
      }

      if (bookSubscription) {
        bookSubscription.unsubscribe();
      }

      clearInterval(pollInterval);
    };
  }, [navigate]);

  const filteredRequests = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return requests;
    }

    return requests.filter((request) => {
      return [request.requester_name, request.book_name, request.author, request.status, request.user_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [requests, searchTerm]);

  const stats = useMemo(() => {
    const counts = { total: requests.length, pending: 0, approved: 0, rejected: 0, returned: 0 };
    requests.forEach((request) => {
      const key = String(request.status || '').toLowerCase();
      if (Object.hasOwn(counts, key)) {
        counts[key] += 1;
      }
    });
    return counts;
  }, [requests]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      sessionState.clear();
      navigate('/login');
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    }
  };

  const updateDraft = (requestId, value) => {
    setScheduleDrafts((current) => ({
      ...current,
      [requestId]: value,
    }));
  };

  const updateBookField = (field, value) => {
    setBookForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddBook = async (event) => {
    event.preventDefault();

    const title = bookForm.title.trim();
    const author = bookForm.author.trim();
    const category = bookForm.category.trim();

    if (!title || !author) {
      setBookFormError('Title and author are required.');
      return;
    }

    try {
      setBookActionLoading(true);
      setBookFormError('');
      await bookService.createBook({ title, author, category: category || null });
      setBookForm({ title: '', author: '', category: '' });
      await loadRequests();
    } catch (bookError) {
      console.error('Add book error:', bookError);
      setBookFormError(bookError?.message || 'Unable to add the book. Please try again.');
    } finally {
      setBookActionLoading(false);
    }
  };

  const handleReloadSchema = async () => {
    try {
      setReloadLoading(true);
      setReloadMessage('');
      await bookService.triggerReloadSchemaCache();
      setReloadMessage('Schema cache reload requested.');
    } catch (err) {
      console.error('Reload schema error:', err);
      setReloadMessage(err?.message || 'Schema reload failed.');
    } finally {
      setReloadLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      setActionLoading(true);
      setError('');
      const draftValue = scheduleDrafts[request.id] || toDateTimeLocalValue(addDays(new Date(), 7));
      await bookService.approveRequest(request.id, toIsoDateTime(draftValue));
      await loadRequests();
    } catch (approveError) {
      console.error('Approve request error:', approveError);
      setError('Unable to approve the request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (request) => {
    try {
      setActionLoading(true);
      setError('');
      await bookService.rejectRequest(request.id);
      await loadRequests();
    } catch (rejectError) {
      console.error('Reject request error:', rejectError);
      setError('Unable to reject the request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleUpdate = async (request) => {
    try {
      setActionLoading(true);
      setError('');
      const draftValue = scheduleDrafts[request.id];
      if (!draftValue) {
        setError('Pick a return schedule before updating.');
        return;
      }
      await bookService.updateSchedule(request.id, toIsoDateTime(draftValue));
      await loadRequests();
    } catch (scheduleError) {
      console.error('Update schedule error:', scheduleError);
      setError('Unable to update the schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel = (status) => status || 'Pending';

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="admin-shell loading-state">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar admin-sidebar">
        <h2 className="logo">ReadEase Admin</h2>
        <div className="admin-user">
          <strong>{adminName}</strong>
          <span>{adminEmail}</span>
        </div>
        <ul>
          <li>
            <button type="button" className="nav-link-button" onClick={() => scrollToSection(addBooksRef)}>Add Books</button>
          </li>
          <li>
            <button type="button" className="nav-link-button" onClick={() => scrollToSection(approvalRef)}>Book Approval</button>
          </li>
          <li>
            <button type="button" className="nav-link-button" onClick={() => scrollToSection(overdueRef)}>Borrowed Overdue</button>
          </li>
          <li>
            <button type="button" className="nav-link-button profile-link" onClick={() => navigate('/profile', { state: { from: 'admin' } })}>Profile</button>
          </li>
          <li>
            <button type="button" className="nav-link-button logout" onClick={handleLogout}>Log out</button>
          </li>
        </ul>
      </aside>

      <main className="admin-main">
        <header className="admin-hero">
          <div>
            <p className="eyebrow">ReadEase System Administrator</p>
            <h1>Borrowing Control Center</h1>
            <p>Approve, reject, and reschedule book requests in real time.</p>
          </div>
          <div className="search-panel">
            <input
              type="text"
              placeholder="Search books, students, or status"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card total">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="summary-card pending">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </article>
          <article className="summary-card approved">
            <span>Approved</span>
            <strong>{stats.approved}</strong>
          </article>
          <article className="summary-card rejected">
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </article>
          <article className="summary-card returned">
            <span>Returned</span>
            <strong>{stats.returned}</strong>
          </article>
          <article className="summary-card overdue">
            <span>Overdue</span>
            <strong>{overdueRequests.length}</strong>
          </article>
        </section>

        <section className="admin-book-form" ref={addBooksRef} id="add-books-section">
          <div className="admin-form-header">
            <div>
              <p className="eyebrow">Catalog Management</p>
              <h2>Add a Book</h2>
              <p>New titles will appear instantly in the shared catalog for students and staff.</p>
            </div>
            <div className="catalog-count">
              <span>Live Books</span>
              <strong>{books.length}</strong>
            </div>
              <div className="schema-reload">
                <button type="button" className="nav-link-button reload-db-button" onClick={handleReloadSchema} disabled={reloadLoading}>
                  {reloadLoading ? 'Reloading...' : 'Reload DB schema cache'}
                </button>
                {reloadMessage && <div className="reload-message">{reloadMessage}</div>}
              </div>
          </div>

          <form className="book-form" onSubmit={handleAddBook}>
            <label>
              <span>Title</span>
              <input
                type="text"
                value={bookForm.title}
                onChange={(event) => updateBookField('title', event.target.value)}
                placeholder="Book title"
              />
            </label>
            <label>
              <span>Author</span>
              <input
                type="text"
                value={bookForm.author}
                onChange={(event) => updateBookField('author', event.target.value)}
                placeholder="Author name"
              />
            </label>
            <label>
              <span>Category</span>
              <input
                type="text"
                value={bookForm.category}
                onChange={(event) => updateBookField('category', event.target.value)}
                placeholder="Optional category"
              />
            </label>
            <button className="action-button schedule add-book-button" type="submit" disabled={bookActionLoading}>
              {bookActionLoading ? 'Adding Book...' : 'Add Book'}
            </button>
          </form>

          {bookFormError && <div className="admin-error">{bookFormError}</div>}
        </section>

        {error && <div className="admin-error">{error}</div>}

        <section className="admin-list" ref={approvalRef} id="book-approval-section">
          <div className="section-anchor-header">
            <div>
              <p className="eyebrow">Book Approval</p>
              <h2>Approve or Reject Requests</h2>
              <p>Manage student borrowing requests and set return schedules.</p>
            </div>
          </div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <h3>No borrowing requests yet.</h3>
              <p>Students will appear here after they click Borrow on a book.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <h3>No requests match your search.</h3>
              <p>Try clearing the search box to see all student requests.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <article key={request.id} className={`admin-card status-${String(request.status || 'pending').toLowerCase()}`}>
                <div className="admin-card-header">
                  <div>
                    <p className="request-id">Request #{request.id}</p>
                    <h3>{request.book_name || 'Untitled Book'}</h3>
                  </div>
                  <span className="status-pill">{statusLabel(request.status)}</span>
                </div>

                <div className="admin-card-body">
                  <div>
                    <span className="field-label">Student</span>
                    <strong>{request.requester_name || request.user_id}</strong>
                  </div>
                  <div>
                    <span className="field-label">Author</span>
                    <strong>{request.author || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="field-label">Requested</span>
                    <strong>{formatDate(request.request_date)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Return Schedule</span>
                    <strong>{formatDateTime(request.due_date)}</strong>
                  </div>
                </div>

                <div className="admin-controls">
                  <label>
                    <span>Return schedule</span>
                    <input type="datetime-local" value={scheduleDrafts[request.id] || ''} onChange={(event) => updateDraft(request.id, event.target.value)} />
                  </label>

                  <div className="control-buttons">
                    {request.status === 'Pending' && (
                      <>
                        <button
                          className="action-button approve"
                          disabled={actionLoading}
                          onClick={() => handleApprove(request)}
                        >
                          Approve
                        </button>
                        <button
                          className="action-button reject"
                          disabled={actionLoading}
                          onClick={() => handleReject(request)}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {request.status === 'Approved' && (
                      <button
                        className="action-button schedule"
                        disabled={actionLoading}
                        onClick={() => handleScheduleUpdate(request)}
                      >
                        Update Schedule
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="admin-list overdue-section" ref={overdueRef} id="borrowed-overdue-section">
          <div className="section-anchor-header">
            <div>
              <p className="eyebrow">Borrowed Overdue</p>
              <h2>Unblock Students by Returning Overdue Books</h2>
              <p>Return the overdue loan to clear the block and allow borrowing again.</p>
            </div>
          </div>

          {overdueRequests.length === 0 ? (
            <div className="empty-state">
              <h3>No overdue books right now.</h3>
              <p>When a student misses the due date, the record will appear here.</p>
            </div>
          ) : (
            overdueRequests.map((request) => (
              <article key={request.id} className="admin-card status-approved overdue-card">
                <div className="admin-card-header">
                  <div>
                    <p className="request-id">Overdue Request #{request.id}</p>
                    <h3>{request.book_name || 'Untitled Book'}</h3>
                  </div>
                  <span className="status-pill overdue-pill">Overdue</span>
                </div>

                <div className="admin-card-body">
                  <div>
                    <span className="field-label">Student</span>
                    <strong>{request.requester_name || request.user_id}</strong>
                  </div>
                  <div>
                    <span className="field-label">Author</span>
                    <strong>{request.author || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="field-label">Due Date</span>
                    <strong>{formatDateTime(request.due_date)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Status</span>
                    <strong>Blocked until return</strong>
                  </div>
                </div>

                <div className="admin-controls">
                  <div className="control-buttons overdue-buttons">
                    <button
                      className="action-button schedule"
                      disabled={actionLoading}
                      onClick={() => handleScheduleUpdate(request)}
                    >
                      Update Schedule
                    </button>
                    <button
                      className="action-button approve"
                      disabled={actionLoading}
                      onClick={async () => {
                        try {
                          setActionLoading(true);
                          setError('');
                          await bookService.returnBook(request.id);
                          await loadRequests();
                        } catch (returnError) {
                          console.error('Return overdue request error:', returnError);
                          setError('Unable to return the overdue book.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      Mark Returned / Unblock
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) {
    return 'No schedule assigned';
  }

  return new Date(value).toLocaleString();
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toIsoDateTime(localValue) {
  if (!localValue) {
    return null;
  }

  const date = new Date(localValue);
  return date.toISOString();
}

function toDateTimeLocalValue(value) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

export default AdminDashboard;
