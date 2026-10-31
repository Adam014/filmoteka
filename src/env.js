import { defineEnvVars } from '@sveltejs/kit/env';

/** @param {string | undefined} value */
const optional = (value) => value || undefined;

export const variables = defineEnvVars({
	// Project address, needed by the browser for session storage and public image links.
	VITE_SUPABASE_URL: { public: true, schema: optional },
	PUBLIC_SUPABASE_URL: { public: true, schema: optional },

	// Server only. The browser reaches Supabase through /api/sb and never sees these keys.
	SUPABASE_SERVICE_ROLE_KEY: { schema: optional },
	VITE_SUPABASE_KEY: { schema: optional },
	VITE_TMDB_API_KEY: { schema: optional },
	VITE_TMDB_FETCH_API_KEY: { schema: optional },
	TMDB_API_URL: { schema: optional },
	GITHUB_API_URL: { schema: optional },
	CRON_SECRET: { schema: optional },
	SPOTIFY_CLIENT_ID: { schema: optional },
	SPOTIFY_CLIENT_SECRET: { schema: optional },
	SPOTIFY_API_URL: { schema: optional },
	SPOTIFY_ACCOUNTS_URL: { schema: optional }
});
