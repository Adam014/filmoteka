import { supabase } from '../../../lib/db/supabaseClient';

export async function load({ params }) {
	try {
		const personId = params.id;

		// Check if the person already exists in the person_detailed table
		const { data: existingPerson, error: fetchError } = await supabase
			.from('person_detailed')
			.select('*')
			.eq('id', personId)
			.single();

		if (fetchError) {
			console.log(fetchError);
			return;
		}

		// If the person exists in the database, return it
		if (existingPerson) {
			return {
				person: existingPerson
			};
		}
	} catch (error) {
		console.error('Error loading person data:', error);
		return {
			person: null,
			error: true
		};
	}
}
