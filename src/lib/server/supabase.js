import { createClient } from '@supabase/supabase-js';
import { supabaseFallbackKey, supabaseServiceKey, supabaseUrl } from './env.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };
let serviceClient;
let anonClient;

/** Service-role client, or null when not configured. Required for anything touching auth users. */
export function adminDb() {
	const url = supabaseUrl();
	const key = supabaseServiceKey();
	if (!url || !key) return null;
	return (serviceClient ??= createClient(url, key, options));
}

/** Best available client for public catalogue reads, or null when Supabase is not configured. */
export function db() {
	const admin = adminDb();
	if (admin) return admin;
	const url = supabaseUrl();
	const key = supabaseFallbackKey();
	if (!url || !key) return null;
	return (anonClient ??= createClient(url, key, options));
}
