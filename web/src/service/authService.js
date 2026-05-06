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

  getUserContext: async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        return { success: false, data: null, error: authError, message: authError.message };
      }

      const user = authData?.user || null;
      if (!user) {
        return { success: false, data: null, error: null, message: 'No active session found.' };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        return { success: false, data: null, error: profileError, message: profileError.message };
      }

      return {
        success: true,
        data: {
          user,
          profile: profile || null,
        },
        error: null,
        message: null,
      };
    } catch (error) {
      console.error('Get user context error:', error);
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