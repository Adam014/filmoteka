import { createClient } from '@supabase/supabase-js';
import { user } from '../../stores/user';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set the initial user value
supabase.auth.getSession().then(({ data: { session } }) => {
	user.set(session?.user ?? null);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
	user.set(session?.user ?? null);
});
