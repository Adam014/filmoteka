import { supabase } from '../supabase.js';

/** Signed-in user. `ready` turns true once the stored session has been checked. */
export const auth = $state({ user: null, ready: false });

function apply(session) {
	auth.user = session?.user ?? null;
	auth.ready = true;
}

/** Starts session tracking and returns the cleanup function. Call once from the root layout. */
export function initAuth() {
	if (!supabase) {
		auth.ready = true;
		return () => {};
	}

	supabase.auth
		.getSession()
		.then(({ data }) => apply(data.session))
		.catch(() => apply(null));

	// The auth client holds a lock while this callback runs, so work is deferred out of it.
	const { data } = supabase.auth.onAuthStateChange((_event, session) => {
		setTimeout(() => apply(session), 0);
	});
	return () => data.subscription.unsubscribe();
}

export async function accessToken() {
	if (!supabase) return null;
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token ?? null;
}

export function signOut() {
	return supabase?.auth.signOut() ?? Promise.resolve({ error: null });
}
