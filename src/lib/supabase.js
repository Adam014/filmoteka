import { browser } from '$app/env';
import { PUBLIC_SUPABASE_URL, VITE_SUPABASE_URL } from '$app/env/public';
import { createClient } from '@supabase/supabase-js';

const projectUrl = VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;

/** Stands in for a key: /api/sb replaces it on the server, so no real key reaches the browser. */
export const GATEWAY_PLACEHOLDER_KEY = 'filmoteka-gateway';

/**
 * Browser client, signed in as the visitor. Null during server rendering and when not configured.
 * Server code uses `server/supabase.js` instead, so sessions can never be shared between requests.
 */
export const supabase =
	browser && projectUrl
		? createClient(`${location.origin}/api/sb`, GATEWAY_PLACEHOLDER_KEY, {
				auth: {
					// Same name as a direct connection uses, so people stay logged in.
					storageKey: `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`
				}
			})
		: null;

/** Permanent public address of a file, independent of the gateway. */
export function publicStorageUrl(bucket, path) {
	return `${projectUrl}/storage/v1/object/public/${bucket}/${path}`;
}
