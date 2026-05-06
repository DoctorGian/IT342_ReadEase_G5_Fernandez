/**
 * Session State Manager
 * Uses sessionStorage to maintain tab-specific session data
 * This allows multiple users to be logged in on different tabs/windows simultaneously
 */

const SESSION_KEYS = {
  TOKEN: 'readease_session_token',
  USER_ID: 'readease_user_id',
  USER_EMAIL: 'readease_user_email',
  USER_NAME: 'readease_user_name',
  USER_ROLE: 'readease_user_role',
};

export const sessionState = {
  // Get a session value
  get: (key) => {
    return sessionStorage.getItem(key) || null;
  },

  // Set a session value
  set: (key, value) => {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  },

  // Get all session data as an object
  getAll: () => ({
    token: sessionStorage.getItem(SESSION_KEYS.TOKEN),
    userId: sessionStorage.getItem(SESSION_KEYS.USER_ID),
    userEmail: sessionStorage.getItem(SESSION_KEYS.USER_EMAIL),
    userName: sessionStorage.getItem(SESSION_KEYS.USER_NAME),
    userRole: sessionStorage.getItem(SESSION_KEYS.USER_ROLE),
  }),

  // Set all session data at once
  setAll: ({ token, userId, userEmail, userName, userRole }) => {
    if (token) sessionStorage.setItem(SESSION_KEYS.TOKEN, token);
    if (userId) sessionStorage.setItem(SESSION_KEYS.USER_ID, userId);
    if (userEmail) sessionStorage.setItem(SESSION_KEYS.USER_EMAIL, userEmail);
    if (userName) sessionStorage.setItem(SESSION_KEYS.USER_NAME, userName);
    if (userRole) sessionStorage.setItem(SESSION_KEYS.USER_ROLE, userRole);
  },

  // Clear all session data
  clear: () => {
    Object.values(SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!sessionStorage.getItem(SESSION_KEYS.TOKEN);
  },

  // Get specific session properties
  getToken: () => sessionStorage.getItem(SESSION_KEYS.TOKEN),
  getUserId: () => sessionStorage.getItem(SESSION_KEYS.USER_ID),
  getUserEmail: () => sessionStorage.getItem(SESSION_KEYS.USER_EMAIL),
  getUserName: () => sessionStorage.getItem(SESSION_KEYS.USER_NAME),
  getUserRole: () => sessionStorage.getItem(SESSION_KEYS.USER_ROLE),

  // Set specific session properties
  setToken: (token) => sessionState.set(SESSION_KEYS.TOKEN, token),
  setUserId: (userId) => sessionState.set(SESSION_KEYS.USER_ID, userId),
  setUserEmail: (email) => sessionState.set(SESSION_KEYS.USER_EMAIL, email),
  setUserName: (name) => sessionState.set(SESSION_KEYS.USER_NAME, name),
  setUserRole: (role) => sessionState.set(SESSION_KEYS.USER_ROLE, role),

  // Keys for reference
  KEYS: SESSION_KEYS,
};

export default sessionState;
