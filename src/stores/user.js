import { writable } from 'svelte/store';
import { supabase } from '../lib/db/supabaseClient'; // Ensure this path is correct

export const user = writable(null);

// Initialize the user store with the current session
(async () => {
	try {
		if (!supabase?.auth) {
			console.error('Supabase auth client is not available.');
			return;
		}

		const { data, error } = await supabase.auth.getSession();
		if (error) {
			console.error('Error fetching session:', error.message);
			return;
		}

		user.set(data?.session?.user || null); // Set the user or null if not logged in
	} catch (err) {
		console.error('Error initializing user store:', err.message);
	}
})();
