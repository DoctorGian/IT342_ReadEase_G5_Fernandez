import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

function createMissingClient() {
  const errMsg = 'Supabase not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local';
  console.error(errMsg);

  const rejectErr = () => Promise.reject(new Error(errMsg));

  const fromProxy = () => ({
    insert: rejectErr,
    select: rejectErr,
    update: rejectErr,
    delete: rejectErr,
    upsert: rejectErr,
  });

  return {
    auth: {
      signUp: () => rejectErr(),
      signInWithPassword: () => rejectErr(),
      signOut: () => rejectErr(),
      getUser: () => rejectErr(),
    },
    from: () => fromProxy(),
  };
}

const supabase = !SUPABASE_URL || !SUPABASE_ANON_KEY
  ? (console.warn('Supabase URL or ANON key not set. See web/.env.local.example'), createMissingClient())
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
