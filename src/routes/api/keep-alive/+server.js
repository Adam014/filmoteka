import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import { env } from '$env/static/private'; 
import { PUBLIC_SUPABASE_URL } from '$env/static/public'; 

const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY 
);

export const prerender = false; 

export async function GET() {
  console.log('Spouštím Supabase keep-alive ping (SvelteKit)...');

  try {
    const { data, error } = await supabase
      .from('films') 
      .select('id, original_title') 
      .limit(1);

    if (error) {
      throw new Error(`Supabase chyba: ${error.message}`);
    }

    console.log('Supabase keep-alive: Ping úspěšný.');
    console.log('Načtená ukázková data:', data);

    return json({
      message: 'Supabase databáze úspěšně pingnuta.',
      data: data
    });

  } catch (error) {
    console.error('Chyba při Supabase keep-alive pingu:', error.message);

    return json(
      { message: 'Chyba při pingu Supabase.', error: error.message },
      { status: 500 }
    );
  }
}