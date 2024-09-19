import { supabase } from './lib/db/supabaseClient';

export async function handle({ event, resolve }) {
  // Get the supabase session from cookies
  const { data: { session } } = await supabase.auth.getSessionFromCookie(event.request.headers.get('cookie'));

  // Make the session available in `event.locals`
  event.locals.user = session?.user || null;

  // Proceed with the request
  return resolve(event);
}