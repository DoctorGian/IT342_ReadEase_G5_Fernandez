import supabase from './supabaseClient';

const isSchemaCacheError = (error) => {
  const text = String(error?.message || JSON.stringify(error) || '').toLowerCase();
  return (
    text.includes('schema cache') ||
    text.includes('could not find the table') ||
    text.includes('relation "public.') ||
    text.includes('does not exist')
  );
};

const reloadSchemaCache = async () => {
  try {
    await supabase.rpc('reload_schema_cache');
  } catch (error) {
    console.warn('Schema cache reload failed:', error);
  }
};

const withSchemaCacheRetry = async (operation, shouldRetry = true) => {
  try {
    return await operation();
  } catch (error) {
    if (shouldRetry && isSchemaCacheError(error)) {
      await reloadSchemaCache();
      return withSchemaCacheRetry(operation, false);
    }

    throw error;
  }
};

const nowIso = () => new Date().toISOString();

const requestIsOverdue = (request) => {
  return request?.status === 'Approved' && request?.due_date && new Date(request.due_date).getTime() < Date.now();
};

export const bookService = {
  getBooks: async () => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('title', { ascending: true });
        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error('Get books error:', error);
      throw error;
    }
  },

  createBook: async ({ title, author, category }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Please log in before adding books.');

      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('books')
          .upsert([
            {
              title,
              author,
              category,
            },
          ], { onConflict: 'title' })
          .select('*')
          .single();
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Create book error:', error);
      throw error;
    }
  },

  getBookById: async (bookId) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .maybeSingle();
        if (error) throw error;
        return data || null;
      });
    } catch (error) {
      console.error('Get book by id error:', error);
      throw error;
    }
  },

  borrowBook: async (bookId, bookName, author) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Please log in before borrowing books.');

      const overdueRequests = await bookService.getUserOverdueRequests();
      if (overdueRequests.length > 0) {
        throw new Error('Your account is blocked until you return the overdue book.');
      }

      let resolvedBookName = bookName;
      let resolvedAuthor = author;

      if (!resolvedBookName || !resolvedAuthor) {
        const bookRecord = await bookService.getBookById(bookId);
        resolvedBookName = resolvedBookName || bookRecord?.title || `Book ${bookId}`;
        resolvedAuthor = resolvedAuthor || bookRecord?.author || null;
      }

      const { data, error } = await supabase
        .from('borrow_requests')
        .insert([
          {
            user_id: user.id,
            book_id: String(bookId),
            book_name: resolvedBookName,
            author: resolvedAuthor,
            status: 'Pending',
            request_date: nowIso(),
            due_date: null,
          },
        ])
        .select('*');
      if (error) {
        console.error('Borrow book insert error details:', error);
        throw error;
      }
      console.log('Borrow request created successfully:', data);
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
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('request_date', { ascending: false });
        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  },

  getUserOverdueRequests: async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Please log in to view blocked requests.');

      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Approved')
        .lt('due_date', nowIso())
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user overdue requests error:', error);
      throw error;
    }
  },

  getAllRequests: async () => {
    try {
      return await withSchemaCacheRetry(async () => {
        // Check current user for debugging
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.warn('Auth error:', authError);
        }
        const currentUser = authData?.user;
        console.log('Current user for getAllRequests:', currentUser?.email, currentUser?.id);

        let requestData = null;
        let requestError = null;

        const rpcResult = await supabase.rpc('admin_get_all_borrow_requests');
        requestData = rpcResult.data;
        requestError = rpcResult.error;

        if (requestError) {
          console.warn('Admin RPC for requests failed, falling back to table select.', requestError);
          const fallbackResult = await supabase
            .from('borrow_requests')
            .select('*')
            .order('request_date', { ascending: false });
          requestData = fallbackResult.data;
          requestError = fallbackResult.error;
        }

        if (requestError) {
          console.error('Borrow requests query error:', requestError);
          throw requestError;
        }

        const requests = requestData || [];
        console.log('Fetched borrow requests count:', requests.length, 'Error:', requestError);

        if (requests.length === 0) {
          return requests;
        }

        if (requests.some((request) => request.requester_name)) {
          return requests;
        }

        const uniqueUserIds = [...new Set(requests.map((request) => request.user_id).filter(Boolean))];

        if (uniqueUserIds.length === 0) {
          console.log('No user IDs found in requests, returning empty');
          return requests;
        }

        let profileMap = new Map();
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', uniqueUserIds);

          if (profileError) {
            console.warn('Profile lookup for admin request list failed; falling back to user IDs only.', profileError);
          } else {
            profileMap = new Map((profileData || []).map((profile) => [profile.user_id, profile.full_name]));
          }
        } catch (profileLookupError) {
          console.warn('Profile lookup for admin request list threw; falling back to user IDs only.', profileLookupError);
        }

        return requests.map((request) => ({
          ...request,
          requester_name: profileMap.get(request.user_id) || request.user_id,
        }));
      });
    } catch (error) {
      console.error('Get all requests error:', error);
      throw error;
    }
  },

  getAllOverdueRequests: async () => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .select('*')
          .eq('status', 'Approved')
          .lt('due_date', nowIso())
          .order('due_date', { ascending: true });

        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error('Get all overdue requests error:', error);
      throw error;
    }
  },

  cancelRequest: async (requestId) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .update({ status: 'Cancelled' })
          .eq('id', requestId)
          .select('*');
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  },

  approveRequest: async (requestId, dueDate) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .update({ status: 'Approved', due_date: dueDate })
          .eq('id', requestId)
          .select('*');
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Approve request error:', error);
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .update({ status: 'Rejected', due_date: null, approved_at: null, approved_by: null })
          .eq('id', requestId)
          .select('*');
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  },

  returnBook: async (requestId) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .update({ status: 'Returned', returned_at: new Date().toISOString() })
          .eq('id', requestId)
          .select('*');
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Return request error:', error);
      throw error;
    }
  },

  updateSchedule: async (requestId, dueDate) => {
    try {
      return await withSchemaCacheRetry(async () => {
        const { data, error } = await supabase
          .from('borrow_requests')
          .update({ due_date: dueDate })
          .eq('id', requestId)
          .select('*');
        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error('Update schedule error:', error);
      throw error;
    }
  },

  subscribeToRequests: ({ userId, isAdmin = false, onChange }) => {
    const filter = !isAdmin && userId ? `user_id=eq.${userId}` : undefined;
    const channel = supabase
      .channel(isAdmin ? 'admin-borrow-requests' : `student-borrow-requests-${userId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          ...(filter ? { filter } : {}),
        },
        onChange
      )
      .subscribe();

    return channel;
  },

  subscribeToBooks: (onChange) => {
    return supabase
      .channel('books-live-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
        },
        onChange
      )
      .subscribe();
  },

  triggerReloadSchemaCache: async () => {
    try {
      await reloadSchemaCache();
      return true;
    } catch (error) {
      console.error('Trigger reload schema cache failed:', error);
      throw error;
    }
  },

  isRequestOverdue: requestIsOverdue,
};

