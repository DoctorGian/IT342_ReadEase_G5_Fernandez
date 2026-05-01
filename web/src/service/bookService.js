const API_BASE_URL = 'http://localhost:8080/api/books';

export const bookService = {
  // Borrow a book - creates a request
  borrowBook: async (bookId, bookName, author, token) => {
    try {
      // For now, using localStorage for local storage
      // TODO: Replace with API call once backend is ready
      /*
      const response = await fetch(`${API_BASE_URL}/borrow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId, bookName, author }),
      });
      return await response.json();
      */
      
      // Local implementation using localStorage
      const requests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      const newRequest = {
        id: Date.now(),
        bookId: bookId,
        bookName: bookName,
        author: author,
        status: 'Pending',
        requestDate: new Date().toLocaleDateString(),
        dueDate: null,
      };
      requests.push(newRequest);
      localStorage.setItem('borrowRequests', JSON.stringify(requests));
      return newRequest;
    } catch (error) {
      console.error('Borrow book error:', error);
      throw error;
    }
  },

  // Get all borrow requests for the user
  getRequests: async (token) => {
    try {
      // For now, using localStorage for local storage
      // TODO: Replace with API call once backend is ready
      /*
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
      */
      
      // Local implementation using localStorage
      const requests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      return requests;
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },

  // Cancel a borrow request
  cancelRequest: async (requestId, token) => {
    try {
      // For now, using localStorage for local storage
      // TODO: Replace with API call once backend is ready
      /*
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
      */
      
      // Local implementation using localStorage
      const requests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      const updatedRequests = requests.map(req =>
        req.id === requestId ? { ...req, status: 'Cancelled' } : req
      );
      localStorage.setItem('borrowRequests', JSON.stringify(updatedRequests));
      return { success: true };
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  },

  // Approve a request (admin function)
  approveRequest: async (requestId, dueDate, token) => {
    try {
      // For now, using localStorage for local storage
      // TODO: Replace with API call once backend is ready
      
      // Local implementation using localStorage
      const requests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      const updatedRequests = requests.map(req =>
        req.id === requestId ? { ...req, status: 'Approved', dueDate: dueDate } : req
      );
      localStorage.setItem('borrowRequests', JSON.stringify(updatedRequests));
      return { success: true };
    } catch (error) {
      console.error('Approve request error:', error);
      throw error;
    }
  },
};
