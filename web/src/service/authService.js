import supabase from './supabaseClient';

export const authService = {
  register: async (name, email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        return { success: false, data: null, error, message: error.message };
      }
      return { success: true, data, error: null, message: null };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, data: null, error, message: error.message };
      }
      return { success: true, data, error: null, message: null };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error, message: error.message };
      }
      return { success: true, error: null, message: null };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  validateToken: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        return { success: false, user: null, error, message: error.message };
      }
      return { success: true, user, error: null, message: null };
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  },
};