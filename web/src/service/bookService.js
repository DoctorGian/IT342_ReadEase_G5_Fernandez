import supabase from './supabaseClient';

export const bookService = {
  borrowBook: async (bookId, bookName, author) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Please log in before borrowing books.');
      const { data, error } = await supabase
        .from('borrow_requests')
        .insert([
          {
            user_id: user.id,
            book_id: String(bookId),
            book_name: bookName,
            author: author,
            status: 'Pending',
            request_date: new Date().toISOString(),
            due_date: null,
          },
        ]);
      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Borrow book error:', error);
      throw error;
    }
  },

  getRequests: async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Please log in to view requests.');
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('request_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },

  cancelRequest: async (requestId) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .update({ status: 'Cancelled' })
        .eq('id', requestId)
        .select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  },

  approveRequest: async (requestId, dueDate) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .update({ status: 'Approved', due_date: dueDate })
        .eq('id', requestId)
        .select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Approve request error:', error);
      throw error;
    }
  },
};
