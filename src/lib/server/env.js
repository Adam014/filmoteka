import * as privateEnv from '$app/env/private';
import * as publicEnv from '$app/env/public';

export const supabaseUrl = () => publicEnv.VITE_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
export const supabaseFallbackKey = () => privateEnv.VITE_SUPABASE_KEY;
export const supabaseServiceKey = () => privateEnv.SUPABASE_SERVICE_ROLE_KEY;
export const tmdbToken = () => privateEnv.VITE_TMDB_FETCH_API_KEY;
export const tmdbKey = () => privateEnv.VITE_TMDB_API_KEY;
export const tmdbUrl = () => privateEnv.TMDB_API_URL || 'https://api.themoviedb.org/3';
export const githubUrl = () => privateEnv.GITHUB_API_URL || 'https://api.github.com';
export const cronSecret = () => privateEnv.CRON_SECRET;
